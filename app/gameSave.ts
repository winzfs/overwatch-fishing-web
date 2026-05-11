import {
  DEFAULT_EQUIPMENT,
  DEFAULT_OWNED_ITEM_IDS,
  FISHING_ITEM_BY_ID,
  type EquipmentCategory,
  type FishingEquipmentItem,
} from "../data/fishingItems";

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

export type QuestTask = {
  id: string;
  type: "daily" | "weekly";
  title: string;
  desc: string;
  progress: number;
  goal: number;
  rewardGold: number;
  rewardExp: number;
  claimed?: boolean;
};

export type EquipmentStats = {
  catchPower: number;
  lineControl: number;
  rareBonus: number;
  valueBonus: number;
  speed: number;
  cargoKg: number;
  fuel: number;
  freshnessBonus: number;
  deepSeaAccess: boolean;
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
  totalSold?: number;
  legendaryCaught?: number;
  ownedItems: string[];
  equipment: Record<EquipmentCategory, string>;
  quests: {
    daily: QuestTask[];
    weekly: QuestTask[];
  };
  aquarium: {
    exhibits: BagItem[];
    lastClaimedAt: number;
    totalIncome: number;
  };
};

export const SAVE_KEY = "overwatch-fishing-save-v1";
const RARE_ALERT_SENT_KEY = "overwatch-fishing-rare-alert-sent-v1";
const RARE_ALERT_COOLDOWN_MS = 2500;

let lastRareAlertAt = 0;

let saveSyncTimer: ReturnType<typeof setTimeout> | null = null;

function defaultQuests(): SaveData["quests"] {
  return {
    daily: [
      {
        id: "daily_sell_3",
        type: "daily",
        title: "아침 경매 준비",
        desc: "어획물 3마리를 판매하세요.",
        progress: 0,
        goal: 3,
        rewardGold: 1200,
        rewardExp: 40,
      },
      {
        id: "daily_explore",
        type: "daily",
        title: "항구 순찰",
        desc: "출항 전에 항구 시설을 둘러보세요.",
        progress: 0,
        goal: 1,
        rewardGold: 500,
        rewardExp: 20,
      },
    ],
    weekly: [
      {
        id: "weekly_rare",
        type: "weekly",
        title: "희귀 표본 확보",
        desc: "희귀 이상 물고기를 수족관에 전시하세요.",
        progress: 0,
        goal: 5,
        rewardGold: 8000,
        rewardExp: 240,
      },
    ],
  };
}

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
    totalSold: 0,
    legendaryCaught: 0,
    ownedItems: [...DEFAULT_OWNED_ITEM_IDS],
    equipment: { ...DEFAULT_EQUIPMENT },
    quests: defaultQuests(),
    aquarium: {
      exhibits: [],
      lastClaimedAt: Date.now(),
      totalIncome: 0,
    },
  };
}

export function normalizeSave(data: Partial<SaveData>): SaveData {
  const base = defaultSave();
  const ownedItems = Array.from(
    new Set([...(data.ownedItems || []), ...DEFAULT_OWNED_ITEM_IDS].filter((id) => FISHING_ITEM_BY_ID[id]))
  );
  const equipment = {
    ...base.equipment,
    ...(data.equipment || {}),
  };

  for (const [category, itemId] of Object.entries(equipment) as [EquipmentCategory, string][]) {
    const item = FISHING_ITEM_BY_ID[itemId];
    if (!item || item.category !== category) equipment[category] = base.equipment[category];
  }

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
      bait: data.prep?.bait ?? "basic",
      ice: data.prep?.ice ?? 0,
    },
    totalSold: data.totalSold ?? 0,
    legendaryCaught: data.legendaryCaught ?? 0,
    ownedItems,
    equipment,
    quests: {
      daily: data.quests?.daily?.length ? data.quests.daily : base.quests.daily,
      weekly: data.quests?.weekly?.length ? data.quests.weekly : base.quests.weekly,
    },
    aquarium: {
      exhibits: data.aquarium?.exhibits || [],
      lastClaimedAt: data.aquarium?.lastClaimedAt ?? Date.now(),
      totalIncome: data.aquarium?.totalIncome ?? 0,
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

function getOldSaveBeforeWrite(): SaveData {
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

  const previous = getOldSaveBeforeWrite();
  const normalized = normalizeSave(data);

  localStorage.setItem(SAVE_KEY, JSON.stringify(normalized));

  detectAndSendRareCatchAlert(previous, normalized);
  queueServerSave(normalized);
}

export function getDiscordUserId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("discord-user-id") || "";
}

