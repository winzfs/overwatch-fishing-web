import type { Rect } from "../core/types";
import type { WeatherKind } from "./fish";

export type RegionId = "harbor" | "reef" | "kelp" | "wreck" | "abyss";

export type RegionDefinition = {
  id: RegionId;
  name: string;
  assetId: string;
  bounds: Rect;
  temperature: number;
  depthRange: [number, number];
  danger: number;
  unlock: number;
};

export const regions: RegionDefinition[] = [
  { id: "harbor", name: "등대 항구", assetId: "ocean.island", bounds: { x: 0, y: 0, w: 960, h: 540 }, temperature: 22, depthRange: [0, 3], danger: 0, unlock: 0 },
  { id: "reef", name: "초승달 산호초", assetId: "ocean.reef", bounds: { x: -500, y: -900, w: 760, h: 460 }, temperature: 24, depthRange: [5, 55], danger: 1, unlock: 0 },
  { id: "kelp", name: "흔들숲 해역", assetId: "ocean.kelp", bounds: { x: 420, y: -1120, w: 620, h: 520 }, temperature: 18, depthRange: [12, 80], danger: 2, unlock: 1 },
  { id: "wreck", name: "붉은 안개 난파선", assetId: "ocean.wreck", bounds: { x: -1120, y: -1620, w: 720, h: 560 }, temperature: 13, depthRange: [35, 110], danger: 4, unlock: 2 },
  { id: "abyss", name: "검은 등불 심연", assetId: "ocean.abyss", bounds: { x: 700, y: -1960, w: 680, h: 620 }, temperature: 5, depthRange: [85, 160], danger: 7, unlock: 3 },
];

export const weatherCycle: WeatherKind[] = ["clear", "fog", "rain", "storm", "clear", "rain"];
