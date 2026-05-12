import { createOceanScene, type OceanSceneConfig } from "./OceanScene";
import { bagWeight, cargoLimit, fuelLimit, getPlayerLevel } from "../../app/gameSave";
import { formatGameTime } from "../../lib/time/gameTime";

/**
 * Thin wrapper over the existing OceanScene.
 *
 * The original scene still owns gameplay, fish spawning, input, battle flow,
 * multiplayer, audio and time systems. This wrapper only removes unstable
 * Phaser screen-space HUD pieces so React can own the mobile UI safely.
 */
export function createCleanOceanScene(Phaser: any, cfg: OceanSceneConfig) {
  const BaseOceanScene = createOceanScene(Phaser, cfg) as any;

  return class CleanOceanScene extends BaseOceanScene {
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

      // Keep Phaser minimap objects empty so any old references are harmless.
      this.minimap = null;
      this.minimapBoat = null;
      this.minimapPort = null;
      this.minimapWreck = null;
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
