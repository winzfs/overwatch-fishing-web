export type EquipmentCategory =
  | "rod"
  | "reel"
  | "hook"
  | "bait"
  | "engine"
  | "cargo"
  | "fuelTank"
  | "lantern";

export type ItemGrade = "starter" | "common" | "rare" | "epic" | "legend" | "mythic";

export type ItemStats = Partial<{
  catchPower: number;
  lineControl: number;
  rareBonus: number;
  valueBonus: number;
  speed: number;
  cargoKg: number;
  fuel: number;
  deepSeaAccess: boolean;
  freshnessBonus: number;
}>;

export type FishingEquipmentItem = {
  id: string;
  category: EquipmentCategory;
  name: string;
  icon: string;
  grade: ItemGrade;
  price: number;
  description: string;
  stats: ItemStats;
  nextId?: string;
  upgradeCost?: number;
};

export const CATEGORY_INFO: Record<EquipmentCategory, { name: string; icon: string; desc: string }> = {
  rod: { name: "낚싯대", icon: "🎣", desc: "입질 판정과 대형어 제압력을 올립니다." },
  reel: { name: "릴", icon: "🧵", desc: "줄 장력을 안정화해 전투 시간을 벌어줍니다." },
  hook: { name: "바늘", icon: "🪝", desc: "희귀 어종이 도망갈 확률을 낮춥니다." },
  bait: { name: "미끼", icon: "🪱", desc: "희귀도와 판매 가치에 보너스를 줍니다." },
  engine: { name: "엔진", icon: "🚤", desc: "항해 속도와 먼 해역 진입을 지원합니다." },
  cargo: { name: "적재함", icon: "🎒", desc: "가방 최대 무게를 늘립니다." },
  fuelTank: { name: "연료탱크", icon: "⛽", desc: "출항 가능한 연료량을 늘립니다." },
  lantern: { name: "심해등", icon: "🏮", desc: "심해 탐사와 신선도 유지에 도움을 줍니다." },
};

export const ITEM_GRADE_INFO: Record<ItemGrade, { name: string; color: string }> = {
  starter: { name: "기본", color: "text-slate-200" },
  common: { name: "일반", color: "text-emerald-200" },
  rare: { name: "희귀", color: "text-sky-200" },
  epic: { name: "영웅", color: "text-violet-200" },
  legend: { name: "전설", color: "text-amber-200" },
  mythic: { name: "신화", color: "text-fuchsia-200" },
};

