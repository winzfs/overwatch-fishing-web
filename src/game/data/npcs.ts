import type { Rect } from "../core/types";

export type HarborBuildingDefinition = {
  id: "market" | "shop" | "workshop" | "aquarium" | "tavern" | "dock";
  name: string;
  assetId: string;
  body: Rect;
  zone: Rect;
  prompt: string;
};

export const harborBuildings: HarborBuildingDefinition[] = [
  { id: "market", name: "어시장", assetId: "harbor.market", body: { x: 168, y: 172, w: 170, h: 116 }, zone: { x: 150, y: 286, w: 205, h: 52 }, prompt: "판매/납품" },
  { id: "shop", name: "상점", assetId: "harbor.shop", body: { x: 374, y: 148, w: 140, h: 112 }, zone: { x: 360, y: 258, w: 170, h: 50 }, prompt: "소모품 구매" },
  { id: "workshop", name: "공방", assetId: "harbor.workshop", body: { x: 548, y: 146, w: 150, h: 116 }, zone: { x: 532, y: 260, w: 184, h: 54 }, prompt: "장비 제작" },
  { id: "aquarium", name: "수족관", assetId: "harbor.aquarium", body: { x: 730, y: 172, w: 150, h: 102 }, zone: { x: 710, y: 272, w: 190, h: 52 }, prompt: "전시 수익" },
  { id: "tavern", name: "파도 술집", assetId: "harbor.tavern", body: { x: 90, y: 356, w: 178, h: 104 }, zone: { x: 78, y: 326, w: 205, h: 46 }, prompt: "NPC/퀘스트" },
  { id: "dock", name: "선착장", assetId: "harbor.dock", body: { x: 700, y: 398, w: 210, h: 64 }, zone: { x: 690, y: 350, w: 230, h: 58 }, prompt: "출항" },
];

export const npcRoster = [
  { id: "mara", name: "마라", role: "어시장 경매사", assetId: "npc.mara", x: 260, y: 330, affinity: 1 },
  { id: "teo", name: "테오", role: "엔진 장인", assetId: "npc.teo", x: 584, y: 328, affinity: 0 },
  { id: "nari", name: "나리", role: "해양 생태학자", assetId: "npc.nari", x: 782, y: 330, affinity: 2 },
  { id: "old_salt", name: "솔트", role: "밤바다 선장", assetId: "npc.salt", x: 362, y: 424, affinity: 3 },
];
