import { defaultLoadout, equipmentDatabase, type EquipmentSlot } from "../data/equipment";
import { questDatabase } from "../data/quests";
import type { WeatherKind } from "../data/fish";

export type CargoItem = { id: string; name: string; value: number; weight: number; rarity: string };
export type GameSaveV2 = {
  version: 2;
  gold: number;
  day: number;
  clock: number;
  weather: WeatherKind;
  metaDepth: number;
  fuel: number;
  collection: Record<string, number>;
  cargo: CargoItem[];
  ownedEquipment: string[];
  loadout: Record<EquipmentSlot, string>;
  npcAffinity: Record<string, number>;
  aquarium: { exhibits: string[]; income: number; lastTick: number };
  quests: { active: string[]; completed: string[] };
};

type LegacySaveV1 = Partial<{ gold: number; exp: number; caught: number; collection: Record<string, number>; upgrades: { engine?: number; rod?: number; radar?: number }; bag: Array<{ fishId: string; name: string; baseValue: number; kg: number; grade: string }> }>;
type PreviousCanvasSave = Partial<GameSaveV2> & { oxygen?: number };

const SAVE_KEY_V2 = "overwatch-fishing-game-v2";
const LEGACY_SAVE_KEY_V1 = "overwatch-fishing-save-v1";

export class SaveSystem {
  data: GameSaveV2 = createDefaultGameSave();

  load() {
    if (typeof window === "undefined") return this.data;
    try {
      const current = window.localStorage.getItem(SAVE_KEY_V2);
      if (current) {
        this.data = normalizeGameSave(JSON.parse(current) as PreviousCanvasSave);
        this.persist();
        return this.data;
      }
      const legacy = window.localStorage.getItem(LEGACY_SAVE_KEY_V1);
      if (legacy) {
        this.data = migrateLegacySave(JSON.parse(legacy) as LegacySaveV1);
        this.persist();
        return this.data;
      }
    } catch {
      this.data = createDefaultGameSave();
    }
    return this.data;
  }

  persist() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SAVE_KEY_V2, JSON.stringify(normalizeGameSave(this.data)));
  }

  stats() {
    return computeLoadoutStats(this.data);
  }
}

export function createDefaultGameSave(): GameSaveV2 {
  return {
    version: 2,
    gold: 1200,
    day: 1,
    clock: 7.25,
    weather: "clear",
    metaDepth: 0,
    fuel: 100,
    collection: {},
    cargo: [],
    ownedEquipment: equipmentDatabase.filter((item) => item.cost === 0).map((item) => item.id),
    loadout: defaultLoadout,
    npcAffinity: { mara: 1, teo: 0, nari: 2, old_salt: 3 },
    aquarium: { exhibits: [], income: 0, lastTick: Date.now() },
    quests: { active: questDatabase.map((quest) => quest.id), completed: [] },
  };
}

export function normalizeGameSave(input: Partial<GameSaveV2> | null | undefined): GameSaveV2 {
  const base = createDefaultGameSave();
  if (!input) return base;
  return {
    ...base,
    ...input,
    version: 2,
    weather: input.weather || base.weather,
    collection: input.collection || base.collection,
    cargo: Array.isArray(input.cargo) ? input.cargo : base.cargo,
    ownedEquipment: input.ownedEquipment?.length ? input.ownedEquipment : base.ownedEquipment,
    loadout: { ...base.loadout, ...(input.loadout || {}) },
    npcAffinity: { ...base.npcAffinity, ...(input.npcAffinity || {}) },
    aquarium: { ...base.aquarium, ...(input.aquarium || {}) },
    quests: { ...base.quests, ...(input.quests || {}) },
  };
}

export function migrateLegacySave(legacy: LegacySaveV1): GameSaveV2 {
  const migrated = createDefaultGameSave();
  migrated.gold = legacy.gold ?? migrated.gold;
  migrated.collection = legacy.collection || migrated.collection;
  migrated.metaDepth = Math.max(legacy.upgrades?.engine || 0, legacy.upgrades?.rod || 0, legacy.upgrades?.radar || 0);
  migrated.cargo = (legacy.bag || []).slice(0, 18).map((item) => ({ id: item.fishId, name: item.name, value: item.baseValue, weight: item.kg, rarity: item.grade }));
  return normalizeGameSave(migrated);
}

export function computeLoadoutStats(save: GameSaveV2) {
  return Object.values(save.loadout)
    .map((id) => equipmentDatabase.find((item) => item.id === id))
    .filter(Boolean)
    .reduce(
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