export const FISHING_ITEMS: FishingEquipmentItem[] = [
  {
    id: "rod_old",
    category: "rod",
    name: "낡은 낚싯대",
    icon: "🎣",
    grade: "starter",
    price: 0,
    description: "처음 지급되는 기본 낚싯대입니다.",
    stats: { catchPower: 1 },
    nextId: "rod_carbon",
    upgradeCost: 1800,
  },
  {
    id: "rod_carbon",
    category: "rod",
    name: "카본 낚싯대",
    icon: "🎣",
    grade: "rare",
    price: 4200,
    description: "가볍고 탄성이 좋아 대형어를 상대하기 쉽습니다.",
    stats: { catchPower: 5, lineControl: 2 },
    nextId: "rod_abyss",
    upgradeCost: 9800,
  },
  {
    id: "rod_abyss",
    category: "rod",
    name: "심연 낚싯대",
    icon: "🪄",
    grade: "legend",
    price: 18000,
    description: "전설급 실루엣을 끌어올릴 수 있는 고성능 장비입니다.",
    stats: { catchPower: 12, lineControl: 5, rareBonus: 2 },
  },
  {
    id: "reel_basic",
    category: "reel",
    name: "기본 릴",
    icon: "🧵",
    grade: "starter",
    price: 0,
    description: "기본 릴입니다.",
    stats: { lineControl: 1 },
    nextId: "reel_hydraulic",
    upgradeCost: 1600,
  },
  {
    id: "reel_hydraulic",
    category: "reel",
    name: "유압 릴",
    icon: "⚙️",
    grade: "rare",
    price: 3800,
    description: "줄 장력 제어력이 크게 오릅니다.",
    stats: { lineControl: 5, catchPower: 2 },
    nextId: "reel_titan",
    upgradeCost: 8600,
  },
  {
    id: "reel_titan",
    category: "reel",
    name: "타이탄 릴",
    icon: "🛞",
    grade: "epic",
    price: 14000,
    description: "레이드급 어종을 상대하기 위한 릴입니다.",
    stats: { lineControl: 10, catchPower: 5 },
  },
  {
    id: "hook_basic",
    category: "hook",
    name: "기본 바늘",
    icon: "🪝",
    grade: "starter",
    price: 0,
    description: "평범한 바늘입니다.",
    stats: {},
    nextId: "hook_barbed",
    upgradeCost: 1400,
  },
  {
    id: "hook_barbed",
    category: "hook",
    name: "미늘 바늘",
    icon: "🪝",
    grade: "common",
    price: 3000,
    description: "놓치는 어획물을 줄여줍니다.",
    stats: { catchPower: 2, rareBonus: 1 },
    nextId: "hook_dragon",
    upgradeCost: 7800,
  },
  {
    id: "hook_dragon",
    category: "hook",
    name: "용비늘 바늘",
    icon: "🐉",
    grade: "epic",
    price: 12500,
    description: "희귀 이상 어종을 붙잡는 힘이 강합니다.",
    stats: { catchPower: 6, rareBonus: 3 },
  },
  {
    id: "bait_worm",
    category: "bait",
    name: "갯지렁이 통",
    icon: "🪱",
    grade: "starter",
    price: 0,
    description: "기본 미끼입니다.",
    stats: {},
    nextId: "bait_glow",
    upgradeCost: 1200,
  },
  {
    id: "bait_glow",
    category: "bait",
    name: "발광 미끼",
    icon: "✨",
    grade: "rare",
    price: 3500,
    description: "어두운 해역에서 희귀 어종을 유인합니다.",
    stats: { rareBonus: 2, valueBonus: 0.05 },
    nextId: "bait_legend",
    upgradeCost: 9000,
  },
  {
    id: "bait_legend",
    category: "bait",
    name: "전설의 미끼",
    icon: "🌟",
    grade: "legend",
    price: 16000,
    description: "전설 실루엣이 반응하는 특제 미끼입니다.",
    stats: { rareBonus: 5, valueBonus: 0.12 },
  },
  {
    id: "engine_wood",
    category: "engine",
    name: "소형 엔진",
    icon: "🚤",
    grade: "starter",
    price: 0,
    description: "근해 출항용 기본 엔진입니다.",
    stats: { speed: 1 },
    nextId: "engine_turbo",
    upgradeCost: 2600,
  },
  {
    id: "engine_turbo",
    category: "engine",
    name: "터보 엔진",
    icon: "🚀",
    grade: "rare",
    price: 6000,
    description: "더 먼 바다로 빠르게 이동합니다.",
    stats: { speed: 6, fuel: 10 },
    nextId: "engine_warp",
    upgradeCost: 14000,
  },
  {
    id: "engine_warp",
    category: "engine",
    name: "워프 엔진",
    icon: "🛸",
    grade: "mythic",
    price: 30000,
    description: "심해와 특수 해역 진입에 최적화된 엔진입니다.",
    stats: { speed: 14, fuel: 35, deepSeaAccess: true },
  },
  {
    id: "cargo_crate",
    category: "cargo",
    name: "나무 적재함",
    icon: "📦",
    grade: "starter",
    price: 0,
    description: "기본 적재함입니다.",
    stats: { cargoKg: 0 },
    nextId: "cargo_cold",
    upgradeCost: 2200,
  },
  {
    id: "cargo_cold",
    category: "cargo",
    name: "냉장 적재함",
    icon: "🧊",
    grade: "rare",
    price: 5200,
    description: "더 많이 싣고 신선도를 오래 유지합니다.",
    stats: { cargoKg: 50, freshnessBonus: 1 },
    nextId: "cargo_container",
    upgradeCost: 13000,
  },
  {
    id: "cargo_container",
    category: "cargo",
    name: "선단 컨테이너",
    icon: "🚢",
    grade: "epic",
    price: 22000,
    description: "대형 원정용 적재 컨테이너입니다.",
    stats: { cargoKg: 140, freshnessBonus: 2 },
  },
  {
    id: "fuel_tin",
    category: "fuelTank",
    name: "보조 연료통",
    icon: "⛽",
    grade: "starter",
    price: 0,
    description: "기본 연료 보급 장치입니다.",
    stats: { fuel: 0 },
    nextId: "fuel_large",
    upgradeCost: 2000,
  },
  {
    id: "fuel_large",
    category: "fuelTank",
    name: "대형 연료탱크",
    icon: "🛢️",
    grade: "rare",
    price: 5000,
    description: "장거리 항해를 가능하게 합니다.",
    stats: { fuel: 45 },
    nextId: "fuel_fusion",
    upgradeCost: 15000,
  },
  {
    id: "fuel_fusion",
    category: "fuelTank",
    name: "융합 연료탱크",
    icon: "⚛️",
    grade: "legend",
    price: 28000,
    description: "길드 원정급 항해를 위한 연료 시스템입니다.",
    stats: { fuel: 120, speed: 3 },
  },
  {
    id: "lantern_basic",
    category: "lantern",
    name: "방수 랜턴",
    icon: "🏮",
    grade: "starter",
    price: 0,
    description: "야간 항해용 기본 랜턴입니다.",
    stats: {},
    nextId: "lantern_deep",
    upgradeCost: 2400,
  },
  {
    id: "lantern_deep",
    category: "lantern",
    name: "심해등",
    icon: "💡",
    grade: "epic",
    price: 8500,
    description: "심해 탐사와 희귀 실루엣 탐지에 도움을 줍니다.",
    stats: { rareBonus: 2, deepSeaAccess: true, freshnessBonus: 1 },
    nextId: "lantern_aurora",
    upgradeCost: 17000,
  },
  {
    id: "lantern_aurora",
    category: "lantern",
    name: "오로라 심해등",
    icon: "🌌",
    grade: "mythic",
    price: 36000,
    description: "심해 레이드에서 길을 밝히는 신화 장비입니다.",
    stats: { rareBonus: 5, deepSeaAccess: true, freshnessBonus: 3 },
  },
];

