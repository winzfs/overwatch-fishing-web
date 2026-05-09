import type { Vector2 } from "../core/types";
import { clamp } from "../core/Collision";

export class Diver {
  assetId = "player.diver";
  position: Vector2 = { x: 120, y: 160 };
  velocity: Vector2 = { x: 0, y: 0 };
  oxygen = 100;
  pressure = 0;
  invulnerable = 0;

  reset(oxygen: number) {
    this.position = { x: 110, y: 130 };
    this.velocity = { x: 0, y: 0 };
    this.oxygen = oxygen;
    this.pressure = 0;
    this.invulnerable = 0;
  }

  update(axis: Vector2, baseDepth: number, dt: number) {
    this.velocity.x += axis.x * 260 * dt;
    this.velocity.y += (axis.y * 220 + 24) * dt;
    this.velocity.x *= 0.9;
    this.velocity.y *= 0.9;
    this.position.x = clamp(this.position.x + this.velocity.x * dt, 30, 1280);
    this.position.y = clamp(this.position.y + this.velocity.y * dt, 42, 500);
    this.oxygen -= dt * (1.1 + Math.max(0, this.position.y - 240) / 360);
    this.pressure = baseDepth + this.position.y * 0.18;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }
}
