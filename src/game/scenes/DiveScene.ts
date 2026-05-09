import type { GameContext, GameScene } from "../core/types";
import { Diver } from "../entities/Diver";
import type { Fish } from "../entities/Fish";
import { Particle } from "../entities/Particle";
import { regions, type RegionDefinition, type RegionId } from "../data/regions";
import { FishSpawnSystem } from "../systems/FishSpawnSystem";
import { CombatSystem } from "../systems/CombatSystem";
import { RenderSystem } from "../systems/RenderSystem";

export class DiveScene implements GameScene {
  id = "dive" as const;
  private diver = new Diver();
  private fish: Fish[] = [];
  private particles: Particle[] = [];
  private spawner = new FishSpawnSystem();
  private combat = new CombatSystem();
  private renderSystem = new RenderSystem();
  private region: RegionDefinition = regions[1];
  private toast = "잠수 시작. 산소, 압력, 포식자를 관리하세요.";

  enter(ctx: GameContext, payload?: unknown) {
    const regionId = (payload as { regionId?: RegionId } | undefined)?.regionId || "reef";
    this.region = regions.find((item) => item.id === regionId) || regions[1];
    this.diver.reset(ctx.save.stats().oxygen || 100);
    this.fish = this.spawner.spawn(this.region, ctx.time, ctx.weather);
    this.particles = [];
    ctx.camera.set(0, 0);
    this.say(ctx, `${this.region.name} 잠수 시작. 산소/압력/포식자를 조심하세요.`);
  }

  update(ctx: GameContext, dt: number) {
    this.diver.update(ctx.input.axis(), this.region.depthRange[0], dt);
    ctx.camera.follow(this.diver.position, ctx.width * 0.76, ctx.height, 0.2);
    ctx.camera.position.x = Math.max(0, Math.min(ctx.camera.position.x, 360));
    ctx.camera.position.y = 0;
    ctx.camera.update(dt);
    this.combat.update(dt);
    if (ctx.input.consumeFire()) {
      const result = this.combat.fire(this.diver, this.fish, ctx.save, this.particles);
      if (result.caught) this.fish = this.fish.filter((entity) => entity !== result.caught);
      if (result.message) this.say(ctx, result.message);
      ctx.camera.addShake(result.caught?.species.danger ? 8 : 3);
    }
    this.fish.forEach((entity) => entity.update(this.diver.position, this.combat.bloodScent, performance.now(), dt));
    const hit = this.combat.checkHit(this.diver, this.fish);
    if (hit) {
      this.say(ctx, hit);
      ctx.camera.addShake(11);
    }
    this.particles.forEach((particle) => particle.update(dt));
    this.particles = this.particles.filter((particle) => particle.life > 0);
    if (ctx.input.consumeAction("escape")) ctx.scenes.change("ocean");
    if (this.diver.oxygen <= 0 || this.diver.pressure > ctx.save.stats().pressure + 34) this.emergencyReturn(ctx);
  }

  render(ctx: GameContext) {
    const c = ctx.ctx;
    ctx.camera.begin(c);
    const g = c.createLinearGradient(0, 0, 0, ctx.height);
    g.addColorStop(0, "#0e7490");
    g.addColorStop(0.55, "#0f3150");
    g.addColorStop(1, this.region.id === "abyss" ? "#020617" : "#071827");
    c.fillStyle = g;
    c.fillRect(ctx.camera.position.x, 0, ctx.width, ctx.height);
    for (let i = 0; i < 34; i += 1) {
      c.fillStyle = `rgba(125,211,252,${0.06 + Math.sin(performance.now() / 500 + i) * 0.04})`;
      c.fillRect(i * 44 + Math.sin(performance.now() / 800 + i) * 20, 0, 12, ctx.height);
    }
    c.fillStyle = this.region.id === "wreck" ? "#334155" : "#164e63";
    c.fillRect(0, 500, 1400, 60);
    if (this.region.id === "wreck") ctx.assets.drawSprite(c, "ocean.wreck", 730, 390, { width: 180, height: 108 });
    this.fish.forEach((entity) => {
      ctx.assets.drawSprite(c, entity.assetId, entity.position.x, entity.position.y, { flipX: entity.velocity.x < 0 });
      if (entity.alert > 0) this.renderSystem.text(c, "!", entity.position.x, entity.position.y - 24, 22, "#facc15", "center");
    });
    this.particles.forEach((particle) => {
      c.globalAlpha = Math.max(0, Math.min(1, particle.life));
      if (particle.assetId === "effect.bubble") ctx.assets.drawSprite(c, particle.assetId, particle.x, particle.y, { width: particle.size * 4, height: particle.size * 4 });
      else {
        c.fillStyle = particle.color;
        c.fillRect(particle.x, particle.y, particle.size, particle.size);
      }
      c.globalAlpha = 1;
    });
    ctx.assets.drawSprite(c, this.diver.assetId, this.diver.position.x, this.diver.position.y, { alpha: this.diver.invulnerable > 0 ? 0.65 : 1 });
    c.fillStyle = "rgba(14,165,233,.16)";
    c.beginPath();
    c.arc(this.diver.position.x, this.diver.position.y, 52 + Math.sin(performance.now() / 200) * 3, 0, Math.PI * 2);
    c.fill();
    ctx.camera.end(c);
    if (this.diver.oxygen < 28) {
      c.fillStyle = `rgba(239,68,68,${0.18 + Math.sin(performance.now() / 90) * 0.08})`;
      c.fillRect(0, 0, ctx.width, ctx.height);
    }
    this.renderSystem.drawHud(ctx, "잠수 액션", this.toast, (hud) => this.renderSystem.oxygen(hud, this.diver.oxygen, ctx.save.stats().oxygen || 100, this.diver.pressure));
  }

  private emergencyReturn(ctx: GameContext) {
    const penalty = Math.min(900, Math.max(100, ctx.save.data.cargo.length * 120));
    ctx.save.data.gold = Math.max(0, ctx.save.data.gold - penalty);
    ctx.save.data.cargo = ctx.save.data.cargo.slice(0, Math.ceil(ctx.save.data.cargo.length / 2));
    ctx.save.persist();
    this.say(ctx, `긴급 부상! 일부 화물을 잃고 ${penalty}G 수리비가 발생했습니다.`);
    ctx.scenes.change("harbor");
  }

  private say(ctx: GameContext, message: string) {
    this.toast = message;
    ctx.setToast(message);
  }
}
