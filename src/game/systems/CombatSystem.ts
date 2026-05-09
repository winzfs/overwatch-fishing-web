import { distance } from "../core/Collision";
import type { Diver } from "../entities/Diver";
import type { Fish } from "../entities/Fish";
import { Particle } from "../entities/Particle";
import { rarityColor } from "../data/fish";
import type { SaveSystem } from "./SaveSystem";

export class CombatSystem {
  harpoonCooldown = 0;
  bloodScent = 0;

  update(dt: number) {
    this.harpoonCooldown = Math.max(0, this.harpoonCooldown - dt);
    this.bloodScent = Math.max(0, this.bloodScent - dt);
  }

  fire(diver: Diver, fish: Fish[], save: SaveSystem, particles: Particle[]) {
    if (this.harpoonCooldown > 0) return { caught: undefined as Fish | undefined, message: undefined as string | undefined };
    this.harpoonCooldown = 0.55;
    let target: Fish | undefined;
    let best = 150;
    for (const entity of fish) {
      const d = Math.abs(entity.position.y - diver.position.y) + Math.max(0, entity.position.x - diver.position.x) * 0.45;
      if (entity.position.x > diver.position.x && d < best) {
        target = entity;
        best = d;
      }
    }
    particles.push(new Particle(diver.position.x + 28, diver.position.y + 5, 360, 0, 0.32, "#e0f2fe", 3));
    if (!target) return { caught: undefined, message: undefined };
    const stats = save.stats();
    target.hp -= stats.damage || 22;
    target.alert = 1.2;
    this.bloodScent = 5;
    for (let i = 0; i < 12; i += 1) particles.push(new Particle(target.position.x, target.position.y, (Math.random() - 0.5) * 90, (Math.random() - 0.5) * 90, 0.8, rarityColor[target.species.rarity], 2 + Math.random() * 3));
    if (target.hp > 0) return { caught: undefined, message: `${target.species.name} 명중!` };
    const value = Math.round(target.species.value * (1 + target.species.danger / 100));
    save.data.collection[target.species.id] = (save.data.collection[target.species.id] || 0) + 1;
    save.data.cargo = [...save.data.cargo, { id: target.species.id, name: target.species.name, value, weight: target.species.weight, rarity: target.species.rarity }].slice(-18);
    if (target.species.rarity === "legendary") save.data.aquarium.exhibits = Array.from(new Set([...save.data.aquarium.exhibits, target.species.id]));
    save.persist();
    return { caught: target, message: `${target.species.rarity === "legendary" ? "✨ 희귀 발견! " : ""}${target.species.name} 확보 (+${value}G 가치)` };
  }

  checkHit(diver: Diver, fish: Fish[]) {
    const attacker = fish.find((entity) => entity.species.danger > 0 && distance(entity.position, diver.position) < 28);
    if (!attacker || diver.invulnerable > 0) return undefined;
    diver.oxygen -= attacker.species.danger * 0.45;
    diver.invulnerable = 1;
    return `${attacker.species.name} 공격! 산소가 급감합니다.`;
  }
}
