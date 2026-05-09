"use client";

import Link from "next/link";
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
  { id: "fishmarket", title: "생선 판매소", npc: "마리", icon: "🐟", desc: "어획물 판매 / 전시", x: 7, y: 16, w: 23, h: 15, kind: "building" },
  { id: "shop", title: "장비 상점", npc: "도윤", icon: "🎣", desc: "낚시 장비 구매", x: 38, y: 13, w: 23, h: 16, kind: "building" },
  { id: "shipyard", title: "조선소", npc: "브릭스", icon: "🚢", desc: "배 장비 관리", x: 69, y: 15, w: 22, h: 16, kind: "building" },
  { id: "workshop", title: "업그레이드 공방", npc: "해나", icon: "⚒️", desc: "장비 진화", x: 8, y: 43, w: 25, h: 15, kind: "building" },
  { id: "quests", title: "퀘스트 게시판", npc: "게시판", icon: "📜", desc: "일일 / 주간 의뢰", x: 66, y: 41, w: 25, h: 15, kind: "building" },
  { id: "aquarium", title: "수족관 입구", npc: "루나", icon: "🐠", desc: "희귀어 전시", x: 68, y: 64, w: 24, h: 15, kind: "building" },
  { id: "seaGate", title: "출항 게이트", npc: "항로 선택", icon: "⚓", desc: "바다 선택", x: 7, y: 66, w: 24, h: 15, kind: "gate" },
  { id: "mmo", title: "선단 본부", npc: "제독", icon: "🌐", desc: "MMO 확장 로드맵", x: 38, y: 67, w: 23, h: 14, kind: "building" },
];

const SHOP_CATEGORIES: EquipmentCategory[] = ["rod", "reel", "hook", "bait", "engine", "cargo", "fuelTank", "lantern"];
const FISHING_CATEGORIES: EquipmentCategory[] = ["rod", "reel", "hook", "bait"];
const BOAT_CATEGORIES: EquipmentCategory[] = ["engine", "cargo", "fuelTank", "lantern"];
const INTERACT_DISTANCE = 13;

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
    <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-center">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="font-black text-cyan-100">{value}</p>
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
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <section className="mx-auto min-h-[75vh] max-w-6xl rounded-[2rem] border border-cyan-300/20 bg-slate-950/95 p-5 text-white shadow-2xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-4xl">{icon}</p>
            <h2 className="mt-2 text-3xl font-black">{title}</h2>
            <p className="mt-1 text-sm text-slate-300">{desc}</p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 active:scale-95">
            닫기
          </button>
        </header>
        <div className="pt-5">{children}</div>
      </section>
    </div>
  );
}

function MapBuilding({ spot, active, onClick }: { spot: HarborSpot; active: boolean; onClick: () => void }) {
  const roof =
    spot.id === "fishmarket" || spot.id === "aquarium"
      ? "bg-sky-700"
      : spot.id === "workshop" || spot.id === "shipyard"
        ? "bg-amber-800"
        : spot.id === "seaGate"
          ? "bg-cyan-900"
          : spot.id === "mmo"
            ? "bg-fuchsia-800"
            : "bg-blue-800";

  return (
    <button
      onClick={onClick}
      className={`absolute rounded-2xl border p-2 text-left shadow-xl transition active:scale-95 ${
        active ? "border-cyan-200 bg-cyan-300/20" : "border-white/10 bg-slate-900/80"
      }`}
      style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}
    >
      <div className={`absolute -top-3 left-3 right-3 h-5 rounded-t-2xl ${roof}`} />
      <div className="relative z-10 flex h-full flex-col justify-end rounded-xl bg-black/20 p-2">
        <p className="text-lg font-black">{spot.icon} {spot.title}</p>
        <p className="text-[11px] text-slate-300">{spot.npc} · {spot.desc}</p>
        {active && <p className="mt-1 rounded-full bg-cyan-300 px-2 py-1 text-center text-[11px] font-black text-slate-950">E / 상호작용</p>}
      </div>
    </button>
  );
}

