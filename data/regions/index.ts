import type { Region } from "../../types/region";
import { ilios } from "./ilios";
import { hanamura } from "./hanamura";
import { route66 } from "./route66";
import { busan } from "./busan";
import { numbani } from "./numbani";
import { antarctica } from "./antarctica";
import { horizon } from "./horizon";
import { nullSector } from "./null_sector";

export const regions: Region[] = [
  ilios,
  hanamura,
  route66,
  busan,
  numbani,
  antarctica,
  horizon,
  nullSector,
];

export const regionById: Record<string, Region> = Object.fromEntries(
  regions.map((region) => [region.id, region])
);
