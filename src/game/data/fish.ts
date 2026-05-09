export type FishRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type TimeWindow = "dawn" | "day" | "dusk" | "night";
export type WeatherKind = "clear" | "fog" | "rain" | "storm";
export type FishBiome = "reef" | "kelp" | "wreck" | "abyss";

export type FishSpecies = {
  id: string;
  name: string;
  assetId: string;
  rarity: FishRarity;
  biome: FishBiome;
  value: number;
  weight: number;
  speed: number;
  danger: number;
  depth: [number, number];
  time: TimeWindow[];
  weather: WeatherKind[];
  temperature: [number, number];
  predatorOf?: string[];
  reactsToBlood?: boolean;
  bossPattern?: "charge" | "spiral" | "ambush";
};

export const fishDatabase: FishSpecies[] = [
  { id: "reef_sardine", name: "푸른 산호 정어리", assetId: "fish.sardine", rarity: "common", biome: "reef", value: 80, weight: 0.4, speed: 42, danger: 0, depth: [2, 28], time: ["dawn", "day", "dusk"], weather: ["clear", "fog", "rain"], temperature: [19, 29] },
  { id: "kelp_snapper", name: "다시마 도미", assetId: "fish.snapper", rarity: "uncommon", biome: "kelp", value: 180, weight: 1.1, speed: 35, danger: 0, depth: [12, 48], time: ["day", "dusk"], weather: ["clear", "rain"], temperature: [16, 25] },
  { id: "wreck_eel", name: "난파선 전기 장어", assetId: "fish.eel", rarity: "rare", biome: "wreck", value: 620, weight: 2.8, speed: 58, danger: 18, depth: [35, 82], time: ["dusk", "night"], weather: ["fog", "rain", "storm"], temperature: [10, 20], reactsToBlood: true },
  { id: "reef_shark", name: "피 냄새 암초상어", assetId: "fish.shark", rarity: "epic", biome: "reef", value: 1450, weight: 42, speed: 74, danger: 36, depth: [18, 70], time: ["dawn", "dusk", "night"], weather: ["clear", "rain", "storm"], temperature: [18, 28], predatorOf: ["reef_sardine", "kelp_snapper"], reactsToBlood: true, bossPattern: "charge" },
  { id: "abyss_lantern", name: "심연 등불고래", assetId: "fish.lantern", rarity: "legendary", biome: "abyss", value: 6200, weight: 120, speed: 28, danger: 52, depth: [85, 150], time: ["night"], weather: ["storm", "fog"], temperature: [2, 9], reactsToBlood: true, bossPattern: "spiral" },
];

export const rarityColor: Record<FishRarity, string> = {
  common: "#94f7ff",
  uncommon: "#87efac",
  rare: "#60a5fa",
  epic: "#c084fc",
  legendary: "#facc15",
};
