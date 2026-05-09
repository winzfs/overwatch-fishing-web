import type { FishSpecies } from "../data/fish";
import type { Vector2 } from "../core/types";
import { clamp } from "../core/Collision";

export class Fish {
  readonly assetId = this.species.assetId;
  hp: number;
  alert = 0;
  velocity: Vector2;

  constructor(
    readonly id: string,
    readonly species: FishSpecies,
    public position: Vector2,
    readonly school: number,
  ) {
    this.hp = species.danger > 30 ? 100 : 46;
    this.velocity = { x: (Math.random() - 0.5) * species.speed, y: (Math.random() - 0.5) * species.speed * 0.45 };
  }

  update(target: Vector2, bloodScent: number, now: number, dt: number) {
    const predatorPull = this.species.reactsToBlood && bloodScent > 0 ? 1.8 : 1;
    const passiveTarget = { x: 620 + Math.sin(now / 900 + this.school) * 220, y: 190 + this.school * 48 };
    const destination = this.species.danger > 0 ? target : passiveTarget;
    this.velocity.x += Math.sign(destination.x - this.position.x) * this.species.speed * predatorPull * dt;
    this.velocity.y += Math.sign(destination.y - this.position.y) * this.species.speed * 0.45 * predatorPull * dt;
    this.velocity.x *= 0.985;
    this.velocity.y *= 0.985;
    this.position.x += this.velocity.x * dt;
    this.position.y = clamp(this.position.y + this.velocity.y * dt, 50, 492);
    this.alert = Math.max(0, this.alert - dt);
  }
}
