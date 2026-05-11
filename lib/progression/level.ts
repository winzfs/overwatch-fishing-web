export function getPlayerLevel(save: { exp?: number }): number {
  const exp = Math.max(0, save.exp || 0);
  return Math.floor(Math.sqrt(exp / 120)) + 1;
}

export function getNextLevelExp(level: number): number {
  return Math.pow(Math.max(1, level), 2) * 120;
}
