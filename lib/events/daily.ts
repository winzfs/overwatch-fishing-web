export type DailySeaEvent = {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  goldMultiplier: number;
  expMultiplier: number;
  rareBonus: number;
};

export const DAILY_EVENTS: DailySeaEvent[] = [
  { id: "calm", name: "잔잔한 바다", desc: "안정적인 출항. 기본 보상.", emoji: "🌤️", goldMultiplier: 1, expMultiplier: 1, rareBonus: 0 },
  { id: "gold_tide", name: "황금 물결", desc: "판매 가치가 오르는 날.", emoji: "🌅", goldMultiplier: 1.25, expMultiplier: 1, rareBonus: 0 },
  { id: "school", name: "물고기 떼", desc: "개체 수와 희귀 실루엣 증가.", emoji: "🐟", goldMultiplier: 1, expMultiplier: 1.1, rareBonus: 1 },
  { id: "storm", name: "폭풍 전야", desc: "위험하지만 경험치 증가.", emoji: "⛈️", goldMultiplier: 1, expMultiplier: 1.35, rareBonus: 1 },
  { id: "legend_scent", name: "전설의 기척", desc: "전설 이상 실루엣 증가.", emoji: "✨", goldMultiplier: 1.15, expMultiplier: 1.15, rareBonus: 2 },
];

export function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDailySeaEvent(regionId: string, date: Date = new Date()): DailySeaEvent {
  const key = `${date.toISOString().slice(0, 10)}-${regionId}`;
  return DAILY_EVENTS[hashString(key) % DAILY_EVENTS.length];
}
