import { defaultLoadout, equipmentDatabase, type EquipmentSlot } from "../../data/game/equipmentDatabase";

export type GameSave = {
  version: 2;
  gold: number;
  day: number;
  clock: number;
  metaDepth: number;
  fuel: number;
  oxygen: number;
  collection: Record<string, number>;
  cargo: { id: string; name: string; value: number; weight: number; rarity: string }[];
  ownedEquipment: string[];
  loadout: Record<EquipmentSlot, string>;
  npcAffinity: Record<string, number>;
  aquarium: { exhibits: string[]; income: number; lastTick: number };
  quests: { active: string[]; completed: string[] };
};

const SAVE_KEY = "overwatch-fishing-game-v2";

export function createDefaultSave(): GameSave {
  return {
    version: 2,
    gold: 1200,
    day: 1,
    clock: 7.25,
    metaDepth: 0,
    fuel: 100,
    oxygen: 100,
    collection: {},
    cargo: [],
    ownedEquipment: equipmentDatabase.filter((item) => item.cost === 0).map((item) => item.id),
    loadout: defaultLoadout,
    npcAffinity: { mara: 1, teo: 0, nari: 2, old_salt: 3 },
    aquarium: { exhibits: [], income: 0, lastTick: Date.now() },
    quests: { active: ["daily_market", "first_dive", "rare_hunt"], completed: [] },
  };
}

export function normalizeSave(input: Partial<GameSave> | null | undefined): GameSave {
  const base = createDefaultSave();
  if (!input) return base;
  return {
    ...base,
    ...input,
    version: 2,
    collection: input.collection || base.collection,
    cargo: Array.isArray(input.cargo) ? input.cargo : base.cargo,
    ownedEquipment: input.ownedEquipment?.length ? input.ownedEquipment : base.ownedEquipment,
    loadout: { ...base.loadout, ...(input.loadout || {}) },
    npcAffinity: { ...base.npcAffinity, ...(input.npcAffinity || {}) },
    aquarium: { ...base.aquarium, ...(input.aquarium || {}) },
    quests: { ...base.quests, ...(input.quests || {}) },
  };
}

export function loadGameSave(): GameSave {
  if (typeof window === "undefined") return createDefaultSave();
  try {
    return normalizeSave(JSON.parse(window.localStorage.getItem(SAVE_KEY) || "null"));
  } catch {
    return createDefaultSave();
  }
}

export function persistGameSave(save: GameSave) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(normalizeSave(save)));
}

export function computeLoadoutStats(save: GameSave) {
  const equipped = Object.values(save.loadout)
    .map((id) => equipmentDatabase.find((item) => item.id === id))
    .filter(Boolean);

  return equipped.reduce(
    (stats, item) => ({
      oxygen: stats.oxygen + (item?.stats.oxygen || 0),
      pressure: Math.max(stats.pressure, item?.stats.pressure || 0),
      damage: stats.damage + (item?.stats.damage || 0),
      netRadius: stats.netRadius + (item?.stats.netRadius || 0),
      speed: stats.speed * (item?.stats.speed || 1),
      cargo: stats.cargo + (item?.stats.cargo || 0),
      autoRecover: stats.autoRecover + (item?.stats.autoRecover || 0),
    }),
    { oxygen: 0, pressure: 0, damage: 0, netRadius: 12, speed: 1, cargo: 0, autoRecover: 0 },
  );
}
