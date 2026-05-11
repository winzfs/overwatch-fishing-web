import { describe, expect, it } from "vitest";
import { DAILY_EVENTS, getDailySeaEvent, hashString } from "../../lib/events/daily";

describe("hashString", () => {
  it("returns 0 for empty string", () => {
    expect(hashString("")).toBe(0);
  });

  it("returns deterministic positive hashes", () => {
    expect(hashString("foo")).toBe(hashString("foo"));
    expect(hashString("a")).not.toBe(hashString("b"));
    expect(hashString("test")).toBeGreaterThanOrEqual(0);
  });
});

describe("getDailySeaEvent", () => {
  const fixed = new Date("2026-05-11T00:00:00Z");

  it("returns a valid event", () => {
    const event = getDailySeaEvent("ilios", fixed);
    expect(DAILY_EVENTS).toContain(event);
  });

  it("is deterministic for same region and date", () => {
    const a = getDailySeaEvent("busan", fixed);
    const b = getDailySeaEvent("busan", fixed);
    expect(a.id).toBe(b.id);
  });

  it("varies across regions", () => {
    const ids = new Set(
      ["ilios", "hanamura", "route66", "busan", "numbani", "antarctica", "horizon", "null_sector"].map(
        (r) => getDailySeaEvent(r, fixed).id
      )
    );
    expect(ids.size).toBeGreaterThan(1);
  });
});
