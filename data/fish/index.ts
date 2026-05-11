import type { Fish } from "../../types/fish";
import { iliosFish } from "./ilios";
import { hanamuraFish } from "./hanamura";
import { route66Fish } from "./route66";
import { busanFish } from "./busan";
import { numbaniFish } from "./numbani";
import { antarcticaFish } from "./antarctica";
import { horizonFish } from "./horizon";
import { nullSectorFish } from "./null_sector";
import { sunsetReefFish } from "./sunset_reef";
import { stormSeaFish } from "./storm_sea";
import { volcanicRiftFish } from "./volcanic_rift";
import { redTideFish } from "./red_tide";
import { ghostRouteFish } from "./ghost_route";
import { timeRiftFish } from "./time_rift";
import { gradeInfo } from "./grades";

export { gradeInfo } from "./grades";

export const fishes: Fish[] = [
  ...iliosFish,
  ...hanamuraFish,
  ...route66Fish,
  ...busanFish,
  ...numbaniFish,
  ...antarcticaFish,
  ...horizonFish,
  ...nullSectorFish,
  ...sunsetReefFish,
  ...stormSeaFish,
  ...volcanicRiftFish,
  ...redTideFish,
  ...ghostRouteFish,
  ...timeRiftFish,
];

export function pickFish(regionId: string, rng: () => number = Math.random): Fish {
  const pool = fishes.filter((fish) => fish.region === regionId);
  const candidates = pool.length > 0 ? pool : fishes.filter((fish) => fish.region === "busan");
  const total = candidates.reduce((sum, fish) => sum + gradeInfo[fish.grade].weight, 0);

  let roll = rng() * total;

  for (const fish of candidates) {
    roll -= gradeInfo[fish.grade].weight;
    if (roll <= 0) return fish;
  }

  return candidates[0];
}
