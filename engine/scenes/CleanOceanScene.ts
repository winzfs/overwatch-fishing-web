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
      return [
        this.panel,
        this.battleTitle,
        this.fishNameText,
        this.battleGuide,
        this.battleText,
        this.directionArrow,
        this.directionLabel,
        this.promptPlusText,
        this.promptHookButton,
        this.timingBar,
        this.hitZone,
        this.pointer,
        this.tensionFill,
      ].filter(Boolean);
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

      return {
        left,
        right,
        top,
        bottom,
        width: Math.max(1, right - left),
        height: Math.max(1, bottom - top),
        cx: (left + right) / 2,
        cy: (top + bottom) / 2,
      };
    }

    private scaleTarget(target: any, scale: number) {
      if (!target || scale === 1) return;

      if (target.type === "Rectangle" && target.setSize && typeof target.width === "number" && typeof target.height === "number") {
        target.setSize(target.width * scale, target.height * scale);
      } else if (target.setScale) {
        const sx = typeof target.scaleX === "number" ? target.scaleX : 1;
        const sy = typeof target.scaleY === "number" ? target.scaleY : 1;
        target.setScale(sx * scale, sy * scale);
      }
    }

    private moveTargets(targets: any[], dx: number, dy: number) {
      for (const target of targets) {
        if (!target) continue;
        if (typeof target.x === "number") target.x += dx;
        if (typeof target.y === "number") target.y += dy;
      }
    }

    private separateBattleBarsForPortraitViewport() {
      if (!this.isPortraitMobileViewport()) return;

      const upperGaugeTargets = [this.timingBar, this.hitZone, this.pointer].filter(Boolean);
      const lowerGaugeTargets = [this.tensionFill].filter(Boolean);
      if (!upperGaugeTargets.length || !lowerGaugeTargets.length) return;

      const hs = 1 / (this.CAM_ZOOM || 1);
      const upper = this.boundsOfTargets(upperGaugeTargets);
      const lower = this.boundsOfTargets(lowerGaugeTargets);
      if (!upper || !lower) return;

      const panelBounds = this.panel?.getBounds ? this.panel.getBounds() : null;
      const desiredGap = 26 * hs;
      const minLowerTop = upper.bottom + desiredGap;
      let dy = Math.max(0, minLowerTop - lower.top);
      const maxLowerBottom = Math.min((panelBounds?.bottom ?? this.SY) - 118 * hs, (this.SY || this.scale.height) - 150 * hs);
      if (lower.bottom + dy > maxLowerBottom) dy = Math.max(0, maxLowerBottom - lower.bottom);

      if (dy > 0) this.moveTargets(lowerGaugeTargets, 0, dy);
    }

    private fitBattlePanelToPortraitViewport() {
      if (!this.isPortraitMobileViewport()) return;

      const targets = this.getBattleTargets();
      if (!targets.length || targets.some((target) => target.getData?.("portraitFitApplied"))) {
        this.separateBattleBarsForPortraitViewport();
        return;
      }

      const hs = 1 / (this.CAM_ZOOM || 1);
      const sw = this.SX || this.scale.width;
      const sh = this.SY || this.scale.height;
      const topSafe = 128 * hs;
      const bottomSafe = 138 * hs;
      const sideSafe = 14 * hs;
      const availableW = Math.max(120, sw - sideSafe * 2);
      const availableH = Math.max(120, sh - topSafe - bottomSafe);
      const targetCx = sw / 2;
      const targetCy = topSafe + availableH / 2;

      const before = this.boundsOfTargets(targets);
      if (!before) return;
      const fitScale = Math.min(1, 0.94 * availableW / before.width, 0.94 * availableH / before.height);

      for (const target of targets) {
        if (typeof target.x === "number") target.x = targetCx + (target.x - before.cx) * fitScale;
        if (typeof target.y === "number") target.y = targetCy + (target.y - before.cy) * fitScale;
        this.scaleTarget(target, fitScale);
        target.setData?.("portraitFitApplied", true);
      }

      this.separateBattleBarsForPortraitViewport();
    }

    drawVignette() {
      if (this.vignette) this.vignette.clear();
    }

    drawMinimap() {
      // Minimap is rendered by React HTML overlay in app/ocean/page.tsx.
    }

    createHud() {
      this.applyViewportMetrics();
      const hs = 1 / (this.CAM_ZOOM || 1);
      const sw = this.SX || this.scale.width;
      const sh = this.SY || this.scale.height;
      const hintYOffset = this.isMobile ? (this.isLandscape ? 110 : 150) : 138;

      this.hintText = this.add.text(sw / 2, sh - hintYOffset * hs, "", {
        fontSize: this.isMobile ? `${Math.round(20 * hs)}px` : "16px",
        color: "#fde047",
        align: "center",
        fontStyle: "bold",
        stroke: "#020617",
        strokeThickness: 5,
        fontFamily: '"Press Start 2P", "Courier New", monospace',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

      this.eventText = this.add.text(sw / 2, sh / 2 - (this.isMobile ? 40 : 30) * hs, "", {
        fontSize: this.isMobile ? `${Math.round(15 * hs)}px` : "14px",
        color: "#fde047",
        align: "center",
        fontStyle: "bold",
        backgroundColor: "rgba(7,24,43,0.85)",
        padding: { x: 14, y: 10 },
        stroke: "#020617",
        strokeThickness: 3,
        fontFamily: '"Press Start 2P", "Courier New", monospace',
      }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(110);

      this.minimap = null;
      this.minimapBoat = null;
      this.minimapPort = null;
      this.minimapWreck = null;
    }

    createBattlePanel() {
      if (super.createBattlePanel) super.createBattlePanel();
      this.fitBattlePanelToPortraitViewport();
    }

    onResize(...args: any[]) {
      if (super.onResize) {
        try {
          super.onResize(...args);
        } catch (error) {
          console.warn("Ocean resize fallback", error);
        }
      }

      this.applyViewportMetrics();
      this.refreshHud();
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
          if (!wave.texture || wave.texture.key !== wantTex) wave.setTexture(wantTex);
        } catch (error) {
          console.warn("Skipped invalid wave overlay texture update", error);
        }
      }
    }

    update(time: number, delta: number) {
      if (!this.sys || this.scene?.isActive?.() === false) return;
      if (super.update) {
        try {
          super.update(time, delta);
        } catch (error) {
          console.warn("Ocean update fallback", error);
        }
      }
      this.fitBattlePanelToPortraitViewport();
      this.syncBattleStateForReact();
    }

    private syncBattleStateForReact() {
      const active = Boolean(this.isFishing || this.phase !== "idle");
      if (active === this.lastBattleActive) return;
      this.lastBattleActive = active;
      window.dispatchEvent(new CustomEvent("ocean-battle-state", { detail: { active } }));
    }

    refreshHud() {
      const save = this.saveData;
      const timeInfo = this.timeSystem?.current;
      const zone = this.getCurrentZone ? this.getCurrentZone() : cfg.region?.name || "해역";
      const dist = this.boat ? Math.round(Phaser.Math.Distance.Between(this.boat.x, this.boat.y, this.PORT_X, this.PORT_Y)) : 0;

      window.dispatchEvent(new CustomEvent("hud-update", {
        detail: {
          weight: bagWeight(save),
          limit: cargoLimit(save),
          fuel: Math.max(0, Math.round(this.fuel || 0)),
          fuelMax: fuelLimit(save),
          gold: save?.gold || 0,
          level: getPlayerLevel(save),
          caught: save?.stats?.totalCaught || 0,
          zone,
          dist,
          timeStr: timeInfo ? `${timeInfo.emoji || ""} ${formatGameTime(timeInfo)}` : "00:00",
          boatX: this.boat?.x || this.PORT_X,
          boatY: this.boat?.y || this.PORT_Y,
          worldWidth: this.WORLD_WIDTH,
          worldHeight: this.WORLD_HEIGHT,
          portX: this.PORT_X,
          portY: this.PORT_Y,
          wreckX: 2380,
          wreckY: 1030,
        },
      }));
    }
  };
}