export const DEFAULT_EQUIPMENT: Record<EquipmentCategory, string> = {
  rod: "rod_old",
  reel: "reel_basic",
  hook: "hook_basic",
  bait: "bait_worm",
  engine: "engine_wood",
  cargo: "cargo_crate",
  fuelTank: "fuel_tin",
  lantern: "lantern_basic",
};

export const DEFAULT_OWNED_ITEM_IDS = Object.values(DEFAULT_EQUIPMENT);

export const FISHING_ITEM_BY_ID = Object.fromEntries(
  FISHING_ITEMS.map((item) => [item.id, item])
) as Record<string, FishingEquipmentItem>;

export function getItemsByCategory(category: EquipmentCategory) {
  return FISHING_ITEMS.filter((item) => item.category === category);
}

export function formatItemStat(key: keyof ItemStats, value: number | boolean) {
  if (typeof value === "boolean") return value ? "심해 진입 가능" : "";

  const labels: Record<keyof ItemStats, string> = {
    catchPower: "제압력",
    lineControl: "줄 제어",
    rareBonus: "희귀 보너스",
    valueBonus: "판매 보너스",
    speed: "항해 속도",
    cargoKg: "적재량",
    fuel: "연료",
    deepSeaAccess: "심해 진입",
    freshnessBonus: "신선도 보존",
  };

  if (key === "valueBonus") return `${labels[key]} +${Math.round(value * 100)}%`;
  if (key === "cargoKg") return `${labels[key]} +${value}kg`;
  if (key === "fuel") return `${labels[key]} +${value}`;
  return `${labels[key]} +${value}`;
}
