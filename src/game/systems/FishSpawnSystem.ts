import { Fish } from "../entities/Fish";
import { fishDatabase } from "../data/fish";
import type { RegionDefinition } from "../data/regions";
import type { TimeSystem } from "./TimeSystem";
import type { WeatherSystem } from "./WeatherSystem";

export class FishSpawnSystem {
  spawn(region: RegionDefinition, time: TimeSystem, weather: WeatherSystem) {
    const pool = fishDatabase.filter((fish) => fish.biome === region.id && fish.time.includes(time.window()) && fish.weather.includes(weather.weather) && region.temperature >= fish.temperature[0] && region.temperature <= fish.temperature[1]);
    const fallback = fishDatabase.filter((fish) => fish.biome === region.id || fish.biome === "reef");
    const source = pool.length ? pool : fallback;
    return Array.from({ length: 12 }, (_, index) => {
      const species = source[index % source.length];
      return new Fish(`${species.id}-${Date.now()}-${index}`, species, { x: 220 + Math.random() * 980, y: 90 + Math.random() * 360 }, index % 4);
    });
  }
}
