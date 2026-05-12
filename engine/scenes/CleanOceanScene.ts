import { createOceanScene, type OceanSceneConfig } from "./OceanScene";
import { bagWeight, cargoLimit, fuelLimit, getPlayerLevel } from "../../app/gameSave";
import { formatGameTime } from "../../lib/time/gameTime";

/**
 * Thin wrapper over the existing OceanScene.
 *
 * The original scene still owns gameplay, fish spawning, input, battle flow,
 * multiplayer, audio and time systems. This wrapper removes unstable Phaser
 * screen-space HUD pieces and creates a compact mobile battle panel at source.
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
      const hs = 1 / (this.CAM_ZOOM || 1);
      const sw = this.SX || this.scale.width;
      const sh = this.SY || this.scale.height;
      const portraitMobile = this.isMobile && !this.isLandscape;
      const landscapeMobile = this.isMobile && this.isLandscape;
      const s = portraitMobile ? 0.7 : landscapeMobile ? 0.58 : 1;

      const panelW = portraitMobile
        ? Math.min(sw * 0.84, 500 * hs)
        : landscapeMobile
          ? Math.min(sw * 0.62, 560 * hs)
          : Math.min(sw * 0.78, 660);
      const panelH = portraitMobile
        ? Math.min(sh * 0.46, 390 * hs)
        : landscapeMobile
          ? Math.min(sh * 0.74, 350 * hs)
          : Math.min(sh * 0.72, 480);

      const cx = sw / 2;
      const cy = portraitMobile
        ? Math.min(sh - panelH / 2 - 120 * hs, Math.max(panelH / 2 + 118 * hs, sh * 0.55))
        : landscapeMobile
          ? Math.min(sh - panelH / 2 - 18 * hs, Math.max(panelH / 2 + 10 * hs, sh * 0.52))
          : sh * 0.55;
      const top = cy - panelH / 2;

      this.panel = this.add.rectangle(cx, cy, panelW, panelH, 0x020617, 0.92)
        .setStrokeStyle(Math.max(2, Math.round(3 * hs)), 0x67e8f9, 1)
        .setScrollFactor(0)
        .setDepth(120)
        .setVisible(false);

      this.battleTitle = this.add.text(cx, top + 42 * s * hs, "낚시 전투", {
        fontSize: `${Math.round(27 * s * hs)}px`,
        color: "#ffffff",
        align: "center",
        fontStyle: "bold",
        stroke: "#020617",
        strokeThickness: Math.max(3, Math.round(5 * s * hs)),
        fontFamily: '"Press Start 2P", "Courier New", monospace',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(121).setVisible(false);

      this.fishNameText = this.add.text(cx, top + 80 * s * hs, "", {
        fontSize: `${Math.round(17 * s * hs)}px`,
        color: "#e0f2fe",
        align: "center",
        fontStyle: "bold",
        stroke: "#020617",
        strokeThickness: Math.max(2, Math.round(4 * s * hs)),
        fontFamily: '"Press Start 2P", "Courier New", monospace',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(121).setVisible(false);

      this.battleGuide = this.add.text(cx, top + 112 * s * hs, "", {
        fontSize: `${Math.round(13 * s * hs)}px`,
        color: "#ffffff",
        align: "center",
        fontStyle: "bold",
        stroke: "#020617",
        strokeThickness: Math.max(2, Math.round(4 * s * hs)),
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        wordWrap: { width: Math.max(180, panelW - 34 * hs) },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(121).setVisible(false);

      const controlY = top + 176 * s * hs;
      this.directionArrow = this.add.image(cx - 72 * s * hs, controlY, "arrow_left")
        .setDisplaySize(66 * s * hs, 66 * s * hs)
        .setScrollFactor(0)
        .setDepth(122)
        .setVisible(false);

      this.directionLabel = this.add.text(cx - 72 * s * hs, controlY + 50 * s * hs, "", {
        fontSize: `${Math.round(10 * s * hs)}px`,
        color: "#bae6fd",
        align: "center",
        fontStyle: "bold",
        stroke: "#020617",
        strokeThickness: Math.max(2, Math.round(3 * s * hs)),
        fontFamily: '"Press Start 2P", "Courier New", monospace',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(122).setVisible(false);

      this.promptPlusText = this.add.text(cx, controlY, "+", {
        fontSize: `${Math.round(24 * s * hs)}px`,
        color: "#ffffff",
        align: "center",
        fontStyle: "bold",
        stroke: "#020617",
        strokeThickness: Math.max(2, Math.round(4 * s * hs)),
        fontFamily: '"Press Start 2P", "Courier New", monospace',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(122).setVisible(false);

      this.promptHookButton = this.add.image(cx + 72 * s * hs, controlY, "hook_button")
        .setDisplaySize(60 * s * hs, 60 * s * hs)
        .setScrollFactor(0)
        .setDepth(122)
        .setVisible(false);

      const barW = Math.min(panelW - 42 * hs, 410 * s * hs);
      const barH = Math.max(24, 34 * s * hs);
      const barY = top + 252 * s * hs;

      this.timingBar = this.add.rectangle(cx, barY, barW, barH, 0x172554, 1)
        .setStrokeStyle(Math.max(2, Math.round(2 * hs)), 0xffffff, 0.72)
        .setScrollFactor(0)
        .setDepth(121)
        .setVisible(false);

      this.hitZone = this.add.rectangle(cx, barY, Math.min(104 * s * hs, barW * 0.34), barH, 0x22c55e, 0.95)
        .setStrokeStyle(Math.max(1, Math.round(2 * hs)), 0xffffff, 0.75)
        .setScrollFactor(0)
        .setDepth(122)
        .setVisible(false);

      this.pointer = this.add.rectangle(cx, barY, Math.max(9, 12 * s * hs), barH + 22 * s * hs, 0xfacc15, 1)
        .setStrokeStyle(Math.max(1, Math.round(2 * hs)), 0xffffff, 0.85)
        .setScrollFactor(0)
        .setDepth(123)
        .setVisible(false);

      this.tensionFill = this.add.rectangle(cx - barW / 2, barY + 46 * s * hs, barW, Math.max(18, 24 * s * hs), 0x22c55e, 0.95)
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(122)
        .setVisible(false);

      this.battleText = this.add.text(cx, Math.min(top + panelH - 32 * s * hs, barY + 78 * s * hs), "", {
        fontSize: `${Math.round(16 * s * hs)}px`,
        color: "#fecaca",
        align: "center",
        fontStyle: "bold",
        stroke: "#020617",
        strokeThickness: Math.max(2, Math.round(4 * s * hs)),
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        wordWrap: { width: Math.max(180, panelW - 30 * hs) },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(124).setVisible(false);
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

      this.refreshHud();
    }

    update(time: number, delta: number) {
      if (super.update) super.update(time, delta);
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
