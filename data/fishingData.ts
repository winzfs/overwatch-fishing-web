// Re-export shim for backward compatibility.
// New code should import from `data/fish` and `data/regions` directly.
export type { Fish, FishGrade } from "../types/fish";
export type { Region } from "../types/region";

export { fishes, gradeInfo, pickFish } from "./fish";
export { regions } from "./regions";
