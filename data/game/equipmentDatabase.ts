export type EquipmentSlot = "suit" | "oxygen" | "harpoon" | "net" | "engine" | "cargo" | "drone";

export type EquipmentItem = {
  id: string;
  slot: EquipmentSlot;
  name: string;
  rarity: "starter" | "improved" | "advanced" | "prototype";
  cost: number;
  stats: Partial<{
    oxygen: number;
    pressure: number;
    damage: number;
    netRadius: number;
    speed: number;
    cargo: number;
    autoRecover: number;
  }>;
};

export const equipmentDatabase: EquipmentItem[] = [
  { id: "suit_canvas", slot: "suit", name: "캔버스 잠수복", rarity: "starter", cost: 0, stats: { pressure: 70 } },
  { id: "suit_reef", slot: "suit", name: "리프 강화 잠수복", rarity: "improved", cost: 1800, stats: { pressure: 105 } },
  { id: "oxygen_tin", slot: "oxygen", name: "소형 산소통", rarity: "starter", cost: 0, stats: { oxygen: 100 } },
  { id: "oxygen_dual", slot: "oxygen", name: "듀얼 산소통", rarity: "advanced", cost: 2600, stats: { oxygen: 155 } },
  { id: "harpoon_rust", slot: "harpoon", name: "녹슨 작살", rarity: "starter", cost: 0, stats: { damage: 22 } },
  { id: "harpoon_recoil", slot: "harpoon", name: "반동식 작살", rarity: "advanced", cost: 3200, stats: { damage: 42 } },
  { id: "engine_dock", slot: "engine", name: "항구 중고 엔진", rarity: "starter", cost: 0, stats: { speed: 1 } },
  { id: "engine_boost", slot: "engine", name: "부스트 터빈", rarity: "prototype", cost: 5200, stats: { speed: 1.45 } },
  { id: "cargo_crate", slot: "cargo", name: "목재 화물칸", rarity: "starter", cost: 0, stats: { cargo: 18 } },
  { id: "drone_gull", slot: "drone", name: "갈매기 회수 드론", rarity: "prototype", cost: 7000, stats: { autoRecover: 1 } },
];

export const defaultLoadout: Record<EquipmentSlot, string> = {
  suit: "suit_canvas",
  oxygen: "oxygen_tin",
  harpoon: "harpoon_rust",
  net: "harpoon_rust",
  engine: "engine_dock",
  cargo: "cargo_crate",
  drone: "cargo_crate",
};
