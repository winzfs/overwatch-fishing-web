import { describe, expect, it } from "vitest";
import { fishes, gradeInfo, pickFish } from "../../data/fish";

describe("fishes catalog", () => {
  it("has at least 30 species", () => {
    expect(fishes.length).toBeGreaterThanOrEqual(30);
  });

  it("every fish references a known grade", () => {
    for (const fish of fishes) {
      expect(gradeInfo[fish.grade]).toBeDefined();
    }
  });

  it("fish ids are unique", () => {
    const ids = new Set(fishes.map((f) => f.id));
    expect(ids.size).toBe(fishes.length);
  });
});

describe("pickFish", () => {
  it("returns a fish from the requested region when available", () => {
    const seeded = pickFish("ilios", () => 0);
    expect(seeded.region).toBe("ilios");
  });

  it("falls back to busan pool for unknown region", () => {
    const result = pickFish("nonexistent_region", () => 0);
    expect(result).toBeDefined();
    expect(result.region).toBe("busan");
  });

  it("rng=0 always picks the first candidate", () => {
    const first = pickFish("ilios", () => 0);
    const again = pickFish("ilios", () => 0);
    expect(first.id).toBe(again.id);
  });
});
