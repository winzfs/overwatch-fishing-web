export type BagItem = {
  uid: string;
  fishId: string;
  name: string;
  grade: string;
  cm: number;
  kg: number;
  baseValue: number;
  exp: number;
  freshness: number;
  caughtAt: number;
  region: string;
  sizeRank: string;
};

export type SaveData = {
  gold: number;
  exp: number;
  caught: number;
  collection: Record<string, number>;
  upgrades: {
    rod: number;
    engine: number;
    radar: number;
    cargo?: number;
    fridge?: number;
    fuelTank?: number;
  };
  bag?: BagItem[];
  records?: Record<string, { cm: number; kg: number }>;
  prep?: {
    bait: "basic" | "rare" | "heavy";
    ice: number;
  };
};

export const SAVE_KEY = "overwatch-fishing-save-v1";

export function defaultSave(): SaveData {
  return {
    gold: 3000,
    exp: 0,
    caught: 0,
    collection: {},
    upgrades: {
      rod: 0,
      engine: 0,
      radar: 0,
      cargo: 0,
      fridge: 0,
      fuelTank: 0,
    },
    bag: [],
    records: {},
    prep: {
      bait: "basic",
      ice: 0,
    },
  };
}

export function normalizeSave(data: Partial<SaveData>): SaveData {
  const base = defaultSave();
  return {
    ...base,
    ...data,
    collection: data.collection || {},
    upgrades: {
      ...base.upgrades,
      ...(data.upgrades || {}),
    },
    bag: data.bag || [],
    records: data.records || {},
    prep: {
      bait: data.prep?.bait ?? base.prep.bait,
      ice: data.prep?.ice ?? base.prep.ice,
    },
  };
}

export function loadSave(): SaveData {
  if (typeof window === "undefined") return defaultSave();

  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return normalizeSave(JSON.parse(raw));
  } catch {
    return defaultSave();
  }
}

export function saveGame(data: SaveData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(normalizeSave(data)));
}

export function bagWeight(save: SaveData) {
  return (save.bag || []).reduce((sum, item) => sum + item.kg, 0);
}

export function cargoLimit(save: SaveData) {
  return 80 + (save.upgrades.cargo || 0) * 35;
}

export function fuelLimit(save: SaveData) {
  return 100 + (save.upgrades.fuelTank || 0) * 30;
}

export function currentFreshness(item: BagItem, save: SaveData) {
  const fridge = save.upgrades.fridge || 0;
  const iceBonus = save.prep?.ice || 0;
  const decayPerMinute = Math.max(0.8, 4.5 - fridge * 0.55 - iceBonus * 0.15);
  const elapsedMinutes = (Date.now() - item.caughtAt) / 60000;
  return Math.max(20, Math.floor(item.freshness - elapsedMinutes * decayPerMinute));
}

export function itemSellValue(item: BagItem, save: SaveData) {
  const fresh = currentFreshness(item, save);
  return Math.floor(item.baseValue * (fresh / 100));
}

export const upgradeList = [
  { key: "cargo", emoji: "🎒", name: "적재함", desc: "가방 최대 무게 증가", base: 2600, max: 8 },
  { key: "fridge", emoji: "🧊", name: "냉장고", desc: "신선도 감소 속도 완화", base: 3200, max: 8 },
  { key: "fuelTank", emoji: "⛽", name: "연료탱크", desc: "출항 연료량 증가", base: 2800, max: 8 },
  { key: "engine", emoji: "🚤", name: "엔진", desc: "배 이동속도 증가", base: 3500, max: 8 },
  { key: "radar", emoji: "📡", name: "레이더", desc: "탐지 범위와 희귀 발견률 증가", base: 4200, max: 8 },
  { key: "rod", emoji: "🎣", name: "낚싯대", desc: "낚시 성공 구간 증가", base: 3000, max: 8 },
] as const;

export function upgradePrice(base: number, level: number) {
  return Math.floor(base * Math.pow(1.82, level));
}

export type DailySeaEvent = {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  goldMultiplier: number;
  expMultiplier: number;
  rareBonus: number;
};

export const DAILY_EVENTS: DailySeaEvent[] = [
  { id: "calm", name: "잔잔한 바다", desc: "안정적인 출항. 기본 보상.", emoji: "🌤️", goldMultiplier: 1, expMultiplier: 1, rareBonus: 0 },
  { id: "gold_tide", name: "황금 물결", desc: "판매 가치가 오르는 날.", emoji: "🌅", goldMultiplier: 1.25, expMultiplier: 1, rareBonus: 0 },
  { id: "school", name: "물고기 떼", desc: "개체 수와 희귀 실루엣 증가.", emoji: "🐟", goldMultiplier: 1, expMultiplier: 1.1, rareBonus: 1 },
  { id: "storm", name: "폭풍 전야", desc: "위험하지만 경험치 증가.", emoji: "⛈️", goldMultiplier: 1, expMultiplier: 1.35, rareBonus: 1 },
  { id: "legend_scent", name: "전설의 기척", desc: "전설 이상 실루엣 증가.", emoji: "✨", goldMultiplier: 1.15, expMultiplier: 1.15, rareBonus: 2 },
];

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDailySeaEvent(regionId: string): DailySeaEvent {
  const key = `${new Date().toISOString().slice(0, 10)}-${regionId}`;
  return DAILY_EVENTS[hashString(key) % DAILY_EVENTS.length];
}
