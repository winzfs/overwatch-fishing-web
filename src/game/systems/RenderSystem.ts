import type { GameContext } from "../core/types";
import { clamp } from "../core/Collision";

export class RenderSystem {
  clear(ctx: GameContext) {
    ctx.ctx.clearRect(0, 0, ctx.width, ctx.height);
  }

  text(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size = 14, color = "#e2e8f0", align: CanvasTextAlign = "left") {
    ctx.font = `800 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }

  panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = "rgba(2,6,23,.72)") {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255,255,255,.14)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }

  drawHud(game: GameContext, mode: string, toast: string, extra?: (ctx: CanvasRenderingContext2D) => void) {
    const { ctx, save, time, weather } = game;
    this.panel(ctx, 16, 14, 430, 72);
    this.text(ctx, `${mode}  DAY ${time.day} ${time.label()} ${weather.weather.toUpperCase()}`, 32, 42, 15, "#bae6fd");
    this.text(ctx, `G ${save.data.gold.toLocaleString()}  화물 ${save.data.cargo.length}/18  도감 ${Object.keys(save.data.collection).length}`, 32, 68, 14, "#fef3c7");
    extra?.(ctx);
    this.panel(ctx, 16, 464, 928, 52, "rgba(2,6,23,.76)");
    this.text(ctx, toast, 32, 497, 15, "#f8fafc");
  }

  oxygen(ctx: CanvasRenderingContext2D, oxygen: number, max: number, pressure: number) {
    this.panel(ctx, 584, 14, 354, 92, "rgba(2,6,23,.74)");
    ctx.fillStyle = "#0ea5e9";
    ctx.fillRect(606, 44, 180 * clamp(oxygen / max, 0, 1), 14);
    ctx.strokeStyle = "#bae6fd";
    ctx.strokeRect(606, 44, 180, 14);
    this.text(ctx, `O2 ${Math.ceil(oxygen)} / 압력 ${Math.ceil(pressure)}m`, 606, 34, 14, "#e0f2fe");
    this.text(ctx, "Space 작살 · Esc 수면", 606, 82, 14, "#fde68a");
  }
}
