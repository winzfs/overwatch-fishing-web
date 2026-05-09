import type { TimeWindow } from "../data/fish";

export class TimeSystem {
  day = 1;
  clock = 7.25;

  hydrate(day: number, clock: number) {
    this.day = day;
    this.clock = clock;
  }

  update(dt: number, scale: number) {
    this.clock += dt * scale;
    if (this.clock >= 24) {
      this.clock -= 24;
      this.day += 1;
      return true;
    }
    return false;
  }

  window(): TimeWindow {
    if (this.clock < 6) return "night";
    if (this.clock < 10) return "dawn";
    if (this.clock < 18) return "day";
    if (this.clock < 21) return "dusk";
    return "night";
  }

  label() {
    const h = Math.floor(this.clock) % 24;
    const m = Math.floor((this.clock - Math.floor(this.clock)) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
}
