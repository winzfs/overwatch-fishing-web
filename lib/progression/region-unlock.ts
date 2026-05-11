import { getPlayerLevel } from "./level";

const REGION_LEVEL: Record<string, number> = {
  ilios: 1,
  hanamura: 5,
  route66: 10,
  busan: 15,
  numbani: 20,
  antarctica: 25,
  horizon: 30,
  null_sector: 35,
};

export function getRegionRequiredLevel(regionId: string): number {
  return REGION_LEVEL[regionId] ?? 1;
}

export function isRegionUnlocked(regionId: string, save: { exp?: number }): boolean {
  return getPlayerLevel(save) >= getRegionRequiredLevel(regionId);
}
