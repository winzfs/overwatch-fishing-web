"use client";

import DiscordLaunchBridge from "../components/DiscordLaunchBridge";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { gradeInfo, regions } from "../../data/fishingData";
import {
  SaveData,
  loadSave,
  saveGame,
  defaultSave,
  bagWeight,
  cargoLimit,
  currentFreshness,
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
import {
  CATEGORY_INFO,
  FISHING_ITEM_BY_ID,
  ITEM_GRADE_INFO,
  EquipmentCategory,
  FishingEquipmentItem,
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
  | "seaGate";

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
  kind: "building" | "gate";
};

const HARBOR_SPOTS: HarborSpot[] = [
  { id: "fishmarket", title: "생선 판매소", npc: "마리", icon: "🐟", desc: "어획물 판매 / 전시", x: 8, y: 17, w: 23, h: 15, kind: "building" },
  { id: "shop", title: "장비 상점", npc: "도윤", icon: "🎣", desc: "낚시 장비 구매", x: 38, y: 14, w: 23, h: 15, kind: "building" },
  { id: "shipyard", title: "조선소", npc: "브릭스", icon: "🛶", desc: "배 장비 관리", x: 69, y: 15, w: 22, h: 17, kind: "building" },
  { id: "workshop", title: "업그레이드 공방", npc: "해나", icon: "⚒️", desc: "장비 진화", x: 8, y: 43, w: 25, h: 15, kind: "building" },
  { id: "quests", title: "퀘스트 게시판", npc: "게시판", icon: "📜", desc: "일일 / 주간 의뢰", x: 66, y: 42, w: 25, h: 15, kind: "building" },
  { id: "aquarium", title: "수족관 입구", npc: "루나", icon: "🐠", desc: "희귀어 전시", x: 68, y: 63, w: 24, h: 15, kind: "building" },
  { id: "seaGate", title: "출항 게이트", npc: "항로 선택", icon: "🌊", desc: "바다 선택", x: 7, y: 65, w: 24, h: 15, kind: "gate" },
];

const SHOP_CATEGORIES: EquipmentCategory[] = ["rod", "reel", "hook", "bait", "engine", "cargo", "fuelTank", "lantern"];
const FISHING_CATEGORIES: EquipmentCategory[] = ["rod", "reel", "hook", "bait"];
const BOAT_CATEGORIES: EquipmentCategory[] = ["engine", "cargo", "fuelTank", "lantern"];
const INTERACT_DISTANCE = 12;

function getFishGradeInfo(grade: string) {
  return gradeInfo[grade as keyof typeof gradeInfo] || gradeInfo.common;
}

function spotCenter(spot: HarborSpot) {
  return {
    x: spot.x + spot.w / 2,
    y: spot.y + spot.h + 5,
  };
}

function distanceToSpot(pos: { x: number; y: number }, spot: HarborSpot) {
  const target = spotCenter(spot);
  return Math.hypot(pos.x - target.x, pos.y - target.y);
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 shadow-inner">
      <p className="text-[10px] font-black uppercase tracking-wider text-cyan-200/70">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
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
    <section className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 p-3 text-white backdrop-blur-md">
      <div className="mx-auto min-h-full max-w-6xl overflow-hidden rounded-[2rem] border border-cyan-300/25 bg-slate-950/95 shadow-2xl shadow-cyan-950/50">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/95 p-4 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-3xl">{icon}</div>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-black">{title}</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">{desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 active:scale-95">
            닫기
          </button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </section>
  );
}

