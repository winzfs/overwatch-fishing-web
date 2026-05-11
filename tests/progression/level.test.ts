import { describe, expect, it } from "vitest";
import { getNextLevelExp, getPlayerLevel } from "../../lib/progression/level";

describe("getPlayerLevel", () => {
  it("returns 1 at 0 exp", () => {
    expect(getPlayerLevel({ exp: 0 })).toBe(1);
  });

  it("returns 1 just below first threshold", () => {
    expect(getPlayerLevel({ exp: 119 })).toBe(1);
  });

  it("returns 2 at first threshold", () => {
    expect(getPlayerLevel({ exp: 120 })).toBe(2);
  });

  it("clamps negative exp to 0", () => {
    expect(getPlayerLevel({ exp: -50 })).toBe(1);
  });

  it("handles missing exp", () => {
    expect(getPlayerLevel({})).toBe(1);
  });

  it("scales with sqrt curve", () => {
    expect(getPlayerLevel({ exp: 120 * 9 })).toBe(4);
    expect(getPlayerLevel({ exp: 120 * 100 })).toBe(11);
  });
});

describe("getNextLevelExp", () => {
  it("returns 120 for level 1", () => {
    expect(getNextLevelExp(1)).toBe(120);
  });

  it("scales quadratically", () => {
    expect(getNextLevelExp(2)).toBe(480);
    expect(getNextLevelExp(5)).toBe(3000);
  });

  it("clamps level below 1", () => {
    expect(getNextLevelExp(0)).toBe(120);
    expect(getNextLevelExp(-3)).toBe(120);
  });
});
