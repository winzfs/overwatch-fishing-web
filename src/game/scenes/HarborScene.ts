import type { GameContext, GameScene } from "../core/types";
import { Player } from "../entities/Player";
import { Building } from "../entities/Building";
import { NPC } from "../entities/NPC";
import { harborBuildings, npcRoster } from "../data/npcs";
import { PhysicsSystem } from "../systems/PhysicsSystem";
import { InteractionSystem } from "../systems/InteractionSystem";
import { RenderSystem } from "../systems/RenderSystem";

export class HarborScene implements GameScene {
  id = "harbor" as const;
  private player = new Player();
  private buildings = harborBuildings.map((building) => new Building(building));
  private npcs = npcRoster.map((npc) => new NPC(npc.id, npc.name, npc.role, npc.assetId, npc.x, npc.y, npc.affinity));
  private physics = new PhysicsSystem();
  private interactions = new InteractionSystem();
  private renderSystem = new RenderSystem();
  private toast = "항구에서 이동하고 건물 상호작용 존에서 E를 누르세요.";

  enter(ctx: GameContext) {
    ctx.camera.set(0, 0);
    ctx.setToast(this.toast);
  }

  update(ctx: GameContext, dt: number) {
    const previous = { x: this.player.body().x, y: this.player.body().y };
    this.player.update(ctx.input.axis(), dt);
    const resolved = this.physics.resolveSolids(this.player.body(), previous, this.buildings.map((building) => building.body));
    const body = this.player.body();
    this.player.position.x += resolved.x - body.x;
    this.player.position.y += resolved.y - body.y;
    this.npcs.forEach((npc) => npc.update(performance.now()));
    const near = this.interactions.findBuilding(this.player.position, this.buildings);
    this.toast = near ? `E: ${near.name} - ${near.prompt}` : "항구: 어시장 판매 · 공방 업그레이드 · 수족관 수익 · 선착장 출항";
    if (ctx.input.consumeAction("e") && near) this.interact(ctx, near.id);
    ctx.camera.set((this.player.position.x - ctx.width / 2) * 0.08, (this.player.position.y - ctx.height / 2) * 0.06);
    ctx.camera.update(dt);
    ctx.time.update(dt, 0.015);
    ctx.save.data.day = ctx.time.day;
    ctx.save.data.clock = ctx.time.clock;
  }

  render(ctx: GameContext) {
    const c = ctx.ctx;
    const now = performance.now();
    ctx.assets.drawTiled(c, "water.ocean", 0, 0, ctx.width, ctx.height, { offsetX: now * 0.012, offsetY: -now * 0.008, tileSize: 100, alpha: 0.92 });
    ctx.assets.drawTiled(c, "wave.1", 0, 0, ctx.width, 220, { offsetX: now * 0.016, offsetY: now * 0.006, tileSize: 256, alpha: 0.18 });
    ctx.assets.drawTiled(c, "wave.2", 0, 0, ctx.width, 250, { offsetX: -now * 0.01, offsetY: now * 0.012, tileSize: 256, alpha: 0.12 });
    ctx.camera.begin(c);
    ctx.assets.drawSprite(c, "ocean.island.sandbar", 480, 390, { width: 1050, height: 620, center: true });
    ctx.assets.drawTiled(c, "water.shallow", -40, 118, 1040, 140, { offsetX: now * 0.008, offsetY: now * 0.01, tileSize: 100, alpha: 0.28 });
    ctx.assets.drawSprite(c, "harbor.dock", 700, 398, { width: 210, height: 64 });
    ctx.assets.drawSprite(c, "harbor.dock", 740, 338, { width: 160, height: 50, alpha: 0.85 });
    this.buildings.forEach((building) => {
      ctx.assets.drawSprite(c, building.assetId, building.body.x, building.body.y, { width: building.body.w, height: building.body.h });
      this.renderSystem.text(c, building.name, building.body.x + building.body.w / 2, building.body.y - 8, 15, "#f8fafc", "center");
    });
    this.npcs.forEach((npc) => {
      ctx.assets.drawSprite(c, npc.assetId, npc.x, npc.y);
      this.renderSystem.text(c, npc.name, npc.x, npc.y - 42, 11, "#fff", "center");
    });
    ctx.assets.drawSprite(c, this.player.assetId, this.player.position.x, this.player.position.y, { flipX: this.player.facing < 0 });
    ctx.camera.end(c);
    this.renderSystem.drawHud(ctx, "항구 생활", this.toast);
  }

  private interact(ctx: GameContext, id: string) {
    if (id === "market") {
      const total = ctx.save.data.cargo.reduce((sum, item) => sum + item.value, 0);
      if (!total) return this.say(ctx, "판매할 어획물이 없습니다. 먼저 잠수해서 표본을 확보하세요.");
      ctx.save.data.gold += total;
      ctx.save.data.cargo = [];
      ctx.save.persist();
      return this.say(ctx, `어시장 경매 완료: +${total.toLocaleString()}G`);
    }
    if (id === "workshop" || id === "shop") {
      const cost = 1400 + ctx.save.data.metaDepth * 900;
      if (ctx.save.data.gold < cost) return this.say(ctx, `업그레이드 비용 ${cost.toLocaleString()}G가 부족합니다.`);
      ctx.save.data.gold -= cost;
      ctx.save.data.metaDepth += 1;
      ctx.save.persist();
      return this.say(ctx, `장비 정비 완료. 해금 심도 단계 ${ctx.save.data.metaDepth}`);
    }
    if (id === "aquarium") {
      const income = Math.max(120, Object.keys(ctx.save.data.collection).length * 75 + ctx.save.data.aquarium.exhibits.length * 240);
      ctx.save.data.gold += income;
      ctx.save.data.aquarium.income += income;
      ctx.save.data.aquarium.lastTick = Date.now();
      ctx.save.persist();
      return this.say(ctx, `수족관 관람 수익 +${income.toLocaleString()}G`);
    }
    if (id === "tavern") {
      ctx.save.data.npcAffinity.old_salt = (ctx.save.data.npcAffinity.old_salt || 0) + 1;
      ctx.save.data.quests.completed = Array.from(new Set([...ctx.save.data.quests.completed, "harbor_talk"]));
      ctx.save.persist();
      return this.say(ctx, "솔트 선장이 오늘의 밤바다 소문을 알려줬습니다.");
    }
    if (id === "dock") ctx.scenes.change("ocean", { fromHarbor: true });
  }

  private say(ctx: GameContext, message: string) {
    this.toast = message;
    ctx.setToast(message);
  }
}
