export type TimePeriod = "dawn" | "morning" | "noon" | "dusk" | "night" | "latenight";

export interface GameTimeInfo {
  period: TimePeriod;
  hour: number;
  minute: number;
  progress: number;
  isMagicHour: boolean;
  spawnMultiplier: number;
  label: string;
  emoji: string;
}

// 1 real minute = 1 game hour  →  1 game day = 24 real minutes
export const GAME_DAY_MS = 24 * 60 * 1000;

// Sky color and darkness per period
export const PERIOD_META: Record<
  TimePeriod,
  { label: string; emoji: string; isMagicHour: boolean; spawnMultiplier: number; skyColor: number; overlayAlpha: number }
> = {
  dawn:      { label: "새벽", emoji: "🌅", isMagicHour: true,  spawnMultiplier: 1.3, skyColor: 0xFF8C42, overlayAlpha: 0.22 },
  morning:   { label: "아침", emoji: "☀️", isMagicHour: false, spawnMultiplier: 1.0, skyColor: 0x87CEEB, overlayAlpha: 0.0  },
  noon:      { label: "정오", emoji: "🌞", isMagicHour: false, spawnMultiplier: 0.85,skyColor: 0x1E90FF, overlayAlpha: 0.0  },
  dusk:      { label: "황혼", emoji: "🌇", isMagicHour: true,  spawnMultiplier: 1.3, skyColor: 0xFF4500, overlayAlpha: 0.18 },
  night:     { label: "밤",   emoji: "🌙", isMagicHour: false, spawnMultiplier: 1.1, skyColor: 0x1a1a4e, overlayAlpha: 0.48 },
  latenight: { label: "심야", emoji: "⭐", isMagicHour: false, spawnMultiplier: 1.2, skyColor: 0x05051a, overlayAlpha: 0.68 },
};

// Game hour ranges: total 24h, stored as [start, end)
const BOUNDARIES: Array<{ period: TimePeriod; start: number; end: number }> = [
  { period: "latenight", start:  0, end:  4 },
  { period: "dawn",      start:  4, end:  6 },
  { period: "morning",   start:  6, end: 12 },
  { period: "noon",      start: 12, end: 17 },
  { period: "dusk",      start: 17, end: 20 },
  { period: "night",     start: 20, end: 24 },
];

export function getGameTime(startMs: number, nowMs: number): GameTimeInfo {
  const elapsed = Math.max(0, nowMs - startMs);
  const dayProgress = (elapsed % GAME_DAY_MS) / GAME_DAY_MS;
  const gameHour = dayProgress * 24;
  const hour = Math.floor(gameHour);
  const minute = Math.floor((gameHour - hour) * 60);

  const entry = BOUNDARIES.find((b) => gameHour >= b.start && gameHour < b.end) ?? BOUNDARIES[0];
  const meta = PERIOD_META[entry.period];

  return {
    period: entry.period,
    hour,
    minute,
    progress: dayProgress,
    isMagicHour: meta.isMagicHour,
    spawnMultiplier: meta.spawnMultiplier,
    label: meta.label,
    emoji: meta.emoji,
  };
}

export function formatGameTime(info: GameTimeInfo): string {
  const h = String(info.hour).padStart(2, "0");
  const m = String(info.minute).padStart(2, "0");
  return `${h}:${m}`;
}
