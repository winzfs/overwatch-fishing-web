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
    const now = performance.now();
    const g = c.createLinearGradient(0, 0, 0, ctx.height);
    g.addColorStop(0, ctx.weather.weather === "storm" ? "#123044" : "#0d8fb3");
    g.addColorStop(0.52, "#075985");
    g.addColorStop(1, "#082f49");
    c.fillStyle = g;
    c.fillRect(0, 0, ctx.width, ctx.height);
    ctx.camera.begin(c);
    const viewX = ctx.camera.position.x - 80;
    const viewY = ctx.camera.position.y - 80;
    ctx.assets.drawTiled(c, "water.ocean", viewX, viewY, ctx.width + 160, ctx.height + 160, { offsetX: ctx.camera.position.x * 0.18, offsetY: ctx.camera.position.y * 0.18, tileSize: 100, alpha: 0.92 });
    ctx.assets.drawTiled(c, "wave.1", viewX, viewY, ctx.width + 160, ctx.height + 160, { offsetX: ctx.camera.position.x * 0.35 + now * 0.018, offsetY: ctx.camera.position.y * 0.22, tileSize: 256, alpha: 0.16 });
    ctx.assets.drawTiled(c, "wave.2", viewX, viewY, ctx.width + 160, ctx.height + 160, { offsetX: ctx.camera.position.x * 0.12 - now * 0.012, offsetY: ctx.camera.position.y * 0.28 + now * 0.01, tileSize: 256, alpha: 0.12 });
    ctx.assets.drawTiled(c, "wave.3", viewX, viewY, ctx.width + 160, ctx.height + 160, { offsetX: ctx.camera.position.x * 0.2 + now * 0.006, offsetY: ctx.camera.position.y * 0.2 - now * 0.016, tileSize: 256, alpha: 0.1 });
    regions.filter((region) => region.id !== "harbor").forEach((region) => {
      const active = region.id === this.currentRegion.id;
      ctx.assets.drawTiled(c, region.id === "reef" || region.id === "kelp" ? "water.shallow" : "water.ocean", region.bounds.x, region.bounds.y, region.bounds.w, region.bounds.h, { offsetX: now * 0.01, offsetY: -now * 0.008, tileSize: 100, alpha: active ? 0.55 : 0.25 });
      ctx.assets.drawSprite(c, region.assetId, region.bounds.x + 58, region.bounds.y + 58, { width: region.id === "wreck" ? 185 : 150, height: region.id === "wreck" ? 135 : 100, alpha: active ? 0.96 : 0.72 });
      this.renderSystem.text(c, `${region.name}  DANGER ${region.danger}`, region.bounds.x + 18, region.bounds.y + 28, 16, active ? "#fde68a" : "#e0f2fe");
    });
    [
      { x: -820, y: -760, id: "ocean.island" },
      { x: 920, y: -930, id: "ocean.island.sandbar" },
      { x: -260, y: -1510, id: "ocean.island.rocky" },
    ].forEach((island) => ctx.assets.drawSprite(c, island.id, island.x, island.y, { center: true }));
    ctx.assets.drawSprite(c, this.boat.assetId, this.boat.position.x, this.boat.position.y, { rotation: this.boat.angle + Math.PI / 2 });
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