function DockPiece({ left, top, width, height }: { left: number; top: number; width: number; height: number }) {
  return <div className="absolute rounded-xl bg-amber-900/70 shadow-inner" style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }} />;
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
      className={`relative rounded-2xl border p-4 text-left transition active:scale-95 ${
        selected ? "border-cyan-200 bg-cyan-300/15" : "border-white/10 bg-slate-900/70"
      }`}
    >
      {equipped && <span className="absolute right-3 top-3 rounded-full bg-cyan-300 px-2 py-1 text-[10px] font-black text-slate-950">장착</span>}
      {!equipped && owned && <span className="absolute right-3 top-3 rounded-full bg-white/15 px-2 py-1 text-[10px] font-black text-white">보유</span>}
      <p className="text-3xl">{item.icon}</p>
      <h3 className="mt-2 font-black">{item.name}</h3>
      <p className={`mt-1 text-xs font-bold ${grade.color}`}>{grade.name}</p>
      <p className="mt-2 line-clamp-2 text-xs text-slate-400">{item.description}</p>
      <p className="mt-3 text-sm font-black text-yellow-200">{item.price ? `${item.price.toLocaleString()}G` : "기본 지급"}</p>
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
    <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
      <div className="flex items-start gap-4">
        <p className="text-5xl">{item.icon}</p>
        <div>
          <h3 className="text-2xl font-black">{item.name}</h3>
          <p className={`mt-1 text-sm font-bold ${grade.color}`}>{grade.name} · {CATEGORY_INFO[item.category].name}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{item.description}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {statEntries.length === 0 && <p className="rounded-2xl bg-black/25 p-3 text-sm text-slate-300">기본 장비입니다.</p>}
        {statEntries.map(([key, value]) => (
          <p key={key} className="rounded-2xl bg-black/25 p-3 text-sm font-bold text-cyan-100">
            {formatItemStat(key, value)}
          </p>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
    </section>
  );
}

export default function HarborPage() {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [message, setMessage] = useState("");
  const [panel, setPanel] = useState<HarborPanel>("none");
  const [shopCategory, setShopCategory] = useState<EquipmentCategory>("rod");
  const [selectedItemId, setSelectedItemId] = useState("rod_old");
  const [selectedFishUid, setSelectedFishUid] = useState<string | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 70 });
  const [playerFacing, setPlayerFacing] = useState<"left" | "right" | "up" | "down">("up");

  useEffect(() => {
    const timer = window.setTimeout(() => setSave(loadSave()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const level = getPlayerLevel(save);
  const nextExp = getNextLevelExp(level);
  const stats = getEquipmentStats(save);
  const selectedFish = (save.bag || []).find((item) => item.uid === selectedFishUid) || (save.bag || [])[0];
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
  }, [panel, nearestSpot]);

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
      <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
        <DiscordLaunchBridge />
        <section className="relative min-h-screen bg-[radial-gradient(circle_at_50%_25%,rgba(34,211,238,0.28),transparent_34%),linear-gradient(180deg,#082f49_0%,#0f172a_42%,#020617_100%)]">
          <div className="absolute left-0 right-0 top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-4">
            <Link href="/" className="rounded-xl bg-black/35 px-4 py-2 font-bold backdrop-blur">← 홈</Link>
            <div className="flex flex-wrap gap-2">
              <StatPill label="적재" value={`${bagWeight(save).toFixed(1)} / ${cargoLimit(save)}kg`} />
              <StatPill label="연료" value={`${fuelLimit(save)} MAX`} />
              <StatPill label="골드" value={`${save.gold.toLocaleString()}G`} />
              <StatPill label="레벨" value={`Lv.${level}`} />
            </div>
            <button onClick={() => setPanel("seaGate")} className="rounded-2xl bg-amber-300 px-4 py-2 text-sm font-black text-slate-950 active:scale-95">
              출항
            </button>
          </div>

          <div className="absolute inset-x-4 bottom-28 top-28 overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-cyan-950/25 shadow-2xl backdrop-blur-sm">
            <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-b from-cyan-900/30 to-blue-950/80" />
            <div className="absolute inset-x-0 top-0 h-[62%] bg-gradient-to-b from-slate-800 to-slate-900" />
            <DockPiece left={3} top={58} width={94} height={6} />
            <DockPiece left={46} top={58} width={8} height={34} />
            <DockPiece left={16} top={58} width={7} height={25} />
            <DockPiece left={76} top={58} width={7} height={25} />
            {Array.from({ length: 18 }).map((_, index) => (
              <div key={index} className="absolute h-2 w-10 rounded-full bg-cyan-200/15" style={{ left: `${(index * 17) % 94}%`, top: `${66 + (index % 5) * 5}%` }} />
            ))}
            {HARBOR_SPOTS.map((spot) => (
              <MapBuilding key={spot.id} spot={spot} active={nearestSpot?.id === spot.id} onClick={() => openSpot(spot)} />
            ))}
            {nearestSpot && (
              <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 shadow-xl">
                {nearestSpot.icon} {nearestSpot.title} · E / 상호작용
              </div>
            )}
            <div className="absolute z-40 grid size-20 place-items-center rounded-full border-4 border-cyan-200 bg-white text-3xl shadow-2xl transition-all" style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%`, transform: "translate(-50%, -50%)" }}>
              <span>{playerFacing === "left" ? "⛵" : playerFacing === "right" ? "⛵" : playerFacing === "down" ? "🛥️" : "⛵"}</span>
              <span className="absolute -bottom-6 whitespace-nowrap rounded-full bg-black/60 px-2 py-1 text-[11px] font-black text-white">내 배</span>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 z-30 grid w-44 grid-cols-3 gap-2 sm:hidden">
            <div />
            <button onClick={() => movePlayer(0, -6)} className="rounded-2xl bg-white/15 py-4 text-2xl font-black backdrop-blur active:scale-95">↑</button>
            <div />
            <button onClick={() => movePlayer(-6, 0)} className="rounded-2xl bg-white/15 py-4 text-2xl font-black backdrop-blur active:scale-95">←</button>
            <button onClick={() => movePlayer(0, 6)} className="rounded-2xl bg-white/15 py-4 text-2xl font-black backdrop-blur active:scale-95">↓</button>
            <button onClick={() => movePlayer(6, 0)} className="rounded-2xl bg-white/15 py-4 text-2xl font-black backdrop-blur active:scale-95">→</button>
          </div>

          <button
            onClick={() => nearestSpot && setPanel(nearestSpot.id)}
            disabled={!nearestSpot}
            className="absolute bottom-7 right-6 z-50 grid size-24 place-items-center rounded-full border-4 border-white/50 bg-cyan-300 text-sm font-black text-slate-950 shadow-2xl disabled:bg-slate-600 disabled:text-slate-300 active:scale-95"
          >
            상호작용
          </button>

          {message && <p className="absolute bottom-7 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-black/70 px-5 py-3 text-center font-bold text-cyan-100 shadow-xl">{message}</p>}
        </section>
      </main>
    );
  }

  function renderShop(categories: EquipmentCategory[], title: string, icon: string, desc: string) {
    const safeCategory = categories.includes(shopCategory) ? shopCategory : categories[0];
    const items = getItemsByCategory(safeCategory);
    const item = FISHING_ITEM_BY_ID[selectedItemId]?.category === safeCategory ? FISHING_ITEM_BY_ID[selectedItemId] : items[0];

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
                className={`rounded-2xl border px-4 py-3 text-left font-black active:scale-95 ${safeCategory === category ? "border-cyan-200 bg-cyan-300 text-slate-950" : "border-white/10 bg-white/5 text-white"}`}
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
          {item && <ItemDetail save={save} item={item} onBuy={handleBuyItem} onEquip={handleEquipItem} />}
        </div>
      </GameModal>
    );
  }

  function renderFishMarket() {
    const items = save.bag || [];

    return (
      <GameModal title="생선 판매소" icon="🐟" desc="어획물을 판매하거나 희귀 표본을 수족관에 넘깁니다." onClose={() => setPanel("none")}>
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-black">가방 어획물</h3>
              <p className="text-sm text-slate-300">{items.length}마리 · 총 {totalValue.toLocaleString()}G</p>
            </div>
            <div className="mt-4 grid max-h-[55vh] gap-3 overflow-y-auto pr-1">
              {items.length === 0 && <p className="rounded-2xl bg-black/25 p-5 text-slate-300">판매할 물고기가 없습니다.</p>}
              {items.map((fish) => {
                const grade = getFishGradeInfo(fish.grade);
                const selected = selectedFish?.uid === fish.uid;

                return (
                  <button key={fish.uid} onClick={() => setSelectedFishUid(fish.uid)} className={`rounded-2xl border p-3 text-left active:scale-95 ${selected ? "border-cyan-200 bg-cyan-300/10" : "border-white/10 bg-slate-900/60"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{grade.emoji} {fish.name}</p>
                        <p className="mt-1 text-xs text-slate-400">{fish.sizeRank} · {fish.cm.toFixed(1)}cm · {fish.kg.toFixed(1)}kg · 신선도 {currentFreshness(fish, save)}%</p>
                      </div>
                      <p className="font-black text-yellow-200">{itemSellValue(fish, save).toLocaleString()}G</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <h3 className="text-2xl font-black">선택 감정서</h3>
            {selectedFish ? (
              <div className="mt-4">
                <p className="text-5xl">{getFishGradeInfo(selectedFish.grade).emoji}</p>
                <h4 className="mt-3 text-xl font-black">{selectedFish.name}</h4>
                <p className="mt-1 text-sm text-slate-300">{selectedFish.region} · {selectedFish.sizeRank}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <StatPill label="길이" value={`${selectedFish.cm.toFixed(1)}cm`} />
                  <StatPill label="무게" value={`${selectedFish.kg.toFixed(1)}kg`} />
                  <StatPill label="신선도" value={`${currentFreshness(selectedFish, save)}%`} />
                  <StatPill label="판매가" value={`${itemSellValue(selectedFish, save).toLocaleString()}G`} />
                </div>
                <div className="mt-5 grid gap-3">
                  <button onClick={handleSellSelected} className="rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black text-slate-950 active:scale-95">선택 판매</button>
                  <button onClick={() => handleAquariumAdd(selectedFish.uid)} className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 active:scale-95">수족관 전시</button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-slate-300">왼쪽에서 물고기를 선택하세요.</p>
            )}
            <div className="mt-6 border-t border-white/10 pt-5">
              <h3 className="text-xl font-black">정산</h3>
              <button onClick={handleSellAll} className="mt-3 w-full rounded-2xl bg-emerald-300 px-4 py-4 font-black text-slate-950 active:scale-95">전부 판매</button>
            </div>
          </aside>
        </div>
      </GameModal>
    );
  }

  function renderWorkshop() {
    return (
      <GameModal title="업그레이드 공방" icon="⚒️" desc="보유 장비를 다음 단계로 진화시킵니다." onClose={() => setPanel("none")}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SHOP_CATEGORIES.map((category) => {
            const current = getEquipmentItem(save, category);
            const next = current.nextId ? FISHING_ITEM_BY_ID[current.nextId] : null;
            const cost = current.upgradeCost || next?.price || 0;
            const grade = ITEM_GRADE_INFO[current.grade];

            return (
              <article key={category} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <p className="text-sm font-bold text-cyan-200">{CATEGORY_INFO[category].icon} {CATEGORY_INFO[category].name}</p>
                <p className="mt-4 text-4xl">{current.icon}</p>
                <h3 className="mt-3 text-xl font-black">{current.name}</h3>
                <p className={`mt-1 text-sm font-bold ${grade.color}`}>{grade.name}</p>
                <div className="mt-4 min-h-24 rounded-2xl bg-black/25 p-3 text-sm text-slate-300">
                  {next ? (
                    <>
                      <p className="text-slate-400">다음 단계</p>
                      <p className="mt-2 font-black text-white">{current.icon} → {next.icon} {next.name}</p>
                      <p className="mt-2 text-yellow-200">{cost.toLocaleString()}G</p>
                    </>
                  ) : (
                    <p>최종 단계 장비입니다.</p>
                  )}
                </div>
                <button
                  onClick={() => handleUpgrade(category)}
                  disabled={!next || save.gold < cost}
                  className="mt-4 w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black text-slate-950 disabled:bg-slate-600 disabled:text-slate-300 active:scale-95"
                >
                  {!next ? "최대 단계" : save.gold < cost ? "골드 부족" : "업그레이드"}
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
      <GameModal title="퀘스트 게시판" icon="📜" desc="항구 의뢰와 주간 목표를 확인합니다." onClose={() => setPanel("none")}>
        <div className="grid gap-4 md:grid-cols-2">
          {allQuests.map((quest) => {
            const ratio = Math.min(100, (quest.progress / quest.goal) * 100);

            return (
              <article key={quest.id} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-black text-cyan-100">{quest.type === "daily" ? "일일" : "주간"}</span>
                  <span className="text-sm font-bold text-slate-300">{quest.progress}/{quest.goal}</span>
                </div>
                <h3 className="mt-4 text-xl font-black">{quest.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{quest.desc}</p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/40">
                  <div className="h-full bg-cyan-300" style={{ width: `${ratio}%` }} />
                </div>
                <p className="mt-4 text-sm font-bold text-yellow-200">보상 {quest.rewardGold.toLocaleString()}G · EXP {quest.rewardExp}</p>
              </article>
            );
          })}
        </div>
      </GameModal>
    );
  }

  function renderAquarium() {
    return (
      <GameModal title="네온 수족관" icon="🐠" desc="희귀 어종을 전시해 시간당 수익을 얻습니다." onClose={() => setPanel("none")}>
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-fuchsia-300/20 bg-fuchsia-300/10 p-5">
            <h3 className="text-2xl font-black">수족관 수익</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <StatPill label="시간당" value={`${aquariumIncome.hourly.toLocaleString()}G`} />
              <StatPill label="수령 가능" value={`${aquariumIncome.claimable.toLocaleString()}G`} />
              <StatPill label="전시" value={`${save.aquarium.exhibits.length}마리`} />
              <StatPill label="누적" value={`${save.aquarium.totalIncome.toLocaleString()}G`} />
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
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {save.aquarium.exhibits.length === 0 && <p className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-slate-300">아직 전시된 물고기가 없습니다. 판매소에서 희귀 이상 물고기를 전시해보세요.</p>}
            {save.aquarium.exhibits.map((fish) => (
              <article key={fish.uid} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <p className="text-4xl">{getFishGradeInfo(fish.grade).emoji}</p>
                <h3 className="mt-3 font-black">{fish.name}</h3>
                <p className="mt-2 text-sm text-slate-300">{fish.cm.toFixed(1)}cm · {fish.kg.toFixed(1)}kg</p>
              </article>
            ))}
          </section>
        </div>
      </GameModal>
    );
  }

  function renderSeaGate() {
    return (
      <GameModal title="출항 게이트" icon="⚓" desc="레벨 조건을 만족한 해역으로 출항합니다." onClose={() => setPanel("none")}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {regions.map((region) => {
            const unlocked = isRegionUnlocked(region.id, save);

            return (
              <Link
                key={region.id}
                href={`/prepare?region=${region.id}`}
                onClick={(event) => {
                  if (!unlocked) {
                    event.preventDefault();
                    setMessage("레벨이나 장비 조건이 부족합니다.");
                  }
                }}
                className={`rounded-[2rem] border p-5 shadow-xl transition active:scale-95 ${unlocked ? "border-cyan-300/30 bg-cyan-950/30" : "border-white/10 bg-slate-800/50 opacity-60"}`}
              >
                <p className="text-4xl">{region.emoji}</p>
                <h3 className="mt-3 text-xl font-black">{region.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{region.desc}</p>
                <p className={`mt-4 text-sm font-black ${unlocked ? "text-cyan-200" : "text-red-200"}`}>{unlocked ? "출항 가능" : "잠김"}</p>
              </Link>
            );
          })}
        </div>
      </GameModal>
    );
  }

  function renderMmoPanel() {
    return (
      <GameModal title="선단 본부" icon="🌐" desc="MMO 대형 확장 콘텐츠의 핵심 시스템을 확인합니다." onClose={() => setPanel("none")}>
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="grid gap-4 md:grid-cols-2">
            {[
              ["공유 해역", "서버 공용 날씨·해류·희귀종 출현 이벤트를 표시합니다."],
              ["길드 선단", "선장, 낚시꾼, 다이버, 정비사가 역할을 나눠 원정합니다."],
              ["심해 레이드", "거대 어종을 추적하고 단계별로 제압하는 협동 전투입니다."],
              ["항구 경영", "수산시장, 연구소, 조선소, 수족관을 장기 성장축으로 키웁니다."],
            ].map(([title, desc]) => (
              <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <h3 className="text-xl font-black text-cyan-100">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{desc}</p>
              </article>
            ))}
          </section>
          <aside className="rounded-3xl border border-fuchsia-300/20 bg-fuchsia-300/10 p-5">
            <h3 className="text-2xl font-black">현재 선단 전투력</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <StatPill label="제압력" value={stats.catchPower} />
              <StatPill label="줄 제어" value={stats.lineControl} />
              <StatPill label="희귀" value={stats.rareBonus} />
              <StatPill label="항해" value={stats.speed} />
            </div>
            <Link href="/mmo" className="mt-5 block rounded-2xl bg-fuchsia-300 px-4 py-4 text-center font-black text-slate-950 active:scale-95">
              확장 로드맵 보기
            </Link>
          </aside>
        </div>
      </GameModal>
    );
  }

  return (
    <>
      {renderHarborMap()}
      {panel === "fishmarket" && renderFishMarket()}
      {panel === "shop" && renderShop(FISHING_CATEGORIES, "장비 상점", "🎣", "낚시 장비를 구매하고 장착합니다.")}
      {panel === "shipyard" && renderShop(BOAT_CATEGORIES, "조선소", "🚢", "배 장비와 탐험 장비를 관리합니다.")}
      {panel === "workshop" && renderWorkshop()}
      {panel === "quests" && renderQuests()}
      {panel === "aquarium" && renderAquarium()}
      {panel === "seaGate" && renderSeaGate()}
      {panel === "mmo" && renderMmoPanel()}
      <div className="sr-only" aria-live="polite">다음 레벨까지 {Math.max(0, nextExp - save.exp)} 경험치</div>
    </>
  );
}
