export class Particle {
  constructor(public x: number, public y: number, public vx: number, public vy: number, public life: number, public color: string, public size: number, public assetId = "effect.bubble") {}

  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }
}
