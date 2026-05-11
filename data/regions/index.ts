import type { Region } from "../../types/region";
import { ilios } from "./ilios";
import { hanamura } from "./hanamura";
import { route66 } from "./route66";
import { busan } from "./busan";
import { numbani } from "./numbani";
import { antarctica } from "./antarctica";
import { horizon } from "./horizon";
import { nullSector } from "./null_sector";
import { sunsetReef } from "./sunset_reef";
import { stormSea } from "./storm_sea";
import { volcanicRift } from "./volcanic_rift";
import { redTide } from "./red_tide";
import { ghostRoute } from "./ghost_route";
import { timeRift } from "./time_rift";

export const regions: Region[] = [
  ilios,
  hanamura,
  route66,
  busan,
  numbani,
  antarctica,
  horizon,
  nullSector,
  sunsetReef,
  stormSea,
  volcanicRift,
  redTide,
  ghostRoute,
  timeRift,
];

export const regionById: Record<string, Region> = Object.fromEntries(
  regions.map((region) => [region.id, region])
);
