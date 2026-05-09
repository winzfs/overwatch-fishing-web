"use client";

import { useEffect, useRef, useState } from "react";
import { fishDatabase, rarityColor, type FishSpecies, type TimeWindow, type WeatherKind } from "../../data/game/fishDatabase";
import { biomes, eventTable, harborBuildings, npcRoster, weatherCycle, type BiomeId } from "../../data/game/worldDatabase";
import { computeLoadoutStats, loadGameSave, persistGameSave, type GameSave } from "./saveManager";

type Mode = "harbor" | "ocean" | "dive";
type Vec = { x: number; y: number };
type Button = { id: string; label: string; x: number; y: number; w: number; h: number; action: () => void };
type FishEntity = { id: string; species: FishSpecies; x: number; y: number; vx: number; vy: number; hp: number; school: number; alert: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };

const WORLD_W = 960;
const WORLD_H = 540;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

function timeWindow(clock: number): TimeWindow {
  if (clock < 6) return "night";
  if (clock < 10) return "dawn";
  if (clock < 18) return "day";
  if (clock < 21) return "dusk";
  return "night";
}

function clockLabel(clock: number) {
  const h = Math.floor(clock) % 24;
  const m = Math.floor((clock - Math.floor(clock)) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function pickBiomeAt(pos: Vec): BiomeId {
  const hit = biomes.find((biome) => pos.x >= biome.bounds.x && pos.x <= biome.bounds.x + biome.bounds.w && pos.y >= biome.bounds.y && pos.y <= biome.bounds.y + biome.bounds.h);
  return (hit?.id || "reef") as BiomeId;
}

function spawnFish(biome: BiomeId, clock: number, weather: WeatherKind, depth: number): FishEntity[] {
  const now = timeWindow(clock);
  const biomeInfo = biomes.find((item) => item.id === biome) || biomes[1];
  const pool = fishDatabase.filter((fish) => fish.biome === biome && fish.time.includes(now) && fish.weather.includes(weather) && depth >= fish.depth[0] - 8 && depth <= fish.depth[1] + 12 && biomeInfo.temperature >= fish.temperature[0] && biomeInfo.temperature <= fish.temperature[1]);
  const fallback = fishDatabase.filter((fish) => fish.biome === biome || fish.biome === "reef");
  return Array.from({ length: 12 }, (_, index) => {
    const species = (pool.length ? pool : fallback)[index % (pool.length ? pool.length : fallback.length)];
    return {
      id: `${species.id}-${Date.now()}-${index}`,
      species,
      x: 220 + Math.random() * 980,
      y: 90 + Math.random() * 360,
      vx: (Math.random() - 0.5) * species.speed,
      vy: (Math.random() - 0.5) * species.speed * 0.45,
      hp: species.danger > 30 ? 100 : 46,
      school: index % 4,
      alert: 0,
    };
  });
}

export default function CanvasGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const buttonsRef = useRef<Button[]>([]);
  const [save, setSave] = useState<GameSave>(() => loadGameSave());
  const [mode, setMode] = useState<Mode>("harbor");
  const [toast, setToast] = useState("항구에서 WASD/방향키로 이동하고 건물 앞에서 E를 누르세요.");

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const context = canvasElement.getContext("2d");
    if (!context) return;
    const canvas: HTMLCanvasElement = canvasElement;
    const ctx: CanvasRenderingContext2D = context;

    let raf = 0;
    let last = performance.now();
    let running = true;
    const keys = new Set<string>();
    const pointer = { active: false, x: 0, y: 0, startX: 0, startY: 0, fire: false };
    const saveRef = { current: loadGameSave() };
    const modeRef = { current: "harbor" as Mode };
    const toastRef = { current: "항구에서 WASD/방향키로 이동하고 건물 앞에서 E를 누르세요." };
    const player = { x: 500, y: 360, vx: 0, vy: 0, facing: 1, hp: 100 };
    const boat = { x: 820, y: 420, vx: 0, vy: 0, angle: -1.72, boost: 100 };
    const diver = { x: 120, y: 160, vx: 0, vy: 0, oxygen: 100, pressure: 0, invuln: 0 };
    const camera = { x: 0, y: 0, shake: 0 };
    let currentBiome: BiomeId = "reef";
    let fish: FishEntity[] = [];
    let particles: Particle[] = [];
    let harpoonCooldown = 0;
    let weatherIndex = 0;
    let weather: WeatherKind = weatherCycle[0];
    let bloodScent = 0;

    function sync(next: GameSave, message?: string) {
      saveRef.current = next;
      persistGameSave(next);
      setSave(next);
      if (message) {
        toastRef.current = message;
        setToast(message);
      }
    }

    function setGameMode(next: Mode, message?: string) {
      modeRef.current = next;
      setMode(next);
      if (next === "ocean") {
        const event = eventTable[saveRef.current.day % eventTable.length];
        boat.x = 820;
        boat.y = 420;
        boat.vx = 0;
        boat.vy = 0;
        if (!message) message = `랜덤 해상 이벤트 감지: ${event.title} — ${event.desc}`;
      }
      if (next === "dive") {
        const stats = computeLoadoutStats(saveRef.current);
        diver.x = 110;
        diver.y = 130;
        diver.vx = 0;
        diver.vy = 0;
        diver.oxygen = stats.oxygen || 100;
        diver.pressure = 0;
        fish = spawnFish(currentBiome, saveRef.current.clock, weather, biomes.find((b) => b.id === currentBiome)?.depthRange[0] || 20);
      }
      if (message) sync(saveRef.current, message);
    }

    function sellCargo() {
      const total = saveRef.current.cargo.reduce((sum, item) => sum + item.value, 0);
      if (!total) return sync(saveRef.current, "판매할 어획물이 없습니다. 먼저 잠수해서 표본을 확보하세요.");
      sync({ ...saveRef.current, gold: saveRef.current.gold + total, cargo: [] }, `어시장 경매 완료: +${total.toLocaleString()}G`);
    }

    function upgrade() {
      const cost = 1400 + saveRef.current.metaDepth * 900;
      if (saveRef.current.gold < cost) return sync(saveRef.current, `업그레이드 비용 ${cost.toLocaleString()}G가 부족합니다.`);
      sync({ ...saveRef.current, gold: saveRef.current.gold - cost, metaDepth: saveRef.current.metaDepth + 1 }, `잠수복/엔진 정비 완료. 해금 심도 단계 ${saveRef.current.metaDepth + 1}`);
    }

    function claimAquarium() {
      const income = Math.max(120, Object.keys(saveRef.current.collection).length * 75 + saveRef.current.aquarium.exhibits.length * 240);
      sync({ ...saveRef.current, gold: saveRef.current.gold + income, aquarium: { ...saveRef.current.aquarium, income: saveRef.current.aquarium.income + income, lastTick: Date.now() } }, `수족관 관람 수익 +${income.toLocaleString()}G`);
    }

    function completeNpcLoop() {
      const nextAffinity = { ...saveRef.current.npcAffinity, old_salt: (saveRef.current.npcAffinity.old_salt || 0) + 1 };
      sync({ ...saveRef.current, npcAffinity: nextAffinity, quests: { ...saveRef.current.quests, completed: Array.from(new Set([...saveRef.current.quests.completed, "harbor_talk"])) } }, "NPC 루프: 솔트 선장이 밤바다 소문을 알려줬습니다.");
    }

    function interactHarbor() {
      const hit = harborBuildings.find((b) => player.x >= b.x - 24 && player.x <= b.x + b.w + 24 && player.y >= b.y - 24 && player.y <= b.y + b.h + 40);
      if (!hit) return;
      if (hit.id === "market") sellCargo();
      if (hit.id === "workshop") upgrade();
      if (hit.id === "aquarium") claimAquarium();
      if (hit.id === "tavern") completeNpcLoop();
      if (hit.id === "dock") setGameMode("ocean", "출항! 바다는 실제 필드입니다. 조타: WASD, Shift 부스트, Space 잠수.");
    }

    function catchFish(target: FishEntity) {
      const stats = computeLoadoutStats(saveRef.current);
      target.hp -= stats.damage || 22;
      target.alert = 1.2;
      bloodScent = 5;
      particles.push(...Array.from({ length: 12 }, () => ({ x: target.x, y: target.y, vx: (Math.random() - 0.5) * 90, vy: (Math.random() - 0.5) * 90, life: 0.8, color: rarityColor[target.species.rarity], size: 2 + Math.random() * 3 })));
      camera.shake = target.species.danger > 20 ? 8 : 4;
      if (target.hp <= 0) {
        const value = Math.round(target.species.value * (1 + target.species.danger / 100));
        const cargoItem = { id: target.species.id, name: target.species.name, value, weight: target.species.weight, rarity: target.species.rarity };
        const next = {
          ...saveRef.current,
          collection: { ...saveRef.current.collection, [target.species.id]: (saveRef.current.collection[target.species.id] || 0) + 1 },
          cargo: [...saveRef.current.cargo, cargoItem].slice(-18),
          aquarium: target.species.rarity === "legendary" ? { ...saveRef.current.aquarium, exhibits: Array.from(new Set([...saveRef.current.aquarium.exhibits, target.species.id])) } : saveRef.current.aquarium,
        };
        sync(next, `${target.species.rarity === "legendary" ? "✨ 희귀 발견! " : ""}${target.species.name} 확보 (+${value}G 가치)`);
        fish = fish.filter((item) => item.id !== target.id);
      }
    }

    function fireHarpoon() {
      if (harpoonCooldown > 0) return;
      harpoonCooldown = 0.55;
      const muzzle = { x: diver.x + 28, y: diver.y + 5 };
      let best: FishEntity | undefined;
      let bestDist = 150;
      for (const entity of fish) {
        const d = Math.abs(entity.y - muzzle.y) + Math.max(0, entity.x - muzzle.x) * 0.45;
        if (entity.x > diver.x && d < bestDist) {
          best = entity;
          bestDist = d;
        }
      }
      particles.push({ x: muzzle.x, y: muzzle.y, vx: 360, vy: 0, life: 0.32, color: "#e0f2fe", size: 3 });
      if (best) catchFish(best);
      else camera.shake = 2;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function pointerToWorld(ev: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      return { x: ((ev.clientX - rect.left) / rect.width) * WORLD_W, y: ((ev.clientY - rect.top) / rect.height) * WORLD_H };
    }

    function update(dt: number) {
      const s = saveRef.current;
      const nextClock = s.clock + dt * (modeRef.current === "harbor" ? 0.015 : 0.045);
      if (Math.floor(nextClock / 4) !== Math.floor(s.clock / 4)) {
        weatherIndex = (weatherIndex + 1) % weatherCycle.length;
        weather = weatherCycle[weatherIndex];
      }
      if (nextClock >= 24) sync({ ...s, day: s.day + 1, clock: nextClock - 24, fuel: 100 }, "새벽이 밝았습니다. 일일 이벤트와 NPC 루프가 갱신됩니다.");
      else saveRef.current = { ...s, clock: nextClock };

      harpoonCooldown = Math.max(0, harpoonCooldown - dt);
      bloodScent = Math.max(0, bloodScent - dt);
      camera.shake = Math.max(0, camera.shake - dt * 12);
      particles = particles.map((p) => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, life: p.life - dt })).filter((p) => p.life > 0);

      if (modeRef.current === "harbor") {
        const ix = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0) + (pointer.active ? clamp((pointer.x - pointer.startX) / 60, -1, 1) : 0);
        const iy = (keys.has("arrowdown") || keys.has("s") ? 1 : 0) - (keys.has("arrowup") || keys.has("w") ? 1 : 0) + (pointer.active ? clamp((pointer.y - pointer.startY) / 60, -1, 1) : 0);
        player.x += ix * 150 * dt;
        player.y += iy * 150 * dt;
        player.facing = ix < 0 ? -1 : ix > 0 ? 1 : player.facing;
        player.x = clamp(player.x, 36, WORLD_W - 36);
        player.y = clamp(player.y, 116, WORLD_H - 42);
        for (const b of harborBuildings) {
          if (player.x > b.x - 12 && player.x < b.x + b.w + 12 && player.y > b.y - 12 && player.y < b.y + b.h + 12) {
            player.y = player.y < b.y + b.h / 2 ? b.y - 16 : b.y + b.h + 18;
          }
        }
        if (keys.has("e")) {
          keys.delete("e");
          interactHarbor();
        }
      }

      if (modeRef.current === "ocean") {
        const turn = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0) + (pointer.active ? clamp((pointer.x - pointer.startX) / 80, -1, 1) : 0);
        const throttle = (keys.has("arrowup") || keys.has("w") ? 1 : 0) - (keys.has("arrowdown") || keys.has("s") ? 0.6 : 0) + (pointer.active ? clamp((pointer.startY - pointer.y) / 80, -0.5, 1) : 0);
        const boosting = keys.has("shift") && boat.boost > 0;
        boat.angle += turn * dt * 2.5;
        const power = (boosting ? 210 : 130) * computeLoadoutStats(saveRef.current).speed;
        boat.vx += Math.cos(boat.angle) * throttle * power * dt;
        boat.vy += Math.sin(boat.angle) * throttle * power * dt;
        boat.vx *= 0.985;
        boat.vy *= 0.985;
        boat.x += boat.vx * dt;
        boat.y += boat.vy * dt;
        boat.boost = clamp(boat.boost + (boosting ? -28 : 16) * dt, 0, 100);
        currentBiome = pickBiomeAt(boat);
        const biome = biomes.find((b) => b.id === currentBiome) || biomes[1];
        if (keys.has(" ") || pointer.fire) {
          keys.delete(" ");
          pointer.fire = false;
          if (currentBiome !== "harbor" && saveRef.current.metaDepth >= biome.unlock) setGameMode("dive", `${biome.name} 잠수 시작. 산소, 압력, 포식자를 관리하세요.`);
          else sync(saveRef.current, `${biome.name}은(는) 장비 단계 ${biome.unlock} 필요.`);
        }
        camera.x = boat.x - WORLD_W / 2;
        camera.y = boat.y - WORLD_H / 2;
      }

      if (modeRef.current === "dive") {
        const stats = computeLoadoutStats(saveRef.current);
        const ix = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0) + (pointer.active ? clamp((pointer.x - pointer.startX) / 70, -1, 1) : 0);
        const iy = (keys.has("arrowdown") || keys.has("s") ? 1 : 0) - (keys.has("arrowup") || keys.has("w") ? 1 : 0) + (pointer.active ? clamp((pointer.y - pointer.startY) / 70, -1, 1) : 0);
        diver.vx += ix * 260 * dt;
        diver.vy += (iy * 220 + 24) * dt;
        diver.vx *= 0.9;
        diver.vy *= 0.9;
        diver.x = clamp(diver.x + diver.vx * dt, 30, 1280);
        diver.y = clamp(diver.y + diver.vy * dt, 42, 500);
        diver.oxygen -= dt * (1.1 + Math.max(0, diver.y - 240) / 360);
        diver.pressure = (biomes.find((b) => b.id === currentBiome)?.depthRange[0] || 20) + diver.y * 0.18;
        diver.invuln = Math.max(0, diver.invuln - dt);
        if (keys.has(" ") || pointer.fire) {
          keys.delete(" ");
          pointer.fire = false;
          fireHarpoon();
        }
        if (diver.oxygen <= 0 || diver.pressure > stats.pressure + 34) {
          const penalty = Math.min(900, Math.max(100, saveRef.current.cargo.length * 120));
          sync({ ...saveRef.current, gold: Math.max(0, saveRef.current.gold - penalty), cargo: saveRef.current.cargo.slice(0, Math.ceil(saveRef.current.cargo.length / 2)) }, `긴급 부상! 일부 화물을 잃고 ${penalty}G 수리비가 발생했습니다.`);
          setGameMode("harbor");
        }
        fish.forEach((entity) => {
          const predatorPull = entity.species.reactsToBlood && bloodScent > 0 ? 1.8 : 1;
          const targetX = entity.species.danger > 0 ? diver.x : 620 + Math.sin(performance.now() / 900 + entity.school) * 220;
          const targetY = entity.species.danger > 0 ? diver.y : 190 + entity.school * 48;
          entity.vx += Math.sign(targetX - entity.x) * entity.species.speed * predatorPull * dt;
          entity.vy += Math.sign(targetY - entity.y) * entity.species.speed * 0.45 * predatorPull * dt;
          entity.vx *= 0.985;
          entity.vy *= 0.985;
          entity.x += entity.vx * dt;
          entity.y += entity.vy * dt;
          entity.y = clamp(entity.y, 50, 492);
          entity.alert = Math.max(0, entity.alert - dt);
          if (entity.species.danger > 0 && distance(entity, diver) < 28 && diver.invuln <= 0) {
            diver.oxygen -= entity.species.danger * 0.45;
            diver.invuln = 1;
            camera.shake = 11;
            sync(saveRef.current, `${entity.species.name} 공격! 산소가 급감합니다.`);
          }
        });
        camera.x = clamp(diver.x - WORLD_W * 0.38, 0, 360);
        camera.y = 0;
        if (keys.has("escape")) {
          keys.delete("escape");
          setGameMode("ocean", "수면으로 복귀했습니다. 항구로 돌아가 판매하세요.");
        }
      }
    }

    function drawPixelText(text: string, x: number, y: number, size = 14, color = "#e2e8f0", align: CanvasTextAlign = "left") {
      ctx.font = `800 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
    }

    function drawRect(x: number, y: number, w: number, h: number, fill: string, stroke = "rgba(255,255,255,.14)") {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
    }

    function drawHarbor() {
      const g = ctx.createLinearGradient(0, 0, 0, WORLD_H);
      g.addColorStop(0, "#0f3f5c");
      g.addColorStop(0.42, "#1e7f88");
      g.addColorStop(0.43, "#7c5d33");
      g.addColorStop(1, "#3b2f22");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      for (let i = 0; i < 24; i++) {
        ctx.fillStyle = `rgba(125, 211, 252, ${0.1 + Math.sin(performance.now() / 700 + i) * 0.04})`;
        ctx.fillRect(i * 48 - ((performance.now() / 40) % 48), 74 + Math.sin(i) * 10, 34, 3);
      }
      harborBuildings.forEach((b) => {
        drawRect(b.x, b.y, b.w, b.h, b.id === "dock" ? "#6b4f2a" : "#26364f");
        drawRect(b.x + 14, b.y + 18, b.w - 28, 22, "rgba(56,189,248,.28)", "rgba(125,211,252,.3)");
        drawPixelText(b.name, b.x + b.w / 2, b.y - 8, 15, "#f8fafc", "center");
        if (player.x >= b.x - 28 && player.x <= b.x + b.w + 28 && player.y >= b.y - 28 && player.y <= b.y + b.h + 48) {
          drawPixelText(`E: ${b.prompt}`, b.x + b.w / 2, b.y + b.h + 24, 14, "#fde68a", "center");
        }
      });
      npcRoster.forEach((npc, idx) => {
        ctx.fillStyle = ["#fda4af", "#93c5fd", "#86efac", "#fcd34d"][idx];
        ctx.fillRect(npc.x - 9, npc.y - 18 + Math.sin(performance.now() / 400 + idx) * 2, 18, 26);
        drawPixelText(npc.name, npc.x, npc.y - 26, 11, "#fff", "center");
      });
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(player.x - 10, player.y - 24, 20, 28);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(player.x + player.facing * 8, player.y - 16, 16 * player.facing, 6);
      ctx.fillStyle = "rgba(250,204,21,.18)";
      ctx.beginPath();
      ctx.arc(820, 430, 52, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawOcean() {
      ctx.save();
      ctx.translate(-camera.x + (Math.random() - 0.5) * camera.shake, -camera.y + (Math.random() - 0.5) * camera.shake);
      const g = ctx.createLinearGradient(camera.x, camera.y, camera.x, camera.y + WORLD_H);
      g.addColorStop(0, weather === "storm" ? "#123044" : "#0e7490");
      g.addColorStop(1, "#082f49");
      ctx.fillStyle = g;
      ctx.fillRect(camera.x - 80, camera.y - 80, WORLD_W + 160, WORLD_H + 160);
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = "rgba(186,230,253,.16)";
        ctx.fillRect(-1300 + i * 30 + Math.sin(performance.now() / 700 + i) * 12, -2100 + ((i * 53 + performance.now() / 22) % 2500), 18, 2);
      }
      biomes.filter((b) => b.id !== "harbor").forEach((b) => {
        ctx.fillStyle = b.id === currentBiome ? "rgba(250,204,21,.20)" : "rgba(15,23,42,.28)";
        ctx.fillRect(b.bounds.x, b.bounds.y, b.bounds.w, b.bounds.h);
        drawPixelText(`${b.name}  DANGER ${b.danger}`, b.bounds.x + 18, b.bounds.y + 28, 16, "#e0f2fe");
      });
      [{ x: -820, y: -760 }, { x: 920, y: -930 }, { x: -260, y: -1510 }].forEach((island) => {
        ctx.fillStyle = "#7c5d33";
        ctx.beginPath();
        ctx.ellipse(island.x, island.y, 82, 48, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#166534";
        ctx.fillRect(island.x - 26, island.y - 42, 54, 28);
      });
      ctx.translate(boat.x, boat.y);
      ctx.rotate(boat.angle);
      ctx.fillStyle = "#f97316";
      ctx.fillRect(-22, -10, 48, 20);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-2, -8, 18, 16);
      ctx.restore();
      if (weather === "fog") {
        ctx.fillStyle = "rgba(226,232,240,.18)";
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      }
      if (weather === "rain" || weather === "storm") {
        ctx.strokeStyle = weather === "storm" ? "rgba(191,219,254,.55)" : "rgba(191,219,254,.34)";
        for (let i = 0; i < 80; i++) {
          const x = (i * 37 + performance.now() / 4) % WORLD_W;
          const y = (i * 79 + performance.now() / 2) % WORLD_H;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 9, y + 18);
          ctx.stroke();
        }
      }
    }

    function drawDive() {
      ctx.save();
      ctx.translate(-camera.x + (Math.random() - 0.5) * camera.shake, -camera.y + (Math.random() - 0.5) * camera.shake);
      const g = ctx.createLinearGradient(0, 0, 0, WORLD_H);
      g.addColorStop(0, "#0e7490");
      g.addColorStop(0.55, "#0f3150");
      g.addColorStop(1, currentBiome === "abyss" ? "#020617" : "#071827");
      ctx.fillStyle = g;
      ctx.fillRect(camera.x, 0, WORLD_W, WORLD_H);
      for (let i = 0; i < 34; i++) {
        ctx.fillStyle = `rgba(125,211,252,${0.06 + Math.sin(performance.now() / 500 + i) * 0.04})`;
        ctx.fillRect(i * 44 + Math.sin(performance.now() / 800 + i) * 20, 0, 12, WORLD_H);
      }
      ctx.fillStyle = currentBiome === "wreck" ? "#334155" : "#164e63";
      ctx.fillRect(0, 500, 1400, 60);
      if (currentBiome === "wreck") {
        ctx.fillStyle = "#475569";
        ctx.fillRect(730, 390, 180, 72);
        ctx.fillRect(800, 350, 70, 40);
      }
      fish.forEach((entity) => {
        ctx.save();
        ctx.translate(entity.x, entity.y);
        const dir = entity.vx < 0 ? -1 : 1;
        ctx.scale(dir, 1);
        ctx.fillStyle = rarityColor[entity.species.rarity];
        ctx.beginPath();
        ctx.ellipse(0, 0, entity.species.danger > 30 ? 28 : 18, entity.species.danger > 30 ? 14 : 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = entity.species.danger > 0 ? "#ef4444" : "#0f172a";
        ctx.fillRect(12, -3, 4, 4);
        ctx.fillStyle = rarityColor[entity.species.rarity];
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(-30, -10);
        ctx.lineTo(-30, 10);
        ctx.fill();
        if (entity.alert > 0) drawPixelText("!", 0, -24, 22, "#facc15", "center");
        ctx.restore();
      });
      particles.forEach((p) => {
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
      });
      ctx.fillStyle = diver.invuln > 0 ? "#fca5a5" : "#e0f2fe";
      ctx.fillRect(diver.x - 12, diver.y - 18, 24, 30);
      ctx.fillStyle = "#f97316";
      ctx.fillRect(diver.x + 10, diver.y - 4, 28, 4);
      ctx.fillStyle = "rgba(14,165,233,.16)";
      ctx.beginPath();
      ctx.arc(diver.x, diver.y, 52 + Math.sin(performance.now() / 200) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (diver.oxygen < 28) {
        ctx.fillStyle = `rgba(239,68,68,${0.18 + Math.sin(performance.now() / 90) * 0.08})`;
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      }
    }

    function drawHud() {
      buttonsRef.current = [];
      const s = saveRef.current;
      const modeName = modeRef.current === "harbor" ? "항구 생활" : modeRef.current === "ocean" ? "바다 탐험" : "잠수 액션";
      drawRect(16, 14, 420, 72, "rgba(2,6,23,.72)");
      drawPixelText(`${modeName}  DAY ${s.day} ${clockLabel(s.clock)} ${weather.toUpperCase()}`, 32, 42, 15, "#bae6fd");
      drawPixelText(`G ${s.gold.toLocaleString()}  화물 ${s.cargo.length}/18  도감 ${Object.keys(s.collection).length}`, 32, 68, 14, "#fef3c7");
      if (modeRef.current === "ocean") {
        const biome = biomes.find((b) => b.id === currentBiome);
        drawRect(620, 14, 318, 72, "rgba(2,6,23,.72)");
        drawPixelText(`현재 해역: ${biome?.name || "외해"}`, 636, 42, 14, "#e0f2fe");
        drawPixelText(`부스트 ${Math.round(boat.boost)}%  Space 잠수`, 636, 68, 14, "#fde68a");
      }
      if (modeRef.current === "dive") {
        const stats = computeLoadoutStats(saveRef.current);
        drawRect(584, 14, 354, 92, "rgba(2,6,23,.74)");
        ctx.fillStyle = "#0ea5e9";
        ctx.fillRect(606, 44, 180 * clamp(diver.oxygen / (stats.oxygen || 100), 0, 1), 14);
        ctx.strokeStyle = "#bae6fd";
        ctx.strokeRect(606, 44, 180, 14);
        drawPixelText(`O2 ${Math.ceil(diver.oxygen)} / 압력 ${Math.ceil(diver.pressure)}m`, 606, 34, 14, "#e0f2fe");
        drawPixelText(`Space 작살 · Esc 수면`, 606, 82, 14, "#fde68a");
      }
      drawRect(16, WORLD_H - 76, WORLD_W - 32, 52, "rgba(2,6,23,.76)");
      drawPixelText(toastRef.current, 32, WORLD_H - 43, 15, "#f8fafc");

      const buttonData: [string, string, () => void][] = [
        ["harbor", "항구", () => setGameMode("harbor", "항구로 귀환했습니다. 판매, 제작, NPC 루프를 진행하세요.")],
        ["ocean", "출항", () => setGameMode("ocean", "외해 필드로 출항합니다.")],
        ["interact", modeRef.current === "dive" ? "작살" : "상호작용", () => (modeRef.current === "dive" ? fireHarpoon() : modeRef.current === "harbor" ? interactHarbor() : setGameMode("dive", "수동 잠수를 시작합니다."))],
      ];
      buttonData.forEach(([id, label, action], index) => {
        const btn = { id, label, x: WORLD_W - 330 + index * 104, y: WORLD_H - 132, w: 94, h: 42, action };
        buttonsRef.current.push(btn);
        drawRect(btn.x, btn.y, btn.w, btn.h, "rgba(8,145,178,.72)", "rgba(186,230,253,.42)");
        drawPixelText(label, btn.x + btn.w / 2, btn.y + 27, 13, "#fff", "center");
      });
    }

    function render(now: number) {
      if (!running) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      update(dt);
      ctx.clearRect(0, 0, WORLD_W, WORLD_H);
      if (modeRef.current === "harbor") drawHarbor();
      if (modeRef.current === "ocean") drawOcean();
      if (modeRef.current === "dive") drawDive();
      drawHud();
      raf = requestAnimationFrame(render);
    }

    resize();
    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const onPointerDown = (e: PointerEvent) => {
      const p = pointerToWorld(e);
      const hit = buttonsRef.current.find((b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
      if (hit) {
        hit.action();
        return;
      }
      pointer.active = true;
      pointer.startX = p.x;
      pointer.startY = p.y;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.fire = e.pointerType === "mouse";
    };
    const onPointerMove = (e: PointerEvent) => {
      const p = pointerToWorld(e);
      pointer.x = p.x;
      pointer.y = p.y;
    };
    const onPointerUp = () => {
      pointer.active = false;
      pointer.fire = true;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    raf = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      persistGameSave(saveRef.current);
    };
  }, []);

  return (
    <section className="game-shell" aria-label="Overwatch Fishing playable canvas game">
      <canvas ref={canvasRef} className="game-canvas" width={960} height={540} />
      <aside className="game-side-panel">
        <p className="eyebrow">LIVE GAME STATE</p>
        <h2>{mode === "harbor" ? "플레이 가능한 항구" : mode === "ocean" ? "실시간 바다 필드" : "횡스크롤 잠수"}</h2>
        <p>{toast}</p>
        <div className="stat-grid">
          <span>골드 <b>{save.gold.toLocaleString()}G</b></span>
          <span>도감 <b>{Object.keys(save.collection).length}</b></span>
          <span>화물 <b>{save.cargo.length}/18</b></span>
          <span>심도 <b>Lv.{save.metaDepth}</b></span>
        </div>
        <div className="controls-help">
          <b>Keyboard</b> WASD/방향키 이동 · E 상호작용 · Space 작살/잠수 · Shift 부스트 · Esc 상승
          <b>Touch</b> 화면 드래그 이동 · 우하단 HUD 버튼으로 상호작용
        </div>
      </aside>
    </section>
  );
}
