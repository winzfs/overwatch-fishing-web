import { describe, expect, it } from "vitest";
import {
  getRegionRequiredLevel,
  isRegionUnlocked,
} from "../../lib/progression/region-unlock";

describe("getRegionRequiredLevel", () => {
  it("returns expected unlock levels", () => {
    expect(getRegionRequiredLevel("ilios")).toBe(1);
    expect(getRegionRequiredLevel("hanamura")).toBe(5);
    expect(getRegionRequiredLevel("busan")).toBe(15);
    expect(getRegionRequiredLevel("null_sector")).toBe(35);
  });

  it("defaults to 1 for unknown region", () => {
    expect(getRegionRequiredLevel("unknown")).toBe(1);
  });
});

describe("isRegionUnlocked", () => {
  it("ilios always unlocked", () => {
    expect(isRegionUnlocked("ilios", { exp: 0 })).toBe(true);
  });

  it("null_sector requires level 35", () => {
    expect(isRegionUnlocked("null_sector", { exp: 0 })).toBe(false);
    // level 35 requires exp >= 120 * 34^2 = 138720
    expect(isRegionUnlocked("null_sector", { exp: 138720 })).toBe(true);
  });

  it("hanamura unlocked at level 5", () => {
    expect(isRegionUnlocked("hanamura", { exp: 120 * 15 })).toBe(false);
    expect(isRegionUnlocked("hanamura", { exp: 120 * 16 })).toBe(true);
  });
});
