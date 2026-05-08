"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { gradeInfo, pickFish, regions } from "../../data/fishingData";
import {
  BagItem,
  SaveData,
  defaultSave,
  loadSave,
  saveGame,
  bagWeight,
  cargoLimit,
  fuelLimit,
  currentFreshness,
  itemSellValue,
  getDailySeaEvent,
  getPlayerLevel,
} from "../gameSave";

type BattlePhase = "idle" | "bite" | "pull" | "reel" | "result";


type OnlinePlayerRow = {
  discord_id: string;
  display_name: string;
  region_id: string;
  x: number;
  y: number;
  direction?: string | null;
  updated_at?: string | null;
};

type RemotePlayer = {
  sprite: any;
  nameText: any;
  targetX: number;
  targetY: number;
  lastSeen: number;
};

const ONLINE_SYNC_INTERVAL_MS = 200;
const ONLINE_FORCE_SYNC_MS = 2000;
const ONLINE_MOVE_THRESHOLD = 12;
const ONLINE_STALE_MS = 15000;
const MAX_REMOTE_PLAYERS = 12;


function BagOverlay({
  onClose,
  refreshKey,
}: {
  onClose: () => void;
  refreshKey: number;
}) {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [sort, setSort] = useState<"value" | "weight" | "fresh" | "grade">("value");

  useEffect(() => {
    setSave(loadSave());
  }, [refreshKey]);

  const items = [...(save.bag || [])].sort((a, b) => {
    if (sort === "value") return itemSellValue(b, save) - itemSellValue(a, save);
    if (sort === "weight") return b.kg - a.kg;
    if (sort === "fresh") return currentFreshness(b, save) - currentFreshness(a, save);
    return String(b.grade).localeCompare(String(a.grade));
  });

  const totalValue = items.reduce((sum, item) => sum + itemSellValue(item, save), 0);

  function discard(uid: string) {
    const next: SaveData = {
      ...save,
      bag: (save.bag || []).filter((item) => item.uid !== uid),
    };

    saveGame(next);
    setSave(next);
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/65 p-3 backdrop-blur-sm"
      style={{ touchAction: "none" }}
    >
      <section className="mx-auto flex h-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-cyan-300/20 bg-slate-950/95 text-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <h2 className="text-2xl font-black">🎒 어획 가방</h2>
            <p className="mt-1 text-xs text-slate-400">
              {bagWeight(save).toFixed(1)} / {cargoLimit(save)}kg · 예상 판매가 {totalValue.toLocaleString()}G
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 active:scale-95"
          >
            닫기
          </button>
        </header>

        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-white/10 p-3">
          {[
            ["value", "가격순"],
            ["weight", "무게순"],
            ["fresh", "신선도순"],
            ["grade", "등급순"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSort(id as any)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold ${
                sort === id ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">
              아직 가방이 비어 있습니다.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((item) => {
                const grade = gradeInfo[item.grade as keyof typeof gradeInfo];
                const fresh = currentFreshness(item, save);
                const value = itemSellValue(item, save);

                return (
                  <div key={item.uid} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-black" style={{ color: grade?.color || "#fff" }}>
                          {grade?.emoji} {item.name}
                        </div>
                        <p className="mt-1 text-xs text-slate-300">
                          {item.sizeRank} · {item.cm}cm · {item.kg}kg
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          신선도 {fresh}% · {value.toLocaleString()}G
                        </p>
                      </div>

                      <button
                        onClick={() => discard(item.uid)}
                        className="rounded-xl bg-red-500/20 px-3 py-2 text-xs font-bold text-red-200"
                      >
                        버리기
                      </button>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
                      <div
                        className={fresh > 70 ? "h-full bg-cyan-400" : fresh > 40 ? "h-full bg-yellow-400" : "h-full bg-red-400"}
                        style={{ width: `${fresh}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-white/10 p-3 text-center text-xs font-bold text-slate-400">
          판매는 항구 정산소에서 가능합니다. 바다에서는 가방 확인과 버리기만 가능합니다.
        </footer>
      </section>
    </div>
  );
}


function OceanGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [bagOpen, setBagOpen] = useState(false);
  const [bagRefreshKey, setBagRefreshKey] = useState(0);
  const searchParams = useSearchParams();
  const regionId = searchParams.get("region") || "busan";

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("last-ocean-url", `/ocean?region=${regionId}`);
    }

    let game: any = null;
    const currentRegion = regions.find((r) => r.id === regionId) || regions[0];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabase =
      supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey, {
            realtime: {
              params: {
                eventsPerSecond: 6,
              },
            },
          })
        : null;

    const onlineDiscordId =
      typeof window !== "undefined" ? localStorage.getItem("discord-user-id") || "" : "";
    const onlineDisplayName =
      typeof window !== "undefined"
        ? localStorage.getItem("discord-display-name") || "낚시꾼"
        : "낚시꾼";


    async function startGame() {
      const Phaser = (await import("phaser")).default;

      class ExpeditionScene extends Phaser.Scene {
        boat: any;
        fishes: any[] = [];
        keys: any = {};
        move = { x: 0, y: 0 };
        keyboardActive = false;

        otherPlayers = new Map<string, RemotePlayer>();
        onlineChannel: any = null;
        onlineSyncTimer = 0;
        onlineForceSyncTimer = 0;
        lastOnlineX = 0;
        lastOnlineY = 0;
        lastOnlineDirection = "down";
        multiplayerReady = false;

        hudText: any;
        hintText: any;
        eventText: any;
        minimap: any;
        minimapBoat: any;
        minimapPort: any;

        panel: any;
        battleTitle: any;
        fishNameText: any;
        battleGuide: any;
        battleText: any;
        directionArrow: any;
        directionLabel: any;
        promptPlusText: any;
        promptHookButton: any;
        timingBar: any;
        hitZone: any;
        pointer: any;
        tensionFill: any;

        saveData: SaveData = defaultSave();
        dailyEvent = getDailySeaEvent(regionId);
        fuel = 100;
        canFish = false;
        targetFish: any = null;
        isFishing = false;
        isResolving = false;
        phase: BattlePhase = "idle";
        pointerDirection = 1;
        tension = 50;
        reelProgress = 0;
        battleTimer = 0;
        requiredDirection = "LEFT";
        requiredDirection2 = "RIGHT";
        pullRound = 0;
        maxPullRounds = 1;
        battleQuality: "perfect" | "good" = "good";
        selectedFish = pickFish(regionId);
        fishSize = { cm: 0, kg: 0, sizeRank: "중형", multiplier: 1 };
        animTimer = 0;

        WORLD_WIDTH = 3000;
        WORLD_HEIGHT = 2300;
        PORT_X = 180;
        PORT_Y = 180;

        constructor() {
          super("ExpeditionScene");
        }

        preload() {
          this.load.image("ocean", "/assets/backgrounds/ocean_tile.png");
          this.load.image("shallow", "/assets/backgrounds/shallow_water_tile.png");
          this.load.image("island_tropical", "/assets/backgrounds/island_tropical.png");
          this.load.image("island_rocky", "/assets/backgrounds/island_rocky.png");
          this.load.image("island_sandbar", "/assets/backgrounds/island_sandbar.png");

          this.load.image("boat_idle_1", "/assets/sprites/boat_idle_1.png");
          this.load.image("boat_idle_2", "/assets/sprites/boat_idle_2.png");
          this.load.image("boat_move_1", "/assets/sprites/boat_move_1.png");
          this.load.image("boat_move_2", "/assets/sprites/boat_move_2.png");

          this.load.image("fish_common", "/assets/sprites/fish_shadow_common.png");
          this.load.image("fish_rare", "/assets/sprites/fish_shadow_rare.png");
          this.load.image("fish_epic", "/assets/sprites/fish_shadow_epic.png");
          this.load.image("fish_legend", "/assets/sprites/fish_shadow_legend.png");
          this.load.image("fish_mythic", "/assets/sprites/fish_shadow_mythic.png");
          this.load.image("fish_transcend", "/assets/sprites/fish_shadow_transcend.png");

          this.load.image("arrow_left", "/ui/arrows/left.png");
          this.load.image("arrow_right", "/ui/arrows/right.png");
          this.load.image("arrow_up", "/ui/arrows/up.png");
          this.load.image("arrow_down", "/ui/arrows/down.png");
          this.load.image("hook_button", "/assets/ui/hook_button.png");

          this.load.image("burst_rare", "/assets/effects/burst_rare.png");
          this.load.image("burst_epic", "/assets/effects/burst_epic.png");
          this.load.image("burst_legend", "/assets/effects/burst_legend.png");
          this.load.image("burst_mythic", "/assets/effects/burst_mythic.png");
          this.load.image("burst_transcend", "/assets/effects/burst_transcend.png");


        }

        create() {
          this.saveData = loadSave();
          this.fuel = fuelLimit(this.saveData);

          this.cameras.main.setBounds(0, 0, this.WORLD_WIDTH, this.WORLD_HEIGHT);
          this.drawWorld();
          this.spawnLandmarks();
          this.spawnFishField();

          this.boat = this.add.image(this.PORT_X + 80, this.PORT_Y + 80, "boat_idle_1");
          this.boat.setScale(0.12);
          this.boat.setDepth(30);

          this.cameras.main.startFollow(this.boat, true, 0.08, 0.08);

          this.keys = this.input.keyboard?.addKeys({
            up: "W", down: "S", left: "A", right: "D",
            up2: "UP", down2: "DOWN", left2: "LEFT", right2: "RIGHT",
            fish: "SPACE", fish2: "ENTER",
          });

          this.createHud();
          this.createBattlePanel();
          this.refreshHud();
          this.showEvent(`${this.dailyEvent.emoji} ${this.dailyEvent.name}: ${this.dailyEvent.desc}`, "#bae6fd");

          window.addEventListener("ocean-move", this.onMove as EventListener);
          window.addEventListener("ocean-fish", this.onFish as EventListener);
          window.addEventListener("ocean-return", this.returnToHarbor as EventListener);

          this.initMultiplayer();
          this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupMultiplayer());
          this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanupMultiplayer());
        }

        drawWorld() {
          this.add.rectangle(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, this.WORLD_WIDTH, this.WORLD_HEIGHT, currentRegion.bg);

          for (let x = 0; x < this.WORLD_WIDTH; x += 100) {
            for (let y = 0; y < this.WORLD_HEIGHT; y += 100) {
              const far = Phaser.Math.Distance.Between(this.PORT_X, this.PORT_Y, x, y);
              const texture = far < 650 || (x + y) % 500 === 0 ? "shallow" : "ocean";
              const tile = this.add.image(x, y, texture).setOrigin(0);
              tile.setAlpha(texture === "shallow" ? 0.22 : 0.82);
            }
          }

          for (let i = 0; i < 140; i++) {
            const sparkle = this.add.circle(
              Phaser.Math.Between(40, this.WORLD_WIDTH - 40),
              Phaser.Math.Between(40, this.WORLD_HEIGHT - 40),
              Phaser.Math.Between(1, 3),
              0xffffff,
              Phaser.Math.FloatBetween(0.14, 0.42)
            );
            this.tweens.add({ targets: sparkle, alpha: 0.02, duration: Phaser.Math.Between(900, 2200), yoyo: true, repeat: -1 });
          }
        }

        spawnLandmarks() {
          const port = this.add.rectangle(this.PORT_X, this.PORT_Y, 170, 120, 0x78350f, 0.9);
          port.setStrokeStyle(5, 0xfacc15, 0.9);
          port.setDepth(10);
          this.add.text(this.PORT_X - 48, this.PORT_Y - 15, "⚓ 항구", {
            fontSize: "22px", color: "#ffffff", fontStyle: "bold", stroke: "#000000", strokeThickness: 4,
          }).setDepth(20);

          const landmarks = [
            ["island_tropical", 520, 460, 0.28],
            ["island_rocky", 1150, 330, 0.26],
            ["island_sandbar", 2150, 420, 0.34],
            ["island_rocky", 620, 1550, 0.34],
            ["island_tropical", 2000, 1600, 0.28],
            ["island_sandbar", 2600, 1850, 0.26],
          ];

          for (const [texture, x, y, scale] of landmarks as any[]) {
            const island = this.add.image(x, y, texture);
            island.setScale(scale);
            island.setDepth(6);
          }

          const wreck = this.add.rectangle(2380, 1030, 140, 50, 0x3f2f1f, 0.85);
          wreck.setAngle(-18);
          wreck.setStrokeStyle(3, 0xf97316, 0.9);
          wreck.setDepth(8);
          this.add.text(2310, 960, "난파선", { fontSize: "18px", color: "#fed7aa", stroke: "#000000", strokeThickness: 4 }).setDepth(20);

          this.add.circle(2450, 720, 280, 0xffffff, 0.08).setDepth(3);
          this.add.text(2360, 650, "🌫️ 안개 해역", { fontSize: "18px", color: "#e0f2fe", stroke: "#000000", strokeThickness: 4 }).setDepth(20);
        }

        spawnFishField() {
          const radar = this.saveData.upgrades.radar || 0;
          const bait = this.saveData.prep?.bait || "basic";
          const baseTextures = ["fish_common", "fish_common", "fish_common", "fish_rare", "fish_epic"];
          const rareTextures = ["fish_rare", "fish_epic", "fish_legend"];
          const deepTextures = ["fish_epic", "fish_legend", "fish_mythic", "fish_transcend"];

          if (radar >= 2 || bait === "rare") rareTextures.push("fish_legend");
          if (radar >= 4 || bait === "heavy") deepTextures.push("fish_mythic");
          if (this.dailyEvent.rareBonus >= 2) deepTextures.push("fish_transcend");

          const fishCount = this.dailyEvent.id === "school" ? 58 : 46;

          for (let i = 0; i < fishCount; i++) {
            const x = Phaser.Math.Between(240, this.WORLD_WIDTH - 120);
            const y = Phaser.Math.Between(240, this.WORLD_HEIGHT - 120);
            const distance = Phaser.Math.Distance.Between(this.PORT_X, this.PORT_Y, x, y);
            let pool = baseTextures;
            if (distance > 900) pool = rareTextures;
            if (distance > 1650) pool = deepTextures;
            this.spawnOneFish(Phaser.Utils.Array.GetRandom(pool), x, y);
          }

          this.spawnBossShadow();
        }

        spawnOneFish(texture: string, x?: number, y?: number) {
          const fish = this.add.image(x ?? Phaser.Math.Between(220, this.WORLD_WIDTH - 120), y ?? Phaser.Math.Between(220, this.WORLD_HEIGHT - 120), texture);
          fish.setScale(Phaser.Math.FloatBetween(0.07, 0.115));
          fish.setAlpha(Phaser.Math.FloatBetween(0.55, 0.92));
          fish.setDepth(14);
          fish.setData("textureName", texture);
          fish.setData("panic", texture.includes("legend") || texture.includes("mythic") || texture.includes("transcend"));
          fish.setData("dirX", Phaser.Math.FloatBetween(-0.35, 0.35));
          fish.setData("dirY", Phaser.Math.FloatBetween(-0.35, 0.35));
          this.fishes.push(fish);
        }

        spawnBossShadow() {
          const boss = this.add.ellipse(2460, 1400, 260, 90, 0x020617, 0.5);
          boss.setDepth(12);
          boss.setData("boss", true);
          boss.setData("dirX", 0.6);
          boss.setData("dirY", 0.1);
          this.fishes.push(boss);
          this.tweens.add({ targets: boss, scaleX: 1.14, scaleY: 0.88, duration: 1200, yoyo: true, repeat: -1 });
        }

        createHud() {
          this.hudText = this.add.text(14, 58, "", {
            fontSize: "14px", color: "#ffffff", fontStyle: "bold", backgroundColor: "rgba(0,0,0,0.55)", padding: { x: 9, y: 7 },
          }).setScrollFactor(0).setDepth(100);

          this.hintText = this.add.text(this.scale.width / 2, this.scale.height - 118, "", {
            fontSize: "21px", color: "#fde047", align: "center", fontStyle: "bold", stroke: "#000000", strokeThickness: 5,
          }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

          this.eventText = this.add.text(this.scale.width / 2, 118, "", {
            fontSize: "18px", color: "#fde047", align: "center", fontStyle: "bold", backgroundColor: "rgba(0,0,0,0.55)", padding: { x: 12, y: 8 },
          }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(110);

          this.minimap = this.add.graphics().setScrollFactor(0).setDepth(101);
          this.minimapPort = this.add.circle(0, 0, 3, 0xfacc15, 1).setScrollFactor(0).setDepth(102);
          this.minimapBoat = this.add.circle(0, 0, 4, 0x22d3ee, 1).setScrollFactor(0).setDepth(103);
        }

        drawMinimap() {
          const w = 112, h = 88, x = this.scale.width - w - 12, y = 58;
          this.minimap.clear();
          this.minimap.fillStyle(0x020617, 0.62);
          this.minimap.fillRoundedRect(x, y, w, h, 10);
          this.minimap.lineStyle(2, 0x67e8f9, 0.45);
          this.minimap.strokeRoundedRect(x, y, w, h, 10);
          this.minimapBoat.setPosition(x + (this.boat.x / this.WORLD_WIDTH) * w, y + (this.boat.y / this.WORLD_HEIGHT) * h);
          this.minimapPort.setPosition(x + (this.PORT_X / this.WORLD_WIDTH) * w, y + (this.PORT_Y / this.WORLD_HEIGHT) * h);
        }

        createBattlePanel() {
          const width = this.scale.width, height = this.scale.height;
          this.panel = this.add.container(width / 2, height / 2).setScrollFactor(0).setVisible(false).setDepth(130);
          const bg = this.add.rectangle(0, 0, width * 0.92, 480, 0x020617, 0.96);
          bg.setStrokeStyle(5, 0x22d3ee);
          this.battleTitle = this.add.text(0, -210, "🎣 낚시 전투!", { fontSize: "34px", color: "#ffffff", fontStyle: "bold", stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5);
          this.fishNameText = this.add.text(0, -168, "", { fontSize: "21px", color: "#fde047", align: "center", fontStyle: "bold", stroke: "#000000", strokeThickness: 4, wordWrap: { width: width * 0.82 } }).setOrigin(0.5);
          this.battleGuide = this.add.text(0, -130, "", { fontSize: "18px", color: "#cbd5e1", align: "center", fontStyle: "bold", stroke: "#000000", strokeThickness: 4, wordWrap: { width: width * 0.82 } }).setOrigin(0.5);
          // 2단계 저항 입력 안내: 큰 방향키 이미지 + 실제 낚시 버튼 이미지
          // 녹색 타이밍 바 위에 한 줄로 배치한다.
          this.directionArrow = this.add.image(-98, -58, "arrow_left");
          this.directionArrow.setDisplaySize(96, 96);
          this.directionArrow.setVisible(false);
          this.directionArrow.setDepth(8);

          this.directionLabel = this.add.text(-10, -58, "+", {
            fontSize: "52px",
            color: "#ffffff",
            align: "center",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 8,
          }).setOrigin(0.5);
          this.directionLabel.setVisible(false);
          this.directionLabel.setDepth(8);

          this.promptHookButton = this.add.image(82, -58, "hook_button");
          this.promptHookButton.setDisplaySize(78, 78);
          this.promptHookButton.setVisible(false);
          this.promptHookButton.setDepth(8);

          this.timingBar = this.add.rectangle(0, 18, width * 0.72, 32, 0x172554);
          this.timingBar.setStrokeStyle(4, 0xffffff, 0.55);
          this.hitZone = this.add.rectangle(0, 18, width * 0.18, 46, 0x22c55e, 0.92);
          this.hitZone.setStrokeStyle(3, 0xbbf7d0, 1);
          this.pointer = this.add.rectangle(-width * 0.34, 18, 12, 72, 0xfacc15);
          this.pointer.setStrokeStyle(2, 0xffffff, 0.9);
          const tensionBg = this.add.rectangle(0, 54, width * 0.72, 24, 0x1e293b);
          tensionBg.setStrokeStyle(3, 0xffffff, 0.4);
          this.tensionFill = this.add.rectangle(-width * 0.36, 54, width * 0.36, 24, 0x22c55e).setOrigin(0, 0.5);
          this.battleText = this.add.text(0, 126, "", { fontSize: "23px", color: "#fde047", fontStyle: "bold", align: "center", stroke: "#000000", strokeThickness: 4, wordWrap: { width: width * 0.82 } }).setOrigin(0.5);
          const sub = this.add.text(0, 184, "가방에 담긴 물고기는 항구에서 판매됩니다.", { fontSize: "13px", color: "#94a3b8", stroke: "#000000", strokeThickness: 3, align: "center", wordWrap: { width: width * 0.82 } }).setOrigin(0.5);
          this.panel.add([bg, this.battleTitle, this.fishNameText, this.battleGuide,
            this.directionArrow,
            this.directionLabel, this.promptHookButton, this.timingBar, this.hitZone, this.pointer, tensionBg, this.tensionFill,  this.battleText, sub]);
        }

        refreshHud() {
          const weight = bagWeight(this.saveData);
          const limit = cargoLimit(this.saveData);
          const dist = this.boat ? Math.floor(Phaser.Math.Distance.Between(this.boat.x, this.boat.y, this.PORT_X, this.PORT_Y)) : 0;
          this.hudText.setText(
            `🎒 ${weight.toFixed(1)} / ${limit}kg   ⛽ ${Math.max(0, Math.floor(this.fuel))}/${fuelLimit(this.saveData)}\n` +
            `💰 ${this.saveData.gold.toLocaleString()}G   Lv.${getPlayerLevel(this.saveData)}   ✨ ${this.saveData.exp}   🐟 ${this.saveData.caught}\n` +
            `${this.dailyEvent.emoji} ${this.dailyEvent.name}   ⚓ ${dist}m`
          );
        }

        showEvent(message: string, color = "#fde047") {
          this.eventText.setText(message).setColor(color).setVisible(true).setAlpha(1);
          this.eventText.y = 118;
          this.tweens.add({ targets: this.eventText, y: 56, alpha: 0, duration: 1900, onComplete: () => this.eventText.setVisible(false) });
        }

        makeFishSize(grade: string) {
          const bait = this.saveData.prep?.bait || "basic";
          const gradeBonus = grade === "common" ? 1 : grade === "rare" ? 1.25 : grade === "epic" ? 1.6 : grade === "legend" ? 2.2 : grade === "mythic" ? 3.1 : 4.5;
          const roll = Math.random() + (bait === "heavy" ? 0.05 : 0);
          const rank = roll > 0.985 ? "괴물급" : roll > 0.92 ? "초대형" : roll > 0.72 ? "대형" : roll > 0.28 ? "중형" : "소형";
          const rankMult = rank === "괴물급" ? 3.2 : rank === "초대형" ? 2.2 : rank === "대형" ? 1.45 : rank === "중형" ? 1 : 0.72;
          const cm = Math.round((25 + Math.random() * 70) * gradeBonus * rankMult * 10) / 10;
          const kg = Math.round((cm * cm * 0.0009 + Math.random() * 3) * gradeBonus * 10) / 10;
          return { cm, kg, sizeRank: rank, multiplier: Math.max(0.8, rankMult) };
        }

        onMove = (event: Event) => {
          const custom = event as CustomEvent<{ x: number; y: number }>;
          this.move = custom.detail;
        };

        onFish = () => {
          if (this.isResolving) return;
          if (this.isFishing) {
            this.handleBattleInput();
            return;
          }
          if (!this.canFish || !this.targetFish) {
            this.showEvent("🐟 물고기 실루엣 근처로 이동하세요.", "#bae6fd");
            return;
          }
          if (bagWeight(this.saveData) >= cargoLimit(this.saveData)) {
            this.showEvent("🎒 가방이 가득 찼습니다. 항구로 귀환하세요!", "#fca5a5");
            return;
          }
          this.startFishingBattle();
        };

        startFishingBattle() {
          if (this.isFishing || this.isResolving) return;
          this.isFishing = true;
          this.phase = "bite";
          this.tension = 50;
          this.reelProgress = 0;
          this.battleTimer = 0;
          this.pullRound = 0;
          this.battleQuality = "good";
          this.move = { x: 0, y: 0 };
          this.selectedFish = pickFish(regionId);
          this.fishSize = this.makeFishSize(this.selectedFish.grade);
          const grade = gradeInfo[this.selectedFish.grade];

          const gradePulls =
            this.selectedFish.grade === "common" ? 1 :
            this.selectedFish.grade === "rare" ? 1 :
            this.selectedFish.grade === "epic" ? 2 :
            this.selectedFish.grade === "legend" ? 2 :
            this.selectedFish.grade === "mythic" ? 3 : 3;

          const sizeExtra = this.fishSize.sizeRank === "괴물급" || this.fishSize.sizeRank === "초대형" ? 1 : 0;
          this.maxPullRounds = gradePulls + sizeExtra;
          if (["legend", "mythic", "transcend"].includes(this.selectedFish.grade)) {
            this.cameras.main.shake(260, 0.012);
            this.showEvent(`${grade.emoji} 희귀한 기척이 느껴진다!`, grade.color);
          }
          this.fishNameText.setText(`${grade.emoji} ${grade.name} 입질!`).setColor(grade.color);
          this.battleText.setText("");
          const width = this.scale.width;
          const rodBonus = (this.saveData.upgrades.rod || 0) * 0.014;
          const sizePenalty =
            this.fishSize.sizeRank === "괴물급" ? 0.055 :
            this.fishSize.sizeRank === "초대형" ? 0.035 :
            this.fishSize.sizeRank === "대형" ? 0.018 : 0;

          this.hitZone.width = width * Math.max(0.075, Math.min(0.31, grade.zone + rodBonus - sizePenalty));
          this.hitZone.x = Phaser.Math.Between(-Math.floor(width * 0.25), Math.floor(width * 0.25));
          this.pointer.x = -this.timingBar.width / 2;
          this.pointerDirection = 1;
          this.hideDirectionPrompt();
          this.battleGuide.setText("1단계 입질: 초록 구간에서 낚시 버튼! PERFECT면 장력 보너스");
          this.panel.setVisible(true);
          this.hintText.setText("");
          this.updateTensionBar();
        }

        handleBattleInput() {
          if (this.phase === "bite") this.checkBite();
          else if (this.phase === "pull") this.checkPullInput();
          else if (this.phase === "reel") {
            const gradeHard =
              this.selectedFish.grade === "common" ? 0 :
              this.selectedFish.grade === "rare" ? 1 :
              this.selectedFish.grade === "epic" ? 2 :
              this.selectedFish.grade === "legend" ? 3 :
              this.selectedFish.grade === "mythic" ? 4 : 5;

            const sizeHard = this.fishSize.sizeRank === "괴물급" ? 3 : this.fishSize.sizeRank === "초대형" ? 2 : this.fishSize.sizeRank === "대형" ? 1 : 0;
            const rod = this.saveData.upgrades.rod || 0;

            this.reelProgress += Math.max(7, 13 + rod * 1.5 - gradeHard - sizeHard);
            this.tension += 8 + gradeHard + sizeHard;
            this.battleText.setText(`릴 감기! ${Math.min(100, Math.floor(this.reelProgress))}% · 장력 ${Math.floor(this.tension)}%`);
            this.updateTensionBar();
            if (this.reelProgress >= 100) this.finishCatch(true, this.battleQuality);
            if (this.tension >= 100) this.finishCatch(false, "miss");
          }
        }

        checkBite() {
          const center = this.pointer.x;
          const left = this.hitZone.x - this.hitZone.width / 2;
          const right = this.hitZone.x + this.hitZone.width / 2;
          const perfectRange = Math.max(12, this.hitZone.width * 0.18);
          const perfect = Math.abs(center - this.hitZone.x) <= perfectRange;
          const success = center >= left && center <= right;
          if (!success) return this.finishCatch(false, "miss");

          this.battleQuality = perfect ? "perfect" : "good";
          this.phase = "pull";
          this.pullRound = 1;
          this.battleTimer = 0;
          this.requiredDirection = Phaser.Utils.Array.GetRandom(["LEFT", "RIGHT", "UP", "DOWN"]);
          this.showDirectionPrompt(this.requiredDirection, `2단계 저항 ${this.pullRound}/${this.maxPullRounds}`);
          this.battleText.setText(perfect ? "🌟 PERFECT! 장력이 낮아졌다!" : "✅ 입질 성공! 저항을 받아내자!");
          this.tension += perfect ? -14 : 6;
          this.updateTensionBar();
        }

        getArrowTexture(direction: string) {
          if (direction === "LEFT") return "arrow_left";
          if (direction === "RIGHT") return "arrow_right";
          if (direction === "UP") return "arrow_up";
          if (direction === "DOWN") return "arrow_down";
          return "arrow_left";
        }

        showDirectionPrompt(direction: string, prefix = "방향 입력") {
          if (this.directionArrow) {
            this.directionArrow.setTexture(this.getArrowTexture(direction));
            this.directionArrow.setDisplaySize(96, 96);
            this.directionArrow.setPosition(-98, -58);
            this.directionArrow.setVisible(true);
            this.tweens.add({
              targets: [this.directionArrow, this.directionLabel, this.promptHookButton].filter(Boolean),
              alpha: 0.72,
              duration: 160,
              yoyo: true,
              repeat: 1,
            });
          }

          if (this.directionLabel) {
            this.directionLabel.setText("+");
            this.directionLabel.setPosition(-10, -58);
            this.directionLabel.setVisible(true);
          }

          if (this.promptHookButton) {
            this.promptHookButton.setDisplaySize(78, 78);
            this.promptHookButton.setPosition(82, -58);
            this.promptHookButton.setVisible(true);
          }

          this.battleGuide.setText(prefix);
        }

        hideDirectionPrompt() {
          if (this.directionArrow) this.directionArrow.setVisible(false);
          if (this.directionLabel) this.directionLabel.setVisible(false);
          if (this.promptHookButton) this.promptHookButton.setVisible(false);
        }

        formatDirection(direction: string) {
          if (direction === "LEFT") return "왼쪽";
          if (direction === "RIGHT") return "오른쪽";
          if (direction === "UP") return "위쪽";
          if (direction === "DOWN") return "아래쪽";
          return direction;
        }

        getCurrentInputDirection() {
          if (this.keys.left?.isDown || this.keys.left2?.isDown || this.move.x < -0.25) return "LEFT";
          if (this.keys.right?.isDown || this.keys.right2?.isDown || this.move.x > 0.25) return "RIGHT";
          if (this.keys.up?.isDown || this.keys.up2?.isDown || this.move.y < -0.25) return "UP";
          if (this.keys.down?.isDown || this.keys.down2?.isDown || this.move.y > 0.25) return "DOWN";
          return "";
        }

        checkPullInput() {
          const input = this.getCurrentInputDirection();
          if (input === this.requiredDirection) {
            this.tension -= 14;

            if (this.pullRound < this.maxPullRounds) {
              this.pullRound += 1;
              this.battleTimer = 0;
              const dirs = ["LEFT", "RIGHT", "UP", "DOWN"].filter((d) => d !== this.requiredDirection);
              this.requiredDirection = Phaser.Utils.Array.GetRandom(dirs);
              this.showDirectionPrompt(this.requiredDirection, `2단계 저항 ${this.pullRound}/${this.maxPullRounds}`);
              this.battleText.setText("✅ 저항을 받아냈다! 다음 방향!");
            } else {
              this.phase = "reel";
              this.battleTimer = 0;
              this.hideDirectionPrompt();
              this.battleGuide.setText("3단계 릴링: 낚시 버튼을 연타하되 장력이 터지지 않게!");
              this.battleText.setText("🎣 릴링 시작!");
              this.tension -= 12;
            }
          } else {
            const penalty =
              this.selectedFish.grade === "mythic" || this.selectedFish.grade === "transcend" ? 32 :
              this.selectedFish.grade === "legend" ? 28 : 24;
            this.tension += penalty;
            this.requiredDirection = Phaser.Utils.Array.GetRandom(["LEFT", "RIGHT", "UP", "DOWN"]);
            this.showDirectionPrompt(this.requiredDirection, "방향이 틀렸다!");
            this.battleText.setText("⚠️ 장력이 크게 올라간다!");
            if (this.tension >= 100) this.finishCatch(false, "miss");
          }
          this.updateTensionBar();
        }

        updateTensionBar() {
          this.tension = Phaser.Math.Clamp(this.tension, 0, 100);
          const maxWidth = this.scale.width * 0.72;
          this.tensionFill.width = maxWidth * (this.tension / 100);
          this.tensionFill.fillColor = this.tension >= 80 ? 0xef4444 : this.tension >= 55 ? 0xfacc15 : 0x22c55e;
        }

        finishCatch(success: boolean, quality: "perfect" | "good" | "miss") {
          if (this.isResolving) return;
          this.isResolving = true;
          this.phase = "result";
          const grade = gradeInfo[this.selectedFish.grade];
          if (success) {
            const eventMult = this.dailyEvent.goldMultiplier;
            const item: BagItem = {
              uid: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              fishId: this.selectedFish.id,
              name: this.selectedFish.name,
              grade: this.selectedFish.grade,
              cm: this.fishSize.cm,
              kg: this.fishSize.kg,
              baseValue: Math.floor(
                this.selectedFish.price *
                this.fishSize.multiplier *
                eventMult *
                (quality === "perfect" ? 1.25 : 1)
              ),
              exp: Math.floor(this.selectedFish.exp * this.dailyEvent.expMultiplier),
              freshness: 100,
              caughtAt: Date.now(),
              region: regionId,
              sizeRank: this.fishSize.sizeRank,
            };
            if (bagWeight(this.saveData) + item.kg > cargoLimit(this.saveData)) {
              this.battleText.setColor("#fca5a5").setText("MISS\n🎒 가방이 부족해서 놓쳤습니다!\n항구로 돌아가 적재량을 비우세요.");
            } else {
              this.saveData.bag = [...(this.saveData.bag || []), item];
              this.saveData.exp += item.exp;
              this.saveData.caught += 1;
              this.saveData.collection[item.fishId] = (this.saveData.collection[item.fishId] || 0) + 1;
              if (!this.saveData.records) this.saveData.records = {};
              const old = this.saveData.records[item.fishId];
              const isRecord = !old || item.cm > old.cm;
              if (isRecord) this.saveData.records[item.fishId] = { cm: item.cm, kg: item.kg };
              saveGame(this.saveData);
              this.battleText.setColor(quality === "perfect" ? "#fde047" : "#86efac").setText(
                `${quality === "perfect" ? "PERFECT" : "SUCCESS"}\n${grade.emoji} ${item.name}\n${item.sizeRank} · ${item.cm}cm · ${item.kg}kg\n🎒 가방에 보관됨${isRecord ? "\n🏆 신기록!" : ""}`
              );
              if (item.sizeRank === "괴물급") {
                this.cameras.main.shake(320, 0.015);
                this.showEvent("🐋 괴물급 사이즈!", "#fde047");
              }
            }
            if (this.targetFish) {
              const burst = this.add.image(this.targetFish.x, this.targetFish.y, grade.burst).setScale(0.42).setDepth(70);
              this.tweens.add({ targets: burst, scale: 1.1, alpha: 0, duration: 750, onComplete: () => burst.destroy() });
              this.targetFish.destroy();
              this.fishes = this.fishes.filter((f) => f !== this.targetFish);
              this.spawnOneFish(Phaser.Utils.Array.GetRandom(["fish_common", "fish_rare", "fish_epic"]));
            }
            this.targetFish = null;
            this.canFish = false;
            this.refreshHud();
          } else {
            if (this.targetFish) {
              this.targetFish.destroy();
              this.fishes = this.fishes.filter((f) => f !== this.targetFish);
              this.spawnOneFish(Phaser.Utils.Array.GetRandom(["fish_common", "fish_rare", "fish_epic"]));
            }
            this.targetFish = null;
            this.canFish = false;
            this.battleText.setColor("#fca5a5").setText("MISS\n줄이 풀렸다!\n물고기가 도망갔습니다.");
          }
          this.time.delayedCall(1850, () => {
            this.panel.setVisible(false);
            this.isFishing = false;
            this.isResolving = false;
            this.phase = "idle";
            this.battleText.setText("");
          });
        }

        returnToHarbor = () => {
          const dist = Phaser.Math.Distance.Between(this.boat.x, this.boat.y, this.PORT_X, this.PORT_Y);
          if (dist > 230) {
            this.showEvent("⚓ 항구 근처에서만 귀환/판매할 수 있습니다.", "#fca5a5");
            return;
          }
          saveGame(this.saveData);
          window.location.href = "/harbor";
        };

        handleKeyboardInput() {
          if (!this.keys) return;
          const x = (this.keys.left?.isDown || this.keys.left2?.isDown ? -1 : 0) + (this.keys.right?.isDown || this.keys.right2?.isDown ? 1 : 0);
          const y = (this.keys.up?.isDown || this.keys.up2?.isDown ? -1 : 0) + (this.keys.down?.isDown || this.keys.down2?.isDown ? 1 : 0);
          if (!this.isFishing) {
            if (x !== 0 || y !== 0) {
              this.keyboardActive = true;
              this.move = { x, y };
            } else if (this.keyboardActive) {
              this.keyboardActive = false;
              this.move = { x: 0, y: 0 };
            }
          }
          if (Phaser.Input.Keyboard.JustDown(this.keys.fish) || Phaser.Input.Keyboard.JustDown(this.keys.fish2)) this.onFish();
        }

        update(_time: number, delta: number) {
          this.animTimer += delta;
          this.handleKeyboardInput();
          this.drawMinimap();
          if (this.isFishing) {
            this.updateBattle(delta);
            return;
          }
          this.updateMovement(delta);
          this.updateFishAI(delta);
          this.detectFish();
          this.updateMultiplayer(delta);
          this.refreshHud();
        }


        initMultiplayer() {
          if (!supabase || !onlineDiscordId || !this.boat) {
            if (!supabase) console.warn("Supabase env is missing. Multiplayer disabled.");
            return;
          }

          this.multiplayerReady = true;
          this.lastOnlineX = this.boat.x;
          this.lastOnlineY = this.boat.y;

          this.loadInitialOnlinePlayers();

          this.onlineChannel = supabase
            .channel(`fishing-online-${regionId}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "fishing_online_players",
                filter: `region_id=eq.${regionId}`,
              },
              (payload: any) => this.handleOnlinePayload(payload)
            )
            .subscribe((status: string) => {
              if (status === "SUBSCRIBED") {
                this.sendOnlinePosition(true);
              }
            });
        }

        async loadInitialOnlinePlayers() {
          if (!supabase || !onlineDiscordId) return;

          const since = new Date(Date.now() - ONLINE_STALE_MS).toISOString();

          const { data, error } = await supabase
            .from("fishing_online_players")
            .select("discord_id, display_name, region_id, x, y, direction, updated_at")
            .eq("region_id", regionId)
            .gt("updated_at", since)
            .limit(MAX_REMOTE_PLAYERS + 1);

          if (error) {
            console.warn("Failed to load online players:", error.message);
            return;
          }

          for (const row of (data || []) as OnlinePlayerRow[]) {
            this.upsertRemotePlayer(row);
          }
        }

        handleOnlinePayload(payload: any) {
          const row = (payload.new || payload.old) as OnlinePlayerRow | undefined;
          if (!row || row.discord_id === onlineDiscordId) return;

          if (payload.eventType === "DELETE") {
            this.removeRemotePlayer(row.discord_id);
            return;
          }

          if (row.region_id !== regionId) {
            this.removeRemotePlayer(row.discord_id);
            return;
          }

          this.upsertRemotePlayer(row);
        }

        upsertRemotePlayer(row: OnlinePlayerRow) {
          if (!row.discord_id || row.discord_id === onlineDiscordId) return;

          const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
          if (Date.now() - updatedAt > ONLINE_STALE_MS) {
            this.removeRemotePlayer(row.discord_id);
            return;
          }

          if (!this.otherPlayers.has(row.discord_id) && this.otherPlayers.size >= MAX_REMOTE_PLAYERS) {
            return;
          }

          let remote = this.otherPlayers.get(row.discord_id);

          if (!remote) {
            const sprite = this.add.image(row.x, row.y, "boat_idle_1");
            sprite.setScale(0.105);
            sprite.setAlpha(0.78);
            sprite.setDepth(24);

            const safeName = String(row.display_name || "낚시꾼").slice(0, 12);
            const nameText = this.add.text(row.x, row.y - 34, safeName, {
              fontSize: "18px",
              color: "#e0f2fe",
              align: "center",
              fontStyle: "bold",
              stroke: "#020617",
              strokeThickness: 5,
            }).setOrigin(0.5);
            nameText.setDepth(25);

            remote = {
              sprite,
              nameText,
              targetX: row.x,
              targetY: row.y,
              lastSeen: Date.now(),
            };

            this.otherPlayers.set(row.discord_id, remote);
          }

          remote.targetX = Number(row.x) || remote.targetX;
          remote.targetY = Number(row.y) || remote.targetY;
          remote.lastSeen = Date.now();

          if (row.direction === "left") remote.sprite.setFlipX(true);
          if (row.direction === "right") remote.sprite.setFlipX(false);
        }

        removeRemotePlayer(discordId: string) {
          const remote = this.otherPlayers.get(discordId);
          if (!remote) return;

          remote.sprite.destroy();
          remote.nameText.destroy();
          this.otherPlayers.delete(discordId);
        }

        getBoatDirection() {
          if (this.move.x < -0.1) return "left";
          if (this.move.x > 0.1) return "right";
          if (this.move.y < -0.1) return "up";
          if (this.move.y > 0.1) return "down";
          return this.lastOnlineDirection || "down";
        }

        async sendOnlinePosition(force = false) {
          if (!supabase || !onlineDiscordId || !this.boat) return;

          const direction = this.getBoatDirection();
          const moved = Phaser.Math.Distance.Between(
            this.lastOnlineX,
            this.lastOnlineY,
            this.boat.x,
            this.boat.y
          );

          if (!force && moved < ONLINE_MOVE_THRESHOLD && direction === this.lastOnlineDirection) return;

          this.lastOnlineX = this.boat.x;
          this.lastOnlineY = this.boat.y;
          this.lastOnlineDirection = direction;

          await supabase
            .from("fishing_online_players")
            .upsert(
              {
                discord_id: onlineDiscordId,
                display_name: onlineDisplayName,
                region_id: regionId,
                x: Math.round(this.boat.x),
                y: Math.round(this.boat.y),
                direction,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "discord_id" }
            );
        }

        updateMultiplayer(delta: number) {
          if (!this.multiplayerReady) return;

          this.onlineSyncTimer += delta;
          this.onlineForceSyncTimer += delta;

          if (this.onlineSyncTimer >= ONLINE_SYNC_INTERVAL_MS) {
            const force = this.onlineForceSyncTimer >= ONLINE_FORCE_SYNC_MS;
            this.onlineSyncTimer = 0;
            if (force) this.onlineForceSyncTimer = 0;
            this.sendOnlinePosition(force).catch((error: any) => {
              console.warn("Failed to sync online position:", error?.message || error);
            });
          }

          const now = Date.now();

          for (const [discordId, remote] of this.otherPlayers) {
            if (now - remote.lastSeen > ONLINE_STALE_MS) {
              this.removeRemotePlayer(discordId);
              continue;
            }

            remote.sprite.x = Phaser.Math.Linear(remote.sprite.x, remote.targetX, 0.22);
            remote.sprite.y = Phaser.Math.Linear(remote.sprite.y, remote.targetY, 0.22);
            remote.nameText.x = remote.sprite.x;
            remote.nameText.y = remote.sprite.y - 34;
          }
        }

        cleanupMultiplayer() {
          for (const discordId of Array.from(this.otherPlayers.keys())) {
            this.removeRemotePlayer(discordId);
          }

          if (this.onlineChannel && supabase) {
            supabase.removeChannel(this.onlineChannel);
            this.onlineChannel = null;
          }

          if (supabase && onlineDiscordId) {
            supabase
              .from("fishing_online_players")
              .delete()
              .eq("discord_id", onlineDiscordId)
              .then(() => undefined);
          }
        }

        updateBattle(delta: number) {
          if (this.isResolving) return;
          if (this.phase === "bite") {
            const speed = gradeInfo[this.selectedFish.grade].speed;
            const limit = this.timingBar.width / 2;
            this.pointer.x += this.pointerDirection * speed;
            if (this.pointer.x >= limit) { this.pointer.x = limit; this.pointerDirection = -1; }
            if (this.pointer.x <= -limit) { this.pointer.x = -limit; this.pointerDirection = 1; }
          }
          if (this.phase === "pull") {
            this.battleTimer += delta;
            const gradeHard =
              this.selectedFish.grade === "common" ? 1 :
              this.selectedFish.grade === "rare" ? 1.15 :
              this.selectedFish.grade === "epic" ? 1.3 :
              this.selectedFish.grade === "legend" ? 1.55 :
              this.selectedFish.grade === "mythic" ? 1.8 : 2.1;

            this.tension += 0.016 * delta * gradeHard;
            this.updateTensionBar();
            if (this.battleTimer > 3900 || this.tension >= 100) this.finishCatch(false, "miss");
          }
          if (this.phase === "reel") {
            const relief = this.battleQuality === "perfect" ? 0.018 : 0.012;
            this.tension -= relief * delta;
            this.reelProgress -= 0.008 * delta;
            this.reelProgress = Phaser.Math.Clamp(this.reelProgress, 0, 100);
            this.updateTensionBar();
            if (this.tension <= 0) this.tension = 4;
          }
        }

        updateMovement(delta: number) {
          const engine = this.saveData.upgrades.engine || 0;
          const speed = 4.5 + engine * 0.7;
          const moving = this.move.x !== 0 || this.move.y !== 0;
          if (moving && this.fuel > 0) {
            this.boat.x += this.move.x * speed * (delta / 16.6);
            this.boat.y += this.move.y * speed * (delta / 16.6);
            this.fuel -= 0.018 * (delta / 16.6);
          } else if (moving && this.fuel <= 0) {
            this.showEvent("⛽ 연료가 없습니다. 항구로 돌아가세요.", "#fca5a5");
          }
          this.boat.x = Phaser.Math.Clamp(this.boat.x, 50, this.WORLD_WIDTH - 50);
          this.boat.y = Phaser.Math.Clamp(this.boat.y, 50, this.WORLD_HEIGHT - 50);
          if (moving) {
            this.boat.rotation = Math.atan2(this.move.y, this.move.x) + Math.PI / 2;
            this.boat.setTexture(Math.floor(this.animTimer / 180) % 2 === 0 ? "boat_move_1" : "boat_move_2");
          } else {
            this.boat.setTexture(Math.floor(this.animTimer / 550) % 2 === 0 ? "boat_idle_1" : "boat_idle_2");
          }
        }

        updateFishAI(delta: number) {
          for (const fish of this.fishes) {
            if (!fish.active) continue;
            const isBoss = fish.getData("boss");
            const dist = Phaser.Math.Distance.Between(this.boat.x, this.boat.y, fish.x, fish.y);
            const panic = fish.getData("panic");
            let dx = fish.getData("dirX") || 0;
            let dy = fish.getData("dirY") || 0;
            if (dist < (panic || isBoss ? 210 : 145)) {
              const angle = Phaser.Math.Angle.Between(this.boat.x, this.boat.y, fish.x, fish.y);
              dx = Math.cos(angle) * (isBoss ? 1.9 : panic ? 2.4 : 1.25);
              dy = Math.sin(angle) * (isBoss ? 1.9 : panic ? 2.4 : 1.25);
              fish.setAlpha(1);
              if ((panic || isBoss) && Math.random() < 0.006) this.showEvent(isBoss ? "🐋 거대한 그림자가 움직인다..." : "⚠️ 희귀 물고기가 도망친다!", "#fb7185");
            } else if (Math.random() < 0.006) {
              dx = Phaser.Math.FloatBetween(-0.45, 0.45);
              dy = Phaser.Math.FloatBetween(-0.45, 0.45);
              fish.setData("dirX", dx);
              fish.setData("dirY", dy);
            }
            fish.x += dx * (delta / 16.6);
            fish.y += dy * (delta / 16.6);
            fish.x = Phaser.Math.Clamp(fish.x, 60, this.WORLD_WIDTH - 60);
            fish.y = Phaser.Math.Clamp(fish.y, 60, this.WORLD_HEIGHT - 60);
            if (!isBoss && (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1)) fish.rotation = Math.atan2(dy, dx) + Math.PI / 2;
          }
        }

        detectFish() {
          this.canFish = false;
          this.targetFish = null;
          const detectRange = 128 + (this.saveData.upgrades.radar || 0) * 18;
          for (const fish of this.fishes) {
            const dist = Phaser.Math.Distance.Between(this.boat.x, this.boat.y, fish.x, fish.y);
            if (dist < detectRange) {
              this.canFish = true;
              this.targetFish = fish;
              this.hintText.setText(fish.getData("boss") ? "🐋 거대 그림자 발견! 낚시 버튼!" : "🎣 물고기 실루엣 발견! 낚시 버튼!");
              if (typeof fish.setTint === "function") {
                fish.setTint(0xffffaa);
              }
              break;
            } else {
              if (typeof fish.clearTint === "function") {
                fish.clearTint();
              }
            }
          }
          if (!this.canFish) this.hintText.setText("");
        }

        shutdown() {
          window.removeEventListener("ocean-move", this.onMove as EventListener);
          window.removeEventListener("ocean-fish", this.onFish as EventListener);
          window.removeEventListener("ocean-return", this.returnToHarbor as EventListener);
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: gameRef.current!,
        backgroundColor: "#082f49",
        scene: ExpeditionScene,
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
        render: { pixelArt: true, antialias: false },
      });
    }

    startGame();

    return () => { if (game) game.destroy(true); };
  }, [regionId]);

  function move(x: number, y: number) {
    window.dispatchEvent(new CustomEvent("ocean-move", { detail: { x, y } }));
  }
  function stopMove() {
    window.dispatchEvent(new CustomEvent("ocean-move", { detail: { x: 0, y: 0 } }));
  }
  function fish() {
    window.dispatchEvent(new CustomEvent("ocean-fish"));
  }
  function returnHarbor() {
    window.dispatchEvent(new CustomEvent("ocean-return"));
  }

  function openBag() {
    setBagRefreshKey(Date.now());
    setBagOpen(true);
  }
  function releaseMove() {
    setStick({ x: 0, y: 0 });
    stopMove();
  }
  function updateJoystick(clientX: number, clientY: number) {
    const el = stickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const max = rect.width / 2 - 22;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > max && dist > 0) {
      dx = (dx / dist) * max;
      dy = (dy / dist) * max;
    }
    setStick({ x: dx, y: dy });
    move(dx / max, dy / max);
  }
  function pointerJoystick(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    updateJoystick(e.clientX, e.clientY);
  }

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-black select-none" style={{ touchAction: "none" }}>
      <div ref={gameRef} className="h-full w-full" />

      <div className="absolute left-3 top-3 z-50 flex gap-1.5">
        <a href="/harbor" className="rounded-lg bg-black/55 px-2.5 py-2 text-[11px] font-black text-white backdrop-blur">⚓</a>
        <button onClick={openBag} className="rounded-lg bg-black/55 px-2.5 py-2 text-[11px] font-black text-white backdrop-blur">🎒</button>
        <button onClick={returnHarbor} className="rounded-lg bg-amber-400 px-2.5 py-2 text-[11px] font-black text-slate-950 shadow-lg">귀환</button>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-50 hidden rounded-xl bg-black/45 px-3 py-2 text-xs font-bold text-white/80 backdrop-blur sm:block">
        PC: WASD/방향키 이동 · Space/Enter 낚시
      </div>

      <div
        ref={stickRef}
        onPointerDown={pointerJoystick}
        onPointerMove={(e) => { if (e.buttons === 1 || e.pointerType === "touch") updateJoystick(e.clientX, e.clientY); }}
        onPointerUp={releaseMove}
        onPointerCancel={releaseMove}
        onLostPointerCapture={releaseMove}
        className="absolute bottom-6 left-5 z-50 h-32 w-32 rounded-full border border-white/15 bg-black/30 backdrop-blur"
        style={{ touchAction: "none" }}
      >
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20 bg-cyan-400/10" />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-12 rounded-full border-2 border-cyan-200 bg-cyan-400/80 shadow-xl shadow-cyan-400/30"
          style={{ transform: `translate(calc(-50% + ${stick.x}px), calc(-50% + ${stick.y}px))` }}
        />
      </div>

      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); fish(); }}
        className="absolute bottom-9 right-5 z-50 h-24 w-24 rounded-full border-4 border-amber-900 bg-blue-600 text-xl font-black text-white shadow-2xl active:scale-95"
        style={{ backgroundImage: "url('/assets/ui/hook_button.png')", backgroundSize: "cover", backgroundPosition: "center", touchAction: "none", color: "transparent" }}
      >
        낚시
      </button>

      <div className="pointer-events-none absolute bottom-1 left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/35 px-3 py-1 text-[11px] font-bold text-white/70 backdrop-blur sm:hidden">
        탐험 · 가방 적재 · 항구 귀환 · 판매
      </div>

      {bagOpen && (
        <BagOverlay
          refreshKey={bagRefreshKey}
          onClose={() => {
            setBagOpen(false);
            setBagRefreshKey(Date.now());
          }}
        />
      )}
    </main>
  );
}

export default function OceanPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-950 text-white">로딩 중...</main>}>
      <OceanGame />
    </Suspense>
  );
}