function MapBuilding({
  spot,
  active,
  onClick,
}: {
  spot: HarborSpot;
  active: boolean;
  onClick: () => void;
}) {
  const roof =
    spot.id === "fishmarket" || spot.id === "aquarium"
      ? "bg-sky-700"
      : spot.id === "workshop" || spot.id === "shipyard"
        ? "bg-amber-800"
        : spot.id === "seaGate"
          ? "bg-cyan-900"
          : "bg-blue-800";

  return (
    <button
      onClick={onClick}
      className={`absolute z-20 text-left transition active:scale-95 ${active ? "scale-105" : ""}`}
      style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}
    >
      <div className={`relative h-full rounded-xl border-2 shadow-2xl ${active ? "border-cyan-200 shadow-cyan-300/30" : "border-black/50 shadow-black/40"}`}>
        <div className={`absolute inset-x-0 top-0 h-[38%] rounded-t-lg ${roof} [image-rendering:pixelated]`} />
        <div className="absolute inset-x-2 bottom-0 top-[28%] rounded-b-lg border-x border-b border-black/40 bg-amber-950" />
        <div className="absolute bottom-2 left-1/2 h-[38%] w-[22%] -translate-x-1/2 rounded-t-lg bg-slate-950/80" />
        <div className="absolute left-2 top-[45%] size-3 rounded-sm bg-cyan-200/70 shadow-[0_0_12px_rgba(125,211,252,.8)]" />
        <div className="absolute right-2 top-[45%] size-3 rounded-sm bg-cyan-200/70 shadow-[0_0_12px_rgba(125,211,252,.8)]" />
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-black/50 bg-slate-950/85 px-3 py-1 text-center shadow-xl">
          <p className="text-xs font-black text-white md:text-sm">{spot.icon} {spot.title}</p>
        </div>
        {active && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cyan-300 px-3 py-1 text-[10px] font-black text-slate-950 shadow-xl">
            E / 상호작용
          </div>
        )}
      </div>
    </button>
  );
}

