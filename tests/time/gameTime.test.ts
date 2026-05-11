import { describe, expect, it } from "vitest";
import { getGameTime, formatGameTime, GAME_DAY_MS } from "../../lib/time/gameTime";

// Each game hour = GAME_DAY_MS / 24 real ms
const HOUR = GAME_DAY_MS / 24;

describe("getGameTime", () => {
  it("starts at latenight (hour 0)", () => {
    const info = getGameTime(0, 0);
    expect(info.period).toBe("latenight");
    expect(info.hour).toBe(0);
    expect(info.isMagicHour).toBe(false);
  });

  it("dawn starts at hour 4", () => {
    const info = getGameTime(0, HOUR * 4);
    expect(info.period).toBe("dawn");
    expect(info.isMagicHour).toBe(true);
    expect(info.spawnMultiplier).toBe(1.3);
  });

  it("morning starts at hour 6", () => {
    const info = getGameTime(0, HOUR * 6);
    expect(info.period).toBe("morning");
  });

  it("noon starts at hour 12", () => {
    const info = getGameTime(0, HOUR * 12);
    expect(info.period).toBe("noon");
    expect(info.spawnMultiplier).toBeLessThan(1);
  });

  it("dusk starts at hour 17", () => {
    const info = getGameTime(0, HOUR * 17);
    expect(info.period).toBe("dusk");
    expect(info.isMagicHour).toBe(true);
    expect(info.spawnMultiplier).toBe(1.3);
  });

  it("night starts at hour 20", () => {
    const info = getGameTime(0, HOUR * 20);
    expect(info.period).toBe("night");
  });

  it("wraps around after full day", () => {
    const info = getGameTime(0, GAME_DAY_MS + HOUR * 6);
    expect(info.period).toBe("morning");
    expect(info.hour).toBe(6);
  });

  it("minute calculation is correct", () => {
    // 6.5 hours = 6h 30m
    const info = getGameTime(0, HOUR * 6.5);
    expect(info.hour).toBe(6);
    expect(info.minute).toBe(30);
  });

  it("only dawn and dusk are magic hour", () => {
    const periods = ["dawn", "morning", "noon", "dusk", "night", "latenight"] as const;
    const magicHours = periods.filter((p) => {
      const h = { dawn: 4, morning: 6, noon: 12, dusk: 17, night: 20, latenight: 0 }[p];
      return getGameTime(0, HOUR * h).isMagicHour;
    });
    expect(magicHours).toEqual(["dawn", "dusk"]);
  });
});

describe("formatGameTime", () => {
  it("pads hours and minutes", () => {
    const info = getGameTime(0, HOUR * 4.5);
    expect(formatGameTime(info)).toBe("04:30");
  });

  it("shows midnight as 00:00", () => {
    const info = getGameTime(0, 0);
    expect(formatGameTime(info)).toBe("00:00");
  });
});
