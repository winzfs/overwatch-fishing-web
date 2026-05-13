import { createOceanScene, type OceanSceneConfig } from "./OceanScene";
import { bagWeight, cargoLimit, fuelLimit, getPlayerLevel } from "../../app/gameSave";
import { formatGameTime } from "../../lib/time/gameTime";

export function createCleanOceanScene(Phaser: any, cfg: OceanSceneConfig) {
  const BaseOceanScene = createOceanScene(Phaser, cfg) as any;

  return class CleanOceanScene extends BaseOceanScene {
    private lastBattleActive = false;

    private getViewportMetrics() {
      const winW = typeof window !== "undefined" ? window.innerWidth : this.scale.width;
      const winH = typeof window !== "undefined" ? window.innerHeight : this.scale.height;
      const visualW = typeof window !== "undefined" && window.visualViewport ? window.visualViewport.width : winW;
      const visualH = typeof window !== "undefined" && window.visualViewport ? window.visualViewport.height : winH;
      const scaleW = this.scale.width || winW;
      const scaleH = this.scale.height || winH;
      const width = Math.min(winW || scaleW, visualW || scaleW, scaleW || winW);
      const height = Math.max(winH || scaleH, visualH || scaleH, scaleH || winH);
      const shortest = Math.min(width, height);
      const isMobile = shortest < 900;
      const isClearlyLandscape = width >= height * 1.25;
      const isLandscape = isMobile ? isClearlyLandscape : scaleW > scaleH;
      const zoom = isMobile ? (isLandscape ? 0.62 : 0.92) : 1.0;
      return { width: scaleW, height: scaleH, isMobile, isLandscape, zoom };
    }

    private applyViewportMetrics() {
      const metrics = this.getViewportMetrics();
      this.isMobile = metrics.isMobile;
      this.isLandscape = metrics.isLandscape;
      this.CAM_ZOOM = metrics.zoom;
      this.SX = metrics.width / this.CAM_ZOOM;
      this.SY = metrics.height / this.CAM_ZOOM;

      if (this.cameras?.main) {
        this.cameras.main.setZoom(this.CAM_ZOOM);
        this.cameras.main.setBounds(0, 0, this.WORLD_WIDTH, this.WORLD_HEIGHT);
        if (this.boat) this.cameras.main.startFollow(this.boat, true, 1, 1);
      }
    }

    private isPortraitMobileViewport() {
      const metrics = this.getViewportMetrics();
      return metrics.isMobile && !metrics.isLandscape;
    }

    private getBattleTargets() {
      return [this.panel, this.battleTitle, this.fishNameText, this.battleGuide, this.battleText, this.directionArrow, this.directionLabel, this.promptPlusText, this.promptHookButton, this.timingBar, this.hitZone, this.pointer, this.tensionFill].filter(Boolean);
    }

    private boundsOfTargets(targets: any[]) {
      const points: Array<{ x: number; y: number }> = [];
      for (const target of targets) {
        if (target.getBounds) {
          const b = target.getBounds();
          points.push({ x: b.left, y: b.top }, { x: b.right, y: b.bottom });
        } else if (typeof target.x === "number" && typeof target.y === "number") {
          points.push({ x: target.x, y: target.y });
        }
      }
      if (!points.length) return null;
      const left = Math.min(...points.map((p) => p.x));
      const right = Math.max(...points.map((p) => p.x));
      const top = Math.min(...points.map((p) => p.y));
      const bottom = Math.max(...points.map((p) => p.y));
      return { left, right, top, bottom, width: Math.max(1, right - left), height: Math.max(1, bottom - top), cx: (left + right) / 2, cy: (top + bottom) / 2 };
    }

    private moveTargets(targets: any[], dx: number, dy: number) {
      for (const target of targets) {
        if (!target) continue;
        if (typeof target.x === "number") target.x += dx;
        if (typeof target.y === "number") target.y += dy;
      }
    }

    private getLinkedTensionGaugeTargets() {
      const targets = [this.tensionFill].filter(Boolean);
      const fillBounds = this.tensionFill?.getBounds ? this.tensionFill.getBounds() : null;
      if (!fillBounds || !this.children?.list) return targets;

      const ignored = new Set([
        this.panel,
        this.timingBar,
        this.hitZone,
        this.pointer,
        this.battleTitle,
        this.fishNameText,
        this.battleGuide,
        this.battleText,
        this.directionArrow,
        this.directionLabel,
        this.promptPlusText,
        this.promptHookButton,
      ]);

      const fillCx = (fillBounds.left + fillBounds.right) / 2;
      const fillCy = (fillBounds.top + fillBounds.bottom) / 2;
      const hs = 1 / (this.CAM_ZOOM || 1);

      for (const child of this.children.list as any[]) {
        if (!child || ignored.has(child) || targets.includes(child)) continue;
        if (!child.getBounds || typeof child.x !== "number" || typeof child.y !== "number") continue;

        const b = child.getBounds();
        const cx = (b.left + b.right) / 2;
        const cy = (b.top + b.bottom) / 2;

        const closeToFill =
          Math.abs(cx - fillCx) <= Math.max(fillBounds.width, b.width) * 0.9 &&
          Math.abs(cy - fillCy) <= 48 * hs;

        const similarSize =
          b.width >= fillBounds.width * 0.45 &&
          b.width <= fillBounds.width * 2.4 &&
          b.height >= fillBounds.height * 0.2 &&
          b.height <= fillBounds.height * 6;

        if (closeToFill && similarSize) {
          targets.push(child);
        }
      }

      return targets;
    }

    private separateBattleBarsForPortraitViewport() {
      if (!this.isPortraitMobileViewport()) return;

      const upperGaugeTargets = [this.timingBar, this.hitZone, this.pointer].filter(Boolean);
      const lowerGaugeTargets = this.getLinkedTensionGaugeTargets();

      if (!upperGaugeTargets.length || !lowerGaugeTargets.length) return;

      const upper = this.boundsOfTargets(upperGaugeTargets);
      const lower = this.boundsOfTargets(lowerGaugeTargets);
      if (!upper || !lower) return;

      const hs = 1 / (this.CAM_ZOOM || 1);
      const panelBounds = this.panel?.getBounds ? this.panel.getBounds() : null;

      const minLowerTop = upper.bottom + 30 * hs;
      let dy = Math.max(0, minLowerTop - lower.top);

      const maxLowerBottom = Math.min(
        (panelBounds?.bottom ?? this.SY) - 118 * hs,
        (this.SY || this.scale.height) - 150 * hs,
      );

      if (lower.bottom + dy > maxLowerBottom) {
        dy = Math.max(0, maxLowerBottom - lower.bottom);
      }

      if (dy > 0) {
        this.moveTargets(lowerGaugeTargets, 0, dy);
      }
    }

    createBattlePanel() {
      if (super.createBattlePanel) super.createBattlePanel();
      this.separateBattleBarsForPortraitViewport();
    }

    updateWaveOverlays(time?: number) {
      if (!this.sys || !this.textures || !Array.isArray(this.waveOverlays)) return;
      if (this.scene?.isActive?.() === false) return;

      const now = Number.isFinite(time as number) ? Number(time) : (this.time?.now || 0);
      const textureKeys = ["wave_1", "wave_2", "wave_3"].filter((key) => this.textures.exists(key));
      if (!textureKeys.length) return;

      this.waveOverlays = this.waveOverlays.filter((wave: any) => wave && !wave.destroyed && wave.scene);

      for (const wave of this.waveOverlays) {
        if (!wave || wave.destroyed || wave.active === false || !wave.scene) continue;

        const rawPhase = Number(wave.getData?.("phase") ?? 0);
        const phase = Number.isFinite(rawPhase) ? rawPhase : 0;
        const rawFrame = Math.floor((now + phase) / 360) % textureKeys.length;
        const frame = Phaser.Math.Clamp(Number.isFinite(rawFrame) ? rawFrame : 0, 0, textureKeys.length - 1);
        const wantTex = textureKeys[frame] || textureKeys[0];

        if (!wantTex || !this.textures.exists(wantTex)) continue;

        try {
          if (!wave.texture || wave.texture.key !== wantTex) {
            wave.setTexture(wantTex);
          }
        } catch (error) {
          console.warn("Skipped invalid wave overlay texture update", error);
        }
      }
    }
  };
}
