import type { Vector2 } from "../core/types";
import { clamp } from "../core/Collision";

export class Player {
  assetId = "player.harbor";
  position: Vector2 = { x: 500, y: 360 };
  facing: 1 | -1 = 1;
  speed = 150;

  update(axis: Vector2, dt: number) {
    this.position.x += axis.x * this.speed * dt;
    this.position.y += axis.y * this.speed * dt;
    if (axis.x < 0) this.facing = -1;
    if (axis.x > 0) this.facing = 1;
    this.position.x = clamp(this.position.x, 36, 924);
    this.position.y = clamp(this.position.y, 116, 498);
  }

  body() {
    return { x: this.position.x - 12, y: this.position.y - 34, w: 24, h: 34 };
  }
}
