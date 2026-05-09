export class NPC {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly role: string,
    readonly assetId: string,
    public x: number,
    public y: number,
    public affinity: number,
  ) {}

  update(now: number) {
    this.y += Math.sin(now / 500 + this.affinity) * 0.015;
  }
}
