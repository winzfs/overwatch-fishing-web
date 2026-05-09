import type { GameContext, GameScene } from "../core/types";
import { Boat } from "../entities/Boat";
import { pointInRect } from "../core/Collision";
import { regions, type RegionDefinition } from "../data/regions";
import { oceanEvents } from "../data/quests";
import { RenderSystem } from "../systems/RenderSystem";

export class OceanScene implements GameScene {
  id = "ocean" as const;
  private boat = new Boat();
  private renderSystem = new RenderSystem();
  private currentRegion: RegionDefinition = regions[1];
  private toast = "외해 필드: WASD 조타 · Shift 부스트 · Space 잠수 · H 항구";

  enter(ctx: GameContext, payload?: unknown) {
    if ((payload as { fromHarbor?: boolean } | undefined)?.fromHarbor) this.boat.reset();
    const event = oceanEvents[ctx.time.day % oceanEvents.length];
    this.toast = `출항! 랜덤 해상 이벤트: ${event.title} — ${event.desc}`;
    ctx.setToast(this.toast);
  }

  update(ctx: GameContext, dt: number) {
    const previousClock = ctx.time.clock;
    ctx.time.update(dt, 0.045);
    ctx.weather.update(ctx.time.clock, previousClock);
    this.boat.update(ctx.input.axis(), ctx.input.down("shift"), ctx.save.stats().speed, dt);
    this.currentRegion = regions.find((region) => pointInRect(this.boat.position, region.bounds)) || regions[1];
    ctx.camera.follow(this.boat.position, ctx.width, ctx.height, 0.16);
    ctx.camera.update(dt);
    ctx.save.data.day = ctx.time.day;
    ctx.save.data.clock = ctx.time.clock;
    ctx.save.data.weather = ctx.weather.weather;
    if (ctx.input.consumeAction("h")) ctx.scenes.change("harbor");
    if (ctx.input.consumeFire()) {
      if (this.currentRegion.id !== "harbor" && ctx.save.data.metaDepth >= this.currentRegion.unlock) ctx.scenes.change("dive", { regionId: this.currentRegion.id });
      else this.say(ctx, `${this.currentRegion.name}은(는) 장비 단계 ${this.currentRegion.unlock} 필요.`);
    }
  }

  render(ctx: GameContext) {
    const c = ctx.ctx;
    const g = c.createLinearGradient(0, 0, 0, ctx.height);
    g.addColorStop(0, ctx.weather.weather === "storm" ? "#123044" : "#0e7490");
    g.addColorStop(1, "#082f49");
    c.fillStyle = g;
    c.fillRect(0, 0, ctx.width, ctx.height);
    ctx.camera.begin(c);
    for (let i = 0; i < 160; i += 1) {
      c.fillStyle = "rgba(186,230,253,.16)";
      c.fillRect(-1300 + i * 30 + Math.sin(performance.now() / 700 + i) * 12, -2100 + ((i * 53 + performance.now() / 22) % 2500), 18, 2);
    }
    regions.filter((region) => region.id !== "harbor").forEach((region) => {
      c.fillStyle = region.id === this.currentRegion.id ? "rgba(250,204,21,.20)" : "rgba(15,23,42,.28)";
      c.fillRect(region.bounds.x, region.bounds.y, region.bounds.w, region.bounds.h);
      ctx.assets.drawSprite(c, region.assetId, region.bounds.x + 32, region.bounds.y + 44);
      this.renderSystem.text(c, `${region.name}  DANGER ${region.danger}`, region.bounds.x + 18, region.bounds.y + 28, 16, "#e0f2fe");
    });
    [{ x: -820, y: -760 }, { x: 920, y: -930 }, { x: -260, y: -1510 }].forEach((island) => ctx.assets.drawSprite(c, "ocean.island", island.x, island.y, { center: true }));
    ctx.assets.drawSprite(c, this.boat.assetId, this.boat.position.x, this.boat.position.y, { rotation: this.boat.angle });
    ctx.camera.end(c);
    this.drawWeatherOverlay(ctx);
    this.renderSystem.drawHud(ctx, "바다 탐험", this.toast, (hud) => {
      this.renderSystem.panel(hud, 620, 14, 318, 72);
      this.renderSystem.text(hud, `현재 해역: ${this.currentRegion.name}`, 636, 42, 14, "#e0f2fe");
      this.renderSystem.text(hud, `부스트 ${Math.round(this.boat.boost)}%  Space 잠수`, 636, 68, 14, "#fde68a");
    });
  }

  private drawWeatherOverlay(ctx: GameContext) {
    const c = ctx.ctx;
    if (ctx.weather.weather === "fog") {
      c.fillStyle = "rgba(226,232,240,.18)";
      c.fillRect(0, 0, ctx.width, ctx.height);
    }
    if (ctx.weather.weather === "rain" || ctx.weather.weather === "storm") {
      c.strokeStyle = ctx.weather.weather === "storm" ? "rgba(191,219,254,.55)" : "rgba(191,219,254,.34)";
      for (let i = 0; i < 80; i += 1) {
        const x = (i * 37 + performance.now() / 4) % ctx.width;
        const y = (i * 79 + performance.now() / 2) % ctx.height;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 9, y + 18);
        c.stroke();
      }
    }
  }

  private say(ctx: GameContext, message: string) {
    this.toast = message;
    ctx.setToast(message);
  }
}
