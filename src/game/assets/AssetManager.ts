import { assetManifest, type AssetDefinition } from "./assetManifest";

export type DrawSpriteOptions = Partial<{
  width: number;
  height: number;
  rotation: number;
  alpha: number;
  flipX: boolean;
  center: boolean;
}>;

export class AssetManager {
  private definitions = new Map<string, AssetDefinition>(assetManifest.map((asset) => [asset.id, asset]));
  private images = new Map<string, HTMLImageElement>();
  private fallback?: HTMLCanvasElement;

  async preload() {
    const loaders = assetManifest.map((asset) => this.load(asset));
    await Promise.allSettled(loaders);
  }

  getImage(assetId: string) {
    return this.images.get(assetId) || this.images.get("ui.fallback");
  }

  drawSprite(ctx: CanvasRenderingContext2D, assetId: string, x: number, y: number, options: DrawSpriteOptions = {}) {
    const image = this.getImage(assetId);
    const definition = this.definitions.get(assetId) || this.definitions.get("ui.fallback");
    const width = options.width || definition?.width || 32;
    const height = options.height || definition?.height || 32;
    const anchor = definition?.anchor || { x: options.center ? 0.5 : 0, y: options.center ? 0.5 : 0 };
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = options.alpha ?? 1;
    ctx.translate(x, y);
    if (options.rotation) ctx.rotate(options.rotation);
    if (options.flipX) ctx.scale(-1, 1);
    const dx = -width * anchor.x;
    const dy = -height * anchor.y;
    if (image) ctx.drawImage(image, dx, dy, width, height);
    else ctx.drawImage(this.getFallbackCanvas(), dx, dy, width, height);
    ctx.restore();
  }

  drawTiled(ctx: CanvasRenderingContext2D, assetId: string, x: number, y: number, w: number, h: number, options: DrawSpriteOptions & { offsetX?: number; offsetY?: number; tileSize?: number } = {}) {
    const image = this.getImage(assetId) || this.getFallbackCanvas();
    const definition = this.definitions.get(assetId);
    const tileSize = options.tileSize || definition?.width || 100;
    const offsetX = ((options.offsetX || 0) % tileSize + tileSize) % tileSize;
    const offsetY = ((options.offsetY || 0) % tileSize + tileSize) % tileSize;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = options.alpha ?? 1;
    for (let yy = y - offsetY; yy < y + h; yy += tileSize) {
      for (let xx = x - offsetX; xx < x + w; xx += tileSize) {
        ctx.drawImage(image, xx, yy, tileSize, tileSize);
      }
    }
    ctx.restore();
  }

  private load(asset: AssetDefinition) {
    return new Promise<void>((resolve) => {
      const image = new Image();
      image.onload = () => {
        this.images.set(asset.id, image);
        resolve();
      };
      image.onerror = () => resolve();
      image.src = asset.src;
    });
  }

  private getFallbackCanvas() {
    if (this.fallback) return this.fallback;
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, 32, 32);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, 28, 28);
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 16px monospace";
      ctx.fillText("?", 11, 22);
    }
    this.fallback = canvas;
    return canvas;
  }
}
