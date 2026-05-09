import type { Vector2 } from "../core/types";
import { clamp } from "../core/Collision";

export class Boat {
  assetId = "boat.player";
  position: Vector2 = { x: 820, y: 420 };
  velocity: Vector2 = { x: 0, y: 0 };
  angle = -1.72;
  boost = 100;

  reset() {
    this.position = { x: 820, y: 420 };
    this.velocity = { x: 0, y: 0 };
    this.angle = -1.72;
    this.boost = 100;
  }

  update(axis: Vector2, boosting: boolean, speedMultiplier: number, dt: number) {
    this.angle += axis.x * dt * 2.5;
    const throttle = axis.y < 0 ? -axis.y : axis.y * -0.6;
    const isBoosting = boosting && this.boost > 0 && throttle > 0;
    const power = (isBoosting ? 210 : 130) * speedMultiplier;
    this.velocity.x += Math.cos(this.angle) * throttle * power * dt;
    this.velocity.y += Math.sin(this.angle) * throttle * power * dt;
    this.velocity.x *= 0.985;
    this.velocity.y *= 0.985;
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.boost = clamp(this.boost + (isBoosting ? -28 : 16) * dt, 0, 100);
  }
}
