import type { WeatherKind } from "../data/fish";
import { weatherCycle } from "../data/regions";

export class WeatherSystem {
  private index = 0;
  weather: WeatherKind = weatherCycle[0];

  update(clock: number, previousClock: number) {
    if (Math.floor(clock / 4) === Math.floor(previousClock / 4)) return false;
    this.index = (this.index + 1) % weatherCycle.length;
    this.weather = weatherCycle[this.index];
    return true;
  }

  hydrate(weather: WeatherKind) {
    const found = weatherCycle.indexOf(weather);
    this.index = found >= 0 ? found : 0;
    this.weather = weatherCycle[this.index];
  }
}