export function getDiscordDisplayName() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("discord-display-name") || "";
}


function getSentRareAlertIds(): Set<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = localStorage.getItem(RARE_ALERT_SENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function saveSentRareAlertIds(ids: Set<string>) {
  if (typeof window === "undefined") return;

  // 너무 커지지 않게 최근 300개만 보관
  const latest = Array.from(ids).slice(-300);
  localStorage.setItem(RARE_ALERT_SENT_KEY, JSON.stringify(latest));
}

function markRareAlertSent(uid: string) {
  const sentIds = getSentRareAlertIds();
  sentIds.add(uid);
  saveSentRareAlertIds(sentIds);
}

function canSendRareAlertNow() {
  const now = Date.now();

  if (now - lastRareAlertAt < RARE_ALERT_COOLDOWN_MS) {
    return false;
  }

  lastRareAlertAt = now;
  return true;
}

function detectAndSendRareCatchAlert(previous: SaveData, next: SaveData) {
  const discordId = getDiscordUserId();
  if (!discordId) return;

  const oldIds = new Set((previous.bag || []).map((item) => item.uid));
  const sentAlertIds = getSentRareAlertIds();

  const newRareItems = (next.bag || []).filter((item) => {
    return (
      !oldIds.has(item.uid) &&
      !sentAlertIds.has(item.uid) &&
      ["legend", "mythic", "transcend"].includes(item.grade)
    );
  });

  if (newRareItems.length === 0) return;

  const patched: SaveData = {
    ...next,
    legendaryCaught: (next.legendaryCaught || 0) + newRareItems.length,
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(patched));

  // 저장/렌더링이 짧은 시간에 여러 번 호출되어도 웹훅은 1개씩만 보냄
  if (!canSendRareAlertNow()) return;

  const item = newRareItems[0];

  // API 실패/재시도/렌더 중복으로 같은 물고기 속보가 반복 전송되지 않게 먼저 기록
  markRareAlertSent(item.uid);

  sendRareCatchAlert(item, patched).catch(() => {});
}

export function queueServerSave(data?: SaveData) {
  if (typeof window === "undefined") return;

  const discordId = getDiscordUserId();
  if (!discordId) return;

  if (saveSyncTimer) clearTimeout(saveSyncTimer);

  saveSyncTimer = setTimeout(() => {
    syncSaveToServer(data || loadSave()).catch((error) => {
      console.warn("Fishing save sync failed:", error);
    });
  }, 700);
}

export async function syncSaveToServer(data?: SaveData) {
  if (typeof window === "undefined") return;

  const discordId = getDiscordUserId();
  if (!discordId) return;

  const payload = normalizeSave(data || loadSave());

  const res = await fetch("/api/fishing/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-discord-id": discordId,
    },
    body: JSON.stringify({
      discordId,
      displayName: getDiscordDisplayName(),
      save: payload,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }
}

export async function loadSaveFromServer() {
  if (typeof window === "undefined") return null;

  const discordId = getDiscordUserId();
  if (!discordId) return null;

  const res = await fetch(`/api/fishing/save?discordId=${encodeURIComponent(discordId)}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data?.save) return null;

  const serverSave = normalizeSave(data.save);
  localStorage.setItem(SAVE_KEY, JSON.stringify(serverSave));
  return serverSave;
}

export async function sendRareCatchAlert(item: BagItem, save: SaveData) {
  if (typeof window === "undefined") return;

  const discordId = getDiscordUserId();
  if (!discordId) return;

  if (!["legend", "mythic", "transcend"].includes(item.grade)) return;

  await fetch("/api/fishing/catch-alert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-discord-id": discordId,
    },
    body: JSON.stringify({
      discordId,
      displayName: getDiscordDisplayName(),
      fish: item,
      save: normalizeSave(save),
    }),
  });
}

export function bagWeight(save: SaveData) {
  return (save.bag || []).reduce((sum, item) => sum + item.kg, 0);
}

export function cargoLimit(save: SaveData) {
  return 80 + (save.upgrades.cargo || 0) * 35 + getEquipmentStats(save).cargoKg;
}

export function fuelLimit(save: SaveData) {
  return 100 + (save.upgrades.fuelTank || 0) * 30 + getEquipmentStats(save).fuel;
}

export function currentFreshness(item: BagItem, save: SaveData) {
  const fridge = save.upgrades.fridge || 0;
  const iceBonus = save.prep?.ice || 0;
  const freshnessBonus = getEquipmentStats(save).freshnessBonus;
  const decayPerMinute = Math.max(0.8, 4.5 - fridge * 0.55 - iceBonus * 0.15 - freshnessBonus * 0.35);
  const elapsedMinutes = (Date.now() - item.caughtAt) / 60000;

  return Math.max(20, Math.floor(item.freshness - elapsedMinutes * decayPerMinute));
}

export function itemSellValue(item: BagItem, save: SaveData) {
  const fresh = currentFreshness(item, save);
  const valueBonus = getEquipmentStats(save).valueBonus;
  return Math.floor(item.baseValue * (fresh / 100) * (1 + valueBonus));
}

export {
  getPlayerLevel,
  getNextLevelExp,
  getRegionRequiredLevel,
  isRegionUnlocked,
} from "../lib/progression";

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

export type { DailySeaEvent } from "../lib/events/daily";
export { DAILY_EVENTS, getDailySeaEvent } from "../lib/events/daily";

export type SaveMutationResult = {
  ok: boolean;
  save: SaveData;
  message: string;
};

export function getEquipmentItem(save: SaveData, category: EquipmentCategory): FishingEquipmentItem {
  const normalized = normalizeSave(save);
  const item = FISHING_ITEM_BY_ID[normalized.equipment[category]];
  return item && item.category === category ? item : FISHING_ITEM_BY_ID[DEFAULT_EQUIPMENT[category]];
}

export function getEquipmentStats(save: SaveData): EquipmentStats {
  const normalized = normalizeSave(save);
  const stats: EquipmentStats = {
    catchPower: normalized.upgrades.rod || 0,
    lineControl: 0,
    rareBonus: normalized.upgrades.radar || 0,
    valueBonus: 0,
    speed: normalized.upgrades.engine || 0,
    cargoKg: 0,
    fuel: 0,
    freshnessBonus: normalized.upgrades.fridge || 0,
    deepSeaAccess: false,
  };

  for (const category of Object.keys(normalized.equipment) as EquipmentCategory[]) {
    const item = getEquipmentItem(normalized, category);

    stats.catchPower += item.stats.catchPower || 0;
    stats.lineControl += item.stats.lineControl || 0;
    stats.rareBonus += item.stats.rareBonus || 0;
    stats.valueBonus += item.stats.valueBonus || 0;
    stats.speed += item.stats.speed || 0;
    stats.cargoKg += item.stats.cargoKg || 0;
    stats.fuel += item.stats.fuel || 0;
    stats.freshnessBonus += item.stats.freshnessBonus || 0;
    stats.deepSeaAccess = stats.deepSeaAccess || Boolean(item.stats.deepSeaAccess);
  }

  return stats;
}

export function buyItem(save: SaveData, itemId: string): SaveMutationResult {
  const normalized = normalizeSave(save);
  const item = FISHING_ITEM_BY_ID[itemId];

  if (!item) return { ok: false, save: normalized, message: "존재하지 않는 장비입니다." };
  if (normalized.ownedItems.includes(item.id)) return { ok: false, save: normalized, message: "이미 보유한 장비입니다." };
  if (normalized.gold < item.price) return { ok: false, save: normalized, message: `골드가 부족합니다. 필요: ${item.price.toLocaleString()}G` };

  const next = normalizeSave({
    ...normalized,
    gold: normalized.gold - item.price,
    ownedItems: [...normalized.ownedItems, item.id],
  });

  return { ok: true, save: next, message: `${item.name} 구매 완료!` };
}

export function equipItem(save: SaveData, itemId: string): SaveMutationResult {
  const normalized = normalizeSave(save);
  const item = FISHING_ITEM_BY_ID[itemId];

  if (!item) return { ok: false, save: normalized, message: "존재하지 않는 장비입니다." };
  if (!normalized.ownedItems.includes(item.id)) return { ok: false, save: normalized, message: "먼저 장비를 구매해야 합니다." };

  const next = normalizeSave({
    ...normalized,
    equipment: {
      ...normalized.equipment,
      [item.category]: item.id,
    },
  });

  return { ok: true, save: next, message: `${item.name} 장착 완료!` };
}

export function upgradeEquipment(save: SaveData, category: EquipmentCategory): SaveMutationResult {
  const normalized = normalizeSave(save);
  const current = getEquipmentItem(normalized, category);

  if (!current.nextId) return { ok: false, save: normalized, message: "이미 최종 단계 장비입니다." };

  const nextItem = FISHING_ITEM_BY_ID[current.nextId];
  if (!nextItem) return { ok: false, save: normalized, message: "다음 단계 장비 정보가 없습니다." };

  const cost = current.upgradeCost || nextItem.price;
  if (normalized.gold < cost) return { ok: false, save: normalized, message: `골드가 부족합니다. 필요: ${cost.toLocaleString()}G` };

  const next = normalizeSave({
    ...normalized,
    gold: normalized.gold - cost,
    ownedItems: Array.from(new Set([...normalized.ownedItems, nextItem.id])),
    equipment: {
      ...normalized.equipment,
      [category]: nextItem.id,
    },
  });

  return { ok: true, save: next, message: `${current.name} → ${nextItem.name} 업그레이드 완료!` };
}

export function sellBagItems(save: SaveData, uids?: string[]) {
  const normalized = normalizeSave(save);
  const targetIds = uids ? new Set(uids) : null;
  const soldItems = (normalized.bag || []).filter((item) => !targetIds || targetIds.has(item.uid));
  const soldGold = soldItems.reduce((sum, item) => sum + itemSellValue(item, normalized), 0);
  const soldCount = soldItems.length;
  const next = normalizeSave({
    ...normalized,
    gold: normalized.gold + soldGold,
    bag: (normalized.bag || []).filter((item) => targetIds && !targetIds.has(item.uid)),
    totalSold: (normalized.totalSold || 0) + soldGold,
    quests: advanceQuestProgress(normalized.quests, "daily_sell_3", soldCount),
  });

  return { save: next, soldGold, soldCount };
}

function advanceQuestProgress(quests: SaveData["quests"], questId: string, amount: number): SaveData["quests"] {
  return {
    daily: quests.daily.map((quest) =>
      quest.id === questId ? { ...quest, progress: Math.min(quest.goal, quest.progress + amount) } : quest
    ),
    weekly: quests.weekly.map((quest) =>
      quest.id === questId ? { ...quest, progress: Math.min(quest.goal, quest.progress + amount) } : quest
    ),
  };
}

export function addAquariumExhibit(save: SaveData, uid: string): SaveMutationResult {
  const normalized = normalizeSave(save);
  const fish = (normalized.bag || []).find((item) => item.uid === uid);

  if (!fish) return { ok: false, save: normalized, message: "가방에서 물고기를 찾을 수 없습니다." };
  if (!["rare", "epic", "legend", "mythic", "transcend"].includes(fish.grade)) {
    return { ok: false, save: normalized, message: "희귀 이상 물고기만 수족관에 전시할 수 있습니다." };
  }
  if (normalized.aquarium.exhibits.some((item) => item.uid === uid)) {
    return { ok: false, save: normalized, message: "이미 전시 중인 물고기입니다." };
  }

  const next = normalizeSave({
    ...normalized,
    bag: (normalized.bag || []).filter((item) => item.uid !== uid),
    aquarium: {
      ...normalized.aquarium,
      exhibits: [...normalized.aquarium.exhibits, fish],
    },
    quests: advanceQuestProgress(normalized.quests, "weekly_rare", 1),
  });

  return { ok: true, save: next, message: `${fish.name} 수족관 전시 완료!` };
}

export function getAquariumIncome(save: SaveData) {
  const normalized = normalizeSave(save);
  const elapsedHours = Math.max(0, (Date.now() - normalized.aquarium.lastClaimedAt) / 3600000);
  const hourly = normalized.aquarium.exhibits.reduce((sum, item) => {
    const gradeBonus: Record<string, number> = {
      rare: 30,
      epic: 90,
      legend: 240,
      mythic: 650,
      transcend: 1400,
    };

    return sum + Math.max(15, Math.floor(item.baseValue * 0.012)) + (gradeBonus[item.grade] || 10);
  }, 0);
  const claimable = Math.floor(hourly * Math.min(24, elapsedHours));

  return { hourly, claimable, elapsedHours };
}

export function claimAquariumIncome(save: SaveData): SaveMutationResult {
  const normalized = normalizeSave(save);
  const income = getAquariumIncome(normalized);

  if (income.claimable <= 0) return { ok: false, save: normalized, message: "아직 수령할 수익이 없습니다." };

  const next = normalizeSave({
    ...normalized,
    gold: normalized.gold + income.claimable,
    aquarium: {
      ...normalized.aquarium,
      lastClaimedAt: Date.now(),
      totalIncome: normalized.aquarium.totalIncome + income.claimable,
    },
  });

  return { ok: true, save: next, message: `수족관 수익 ${income.claimable.toLocaleString()}G 수령!` };
}
