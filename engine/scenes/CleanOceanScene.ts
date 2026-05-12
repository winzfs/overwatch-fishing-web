import { createOceanScene, type OceanSceneConfig } from "./OceanScene";
import { bagWeight, cargoLimit, fuelLimit, getPlayerLevel } from "../../app/gameSave";
import { formatGameTime } from "../../lib/time/gameTime";

/**
 * Thin wrapper over the existing OceanScene.
 *
 * The original scene still owns gameplay, fish spawning, input, battle flow,
 * multiplayer, audio and time systems. This wrapper removes unstable Phaser
 * screen-space HUD pieces and adds mobile-safe battle panel layout overrides.
 */
export function createCleanOceanScene(Phaser: any, cfg: OceanSceneConfig) {
  const BaseOceanScene = createOceanScene(Phaser, cfg) as any;

  return class CleanOceanScene extends BaseOceanScene {
    private lastBattleActive = false;

    drawVignette() {
      if (this.vignette) this.vignette.clear();
    }

    drawMinimap() {
      // Minimap is rendered by React HTML overlay in app/ocean/page.tsx.
    }

    createHud() {
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
      this.layoutBattlePanelForViewport();
    }

    onResize(...args: any[]) {
      if (super.onResize) {
        try {
          super.onResize(...args);
        } catch (error) {
          console.warn("Ocean resize fallback", error);
        }
      }

      this.isMobile = this.scale.width < 900;
      this.isLandscape = this.scale.width > this.scale.height;
      this.CAM_ZOOM = this.isMobile ? (this.isLandscape ? 0.62 : 0.7) : 1.0;
      this.SX = this.scale.width / this.CAM_ZOOM;
      this.SY = this.scale.height / this.CAM_ZOOM;

      if (this.cameras?.main) {
        this.cameras.main.setZoom(this.CAM_ZOOM);
        this.cameras.main.setBounds(0, 0, this.WORLD_WIDTH, this.WORLD_HEIGHT);
        if (this.boat) this.cameras.main.startFollow(this.boat, true, 1, 1);
      }

      this.layoutBattlePanelForViewport();
      this.refreshHud();
    }

    update(time: number, delta: number) {
      if (super.update) super.update(time, delta);
      this.syncBattleStateForReact();
      if (this.isFishing || this.phase !== "idle") this.layoutBattlePanelForViewport();
    }

    private syncBattleStateForReact() {
      const active = Boolean(this.isFishing || this.phase !== "idle");
      if (active === this.lastBattleActive) return;
      this.lastBattleActive = active;
      window.dispatchEvent(new CustomEvent("ocean-battle-state", { detail: { active } }));
    }

    private safeSetFontSize(target: any, size: number) {
      if (!target?.setFontSize) return;
      target.setFontSize(`${Math.max(6, Math.round(size))}px`);
    }

    private safeSetDisplaySize(target: any, width: number, height: number) {
      if (!target?.setDisplaySize) return;
      target.setDisplaySize(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
    }

    private safeSetPosition(target: any, x: number, y: number) {
      if (!target?.setPosition) return;
      target.setPosition(Math.round(x), Math.round(y));
    }

    private layoutBattlePanelForViewport() {
      if (!this.panel) return;

      const portraitMobile = this.isMobile && this.scale.height >= this.scale.width;
      const landscapeMobile = this.isMobile && this.scale.width > this.scale.height;
      const hs = 1 / (this.CAM_ZOOM || 1);
      const sw = this.SX || this.scale.width;
      const sh = this.SY || this.scale.height;
      const scale = portraitMobile ? 0.72 : landscapeMobile ? 0.58 : 1.0;

      const panelW = portraitMobile
        ? Math.min(sw * 0.86, 520 * hs)
        : landscapeMobile
          ? Math.min(sw * 0.62, 520 * hs)
          : Math.min(sw * 0.78, 620);
      const panelH = portraitMobile
        ? Math.min(sh * 0.50, 430 * hs)
        : landscapeMobile
          ? Math.min(sh * 0.76, 360 * hs)
          : Math.min(sh * 0.70, 480);

      const bottomReserve = portraitMobile ? 132 * hs : landscapeMobile ? 72 * hs : 24;
      const cx = sw / 2;
      const cy = Math.min(
        sh - bottomReserve - panelH / 2,
        Math.max(panelH / 2 + 8 * hs, sh * (portraitMobile ? 0.56 : 0.52))
      );
      const top = cy - panelH / 2;
      const left = cx - panelW / 2;

      if (this.panel.setSize) this.panel.setSize(panelW, panelH);
      this.safeSetDisplaySize(this.panel, panelW, panelH);
      this.safeSetPosition(this.panel, cx, cy);

      const titleY = top + 44 * scale * hs;
      const guideY = top + 86 * scale * hs;
      const controlY = top + 165 * scale * hs;
      const barY = top + 250 * scale * hs;
      const tensionY = top + 300 * scale * hs;
      const resultY = Math.min(top + panelH - 54 * scale * hs, top + 356 * scale * hs);

      this.safeSetPosition(this.fishNameText || this.battleTitle, cx, titleY);
      this.safeSetPosition(this.battleGuide, cx, guideY);
      this.safeSetPosition(this.directionArrow, cx - 86 * scale * hs, controlY);
      this.safeSetPosition(this.directionLabel, cx - 86 * scale * hs, controlY + 62 * scale * hs);
      this.safeSetPosition(this.promptHookButton, cx + 86 * scale * hs, controlY);
      this.safeSetPosition(this.promptPlusText, cx, controlY);
      this.safeSetPosition(this.timingBar, cx, barY);
      this.safeSetPosition(this.hitZone, cx, barY);
      this.safeSetPosition(this.pointer, cx, barY);
      this.safeSetPosition(this.tensionFill, left + 16 * hs, tensionY);
      this.safeSetPosition(this.battleText, cx, resultY);

      this.safeSetFontSize(this.fishNameText || this.battleTitle, 20 * scale * hs);
      this.safeSetFontSize(this.battleGuide, 14 * scale * hs);
      this.safeSetFontSize(this.directionLabel, 11 * scale * hs);
      this.safeSetFontSize(this.promptPlusText, 14 * scale * hs);
      this.safeSetFontSize(this.battleText, 17 * scale * hs);

      this.safeSetDisplaySize(this.directionArrow, 72 * scale * hs, 72 * scale * hs);
      this.safeSetDisplaySize(this.promptHookButton, 62 * scale * hs, 62 * scale * hs);
      this.safeSetDisplaySize(this.timingBar, Math.min(panelW - 52 * hs, 420 * scale * hs), 42 * scale * hs);
      this.safeSetDisplaySize(this.hitZone, 108 * scale * hs, 42 * scale * hs);
      this.safeSetDisplaySize(this.pointer, 14 * scale * hs, 64 * scale * hs);
      this.safeSetDisplaySize(this.tensionFill, Math.min(panelW - 52 * hs, 420 * scale * hs), 30 * scale * hs);
    }

    refreshHud() {
      const save = this.saveData;
      const timeInfo = this.timeSystem?.current;
      const zone = this.getCurrentZone ? this.getCurrentZone() : cfg.region?.name || "해역";
      const dist = this.boat
        ? Math.round(Phaser.Math.Distance.Between(this.boat.x, this.boat.y, this.PORT_X, this.PORT_Y))
        : 0;

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
