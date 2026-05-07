export type FishGrade = "common" | "rare" | "epic" | "legend" | "mythic" | "transcend";

export const regions = [
  { id: "busan", emoji: "🏖️", name: "부산 해변", desc: "디바의 고향 바다" },
  { id: "ilios", emoji: "⛲", name: "일리오스 우물", desc: "맑은 지중해 낚시터" },
  { id: "hanamura", emoji: "🌸", name: "하나무라 정원 연못", desc: "벚꽃 연못 낚시터" },
  { id: "null_sector", emoji: "🌑", name: "널 섹터 심연", desc: "초월체가 숨어 있는 심연" },
];

export const gradeInfo: Record<FishGrade, { name: string; emoji: string; color: string; weight: number; speed: number }> = {
  common: { name: "일반", emoji: "⚪", color: "#d4d4d8", weight: 1000, speed: 5 },
  rare: { name: "희귀", emoji: "🔵", color: "#7dd3fc", weight: 300, speed: 6 },
  epic: { name: "에픽", emoji: "🟣", color: "#c084fc", weight: 80, speed: 7 },
  legend: { name: "전설", emoji: "🟠", color: "#fbbf24", weight: 20, speed: 8 },
  mythic: { name: "신화", emoji: "🔴", color: "#fb7185", weight: 5, speed: 9 },
  transcend: { name: "초월", emoji: "✨", color: "#a5f3fc", weight: 1, speed: 10 },
};

export const fishes = [
  { id: "f001", name: "파치마리 복어", grade: "common" as FishGrade, region: "ilios", price: 100, exp: 8 },
  { id: "f041", name: "루시우 개구리어", grade: "rare" as FishGrade, region: "ilios", price: 400, exp: 20 },
  { id: "f076", name: "라인하르트 방벽 거북어", grade: "epic" as FishGrade, region: "ilios", price: 1500, exp: 50 },

  { id: "f048", name: "키리코 여우 금붕어", grade: "rare" as FishGrade, region: "hanamura", price: 620, exp: 20 },
  { id: "f080", name: "한조 용의 뱀장어", grade: "epic" as FishGrade, region: "hanamura", price: 2500, exp: 50 },
  { id: "f109", name: "한조 쌍룡 황제어", grade: "legend" as FishGrade, region: "hanamura", price: 12000, exp: 120 },

  { id: "f056", name: "디바 메카 새우어", grade: "rare" as FishGrade, region: "busan", price: 650, exp: 20 },
  { id: "f088", name: "디바 네오나 쥐가오리", grade: "epic" as FishGrade, region: "busan", price: 3000, exp: 50 },
  { id: "f134", name: "디바 나노 메카 대고래", grade: "mythic" as FishGrade, region: "busan", price: 70000, exp: 300 },

  { id: "f103", name: "널 섹터 기계 상어", grade: "epic" as FishGrade, region: "null_sector", price: 4500, exp: 50 },
  { id: "f141", name: "옴닉 크라켄 신화", grade: "mythic" as FishGrade, region: "null_sector", price: 85000, exp: 300 },
  { id: "f150", name: "✨ 옴닉 창조주 초월체", grade: "transcend" as FishGrade, region: "null_sector", price: 1000000, exp: 800 },
];

export function pickFish(regionId: string) {
  const pool = fishes.filter((fish) => fish.region === regionId);
  const candidates = pool.length ? pool : fishes.filter((fish) => fish.region === "busan");

  const total = candidates.reduce((sum, fish) => sum + gradeInfo[fish.grade].weight, 0);
  let roll = Math.random() * total;

  for (const fish of candidates) {
    roll -= gradeInfo[fish.grade].weight;
    if (roll <= 0) return fish;
  }

  return candidates[0];
}
