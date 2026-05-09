import type { WeatherKind } from "./fishDatabase";

export type BiomeId = "harbor" | "reef" | "kelp" | "wreck" | "abyss";

export type BiomeDefinition = {
  id: BiomeId;
  name: string;
  bounds: { x: number; y: number; w: number; h: number };
  temperature: number;
  depthRange: [number, number];
  danger: number;
  unlock: number;
};

export const biomes: BiomeDefinition[] = [
  { id: "harbor", name: "등대 항구", bounds: { x: 0, y: 0, w: 960, h: 540 }, temperature: 22, depthRange: [0, 3], danger: 0, unlock: 0 },
  { id: "reef", name: "초승달 산호초", bounds: { x: -500, y: -900, w: 760, h: 460 }, temperature: 24, depthRange: [5, 55], danger: 1, unlock: 0 },
  { id: "kelp", name: "흔들숲 해역", bounds: { x: 420, y: -1120, w: 620, h: 520 }, temperature: 18, depthRange: [12, 80], danger: 2, unlock: 1 },
  { id: "wreck", name: "붉은 안개 난파선", bounds: { x: -1120, y: -1620, w: 720, h: 560 }, temperature: 13, depthRange: [35, 110], danger: 4, unlock: 2 },
  { id: "abyss", name: "검은 등불 심연", bounds: { x: 700, y: -1960, w: 680, h: 620 }, temperature: 5, depthRange: [85, 160], danger: 7, unlock: 3 },
];

export const weatherCycle: WeatherKind[] = ["clear", "fog", "rain", "storm", "clear", "rain"];

export const harborBuildings = [
  { id: "market", name: "어시장", x: 182, y: 188, w: 150, h: 96, prompt: "판매/납품" },
  { id: "workshop", name: "제작소", x: 420, y: 154, w: 150, h: 110, prompt: "장비 제작" },
  { id: "aquarium", name: "수족관", x: 652, y: 178, w: 146, h: 96, prompt: "전시 수익" },
  { id: "tavern", name: "파도 술집", x: 96, y: 344, w: 168, h: 100, prompt: "NPC/퀘스트" },
  { id: "dock", name: "선착장", x: 730, y: 374, w: 180, h: 92, prompt: "출항" },
];

export const npcRoster = [
  { id: "mara", name: "마라", role: "어시장 경매사", x: 258, y: 324, affinity: 1 },
  { id: "teo", name: "테오", role: "엔진 장인", x: 505, y: 318, affinity: 0 },
  { id: "nari", name: "나리", role: "해양 생태학자", x: 660, y: 328, affinity: 2 },
  { id: "old_salt", name: "솔트", role: "밤바다 선장", x: 356, y: 408, affinity: 3 },
];

export const eventTable = [
  { id: "rescue", title: "조난 신호", desc: "안개 속에서 작은 구조 신호가 깜빡입니다.", reward: 900 },
  { id: "rare_bloom", title: "플랑크톤 대발광", desc: "밤 생물과 희귀종이 수면 아래로 모입니다.", reward: 0 },
  { id: "smuggler", title: "수상한 상선", desc: "값싼 연료와 위험한 의뢰를 제안합니다.", reward: 1200 },
];
