"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { gradeInfo, regions } from "../../data/fishingData";
import {
  SaveData,
  loadSave,
  saveGame,
  defaultSave,
  bagWeight,
  cargoLimit,
  currentFreshness,
  fuelLimit,
  itemSellValue,
  getPlayerLevel,
  getNextLevelExp,
  isRegionUnlocked,
  buyItem,
  equipItem,
  upgradeEquipment,
  sellBagItems,
  addAquariumExhibit,
  claimAquariumIncome,
  getAquariumIncome,
  getEquipmentItem,
  getEquipmentStats,
} from "../gameSave";
import DiscordLaunchBridge from "../components/DiscordLaunchBridge";
import {
  CATEGORY_INFO,
  FISHING_ITEM_BY_ID,
  ITEM_GRADE_INFO,
  type EquipmentCategory,
  type FishingEquipmentItem,
  formatItemStat,
  getItemsByCategory,
} from "../../data/fishingItems";

type HarborPanel =
  | "none"
  | "fishmarket"
  | "shop"
  | "shipyard"
  | "workshop"
  | "quests"
  | "aquarium"
  | "seaGate"
  | "mmo";

type SpotKind = "building" | "lighthouse" | "stand";

type HarborSpot = {
  id: Exclude<HarborPanel, "none">;
  title: string;
  npc: string;
  icon: string;
  desc: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: SpotKind;
  hue: string;
  accent: string;
  approach: { x: number; y: number };
  npcPalette: NpcPalette;
};

type NpcPalette = {
  hair: string;
  skin: string;
  body: string;
  legs: string;
};

const VIEW_W = 1280;
const VIEW_H = 720;
const SAND_TOP = 304;
const SHORE_TOP = 348;
const SEA_TOP = 364;
const PLAYER_ACCEL = 0.45;
const PLAYER_FRICTION = 0.86;
const PLAYER_MAX_SPEED = 3.5;
const INTERACT_DISTANCE = 110;

const HARBOR_SPOTS: HarborSpot[] = [
  {
    id: "fishmarket",
    title: "생선 판매소",
    npc: "마리",
    icon: "🐟",
    desc: "어획물 판매 / 전시",
    x: 60,
    y: 70,
    w: 200,
    h: 200,
    kind: "building",
    hue: "#dc2626",
    accent: "#fde68a",
    approach: { x: 160, y: 470 },
    npcPalette: { hair: "#0f172a", skin: "#fcd9b6", body: "#0ea5e9", legs: "#1e293b" },
  },
  {
    id: "shop",
    title: "장비 상점",
    npc: "도윤",
    icon: "🎣",
    desc: "낚시 장비 구매",
    x: 290,
    y: 70,
    w: 200,
    h: 200,
    kind: "building",
    hue: "#1d4ed8",
    accent: "#bfdbfe",
    approach: { x: 390, y: 470 },
    npcPalette: { hair: "#7c2d12", skin: "#fcd9b6", body: "#facc15", legs: "#1f2937" },
  },
  {
    id: "workshop",
    title: "업그레이드 공방",
    npc: "해나",
    icon: "⚒️",
    desc: "장비 진화",
    x: 520,
    y: 70,
    w: 200,
    h: 200,
    kind: "building",
    hue: "#ea580c",
    accent: "#fed7aa",
    approach: { x: 620, y: 470 },
    npcPalette: { hair: "#fbbf24", skin: "#fcd9b6", body: "#7c2d12", legs: "#3b1d0a" },
  },
  {
    id: "shipyard",
    title: "조선소",
    npc: "브릭스",
    icon: "🚢",
    desc: "배 장비 관리",
    x: 750,
    y: 70,
    w: 200,
    h: 200,
    kind: "building",
    hue: "#a16207",
    accent: "#fde68a",
    approach: { x: 850, y: 470 },
    npcPalette: { hair: "#1e293b", skin: "#fcd9b6", body: "#1e3a5f", legs: "#0f172a" },
  },
  {
    id: "quests",
    title: "퀘스트 게시판",
    npc: "게시판",
    icon: "📜",
    desc: "일일 / 주간 의뢰",
    x: 980,
    y: 90,
    w: 200,
    h: 180,
    kind: "building",
    hue: "#7c3aed",
    accent: "#ddd6fe",
    approach: { x: 1080, y: 470 },
    npcPalette: { hair: "#312e81", skin: "#fcd9b6", body: "#a855f7", legs: "#1e1b4b" },
  },
  {
    id: "aquarium",
    title: "수족관",
    npc: "루나",
    icon: "🐠",
    desc: "희귀어 전시",
    x: 200,
    y: 470,
    w: 140,
    h: 100,
    kind: "stand",
    hue: "#a855f7",
    accent: "#f5d0fe",
    approach: { x: 270, y: 600 },
    npcPalette: { hair: "#6b21a8", skin: "#fcd9b6", body: "#f0abfc", legs: "#581c87" },
  },
  {
    id: "seaGate",
    title: "출항 게이트",
    npc: "항로",
    icon: "⚓",
    desc: "바다 선택",
    x: 580,
    y: 410,
    w: 140,
    h: 180,
    kind: "lighthouse",
    hue: "#facc15",
    accent: "#fff7d6",
    approach: { x: 645, y: 620 },
    npcPalette: { hair: "#0f172a", skin: "#fcd9b6", body: "#facc15", legs: "#1e293b" },
  },
  {
    id: "mmo",
    title: "선단 본부",
    npc: "제독",
    icon: "🌐",
    desc: "MMO 확장 로드맵",
    x: 940,
    y: 470,
    w: 140,
    h: 100,
    kind: "stand",
    hue: "#db2777",
    accent: "#fbcfe8",
    approach: { x: 1010, y: 600 },
    npcPalette: { hair: "#831843", skin: "#fcd9b6", body: "#0e7490", legs: "#0f172a" },
  },
];

const SHOP_CATEGORIES: EquipmentCategory[] = ["rod", "reel", "hook", "bait", "engine", "cargo", "fuelTank", "lantern"];
const FISHING_CATEGORIES: EquipmentCategory[] = ["rod", "reel", "hook", "bait"];
const BOAT_CATEGORIES: EquipmentCategory[] = ["engine", "cargo", "fuelTank", "lantern"];

const ASSET_PATHS: Record<string, string> = {
  wave1: "/assets/tiles/wave_1.png",
  wave2: "/assets/tiles/wave_2.png",
  wave3: "/assets/tiles/wave_3.png",
  oceanTile: "/assets/backgrounds/ocean_tile.png",
  shallowTile: "/assets/backgrounds/shallow_water_tile.png",
  islandTropical: "/assets/backgrounds/island_tropical.png",
  islandRocky: "/assets/backgrounds/island_rocky.png",
  islandSandbar: "/assets/backgrounds/island_sandbar.png",
  boatIdle1: "/assets/sprites/boat_idle_1.png",
  boatIdle2: "/assets/sprites/boat_idle_2.png",
  boatMove1: "/assets/sprites/boat_move_1.png",
  boatMove2: "/assets/sprites/boat_move_2.png",
  boatTop: "/assets/sprites/boat_top.png",
  fishCommon: "/assets/sprites/fish_shadow_common.png",
  fishRare: "/assets/sprites/fish_shadow_rare.png",
};

function loadImages(paths: Record<string, string>): Promise<Record<string, HTMLImageElement>> {
  const entries = Object.entries(paths);
  return Promise.all(
    entries.map(
      ([key, src]) =>
        new Promise<[string, HTMLImageElement]>((resolve) => {
          const img = new Image();
          img.onload = () => resolve([key, img]);
          img.onerror = () => resolve([key, img]);
          img.src = src;
        })
    )
  ).then((pairs) => Object.fromEntries(pairs));
}