function DockPiece({ left, top, width, height }: { left: number; top: number; width: number; height: number }) {
  return (
    <div
      className="absolute z-10 rounded-md border border-amber-950/70 bg-amber-800 shadow-md [background-image:repeating-linear-gradient(90deg,rgba(0,0,0,.22)_0,rgba(0,0,0,.22)_2px,transparent_2px,transparent_18px)]"
      style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
    />
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
      className={`relative min-h-[145px] rounded-3xl border p-4 text-left shadow-xl transition active:scale-95 ${
        selected ? "scale-[1.02] border-cyan-200 bg-cyan-300/10" : `${grade.border} ${grade.bg}`
      }`}
    >
      {equipped && <span className="absolute right-3 top-3 rounded-full bg-cyan-300 px-2 py-1 text-[10px] font-black text-slate-950">장착</span>}
      {!equipped && owned && <span className="absolute right-3 top-3 rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-white">보유</span>}
      <div className="text-4xl">{item.icon}</div>
      <h3 className="mt-3 text-base font-black text-white">{item.name}</h3>
      <p className={`mt-1 text-xs font-black ${grade.color}`}>{grade.name}</p>
      <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-300">{item.description}</p>
      <p className="mt-3 text-sm font-black text-amber-200">{item.price ? `${item.price.toLocaleString()}G` : "기본 지급"}</p>
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
    <aside className={`rounded-[2rem] border ${grade.border} ${grade.bg} p-5 shadow-2xl`}>
      <div className="text-center">
        <div className="mx-auto grid size-24 place-items-center rounded-[2rem] border border-white/10 bg-black/20 text-6xl shadow-inner">{item.icon}</div>
        <h3 className="mt-4 text-2xl font-black text-white">{item.name}</h3>
        <p className={`mt-1 text-sm font-black ${grade.color}`}>{grade.name} · {CATEGORY_INFO[item.category].name}</p>
      </div>

      <p className="mt-5 rounded-2xl bg-black/20 p-4 text-sm font-semibold leading-6 text-slate-200">{item.description}</p>

      <div className="mt-4 grid gap-2">
        {statEntries.length === 0 && <p className="rounded-2xl bg-white/5 p-3 text-sm font-bold text-slate-300">기본 장비입니다.</p>}
        {statEntries.map(([key, value]) => (
          <div key={String(key)} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-200">
            {formatItemStat(key as any, value as any)}
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          onClick={() => onBuy(item.id)}
          disabled={owned || save.gold < item.price}
          className="rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black text-slate-950 disabled:bg-slate-600 disabled:text-slate-300 active:scale-95"
        >
          {owned ? "보유중" : save.gold < item.price ? "골드 부족" : "구매"}
        </button>
        <button
          onClick={() => onEquip(item.id)}
          disabled={!owned || equipped}
          className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:bg-slate-600 disabled:text-slate-300 active:scale-95"
        >
          {equipped ? "장착중" : "장착"}
        </button>
      </div>
    </aside>
  );
}

export default function HarborPage() {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [message, setMessage] = useState("");
  const [shopCategory, setShopCategory] = useState<EquipmentCategory>("rod");
  const [selectedItemId, setSelectedItemId] = useState("rod_old");
  const [selectedFishUid, setSelectedFishUid] = useState<string | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 68 });
  const [playerFacing, setPlayerFacing] = useState<"left" | "right" | "up" | "down">("up");

  useEffect(() => setSave(loadSave()), []);

  const level = getPlayerLevel(save);
  const nextExp = getNextLevelExp(level);
  const stats = getEquipmentStats(save);
  const selectedFish = (save.bag || []).find((item) => item.uid === selectedFishUid) || (save.bag || [])[0];
  const selectedItem = FISHING_ITEM_BY_ID[selectedItemId] || getItemsByCategory(shopCategory)[0];
  const totalValue = useMemo(() => (save.bag || []).reduce((sum, item) => sum + itemSellValue(item, save), 0), [save]);
  const activeSpot = HARBOR_SPOTS.reduce<{ spot: HarborSpot | null; distance: number }>(
    (best, spot) => {
      const distance = distanceToSpot(playerPos, spot);
      return distance < best.distance ? { spot, distance } : best;
    },
    { spot: null, distance: Infinity }
  );
  const nearestSpot = activeSpot.distance <= INTERACT_DISTANCE ? activeSpot.spot : null;
  const aquariumIncome = getAquariumIncome(save);

  function commit(next: SaveData, msg: string) {
    saveGame(next);
    setSave(next);
    setMessage(msg);
  }

  function movePlayer(dx: number, dy: number) {
    if (dx < 0) setPlayerFacing("left");
    if (dx > 0) setPlayerFacing("right");
    if (dy < 0) setPlayerFacing("up");
    if (dy > 0) setPlayerFacing("down");

    setPlayerPos((pos) => ({
      x: Math.max(5, Math.min(95, pos.x + dx)),
      y: Math.max(10, Math.min(90, pos.y + dy)),
    }));
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (panel !== "none") return;

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") movePlayer(-4, 0);
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") movePlayer(4, 0);
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") movePlayer(0, -4);
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") movePlayer(0, 4);
      if (event.key.toLowerCase() === "e" && nearestSpot) setPanel(nearestSpot.id);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panel, nearestSpot?.id, playerPos]);

  function openSpot(spot: HarborSpot) {
    const target = spotCenter(spot);
    setPlayerPos(target);
    setPanel(spot.id);
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
    } else {
      setMessage(result.message);
    }
  }

  function renderHarborMap() {
    return (
      <main className="h-screen overflow-hidden bg-slate-950 text-white">
        <DiscordLaunchBridge />

        <div className="absolute left-3 right-3 top-3 z-50 rounded-3xl border border-cyan-300/20 bg-slate-950/80 p-3 shadow-xl backdrop-blur">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-black leading-tight md:grid-cols-5">
              <span>🎒 {bagWeight(save).toFixed(1)} / {cargoLimit(save)}kg</span>
              <span>⛽ {fuelLimit(save)} MAX</span>
              <span>💰 {save.gold.toLocaleString()}G</span>
              <span>Lv.{level}</span>
              <span>✨ {save.exp}</span>
            </div>
            <button
              onClick={() => setPanel("seaGate")}
              className="rounded-2xl bg-amber-300 px-4 py-2 text-sm font-black text-slate-950 active:scale-95"
            >
              출항
            </button>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" style={{ width: `${Math.min(100, ((save.exp || 0) / nextExp) * 100)}%` }} />
          </div>
        </div>

        <section className="absolute inset-0">
          <div className="relative h-full w-full overflow-hidden bg-[#08718a]">
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:72px_72px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(8,145,178,.35),transparent_35%),radial-gradient(circle_at_20%_20%,rgba(14,165,233,.25),transparent_32%)]" />

            <div className="absolute left-0 right-0 top-[9%] z-[5] h-[45%] bg-emerald-900 [clip-path:polygon(0_0,100%_0,100%_78%,82%_74%,72%_91%,57%_78%,44%_95%,31%_76%,0_86%)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(132,204,22,.45),transparent_20%),radial-gradient(circle_at_80%_25%,rgba(34,197,94,.35),transparent_18%),linear-gradient(45deg,rgba(120,53,15,.25),transparent)]" />
            </div>

            <div className="absolute left-[36%] top-[41%] z-[6] h-[35%] w-[26%] rounded-b-[45%] bg-[#08718a]" />
            <div className="absolute left-[32%] top-[38%] z-[7] h-[3%] w-[34%] rounded-full bg-stone-600" />
            <div className="absolute left-[3%] top-[58%] z-[7] h-[8%] w-[20%] rounded-xl bg-amber-900" />
            <div className="absolute left-[3%] top-[66%] z-[7] h-[7%] w-[16%] rounded-b-xl bg-amber-800" />
            <DockPiece left={42} top={37} width={5} height={22} />
            <DockPiece left={50} top={37} width={5} height={22} />
            <DockPiece left={39} top={50} width={18} height={4} />
            <DockPiece left={6} top={62} width={18} height={4} />

            {Array.from({ length: 18 }).map((_, index) => (
              <div
                key={index}
                className="absolute z-[8] text-xl"
                style={{
                  left: `${5 + ((index * 19) % 92)}%`,
                  top: `${12 + ((index * 23) % 38)}%`,
                  opacity: 0.55,
                }}
              >
                🌳
              </div>
            ))}

            {HARBOR_SPOTS.map((spot) => (
              <MapBuilding key={spot.id} spot={spot} active={nearestSpot?.id === spot.id} onClick={() => openSpot(spot)} />
            ))}

            {nearestSpot && (
              <div className="absolute left-1/2 top-[82%] z-50 -translate-x-1/2 rounded-full bg-slate-950/90 px-5 py-2 text-center text-xs font-black text-cyan-100 shadow-2xl">
                {nearestSpot.icon} {nearestSpot.title} · E / 상호작용
              </div>
            )}

            <div
              className="absolute z-40 -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
              style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
            >
              <div className="relative">
                <div className="absolute inset-0 scale-150 rounded-full bg-cyan-200/25 blur-xl" />
                <div className="relative grid size-16 place-items-center rounded-full border-4 border-white/70 bg-sky-700/30 text-4xl shadow-2xl">
                  {playerFacing === "left" ? "🚤" : playerFacing === "right" ? "🚤" : playerFacing === "down" ? "🛥️" : "⛵"}
                </div>
                <p className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/90 px-3 py-1 text-[10px] font-black text-cyan-100">
                  내 배
                </p>
              </div>
            </div>

            <div className="absolute bottom-6 left-5 z-50 grid w-[220px] grid-cols-3 gap-2">
              <button onClick={() => movePlayer(-6, 0)} className="rounded-2xl bg-white/15 py-4 text-2xl font-black backdrop-blur active:scale-95">←</button>
              <button onClick={() => movePlayer(0, -6)} className="rounded-2xl bg-white/15 py-4 text-2xl font-black backdrop-blur active:scale-95">↑</button>
              <button onClick={() => movePlayer(6, 0)} className="rounded-2xl bg-white/15 py-4 text-2xl font-black backdrop-blur active:scale-95">→</button>
              <div />
              <button onClick={() => movePlayer(0, 6)} className="rounded-2xl bg-white/15 py-4 text-2xl font-black backdrop-blur active:scale-95">↓</button>
            </div>

            <button
              onClick={() => nearestSpot && setPanel(nearestSpot.id)}
              disabled={!nearestSpot}
              className="absolute bottom-7 right-6 z-50 grid size-24 place-items-center rounded-full border-4 border-white/50 bg-cyan-300 text-sm font-black text-slate-950 shadow-2xl disabled:bg-slate-600 disabled:text-slate-300 active:scale-95"
            >
              상호작용
            </button>
          </div>
        </section>

        {message && (
          <div className="fixed bottom-32 left-1/2 z-[120] -translate-x-1/2 rounded-3xl border border-amber-300/30 bg-slate-950/95 px-5 py-3 text-center text-sm font-black text-amber-100 shadow-2xl">
            {message}
          </div>
        )}
      </main>
    );
  }

  function renderShop(categories: EquipmentCategory[], title: string, icon: string, desc: string) {
    const safeCategory = categories.includes(shopCategory) ? shopCategory : categories[0];
    const items = getItemsByCategory(safeCategory);
    const item = FISHING_ITEM_BY_ID[selectedItemId] && FISHING_ITEM_BY_ID[selectedItemId].category === safeCategory
      ? FISHING_ITEM_BY_ID[selectedItemId]
      : items[0];

    return (
      <GameModal title={title} icon={icon} desc={desc} onClose={() => setPanel("none")}>
        <div className="grid gap-4 lg:grid-cols-[170px_1fr_330px]">
          <aside className="grid gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setShopCategory(category);
                  setSelectedItemId(getItemsByCategory(category)[0]?.id || selectedItemId);
                }}
                className={`rounded-2xl border px-4 py-3 text-left font-black active:scale-95 ${
                  safeCategory === category ? "border-cyan-200 bg-cyan-300 text-slate-950" : "border-white/10 bg-white/5 text-white"
                }`}
              >
                {CATEGORY_INFO[category].icon} {CATEGORY_INFO[category].name}
              </button>
            ))}
          </aside>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
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

          {item && <ItemDetail save={save} item={item} onBuy={handleBuyItem} onEquip={handleEquipItem} />}
        </div>
      </GameModal>
    );
  }

  function renderFishMarket() {
    const items = save.bag || [];

    return (
      <GameModal title="생선 판매소" icon="🐟" desc="어획물을 판매하거나 희귀어를 수족관에 전시합니다." onClose={() => setPanel("none")}>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_0.75fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-black">가방 어획물</h3>
              <span className="text-xs font-bold text-slate-400">{items.length}마리</span>
            </div>
            <div className="grid max-h-[62vh] gap-2 overflow-y-auto pr-1">
              {items.length === 0 && <p className="rounded-2xl bg-white/5 p-5 text-center text-sm font-bold text-slate-400">판매할 물고기가 없습니다.</p>}
              {items.map((fish) => {
                const grade = getFishGradeInfo(fish.grade);
                const selected = selectedFish?.uid === fish.uid;

                return (
                  <button
                    key={fish.uid}
                    onClick={() => setSelectedFishUid(fish.uid)}
                    className={`rounded-2xl border p-3 text-left active:scale-95 ${selected ? "border-cyan-200 bg-cyan-300/10" : "border-white/10 bg-slate-900/60"}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-black">{grade.emoji} {fish.name}</p>
                      <p className="text-sm font-black text-amber-200">{itemSellValue(fish, save).toLocaleString()}G</p>
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      {fish.sizeRank} · {fish.cm.toFixed(1)}cm · {fish.kg.toFixed(1)}kg · 신선도 {currentFreshness(fish, save)}%
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-300/20 bg-slate-900/70 p-5">
            <h3 className="text-lg font-black">선택 감정서</h3>
            {selectedFish ? (
              <div className="mt-4">
                <div className="grid place-items-center rounded-[2rem] border border-white/10 bg-black/20 p-8 text-6xl">{getFishGradeInfo(selectedFish.grade).emoji}</div>
                <h4 className="mt-4 text-2xl font-black">{selectedFish.name}</h4>
                <p className="mt-2 text-sm font-bold text-slate-300">{selectedFish.region} · {selectedFish.sizeRank}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <StatPill label="판매가" value={`${itemSellValue(selectedFish, save).toLocaleString()}G`} />
                  <StatPill label="신선도" value={`${currentFreshness(selectedFish, save)}%`} />
                  <StatPill label="크기" value={`${selectedFish.cm.toFixed(1)}cm`} />
                  <StatPill label="무게" value={`${selectedFish.kg.toFixed(1)}kg`} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={handleSellSelected} className="rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black text-slate-950 active:scale-95">선택 판매</button>
                  <button onClick={() => handleAquariumAdd(selectedFish.uid)} className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 active:scale-95">수족관 전시</button>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-white/5 p-5 text-sm font-bold text-slate-400">왼쪽에서 물고기를 선택하세요.</p>
            )}
          </div>

          <div className="rounded-[2rem] border border-amber-300/20 bg-amber-950/20 p-5">
            <h3 className="text-lg font-black">정산</h3>
            <div className="mt-4 space-y-2">
              <StatPill label="총 예상 판매금" value={`${totalValue.toLocaleString()}G`} />
              <StatPill label="가방 무게" value={`${bagWeight(save).toFixed(1)} / ${cargoLimit(save)}kg`} />
            </div>
            <button onClick={handleSellAll} className="mt-4 w-full rounded-2xl bg-amber-300 px-4 py-4 text-base font-black text-slate-950 active:scale-95">
              전부 판매
            </button>
          </div>
        </div>
      </GameModal>
    );
  }

  function renderWorkshop() {
    return (
      <GameModal title="업그레이드 공방" icon="⚒️" desc="현재 장비를 다음 단계로 진화시킵니다." onClose={() => setPanel("none")}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SHOP_CATEGORIES.map((category) => {
            const current = getEquipmentItem(save, category);
            const next = current.nextId ? FISHING_ITEM_BY_ID[current.nextId] : null;
            const cost = current.upgradeCost || next?.price || 0;
            const grade = ITEM_GRADE_INFO[current.grade];

            return (
              <div key={category} className={`rounded-[2rem] border ${grade.border} ${grade.bg} p-4 shadow-xl`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-slate-300">{CATEGORY_INFO[category].name}</p>
                  <span className="text-3xl">{current.icon}</span>
                </div>
                <h3 className="mt-3 text-xl font-black">{current.name}</h3>
                <p className={`mt-1 text-xs font-black ${grade.color}`}>{grade.name}</p>

                <div className="my-4 rounded-2xl bg-black/20 p-3 text-center">
                  {next ? (
                    <>
                      <p className="text-xs font-bold text-slate-400">다음 단계</p>
                      <p className="mt-1 text-lg font-black">{current.icon} → {next.icon} {next.name}</p>
                      <p className="mt-2 text-sm font-black text-amber-200">{cost.toLocaleString()}G</p>
                    </>
                  ) : (
                    <p className="py-5 text-sm font-black text-cyan-200">최종 단계 장비</p>
                  )}
                </div>

                <button
                  disabled={!next || save.gold < cost}
                  onClick={() => handleUpgrade(category)}
                  className="w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black text-slate-950 disabled:bg-slate-600 disabled:text-slate-300 active:scale-95"
                >
                  {!next ? "최대 단계" : save.gold < cost ? "골드 부족" : "업그레이드"}
                </button>
              </div>
            );
          })}
        </div>
      </GameModal>
    );
  }

  function renderQuests() {
    const allQuests = [...save.quests.daily, ...save.quests.weekly];

    return (
      <GameModal title="퀘스트 게시판" icon="📜" desc="일일/주간 의뢰를 확인합니다." onClose={() => setPanel("none")}>
        <div className="grid gap-4 md:grid-cols-2">
          {allQuests.map((quest) => {
            const ratio = Math.min(100, (quest.progress / quest.goal) * 100);

            return (
              <div key={quest.id} className="rounded-[2rem] border border-violet-300/20 bg-violet-950/20 p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">{quest.type === "daily" ? "일일" : "주간"}</span>
                  <span className={quest.completed ? "text-sm font-black text-emerald-200" : "text-sm font-black text-slate-300"}>
                    {quest.progress}/{quest.goal}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-black">{quest.title}</h3>
                <p className="mt-1 text-sm font-bold text-slate-300">{quest.desc}</p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-300 to-cyan-300" style={{ width: `${ratio}%` }} />
                </div>
                <p className="mt-3 text-sm font-black text-amber-200">보상 {quest.rewardGold.toLocaleString()}G · EXP {quest.rewardExp}</p>
              </div>
            );
          })}
        </div>
      </GameModal>
    );
  }

  function renderAquarium() {
    return (
      <GameModal title="수족관" icon="🐠" desc="희귀어를 전시하고 시간 수익을 받습니다." onClose={() => setPanel("none")}>
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-[2rem] border border-fuchsia-300/20 bg-fuchsia-950/20 p-5">
            <h3 className="text-xl font-black">수족관 수익</h3>
            <div className="mt-4 grid gap-2">
              <StatPill label="전시 수" value={`${save.aquarium.exhibits.length}마리`} />
              <StatPill label="시간당 수익" value={`${aquariumIncome.hourly.toLocaleString()}G`} />
              <StatPill label="수령 가능" value={`${aquariumIncome.claimable.toLocaleString()}G`} />
            </div>
            <button
              onClick={() => {
                const result = claimAquariumIncome(save);
                if (result.ok) commit(result.save, result.message);
                else setMessage(result.message);
              }}
              className="mt-4 w-full rounded-2xl bg-fuchsia-300 px-4 py-4 text-base font-black text-slate-950 active:scale-95"
            >
              수익 수령
            </button>
          </aside>

          <section className="grid gap-3 md:grid-cols-3">
            {save.aquarium.exhibits.length === 0 && (
              <p className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center text-sm font-bold text-slate-400 md:col-span-3">
                아직 전시된 물고기가 없습니다. 판매소에서 희귀 이상 물고기를 전시해보세요.
              </p>
            )}
            {save.aquarium.exhibits.map((fish) => (
              <div key={fish.uid} className="rounded-[2rem] border border-cyan-300/20 bg-cyan-950/20 p-4 text-center shadow-xl">
                <p className="text-5xl">{getFishGradeInfo(fish.grade).emoji}</p>
                <h3 className="mt-3 text-lg font-black">{fish.name}</h3>
                <p className="mt-1 text-xs font-bold text-slate-300">{fish.cm.toFixed(1)}cm · {fish.kg.toFixed(1)}kg</p>
              </div>
            ))}
          </section>
        </div>
      </GameModal>
    );
  }

  function renderSeaGate() {
    return (
      <GameModal title="바다 선택" icon="🌊" desc="항구 출항 게이트에서 탐험할 바다를 선택합니다." onClose={() => setPanel("none")}>
        <div className="grid gap-3 md:grid-cols-2">
          {regions.map((region) => {
            const unlocked = isRegionUnlocked(region.id, save);

            return (
              <a
                key={region.id}
                href={unlocked ? `/ocean?region=${region.id}` : "#"}
                onClick={(event) => {
                  if (!unlocked) {
                    event.preventDefault();
                    setMessage("레벨이나 장비 조건이 부족합니다.");
                  }
                }}
                className={`rounded-[2rem] border p-5 shadow-xl transition active:scale-95 ${
                  unlocked ? "border-cyan-300/30 bg-cyan-950/30" : "border-white/10 bg-slate-800/50 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black">{region.name}</h3>
                  <span className="text-3xl">🌊</span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-300">{region.desc}</p>
                <p className="mt-4 text-sm font-black text-cyan-100">{unlocked ? "출항 가능" : "잠김"}</p>
              </a>
            );
          })}
        </div>
      </GameModal>
    );
  }

  return (
    <>
      {renderHarborMap()}
      {panel === "fishmarket" && renderFishMarket()}
      {panel === "shop" && renderShop(FISHING_CATEGORIES, "장비 상점", "🎣", "낚시 장비를 구매하고 장착합니다.")}
      {panel === "shipyard" && renderShop(BOAT_CATEGORIES, "조선소", "🛶", "배 장비와 탐험 장비를 관리합니다.")}
      {panel === "workshop" && renderWorkshop()}
      {panel === "quests" && renderQuests()}
      {panel === "aquarium" && renderAquarium()}
      {panel === "seaGate" && renderSeaGate()}
    </>
  );
}
