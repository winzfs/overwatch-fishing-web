import type { Vector2 } from "./types";

export class Camera {
  position: Vector2 = { x: 0, y: 0 };
  shake = 0;

  follow(target: Vector2, viewportW: number, viewportH: number, lerp = 1) {
    const nextX = target.x - viewportW / 2;
    const nextY = target.y - viewportH / 2;
    this.position.x += (nextX - this.position.x) * lerp;
    this.position.y += (nextY - this.position.y) * lerp;
  }

  set(x: number, y: number) {
    this.position.x = x;
    this.position.y = y;
  }

  addShake(amount: number) {
    this.shake = Math.max(this.shake, amount);
  }

  update(dt: number) {
    this.shake = Math.max(0, this.shake - dt * 12);
  }

  begin(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    ctx.translate(-this.position.x + sx, -this.position.y + sy);
  }

  end(ctx: CanvasRenderingContext2D) {
    ctx.restore();
  }
}