function getFishGradeInfo(grade: string) {
  return gradeInfo[grade as keyof typeof gradeInfo] || gradeInfo.common;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="pixel-stat-pill">
      <span className="label">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function GameModal({
  title,
  icon,
  desc,
  onClose,
  children,
}: {
  title: string;
  icon: string;
  desc: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <section className="pixel-modal-shell mx-auto min-h-[75vh] max-w-6xl p-5 text-white">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-cyan-400/40 pb-4">
          <div>
            <p className="text-4xl">{icon}</p>
            <h2 className="pixel-text mt-3 text-xl text-cyan-100">{title}</h2>
            <p className="pixel-text-sm mt-2 text-slate-300">{desc}</p>
          </div>
          <button onClick={onClose} className="pixel-btn">
            CLOSE
          </button>
        </header>
        <div className="pt-5">{children}</div>
      </section>
    </div>
  );
}

function ItemCard({
  item,
  selected,
  owned,
  equipped,
  onClick,
}: {
  item: FishingEquipmentItem;
  selected: boolean;
  owned: boolean;
  equipped: boolean;
  onClick: () => void;
}) {
  const grade = ITEM_GRADE_INFO[item.grade];
  return (
    <button
      onClick={onClick}
      className={`pixel-panel relative p-4 text-left active:scale-95 ${selected ? "ring-4 ring-cyan-300/70" : ""}`}
    >
      {equipped && (
        <span className="pixel-text-sm absolute right-2 top-2 bg-cyan-300 px-2 py-1 text-slate-950">EQUIP</span>
      )}
      {!equipped && owned && (
        <span className="pixel-text-sm absolute right-2 top-2 bg-white/20 px-2 py-1 text-white">OWN</span>
      )}
      <p className="text-3xl">{item.icon}</p>
      <h3 className="pixel-text-sm mt-3 text-white">{item.name}</h3>
      <p className={`pixel-text-sm mt-2 ${grade.color}`}>{grade.name}</p>
      <p className="mt-2 line-clamp-2 text-xs text-slate-400">{item.description}</p>
      <p className="pixel-text-sm mt-3 text-yellow-200">
        {item.price ? `${item.price.toLocaleString()}G` : "FREE"}
      </p>
    </button>
  );
}

function ItemDetail({
  save,
  item,
  onBuy,
  onEquip,
}: {
  save: SaveData;
  item: FishingEquipmentItem;
  onBuy: (id: string) => void;
  onEquip: (id: string) => void;
}) {
  const grade = ITEM_GRADE_INFO[item.grade];
  const owned = save.ownedItems.includes(item.id);
  const equipped = save.equipment[item.category] === item.id;
  const statEntries = Object.entries(item.stats) as [keyof typeof item.stats, number | boolean][];
  return (
    <section className="pixel-panel p-5">
      <div className="flex items-start gap-4">
        <p className="text-5xl">{item.icon}</p>
        <div>
          <h3 className="pixel-text text-base text-white">{item.name}</h3>
          <p className={`pixel-text-sm mt-2 ${grade.color}`}>
            {grade.name} · {CATEGORY_INFO[item.category].name}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{item.description}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {statEntries.length === 0 && (
          <p className="pixel-text-sm bg-black/40 p-3 text-slate-300">기본 장비입니다.</p>
        )}
        {statEntries.map(([key, value]) => (
          <p key={key} className="pixel-text-sm bg-black/40 p-3 text-cyan-100">
            {formatItemStat(key, value)}
          </p>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => onBuy(item.id)}
          disabled={owned || save.gold < item.price}
          className="pixel-btn disabled:opacity-50"
        >
          {owned ? "OWNED" : save.gold < item.price ? "NO GOLD" : "BUY"}
        </button>
        <button
          onClick={() => onEquip(item.id)}
          disabled={!owned || equipped}
          className="pixel-btn pixel-btn-cyan disabled:opacity-50"
        >
          {equipped ? "EQUIPPED" : "EQUIP"}
        </button>
      </div>
    </section>
  );
}

/* ---------- Pixel scene draw helpers ---------- */

function drawSky(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, SAND_TOP);
  grad.addColorStop(0, "#0a2540");
  grad.addColorStop(0.55, "#1f4d70");
  grad.addColorStop(1, "#3a7a8c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, SAND_TOP);

  // distant clouds (pixel puffs)
  for (let i = 0; i < 6; i++) {
    const cx = (i * 230 + 80) % VIEW_W;
    const cy = 26 + (i % 2) * 18;
    ctx.fillStyle = "rgba(241, 245, 249, 0.55)";
    ctx.fillRect(cx, cy, 36, 6);
    ctx.fillRect(cx + 6, cy - 4, 24, 6);
    ctx.fillRect(cx + 12, cy + 6, 30, 4);
  }

  // far mountains
  ctx.fillStyle = "#1d3a55";
  for (let i = 0; i < 5; i++) {
    const mx = i * 280 - 60;
    ctx.beginPath();
    ctx.moveTo(mx, SAND_TOP);
    ctx.lineTo(mx + 90, SAND_TOP - 80);
    ctx.lineTo(mx + 180, SAND_TOP - 30);
    ctx.lineTo(mx + 280, SAND_TOP - 70);
    ctx.lineTo(mx + 360, SAND_TOP);
    ctx.closePath();
    ctx.fill();
  }

  // sun glow
  ctx.fillStyle = "rgba(253, 224, 71, 0.18)";
  ctx.beginPath();
  ctx.arc(1080, 90, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(253, 224, 71, 0.55)";
  ctx.beginPath();
  ctx.arc(1080, 90, 28, 0, Math.PI * 2);
  ctx.fill();
}

function drawLand(ctx: CanvasRenderingContext2D) {
  // grass band behind buildings
  const grad = ctx.createLinearGradient(0, SAND_TOP - 80, 0, SAND_TOP);
  grad.addColorStop(0, "#264c2e");
  grad.addColorStop(1, "#3f7244");
  ctx.fillStyle = grad;
  ctx.fillRect(0, SAND_TOP - 70, VIEW_W, 70);

  // grass tufts
  ctx.fillStyle = "#1a3a20";
  for (let i = 0; i < 60; i++) {
    const gx = (i * 47) % VIEW_W;
    const gy = SAND_TOP - 40 - ((i * 13) % 30);
    ctx.fillRect(gx, gy, 4, 2);
  }

  // sand band
  ctx.fillStyle = "#e8c87a";
  ctx.fillRect(0, SAND_TOP, VIEW_W, SHORE_TOP - SAND_TOP);
  ctx.fillStyle = "#d4a85c";
  for (let i = 0; i < 80; i++) {
    const sx = (i * 31) % VIEW_W;
    const sy = SAND_TOP + 6 + ((i * 11) % (SHORE_TOP - SAND_TOP - 8));
    ctx.fillRect(sx, sy, 3, 2);
  }

  // shore line (wet sand)
  ctx.fillStyle = "#a87a3a";
  ctx.fillRect(0, SHORE_TOP, VIEW_W, SEA_TOP - SHORE_TOP);
}

function drawSea(
  ctx: CanvasRenderingContext2D,
  imgs: Record<string, HTMLImageElement>,
  t: number
) {
  // base deep sea gradient
  const grad = ctx.createLinearGradient(0, SEA_TOP, 0, VIEW_H);
  grad.addColorStop(0, "#0c4a6e");
  grad.addColorStop(0.6, "#082f49");
  grad.addColorStop(1, "#020617");
  ctx.fillStyle = grad;
  ctx.fillRect(0, SEA_TOP, VIEW_W, VIEW_H - SEA_TOP);

  // sparkle dots
  for (let i = 0; i < 70; i++) {
    const sx = (i * 197 + Math.floor(t / 60)) % VIEW_W;
    const sy = SEA_TOP + ((i * 53) % (VIEW_H - SEA_TOP - 4));
    const a = 0.18 + Math.sin(t / 600 + i) * 0.16;
    ctx.fillStyle = `rgba(186, 230, 253, ${a.toFixed(3)})`;
    ctx.fillRect(sx, sy, 2, 2);
  }

  // animated wave tile overlay
  const waveFrame = Math.floor(t / 240) % 3;
  const waveImg = imgs[`wave${waveFrame + 1}`];
  if (waveImg && waveImg.width > 0) {
    const tile = 64;
    ctx.globalAlpha = 0.45;
    for (let y = SEA_TOP - 4; y < VIEW_H; y += tile) {
      const phase = Math.floor((t / 90 + y) % tile);
      for (let x = -tile; x < VIEW_W + tile; x += tile) {
        ctx.drawImage(waveImg, x + (phase - tile / 2) * 0.4, y, tile, tile);
      }
    }
    ctx.globalAlpha = 1;
  }

  // foam line just below shore
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  for (let x = 0; x < VIEW_W; x += 14) {
    const off = Math.sin((x + t / 80) / 28) * 2;
    ctx.fillRect(x, SEA_TOP + off, 8, 2);
  }
}

function drawDocks(ctx: CanvasRenderingContext2D, t: number) {
  // main central pier
  const piers: { x: number; y: number; w: number; h: number }[] = [
    { x: 130, y: 380, w: 80, h: 220 },
    { x: 360, y: 380, w: 80, h: 220 },
    { x: 590, y: 380, w: 100, h: 270 },
    { x: 820, y: 380, w: 80, h: 220 },
    { x: 1050, y: 380, w: 80, h: 220 },
  ];

  // boardwalk along shore
  ctx.fillStyle = "#5b3a1a";
  ctx.fillRect(40, 360, 1200, 28);
  ctx.fillStyle = "#7c4d24";
  ctx.fillRect(40, 360, 1200, 6);
  ctx.fillStyle = "#3b2208";
  for (let x = 40; x < 1240; x += 18) {
    ctx.fillRect(x, 366, 1, 22);
  }

  // boardwalk posts
  ctx.fillStyle = "#3b2208";
  for (let x = 60; x < 1240; x += 70) {
    ctx.fillRect(x, 384, 4, 8);
  }

  for (const p of piers) {
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(p.x + 4, p.y + 4, p.w, p.h);
    // body
    ctx.fillStyle = "#7c4d24";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // top highlight
    ctx.fillStyle = "#a07033";
    ctx.fillRect(p.x, p.y, p.w, 5);
    // plank lines
    ctx.fillStyle = "#3b2208";
    for (let y = p.y + 12; y < p.y + p.h; y += 16) {
      ctx.fillRect(p.x, y, p.w, 1);
    }
    // side highlight
    ctx.fillStyle = "#5b3a1a";
    ctx.fillRect(p.x + p.w - 3, p.y, 3, p.h);
    // posts at bottom (in water)
    ctx.fillStyle = "#3b2208";
    ctx.fillRect(p.x + 6, p.y + p.h - 6, 8, 18);
    ctx.fillRect(p.x + p.w - 14, p.y + p.h - 6, 8, 18);
    // post wakes
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    const ph = Math.sin(t / 220) * 1.5;
    ctx.fillRect(p.x + 4, p.y + p.h + 14 + ph, 12, 1);
    ctx.fillRect(p.x + p.w - 16, p.y + p.h + 14 + ph, 12, 1);
  }

  // dock lanterns
  for (const p of piers) {
    const lx = p.x + p.w / 2 - 2;
    const ly = p.y + 20;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(lx, ly, 4, 14);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(lx - 4, ly - 10, 12, 10);
    const glow = 0.3 + Math.sin(t / 240) * 0.18;
    ctx.fillStyle = `rgba(253, 224, 71, ${glow.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(lx + 2, ly - 4, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBuilding(ctx: CanvasRenderingContext2D, spot: HarborSpot, t: number, active: boolean) {
  const { x, y, w, h, hue, accent } = spot;

  if (spot.kind === "building") {
    const roofHeight = 56;
    // foundation
    ctx.fillStyle = "#475569";
    ctx.fillRect(x, y + h - 14, w, 14);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x, y + h - 14, w, 4);

    // body
    ctx.fillStyle = accent;
    ctx.fillRect(x + 4, y + roofHeight, w - 8, h - roofHeight - 14);
    // wall planks
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(x + 4, y + roofHeight + 10 + i * 22, w - 8, 2);
    }
    // body shadow
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(x + 4, y + h - 18, w - 8, 4);

    // roof (big trapezoid)
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + roofHeight);
    ctx.lineTo(x + 18, y + 6);
    ctx.lineTo(x + w - 18, y + 6);
    ctx.lineTo(x + w + 6, y + roofHeight);
    ctx.closePath();
    ctx.fill();
    // roof highlight
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(x + 18, y + 8, w - 36, 4);
    // roof shadow
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.fillRect(x - 6, y + roofHeight - 4, w + 12, 4);
    // roof tiles
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let i = 0; i < 6; i++) {
      const yi = y + 12 + i * 8;
      if (yi >= y + roofHeight - 4) break;
      ctx.fillRect(x + 18 + (i % 2) * 8, yi, w - 36 - (i % 2) * 16, 1);
    }

    // door
    ctx.fillStyle = "#3b1d0a";
    const doorW = 38, doorH = 60;
    const doorX = x + w / 2 - doorW / 2;
    ctx.fillRect(doorX, y + h - 14 - doorH, doorW, doorH);
    ctx.fillStyle = "#5b3a1a";
    ctx.fillRect(doorX + 2, y + h - 14 - doorH + 2, doorW - 4, doorH - 4);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(doorX + doorW - 8, y + h - 14 - doorH / 2 - 2, 4, 4);
    // step
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(doorX - 4, y + h - 14, doorW + 8, 4);

    // windows (2)
    const winY = y + roofHeight + 22;
    for (const wx of [x + 22, x + w - 22 - 30]) {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(wx - 2, winY - 2, 34, 26);
      ctx.fillStyle = "#fef9a8";
      ctx.fillRect(wx, winY, 30, 22);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(wx + 14, winY, 2, 22);
      ctx.fillRect(wx, winY + 10, 30, 2);
      // frame
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillRect(wx, winY, 6, 4);
    }

    // chimney + smoke
    const cx = x + w - 50;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(cx, y + 10, 14, 26);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(cx - 2, y + 10, 18, 4);
    for (let s = 0; s < 4; s++) {
      const sp = (t / 200 + s) % 4;
      ctx.fillStyle = `rgba(226, 232, 240, ${(0.55 - sp * 0.13).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(cx + 7 + Math.sin(sp * 1.5) * 4, y + 6 - sp * 8, 4 + sp, 0, Math.PI * 2);
      ctx.fill();
    }

    // sign plaque
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x + 16, y + h - 36, w - 32, 14);
    ctx.fillStyle = hue;
    ctx.fillRect(x + 18, y + h - 34, w - 36, 10);
    ctx.font = `9px "Press Start 2P", monospace`;
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(spot.title, x + w / 2, y + h - 28);

    // building-specific motifs
    if (spot.id === "fishmarket") {
      // hanging fish
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(x + 30, y + roofHeight + 4, 1, 8);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(x + 26, y + roofHeight + 12, 14, 6);
      ctx.fillRect(x + w - 40, y + roofHeight + 4, 1, 8);
      ctx.fillRect(x + w - 44, y + roofHeight + 12, 14, 6);
    } else if (spot.id === "shop") {
      // rod sign
      ctx.fillStyle = "#a16207";
      ctx.fillRect(x + 6, y + roofHeight + 4, 28, 3);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(x + 30, y + roofHeight + 6, 4, 4);
    } else if (spot.id === "workshop") {
      // anvil
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(x + 12, y + roofHeight + 6, 22, 8);
      ctx.fillRect(x + 18, y + roofHeight + 14, 10, 4);
    } else if (spot.id === "shipyard") {
      // anchor
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(x + 18, y + roofHeight + 8, 14, 2);
      ctx.fillRect(x + 24, y + roofHeight + 6, 2, 14);
    } else if (spot.id === "quests") {
      // notice board
      ctx.fillStyle = "#7c2d12";
      ctx.fillRect(x + 14, y + roofHeight + 6, 30, 22);
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(x + 18, y + roofHeight + 10, 22, 4);
      ctx.fillRect(x + 18, y + roofHeight + 18, 22, 2);
    }
  } else if (spot.kind === "lighthouse") {
    // base island
    ctx.fillStyle = "#475569";
    ctx.fillRect(x + 8, y + h - 28, w - 16, 28);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x + 8, y + h - 28, w - 16, 4);

    // tower stripes
    const tx = x + w / 2 - 22;
    const ty = y + 30;
    const towerH = h - 60;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(tx, ty, 44, towerH);
    ctx.fillStyle = "#dc2626";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(tx, ty + i * 24, 44, 12);
    }
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(tx - 2, ty, 2, towerH);
    ctx.fillRect(tx + 44, ty, 2, towerH);

    // top dome
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(tx - 6, ty - 14, 56, 14);
    ctx.fillRect(tx - 4, ty - 22, 52, 8);

    // lamp
    ctx.fillStyle = "#fde047";
    ctx.fillRect(tx + 14, ty - 12, 16, 12);
    const beamA = 0.18 + Math.sin(t / 280) * 0.12;
    ctx.save();
    ctx.fillStyle = `rgba(253, 224, 71, ${beamA.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(tx + 22, ty - 6);
    ctx.lineTo(tx + 22 + 260, ty - 80);
    ctx.lineTo(tx + 22 + 260, ty + 30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // sign
    ctx.font = `10px "Press Start 2P", monospace`;
    ctx.fillStyle = "#facc15";
    ctx.textAlign = "center";
    ctx.fillText(spot.title, x + w / 2, y + h + 16);
  } else {
    // stand: small kiosk on dock
    const sx = x, sy = y, sw = w, sh = h;
    // floor stilts
    ctx.fillStyle = "#3b2208";
    ctx.fillRect(sx + 10, sy + sh, 6, 30);
    ctx.fillRect(sx + sw - 16, sy + sh, 6, 30);

    // counter
    ctx.fillStyle = "#7c2d12";
    ctx.fillRect(sx, sy + 30, sw, sh - 30);
    ctx.fillStyle = "#a16207";
    ctx.fillRect(sx, sy + 30, sw, 4);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(sx, sy + 60, sw, 8);

    // canopy stripes
    const stripeW = 14;
    for (let i = 0; i * stripeW < sw + 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? hue : accent;
      ctx.fillRect(sx - 8 + i * stripeW, sy, stripeW, 26);
    }
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(sx - 8, sy + 26, sw + 16, 4);

    // hanging sign
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(sx + sw / 2 - 1, sy - 22, 2, 4);
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(sx + sw / 2 - 38, sy - 22, 76, 18);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(sx + sw / 2 - 38, sy - 22, 76, 2);
    ctx.fillRect(sx + sw / 2 - 38, sy - 6, 76, 2);
    ctx.font = `9px "Press Start 2P", monospace`;
    ctx.fillStyle = "#1e293b";
    ctx.textAlign = "center";
    ctx.fillText(spot.title, sx + sw / 2, sy - 9);

    if (spot.id === "aquarium") {
      // tank window
      ctx.fillStyle = "#0e7490";
      ctx.fillRect(sx + 10, sy + 38, sw - 20, 16);
      ctx.fillStyle = "#67e8f9";
      ctx.fillRect(sx + 10, sy + 38, sw - 20, 3);
      ctx.fillStyle = "#fde047";
      const fishX = sx + 14 + ((t / 30) % (sw - 28));
      ctx.fillRect(fishX, sy + 44, 6, 3);
    } else if (spot.id === "mmo") {
      // flag
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(sx + sw / 2 - 1, sy + 30, 2, 30);
      ctx.fillStyle = "#22d3ee";
      const wave = Math.sin(t / 220) * 2;
      ctx.fillRect(sx + sw / 2 + 1 + wave, sy + 30, 16, 10);
    }
  }

  if (active) {
    // active glow
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(t / 180) * 0.2;
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.strokeRect(spot.x - 4, spot.y - 4, spot.w + 8, spot.h + 8);
    ctx.restore();
  }
}

function drawNPC(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  pal: NpcPalette
) {
  const bob = Math.sin(t / 360 + x * 0.01) * 1.2;
  const yi = Math.round(y + bob);
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(x + 9, y + 38, 11, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // legs
  ctx.fillStyle = pal.legs;
  ctx.fillRect(x + 4, yi + 26, 4, 10);
  ctx.fillRect(x + 11, yi + 26, 4, 10);
  // boots
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(x + 3, yi + 34, 6, 3);
  ctx.fillRect(x + 10, yi + 34, 6, 3);
  // body
  ctx.fillStyle = pal.body;
  ctx.fillRect(x + 2, yi + 14, 16, 14);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(x + 2, yi + 26, 16, 2);
  // arm
  ctx.fillStyle = pal.body;
  ctx.fillRect(x, yi + 16, 3, 10);
  ctx.fillRect(x + 17, yi + 16, 3, 10);
  ctx.fillStyle = pal.skin;
  ctx.fillRect(x, yi + 25, 3, 3);
  ctx.fillRect(x + 17, yi + 25, 3, 3);
  // head
  ctx.fillStyle = pal.skin;
  ctx.fillRect(x + 4, yi + 2, 12, 12);
  // hair
  ctx.fillStyle = pal.hair;
  ctx.fillRect(x + 3, yi + 1, 14, 5);
  ctx.fillRect(x + 3, yi + 5, 2, 3);
  ctx.fillRect(x + 15, yi + 5, 2, 3);
  // eyes
  ctx.fillStyle = "#020617";
  ctx.fillRect(x + 7, yi + 8, 2, 2);
  ctx.fillRect(x + 12, yi + 8, 2, 2);
  // mouth
  ctx.fillStyle = "#7f1d1d";
  ctx.fillRect(x + 9, yi + 12, 3, 1);
}

function drawMooredBoat(
  ctx: CanvasRenderingContext2D,
  imgs: Record<string, HTMLImageElement>,
  cx: number,
  cy: number,
  t: number,
  flip = false
) {
  const img = imgs.boatTop;
  if (!img || img.width === 0) return;
  const w = 64, h = 96;
  const bob = Math.sin(t / 380 + cx * 0.02) * 1.5;
  ctx.save();
  ctx.translate(cx, cy + bob);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
  // wake
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillRect(cx - 26, cy + 36 + bob, 52, 2);
  ctx.fillRect(cx - 18, cy + 40 + bob, 36, 1);
}

function drawShallowFish(
  ctx: CanvasRenderingContext2D,
  imgs: Record<string, HTMLImageElement>,
  t: number
) {
  const img = imgs.fishCommon;
  if (!img || img.width === 0) return;
  const positions = [
    { x: 250, y: 660 },
    { x: 500, y: 690 },
    { x: 770, y: 670 },
    { x: 1010, y: 695 },
    { x: 130, y: 690 },
  ];
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    const dx = Math.sin((t / 800) + i) * 30;
    const dy = Math.cos((t / 1000) + i) * 6;
    const fw = 28, fh = 18;
    ctx.drawImage(img, p.x + dx - fw / 2, p.y + dy - fh / 2, fw, fh);
  }
  ctx.globalAlpha = 1;
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  imgs: Record<string, HTMLImageElement>,
  px: number,
  py: number,
  vx: number,
  vy: number,
  t: number,
  facing: "left" | "right"
) {
  const moving = Math.abs(vx) + Math.abs(vy) > 0.1;
  const animFrame = Math.floor(t / 200) % 2;
  const idleFrame = Math.floor(t / 600) % 2;
  const key = moving
    ? animFrame === 0
      ? "boatMove1"
      : "boatMove2"
    : idleFrame === 0
      ? "boatIdle1"
      : "boatIdle2";
  const img = imgs[key];
  const bob = Math.sin(t / 220) * 2;

  // wake foam
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillRect(px - 22, py + 30 + bob, 44, 2);
  ctx.fillRect(px - 16, py + 35 + bob, 32, 1);
  if (moving) {
    ctx.fillStyle = "rgba(186, 230, 253, 0.5)";
    ctx.fillRect(px - 30, py + 40 + bob, 60, 2);
  }

  if (img && img.width > 0) {
    const w = 66;
    const h = 96;
    ctx.save();
    ctx.translate(px, py + bob);
    if (facing === "left") ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  } else {
    // fallback boat rectangle
    ctx.fillStyle = "#7c2d12";
    ctx.fillRect(px - 24, py - 8 + bob, 48, 16);
  }

  // captain dot above (silhouette)
  ctx.fillStyle = "#020617";
  ctx.fillRect(px - 2, py - 26 + bob, 4, 6);
  ctx.fillStyle = "#fcd9b6";
  ctx.fillRect(px - 2, py - 26 + bob, 4, 3);
}

function drawInteractPrompt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  t: number
) {
  const blink = (Math.floor(t / 350) % 2) === 0;
  ctx.font = `10px "Press Start 2P", monospace`;
  const metrics = ctx.measureText(text);
  const w = metrics.width + 24;
  const h = 26;
  const px = Math.round(x - w / 2);
  const py = Math.round(y - h - 4);
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(px + 2, py + 2, w, h);
  // border
  ctx.fillStyle = "#020617";
  ctx.fillRect(px - 2, py - 2, w + 4, h + 4);
  ctx.fillStyle = "#facc15";
  ctx.fillRect(px, py, w, h);
  ctx.fillStyle = "#020617";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, py + h / 2);
  // arrow down
  if (blink) {
    ctx.fillStyle = "#facc15";
    ctx.fillRect(x - 4, py + h, 8, 3);
    ctx.fillRect(x - 2, py + h + 3, 4, 3);
    ctx.fillStyle = "#020617";
    ctx.fillRect(x - 6, py + h, 1, 3);
    ctx.fillRect(x + 5, py + h, 1, 3);
  }
}

function drawVignette(ctx: CanvasRenderingContext2D) {
  const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 280, VIEW_W / 2, VIEW_H / 2, 720);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawMinimap(
  ctx: CanvasRenderingContext2D,
  size: number,
  px: number,
  py: number
) {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, size, size);
  // sea
  ctx.fillStyle = "#0c4a6e";
  ctx.fillRect(0, size * 0.5, size, size * 0.5);
  // land
  ctx.fillStyle = "#3f7244";
  ctx.fillRect(0, 0, size, size * 0.45);
  ctx.fillStyle = "#e8c87a";
  ctx.fillRect(0, size * 0.45, size, size * 0.05);
  // dock strip
  ctx.fillStyle = "#7c4d24";
  ctx.fillRect(2, size * 0.5, size - 4, 2);
  // spots
  for (const s of HARBOR_SPOTS) {
    const sx = (s.x + s.w / 2) / VIEW_W * size;
    const sy = (s.y + s.h / 2) / VIEW_H * size;
    ctx.fillStyle = s.kind === "lighthouse" ? "#facc15" : s.kind === "stand" ? "#f0abfc" : "#fda4af";
    ctx.fillRect(sx - 1, sy - 1, 3, 3);
  }
  // player
  ctx.fillStyle = "#67e8f9";
  ctx.fillRect((px / VIEW_W) * size - 2, (py / VIEW_H) * size - 2, 4, 4);
  // border
  ctx.strokeStyle = "#67e8f9";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);
}

/* ---------- Pixel scene component ---------- */

function HarborScene({
  spots,
  panelOpen,
  onInteract,
  setNearestSpotId,
  shakeTrigger,
}: {
  spots: HarborSpot[];
  panelOpen: boolean;
  onInteract: (spotId: HarborSpot["id"]) => void;
  setNearestSpotId: (id: HarborSpot["id"] | null) => void;
  shakeTrigger: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const imgsRef = useRef<Record<string, HTMLImageElement>>({});
  const playerRef = useRef({
    x: 640,
    y: 620,
    vx: 0,
    vy: 0,
    facing: "right" as "left" | "right",
  });
  const inputRef = useRef({ left: false, right: false, up: false, down: false });
  const stickRef = useRef({ x: 0, y: 0 });
  const shakeRef = useRef(0);
  const nearestRef = useRef<HarborSpot["id"] | null>(null);
  const panelOpenRef = useRef(panelOpen);

  useEffect(() => {
    panelOpenRef.current = panelOpen;
  }, [panelOpen]);

  useEffect(() => {
    shakeRef.current = Math.max(shakeRef.current, 14);
  }, [shakeTrigger]);

  useEffect(() => {
    let mounted = true;
    let raf = 0;
    let imagesReady = false;

    loadImages(ASSET_PATHS).then((imgs) => {
      if (!mounted) return;
      imgsRef.current = imgs;
      imagesReady = true;
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (panelOpenRef.current) return;
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") inputRef.current.left = true;
      if (k === "arrowright" || k === "d") inputRef.current.right = true;
      if (k === "arrowup" || k === "w") inputRef.current.up = true;
      if (k === "arrowdown" || k === "s") inputRef.current.down = true;
      if (k === "e" || k === " " || k === "enter") {
        if (nearestRef.current) {
          shakeRef.current = 6;
          onInteract(nearestRef.current);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") inputRef.current.left = false;
      if (k === "arrowright" || k === "d") inputRef.current.right = false;
      if (k === "arrowup" || k === "w") inputRef.current.up = false;
      if (k === "arrowdown" || k === "s") inputRef.current.down = false;
    };
    const onStick = (e: Event) => {
      const ce = e as CustomEvent<{ x: number; y: number }>;
      stickRef.current = ce.detail;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("harbor-stick", onStick as EventListener);

    const loop = (ts: number) => {
      raf = requestAnimationFrame(loop);
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      // input
      const player = playerRef.current;
      let ix = (inputRef.current.right ? 1 : 0) - (inputRef.current.left ? 1 : 0);
      let iy = (inputRef.current.down ? 1 : 0) - (inputRef.current.up ? 1 : 0);
      if (stickRef.current.x !== 0 || stickRef.current.y !== 0) {
        ix = stickRef.current.x;
        iy = stickRef.current.y;
      }
      if (!panelOpenRef.current) {
        player.vx += ix * PLAYER_ACCEL;
        player.vy += iy * PLAYER_ACCEL;
      }
      player.vx *= PLAYER_FRICTION;
      player.vy *= PLAYER_FRICTION;
      const sp = Math.hypot(player.vx, player.vy);
      if (sp > PLAYER_MAX_SPEED) {
        player.vx = (player.vx / sp) * PLAYER_MAX_SPEED;
        player.vy = (player.vy / sp) * PLAYER_MAX_SPEED;
      }
      player.x += player.vx;
      player.y += player.vy;
      // bounds: stay in dock/sea region
      player.x = Math.max(60, Math.min(VIEW_W - 60, player.x));
      player.y = Math.max(420, Math.min(VIEW_H - 60, player.y));
      if (player.vx < -0.2) player.facing = "left";
      else if (player.vx > 0.2) player.facing = "right";

      // nearest spot
      let nearest: HarborSpot | null = null;
      let bestDist = Infinity;
      for (const spot of spots) {
        const d = distance(player, spot.approach);
        if (d < bestDist) {
          bestDist = d;
          nearest = spot;
        }
      }
      const nearestId = nearest && bestDist <= INTERACT_DISTANCE ? nearest.id : null;
      if (nearestId !== nearestRef.current) {
        nearestRef.current = nearestId;
        setNearestSpotId(nearestId);
      }

      // shake
      let sx = 0, sy = 0;
      if (shakeRef.current > 0) {
        sx = (Math.random() - 0.5) * shakeRef.current;
        sy = (Math.random() - 0.5) * shakeRef.current;
        shakeRef.current = Math.max(0, shakeRef.current - 0.6);
      }

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      ctx.translate(sx, sy);

      drawSky(ctx);
      drawLand(ctx);
      drawSea(ctx, imgsRef.current, ts);
      drawDocks(ctx, ts);

      // moored boats
      drawMooredBoat(ctx, imgsRef.current, 510, 530, ts, false);
      drawMooredBoat(ctx, imgsRef.current, 770, 530, ts, true);
      drawMooredBoat(ctx, imgsRef.current, 230, 540, ts, false);
      drawMooredBoat(ctx, imgsRef.current, 1110, 540, ts, true);

      drawShallowFish(ctx, imgsRef.current, ts);

      // buildings (sorted by y for layering)
      const sortedSpots = [...spots].sort((a, b) => a.y + a.h - (b.y + b.h));
      for (const spot of sortedSpots) {
        drawBuilding(ctx, spot, ts, nearestId === spot.id);
      }

      // NPCs in front of buildings
      for (const spot of spots) {
        if (spot.kind === "lighthouse") continue;
        const nx = spot.x + spot.w / 2 - 9;
        const ny = spot.kind === "building"
          ? spot.y + spot.h - 16
          : spot.y + spot.h - 4;
        drawNPC(ctx, nx, ny, ts, spot.npcPalette);
        // name plate
        ctx.font = `8px "Press Start 2P", monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = "#020617";
        ctx.fillRect(nx - 12, ny - 14, 38, 10);
        ctx.fillStyle = "#facc15";
        ctx.fillText(spot.npc, nx + 7, ny - 9);
      }

      // player
      drawPlayer(
        ctx,
        imgsRef.current,
        player.x,
        player.y,
        player.vx,
        player.vy,
        ts,
        player.facing
      );

      // interaction prompt
      if (nearestId && !panelOpenRef.current) {
        const spot = spots.find((s) => s.id === nearestId);
        if (spot) {
          drawInteractPrompt(
            ctx,
            player.x,
            player.y - 56,
            `E · ${spot.title}`,
            ts
          );
        }
      }

      drawVignette(ctx);
      ctx.restore();

      // minimap
      const mctx = minimapRef.current?.getContext("2d");
      if (mctx) {
        mctx.imageSmoothingEnabled = false;
        mctx.clearRect(0, 0, 128, 128);
        drawMinimap(mctx, 128, player.x, player.y);
      }
    };

    raf = requestAnimationFrame(loop);

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("harbor-stick", onStick as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={VIEW_W}
        height={VIEW_H}
        className="absolute inset-0 h-full w-full sea-bloom"
        style={{ imageRendering: "pixelated", objectFit: "contain" }}
      />
      <canvas
        ref={minimapRef}
        width={128}
        height={128}
        className="pixel-mini-map absolute bottom-4 right-4 z-30 h-32 w-32 sm:h-36 sm:w-36"
        style={{ imageRendering: "pixelated" }}
      />
    </>
  );
}

/* ---------- Page ---------- */

export default function HarborPage() {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [message, setMessage] = useState("");
  const [panel, setPanel] = useState<HarborPanel>("none");
  const [shopCategory, setShopCategory] = useState<EquipmentCategory>("rod");
  const [selectedItemId, setSelectedItemId] = useState("rod_old");
  const [selectedFishUid, setSelectedFishUid] = useState<string | null>(null);
  const [nearestSpotId, setNearestSpotId] = useState<HarborSpot["id"] | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const stickPadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSave(loadSave()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const level = getPlayerLevel(save);
  const nextExp = getNextLevelExp(level);
  const stats = getEquipmentStats(save);
  const selectedFish =
    (save.bag || []).find((item) => item.uid === selectedFishUid) || (save.bag || [])[0];
  const totalValue = useMemo(
    () => (save.bag || []).reduce((sum, item) => sum + itemSellValue(item, save), 0),
    [save]
  );
  const aquariumIncome = getAquariumIncome(save);
  const [today, setToday] = useState("--.--");

  useEffect(() => {
    const d = new Date();
    setToday(`${d.getMonth() + 1}.${d.getDate()}`);
  }, []);

  const nearestSpot = useMemo(
    () => HARBOR_SPOTS.find((s) => s.id === nearestSpotId) ?? null,
    [nearestSpotId]
  );

  function commit(next: SaveData, msg: string) {
    saveGame(next);
    setSave(next);
    setMessage(msg);
  }

  function handleInteract(id: HarborSpot["id"]) {
    if (id === "seaGate") {
      window.location.href = "/prepare";
      return;
    }

    setPanel(id);
    setShakeTrigger((n) => n + 1);
  }

  function handleBuyItem(itemId: string) {
    const result = buyItem(save, itemId);
    if (result.ok) commit(result.save, result.message);
    else setMessage(result.message);
  }
  function handleEquipItem(itemId: string) {
    const result = equipItem(save, itemId);
    if (result.ok) commit(result.save, result.message);
    else setMessage(result.message);
  }
  function handleUpgrade(category: EquipmentCategory) {
    const result = upgradeEquipment(save, category);
    if (result.ok) commit(result.save, result.message);
    else setMessage(result.message);
  }
  function handleSellAll() {
    const result = sellBagItems(save);
    if (result.soldCount <= 0) return setMessage("판매할 물고기가 없습니다.");
    commit(result.save, `어획물 ${result.soldCount}마리 판매! +${result.soldGold.toLocaleString()}G`);
  }
  function handleSellSelected() {
    if (!selectedFish) return setMessage("선택한 물고기가 없습니다.");
    const result = sellBagItems(save, [selectedFish.uid]);
    commit(result.save, `${selectedFish.name} 판매! +${result.soldGold.toLocaleString()}G`);
    setSelectedFishUid(null);
  }
  function handleAquariumAdd(uid: string) {
    const result = addAquariumExhibit(save, uid);
    if (result.ok) {
      commit(result.save, result.message);
      setSelectedFishUid(null);
    } else setMessage(result.message);
  }

  /* mobile joystick */
  function emitStick(x: number, y: number) {
    window.dispatchEvent(new CustomEvent("harbor-stick", { detail: { x, y } }));
  }
  function updateJoystick(clientX: number, clientY: number) {
    const el = stickPadRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = rect.width / 2 - 18;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > max && d > 0) {
      dx = (dx / d) * max;
      dy = (dy / d) * max;
    }
    setStick({ x: dx, y: dy });
    emitStick(dx / max, dy / max);
  }
  function releaseJoystick() {
    setStick({ x: 0, y: 0 });
    emitStick(0, 0);
  }

  /* ---------- modal renderers (kept logic, restyled) ---------- */

  function renderShop(categories: EquipmentCategory[], title: string, icon: string, desc: string) {
    const safeCategory = categories.includes(shopCategory) ? shopCategory : categories[0];
    const items = getItemsByCategory(safeCategory);
    const item =
      FISHING_ITEM_BY_ID[selectedItemId]?.category === safeCategory
        ? FISHING_ITEM_BY_ID[selectedItemId]
        : items[0];

    return (
      <GameModal title={title} icon={icon} desc={desc} onClose={() => setPanel("none")}>
        <div className="grid gap-5 lg:grid-cols-[220px_1fr_320px]">
          <aside className="grid gap-2 content-start">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setShopCategory(category);
                  setSelectedItemId(getItemsByCategory(category)[0]?.id || selectedItemId);
                }}
                className={`pixel-text-sm px-4 py-3 text-left active:scale-95 ${
                  safeCategory === category
                    ? "bg-cyan-300 text-slate-950"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
                style={{ boxShadow: "0 0 0 2px #020617, 0 0 0 4px #67e8f9" }}
              >
                {CATEGORY_INFO[category].icon} {CATEGORY_INFO[category].name}
              </button>
            ))}
          </aside>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((shopItem) => (
              <ItemCard
                key={shopItem.id}
                item={shopItem}
                selected={item?.id === shopItem.id}
                owned={save.ownedItems.includes(shopItem.id)}
                equipped={save.equipment[shopItem.category] === shopItem.id}
                onClick={() => setSelectedItemId(shopItem.id)}
              />
            ))}
          </section>
          {item && (
            <ItemDetail save={save} item={item} onBuy={handleBuyItem} onEquip={handleEquipItem} />
          )}
        </div>
      </GameModal>
    );
  }

  function renderFishMarket() {
    const items = save.bag || [];
    return (
      <GameModal
        title="생선 판매소"
        icon="🐟"
        desc="어획물을 판매하거나 희귀 표본을 수족관에 넘깁니다."
        onClose={() => setPanel("none")}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="pixel-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="pixel-text text-base text-white">가방 어획물</h3>
              <p className="pixel-text-sm text-slate-300">
                {items.length}마리 · 총 {totalValue.toLocaleString()}G
              </p>
            </div>
            <div className="mt-4 grid max-h-[55vh] gap-3 overflow-y-auto pr-1">
              {items.length === 0 && (
                <p className="pixel-text-sm bg-black/40 p-5 text-slate-300">
                  판매할 물고기가 없습니다.
                </p>
              )}
              {items.map((fish) => {
                const grade = getFishGradeInfo(fish.grade);
                const selected = selectedFish?.uid === fish.uid;
                return (
                  <button
                    key={fish.uid}
                    onClick={() => setSelectedFishUid(fish.uid)}
                    className={`pixel-panel p-3 text-left active:scale-95 ${
                      selected ? "ring-4 ring-cyan-300/70" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="pixel-text-sm text-white">
                          {grade.emoji} {fish.name}
                        </p>
                        <p className="pixel-text-sm mt-2 text-slate-400">
                          {fish.sizeRank} · {fish.cm.toFixed(1)}cm · {fish.kg.toFixed(1)}kg · 신선도{" "}
                          {currentFreshness(fish, save)}%
                        </p>
                      </div>
                      <p className="pixel-text-sm text-yellow-200">
                        {itemSellValue(fish, save).toLocaleString()}G
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="pixel-panel p-5">
            <h3 className="pixel-text text-base text-white">선택 감정서</h3>
            {selectedFish ? (
              <div className="mt-4">
                <p className="text-5xl">{getFishGradeInfo(selectedFish.grade).emoji}</p>
                <h4 className="pixel-text mt-3 text-base text-cyan-100">{selectedFish.name}</h4>
                <p className="pixel-text-sm mt-2 text-slate-300">
                  {selectedFish.region} · {selectedFish.sizeRank}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <StatPill label="LEN" value={`${selectedFish.cm.toFixed(1)}cm`} />
                  <StatPill label="WT" value={`${selectedFish.kg.toFixed(1)}kg`} />
                  <StatPill label="FRSH" value={`${currentFreshness(selectedFish, save)}%`} />
                  <StatPill label="GOLD" value={`${itemSellValue(selectedFish, save).toLocaleString()}`} />
                </div>
                <div className="mt-5 grid gap-3">
                  <button onClick={handleSellSelected} className="pixel-btn">
                    SELL ONE
                  </button>
                  <button
                    onClick={() => handleAquariumAdd(selectedFish.uid)}
                    className="pixel-btn pixel-btn-cyan"
                  >
                    AQUARIUM
                  </button>
                </div>
              </div>
            ) : (
              <p className="pixel-text-sm mt-4 text-slate-300">왼쪽에서 물고기를 선택하세요.</p>
            )}
            <div className="mt-6 border-t-2 border-cyan-400/30 pt-5">
              <h3 className="pixel-text text-sm text-white">정산</h3>
              <button onClick={handleSellAll} className="pixel-btn mt-3 w-full">
                SELL ALL
              </button>
            </div>
          </aside>
        </div>
      </GameModal>
    );
  }

  function renderWorkshop() {
    return (
      <GameModal
        title="업그레이드 공방"
        icon="⚒️"
        desc="보유 장비를 다음 단계로 진화시킵니다."
        onClose={() => setPanel("none")}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SHOP_CATEGORIES.map((category) => {
            const current = getEquipmentItem(save, category);
            const next = current.nextId ? FISHING_ITEM_BY_ID[current.nextId] : null;
            const cost = current.upgradeCost || next?.price || 0;
            const grade = ITEM_GRADE_INFO[current.grade];
            return (
              <article key={category} className="pixel-panel p-5">
                <p className="pixel-text-sm text-cyan-200">
                  {CATEGORY_INFO[category].icon} {CATEGORY_INFO[category].name}
                </p>
                <p className="mt-4 text-4xl">{current.icon}</p>
                <h3 className="pixel-text-sm mt-3 text-white">{current.name}</h3>
                <p className={`pixel-text-sm mt-2 ${grade.color}`}>{grade.name}</p>
                <div className="mt-4 min-h-24 bg-black/40 p-3 pixel-text-sm text-slate-300">
                  {next ? (
                    <>
                      <p className="text-slate-400">다음 단계</p>
                      <p className="mt-2 text-white">
                        {current.icon} → {next.icon} {next.name}
                      </p>
                      <p className="mt-2 text-yellow-200">{cost.toLocaleString()}G</p>
                    </>
                  ) : (
                    <p>최종 단계 장비입니다.</p>
                  )}
                </div>
                <button
                  onClick={() => handleUpgrade(category)}
                  disabled={!next || save.gold < cost}
                  className="pixel-btn mt-4 w-full disabled:opacity-50"
                >
                  {!next ? "MAX" : save.gold < cost ? "NO GOLD" : "UPGRADE"}
                </button>
              </article>
            );
          })}
        </div>
      </GameModal>
    );
  }

  function renderQuests() {
    const allQuests = [...save.quests.daily, ...save.quests.weekly];
    return (
      <GameModal
        title="퀘스트 게시판"
        icon="📜"
        desc="항구 의뢰와 주간 목표를 확인합니다."
        onClose={() => setPanel("none")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {allQuests.map((quest) => {
            const ratio = Math.min(100, (quest.progress / quest.goal) * 100);
            return (
              <article key={quest.id} className="pixel-panel p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="pixel-text-sm bg-cyan-400/20 px-3 py-1 text-cyan-100">
                    {quest.type === "daily" ? "DAILY" : "WEEKLY"}
                  </span>
                  <span className="pixel-text-sm text-slate-300">
                    {quest.progress}/{quest.goal}
                  </span>
                </div>
                <h3 className="pixel-text mt-4 text-sm text-white">{quest.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{quest.desc}</p>
                <div className="mt-4 h-3 overflow-hidden bg-black/60" style={{ boxShadow: "inset 0 0 0 2px #020617" }}>
                  <div className="h-full bg-cyan-300" style={{ width: `${ratio}%` }} />
                </div>
                <p className="pixel-text-sm mt-4 text-yellow-200">
                  보상 {quest.rewardGold.toLocaleString()}G · EXP {quest.rewardExp}
                </p>
              </article>
            );
          })}
        </div>
      </GameModal>
    );
  }

  function renderAquarium() {
    return (
      <GameModal
        title="네온 수족관"
        icon="🐠"
        desc="희귀 어종을 전시해 시간당 수익을 얻습니다."
        onClose={() => setPanel("none")}
      >
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="pixel-panel p-5">
            <h3 className="pixel-text text-sm text-fuchsia-100">수족관 수익</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <StatPill label="HOUR" value={`${aquariumIncome.hourly.toLocaleString()}G`} />
              <StatPill label="CLAIM" value={`${aquariumIncome.claimable.toLocaleString()}G`} />
              <StatPill label="EXHIB" value={`${save.aquarium.exhibits.length}`} />
              <StatPill label="TOTAL" value={`${save.aquarium.totalIncome.toLocaleString()}`} />
            </div>
            <button
              onClick={() => {
                const result = claimAquariumIncome(save);
                if (result.ok) commit(result.save, result.message);
                else setMessage(result.message);
              }}
              className="pixel-btn mt-4 w-full"
            >
              CLAIM
            </button>
          </aside>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {save.aquarium.exhibits.length === 0 && (
              <p className="pixel-panel pixel-text-sm p-5 text-slate-300">
                아직 전시된 물고기가 없습니다. 판매소에서 희귀 이상 물고기를 전시해보세요.
              </p>
            )}
            {save.aquarium.exhibits.map((fish) => (
              <article key={fish.uid} className="pixel-panel p-5">
                <p className="text-4xl">{getFishGradeInfo(fish.grade).emoji}</p>
                <h3 className="pixel-text-sm mt-3 text-white">{fish.name}</h3>
                <p className="pixel-text-sm mt-2 text-slate-300">
                  {fish.cm.toFixed(1)}cm · {fish.kg.toFixed(1)}kg
                </p>
              </article>
            ))}
          </section>
        </div>
      </GameModal>
    );
  }

  function renderSeaGate() {
    return (
      <GameModal
        title="출항 게이트"
        icon="⚓"
        desc="출항 준비 화면으로 이동합니다."
        onClose={() => setPanel("none")}
      >
        <div className="pixel-panel p-5 text-center">
          <p className="pixel-text text-base text-cyan-100">
            🚤 출항 준비
          </p>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            지역, 미끼, 얼음 선택은 출항 준비 화면에서
            한 번만 진행합니다.
          </p>

          <Link
            href="/prepare"
            className="pixel-btn pixel-btn-cyan mt-6 inline-block"
          >
            출항 준비하기
          </Link>
        </div>
      </GameModal>
    );
  }

  function renderMmoPanel() {
    return (
      <GameModal
        title="선단 본부"
        icon="🌐"
        desc="MMO 대형 확장 콘텐츠의 핵심 시스템을 확인합니다."
        onClose={() => setPanel("none")}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="grid gap-4 md:grid-cols-2">
            {[
              ["공유 해역", "서버 공용 날씨·해류·희귀종 출현 이벤트를 표시합니다."],
              ["길드 선단", "선장, 낚시꾼, 다이버, 정비사가 역할을 나눠 원정합니다."],
              ["심해 레이드", "거대 어종을 추적하고 단계별로 제압하는 협동 전투입니다."],
              ["항구 경영", "수산시장, 연구소, 조선소, 수족관을 장기 성장축으로 키웁니다."],
            ].map(([title, desc]) => (
              <article key={title} className="pixel-panel p-5">
                <h3 className="pixel-text text-sm text-cyan-100">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{desc}</p>
              </article>
            ))}
          </section>
          <aside className="pixel-panel p-5">
            <h3 className="pixel-text text-sm text-fuchsia-100">현재 선단 전투력</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <StatPill label="POWER" value={stats.catchPower} />
              <StatPill label="LINE" value={stats.lineControl} />
              <StatPill label="RARE" value={stats.rareBonus} />
              <StatPill label="SPD" value={stats.speed} />
            </div>
            <Link href="/mmo" className="pixel-btn mt-5 block text-center">
              ROADMAP
            </Link>
          </aside>
        </div>
      </GameModal>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <DiscordLaunchBridge />
      <section
        className="relative h-[100dvh] w-screen pixel-vignette"
        style={{ background: "#020617" }}
      >
        <HarborScene
          spots={HARBOR_SPOTS}
          panelOpen={panel !== "none"}
          onInteract={handleInteract}
          setNearestSpotId={setNearestSpotId}
          shakeTrigger={shakeTrigger}
        />

        {/* Top HUD bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-2 sm:p-3">
          <div className="pixel-hud-bar pointer-events-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] sm:gap-3 sm:text-[10px]">
            <Link href="/" className="text-cyan-100 hover:text-yellow-200">
              ← HOME
            </Link>
            <span className="hidden text-slate-400 sm:inline">|</span>
            <span className="text-yellow-200">DAY {today}</span>
            <span className="hidden text-slate-400 sm:inline">|</span>
            <span className="text-amber-200">{save.gold.toLocaleString()}G</span>
            <span className="hidden text-slate-400 sm:inline">|</span>
            <span className="text-cyan-200">FUEL {fuelLimit(save)}</span>
            <span className="hidden text-slate-400 sm:inline">|</span>
            <span className="text-fuchsia-200">PORT</span>
          </div>
          <div className="pixel-hud-bar pointer-events-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] sm:gap-3 sm:text-[10px]">
            <span className="text-rose-200">HP 100/100</span>
            <span className="hidden text-slate-400 sm:inline">|</span>
            <span className="text-emerald-200">Lv.{level}</span>
            <span className="hidden text-slate-400 sm:inline">|</span>
            <span className="text-cyan-100">EXP {save.exp}/{nextExp}</span>
          </div>
        </div>

        {/* Active spot tag */}
        {nearestSpot && (
          <div className="pixel-text-sm pointer-events-none absolute left-1/2 top-[88px] z-20 -translate-x-1/2 whitespace-nowrap bg-yellow-300 px-3 py-2 text-slate-950 shadow-xl sm:top-24">
            {nearestSpot.icon} {nearestSpot.title} · {nearestSpot.npc}
          </div>
        )}

        {message && (
          <p className="pixel-text-sm pointer-events-none absolute bottom-[180px] left-1/2 z-30 max-w-[88vw] -translate-x-1/2 whitespace-nowrap bg-black/85 px-4 py-2 text-cyan-100 shadow-xl sm:bottom-44">
            {message}
          </p>
        )}

        {/* Sea gate quick button */}
        <button
          onClick={() => setPanel("seaGate")}
          className="pixel-btn pixel-btn-cyan absolute right-2 top-[68px] z-30 sm:right-4 sm:top-20"
        >
          ⚓ 출항
        </button>

        {/* Bottom-left D-pad */}
        <div className="absolute bottom-3 left-3 z-30 sm:bottom-6 sm:left-6">
          <div
            ref={stickPadRef}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              updateJoystick(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.buttons === 1 || e.pointerType === "touch") updateJoystick(e.clientX, e.clientY);
            }}
            onPointerUp={releaseJoystick}
            onPointerCancel={releaseJoystick}
            onLostPointerCapture={releaseJoystick}
            className="relative h-24 w-24 rounded-full border-4 border-cyan-300/40 bg-black/60 backdrop-blur sm:h-32 sm:w-32"
            style={{ touchAction: "none" }}
          >
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-300/30 bg-cyan-400/10 sm:h-20 sm:w-20" />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 rounded-full border-2 border-cyan-200 bg-cyan-400 shadow-xl shadow-cyan-400/40 sm:h-12 sm:w-12"
              style={{ transform: `translate(calc(-50% + ${stick.x}px), calc(-50% + ${stick.y}px))` }}
            />
          </div>
        </div>

        {/* Interaction button */}
        <button
          onClick={() => nearestSpot && handleInteract(nearestSpot.id)}
          disabled={!nearestSpot}
          className="pixel-btn absolute bottom-[140px] right-3 z-30 max-w-[55vw] truncate disabled:opacity-50 sm:bottom-10 sm:right-44"
          style={{ minWidth: 100 }}
        >
          {nearestSpot ? `E · ${nearestSpot.title}` : "EXPLORE"}
        </button>
      </section>

      {panel === "fishmarket" && renderFishMarket()}
      {panel === "shop" && renderShop(FISHING_CATEGORIES, "장비 상점", "🎣", "낚시 장비를 구매하고 장착합니다.")}
      {panel === "shipyard" && renderShop(BOAT_CATEGORIES, "조선소", "🚢", "배 장비와 탐험 장비를 관리합니다.")}
      {panel === "workshop" && renderWorkshop()}
      {panel === "quests" && renderQuests()}
      {panel === "aquarium" && renderAquarium()}
      {panel === "seaGate" && renderSeaGate()}
      {panel === "mmo" && renderMmoPanel()}
      <div className="sr-only" aria-live="polite">
        다음 레벨까지 {Math.max(0, nextExp - save.exp)} 경험치
      </div>
    </main>
  );
}
