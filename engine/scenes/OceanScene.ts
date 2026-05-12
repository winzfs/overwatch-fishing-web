import { gradeInfo, pickFish } from "../../data/fish";
import type { Region } from "../../types/region";
import {
  type BagItem,
  type SaveData,
  defaultSave,
  loadSave,
  saveGame,
  bagWeight,
  cargoLimit,
  fuelLimit,
  getDailySeaEvent,
  getPlayerLevel,
} from "../../app/gameSave";
import { AudioSystem } from "../systems/AudioSystem";
import { TimeSystem } from "../systems/TimeSystem";
import { PERIOD_META, formatGameTime } from "../../lib/time/gameTime";
import type { FishDiscoveredDetail } from "../../components/ocean/DiscoveryOverlay";

type BattlePhase = "idle" | "bite" | "pull" | "reel" | "result";

type OnlinePlayerRow = {
  discord_id: string;
  display_name: string;
  region_id: string;
  x: number;
  y: number;
  direction?: string | null;
  is_fishing?: boolean | null;
  updated_at?: string | null;
};

type RemotePlayer = {
  sprite: any;
  nameText: any;
  fishingText: any;
  targetX: number;
  targetY: number;
  lastSeen: number;
};

const ONLINE_SYNC_INTERVAL_MS = 200;
const ONLINE_FORCE_SYNC_MS = 2000;
const ONLINE_MOVE_THRESHOLD = 12;
const ONLINE_STALE_MS = 15000;
const MAX_REMOTE_PLAYERS = 12;

export interface OceanSceneConfig {
  regionId: string;
  region: Region;
  supabase: any;
  discordId: string;
  displayName: string;
}

export function createOceanScene(Phaser: any, cfg: OceanSceneConfig) {
  const { regionId, region: currentRegion, supabase, discordId: onlineDiscordId, displayName: onlineDisplayName } = cfg;

  class OceanScene extends Phaser.Scene {
    boat: any;
    fishes: any[] = [];
    keys: any = {};
    move = { x: 0, y: 0 };
    keyboardActive = false;

    otherPlayers = new Map<string, RemotePlayer>();
    onlineChannel: any = null;
    onlineSyncTimer = 0;
    onlineForceSyncTimer = 0;
    lastOnlineX = 0;
    lastOnlineY = 0;
    lastOnlineDirection = "down";
    multiplayerReady = false;

    hudText: any;
    hudBox: any;
    hintText: any;
    eventText: any;
    minimap: any;
    minimapBoat: any;
    minimapPort: any;
    minimapWreck: any;
    vignette: any;
    waveOverlays: any[] = [];
    buoys: any[] = [];
    crates: any[] = [];
    isMobile = false;
    CAM_ZOOM = 1;
    SX = 0;
    SY = 0;
    boatBobBase = 0;

    panel: any;
    battleTitle: any;
    fishNameText: any;
    battleGuide: any;
    battleText: any;
    directionArrow: any;
    directionLabel: any;
    promptPlusText: any;
    promptHookButton: any;
    timingBar: any;
    hitZone: any;
    pointer: any;
    tensionFill: any;

    audio = new AudioSystem();
    timeSystem = new TimeSystem();
    skyOverlay: any = null;
    lastPeriod = "";

    saveData: SaveData = defaultSave();
    dailyEvent = getDailySeaEvent(regionId);
    fuel = 100;
    canFish = false;
    targetFish: any = null;
    isFishing = false;
    isResolving = false;
    phase: BattlePhase = "idle";
    pointerDirection = 1;
    tension = 50;
    reelProgress = 0;
    battleTimer = 0;
    requiredDirection = "LEFT";
    requiredDirection2 = "RIGHT";
    pullRound = 0;
    maxPullRounds = 1;
    battleQuality: "perfect" | "good" = "good";
    selectedFish = pickFish(regionId);
    fishSize = { cm: 0, kg: 0, sizeRank: "중형", multiplier: 1 };
    animTimer = 0;
    lastBob = 0;

    WORLD_WIDTH = 3000;
    WORLD_HEIGHT = 2300;
    PORT_X = 180;
    PORT_Y = 180;

    constructor() {
      super("OceanScene");
    }

    preload() {
      this.load.image("ocean", "/assets/backgrounds/ocean_tile.png");
      this.load.image("shallow", "/assets/backgrounds/shallow_water_tile.png");
      this.load.image("island_tropical", "/assets/backgrounds/island_tropical.png");
      this.load.image("island_rocky", "/assets/backgrounds/island_rocky.png");
      this.load.image("island_sandbar", "/assets/backgrounds/island_sandbar.png");

      this.load.image("wave_1", "/assets/tiles/wave_1.png");
      this.load.image("wave_2", "/assets/tiles/wave_2.png");
      this.load.image("wave_3", "/assets/tiles/wave_3.png");

      this.load.image("boat_idle_1", "/assets/sprites/boat_idle_1.png");
      this.load.image("boat_idle_2", "/assets/sprites/boat_idle_2.png");
      this.load.image("boat_move_1", "/assets/sprites/boat_move_1.png");
      this.load.image("boat_move_2", "/assets/sprites/boat_move_2.png");
      this.load.image("boat_top", "/assets/sprites/boat_top.png");

      this.load.image("fish_common", "/assets/sprites/fish_shadow_common.png");
      this.load.image("fish_rare", "/assets/sprites/fish_shadow_rare.png");
      this.load.image("fish_epic", "/assets/sprites/fish_shadow_epic.png");
      this.load.image("fish_legend", "/assets/sprites/fish_shadow_legend.png");
      this.load.image("fish_mythic", "/assets/sprites/fish_shadow_mythic.png");
      this.load.image("fish_transcend", "/assets/sprites/fish_shadow_transcend.png");

      this.load.image("arrow_left", "/ui/arrows/left.png");
      this.load.image("arrow_right", "/ui/arrows/right.png");
      this.load.image("arrow_up", "/ui/arrows/up.png");
      this.load.image("arrow_down", "/ui/arrows/down.png");
      this.load.image("hook_button", "/assets/ui/hook_button.png");
      this.load.image("fish_nearby_sign", "/assets/ui/fish_nearby_sign.png");

      this.load.image("burst_rare", "/assets/effects/burst_rare.png");
      this.load.image("burst_epic", "/assets/effects/burst_epic.png");
      this.load.image("burst_legend", "/assets/effects/burst_legend.png");
      this.load.image("burst_mythic", "/assets/effects/burst_mythic.png");
      this.load.image("burst_transcend", "/assets/effects/burst_transcend.png");
    }

    create() {
      this.saveData = loadSave();
      this.fuel = fuelLimit(this.saveData);
      this.isMobile = this.scale.width < 900;
      this.CAM_ZOOM = this.isMobile ? 0.7 : 1.0;
      this.SX = this.scale.width / this.CAM_ZOOM;
      this.SY = this.scale.height / this.CAM_ZOOM;

      this.cameras.main.setBounds(0, 0, this.WORLD_WIDTH, this.WORLD_HEIGHT);
      if (this.isMobile) this.cameras.main.setZoom(this.CAM_ZOOM);
      this.drawWorld();
      this.spawnLandmarks();
      this.spawnFishField();

      this.boat = this.add.image(this.PORT_X + 80, this.PORT_Y + 80, "boat_idle_1");
      this.boat.setScale(this.isMobile ? 0.22 : 0.14);
      this.boat.setDepth(30);
      this.boatBobBase = this.boat.y;

      this.cameras.main.startFollow(this.boat, true, 1, 1);
      this.cameras.main.setRoundPixels(true);

      this.keys = this.input.keyboard?.addKeys({
        up: "W", down: "S", left: "A", right: "D",
        up2: "UP", down2: "DOWN", left2: "LEFT", right2: "RIGHT",
        fish: "SPACE", fish2: "ENTER",
      });

      this.createHud();
      this.createBattlePanel();
      this.refreshHud();
      this.showEvent(`${this.dailyEvent.emoji} ${this.dailyEvent.name}: ${this.dailyEvent.desc}`, "#bae6fd");

      window.addEventListener("ocean-move", this.onMove as EventListener);
      window.addEventListener("ocean-fish", this.onFish as EventListener);
      window.addEventListener("ocean-return", this.returnToHarbor as EventListener);

      this.initMultiplayer();
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.cleanupMultiplayer(); this.audio.destroy(); });
      this.events.once(Phaser.Scenes.Events.DESTROY, () => { this.cleanupMultiplayer(); this.audio.destroy(); });

      this.audio.init();
      this.audio.startOceanAmbient();

      // Screen-space time-of-day overlay (below HUD, above world)
      this.skyOverlay = this.add.rectangle(
        this.SX / 2, this.SY / 2,
        this.SX, this.SY,
        0x000000, 0
      ).setScrollFactor(0).setDepth(90);
      this.applyTimePeriod();
    }

    drawWorld() {
      this.add.rectangle(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, this.WORLD_WIDTH, this.WORLD_HEIGHT, currentRegion.bg);

      for (let x = 0; x < this.WORLD_WIDTH; x += 100) {
        for (let y = 0; y < this.WORLD_HEIGHT; y += 100) {
          const far = Phaser.Math.Distance.Between(this.PORT_X, this.PORT_Y, x, y);
          const texture = far < 650 || (x + y) % 500 === 0 ? "shallow" : "ocean";
          const tile = this.add.image(x, y, texture).setOrigin(0);
          tile.setAlpha(texture === "shallow" ? 0.22 : 0.82);
        }
      }

      const deepZone = this.add.rectangle(
        this.WORLD_WIDTH * 0.78,
        this.WORLD_HEIGHT * 0.72,
        this.WORLD_WIDTH * 0.55,
        this.WORLD_HEIGHT * 0.6,
        0x020617,
        0.32
      );
      deepZone.setDepth(2);
      this.add.text(
        this.WORLD_WIDTH * 0.55,
        this.WORLD_HEIGHT * 0.46,
        "심해 영역",
        {
          fontSize: "20px",
          color: "#7dd3fc",
          fontStyle: "bold",
          stroke: "#020617",
          strokeThickness: 5,
          fontFamily: '"Press Start 2P", "Courier New", monospace',
        }
      ).setDepth(3).setAlpha(0.7);

      for (let i = 0; i < 60; i++) {
        const wx = Phaser.Math.Between(60, this.WORLD_WIDTH - 60);
        const wy = Phaser.Math.Between(60, this.WORLD_HEIGHT - 60);
        const distPort = Phaser.Math.Distance.Between(this.PORT_X, this.PORT_Y, wx, wy);
        if (distPort < 280) continue;
        const frame = Phaser.Math.Between(1, 3);
        const wave = this.add.image(wx, wy, `wave_${frame}`);
        wave.setOrigin(0.5);
        wave.setDisplaySize(96, 96);
        wave.setAlpha(0.32);
        wave.setDepth(4);
        wave.setData("phase", Phaser.Math.Between(0, 600));
        this.waveOverlays.push(wave);
      }

      for (let i = 0; i < 180; i++) {
        const sparkle = this.add.circle(
          Phaser.Math.Between(40, this.WORLD_WIDTH - 40),
          Phaser.Math.Between(40, this.WORLD_HEIGHT - 40),
          Phaser.Math.Between(1, 3),
          0xffffff,
          Phaser.Math.FloatBetween(0.14, 0.42)
        );
        sparkle.setDepth(5);
        this.tweens.add({ targets: sparkle, alpha: 0.02, duration: Phaser.Math.Between(900, 2200), yoyo: true, repeat: -1 });
      }

      this.vignette = this.add.graphics().setScrollFactor(0).setDepth(115);
      this.drawVignette();
    }

    drawVignette() {
      if (!this.vignette) return;
      const w = this.SX, h = this.SY;
      this.vignette.clear();
      const layers = 20;
      for (let i = 0; i < layers; i++) {
        const a = (i / layers) * 0.55;
        this.vignette.lineStyle(8, 0x000000, a / 4);
        this.vignette.strokeRect(i * 4, i * 4, w - i * 8, h - i * 8);
      }
    }

    spawnBuoys() {
      const positions = [
        { x: 700, y: 350 },
        { x: 1380, y: 480 },
        { x: 980, y: 880 },
        { x: 1850, y: 760 },
        { x: 1620, y: 1280 },
      ];
      for (const p of positions) {
        const c = this.add.container(p.x, p.y);
        const post = this.add.rectangle(0, 6, 6, 18, 0x3b2208).setOrigin(0.5);
        const float = this.add.rectangle(0, -6, 18, 14, 0xfacc15).setOrigin(0.5);
        const stripe = this.add.rectangle(0, -6, 18, 4, 0xb91c1c).setOrigin(0.5);
        const flag = this.add.rectangle(8, -18, 10, 8, 0x22d3ee).setOrigin(0, 0.5);
        const wake = this.add.ellipse(0, 14, 30, 6, 0xffffff, 0.35).setOrigin(0.5);
        c.add([wake, post, float, stripe, flag]);
        c.setDepth(11);
        this.tweens.add({ targets: c, y: p.y - 3, duration: Phaser.Math.Between(900, 1400), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        this.buoys.push(c);
      }
    }

    spawnCrates() {
      const positions = [
        { x: 1240, y: 740 },
        { x: 540, y: 1180 },
        { x: 2280, y: 1500 },
      ];
      for (const p of positions) {
        const c = this.add.container(p.x, p.y);
        const shadow = this.add.ellipse(0, 12, 40, 6, 0x000000, 0.45).setOrigin(0.5);
        const box = this.add.rectangle(0, 0, 32, 28, 0x7c4d24).setOrigin(0.5);
        const rim = this.add.rectangle(0, -12, 32, 4, 0xa07033).setOrigin(0.5);
        const strap1 = this.add.rectangle(0, -2, 32, 3, 0xfacc15).setOrigin(0.5);
        const strap2 = this.add.rectangle(0, 8, 32, 3, 0xfacc15).setOrigin(0.5);
        const wake = this.add.ellipse(0, 18, 36, 4, 0xffffff, 0.35).setOrigin(0.5);
        c.add([shadow, wake, box, rim, strap1, strap2]);
        c.setDepth(11);
        this.tweens.add({ targets: c, y: p.y - 2, angle: 4, duration: Phaser.Math.Between(1200, 1800), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        this.crates.push(c);
      }
    }

    spawnLandmarks() {
      const dock = this.add.rectangle(this.PORT_X, this.PORT_Y, 170, 120, 0x7c4d24, 0.95);
      dock.setStrokeStyle(4, 0x3b2208, 1);
      dock.setDepth(10);
      for (let i = -55; i <= 55; i += 16) {
        const plank = this.add.rectangle(this.PORT_X, this.PORT_Y + i, 168, 1, 0x3b2208, 0.7);
        plank.setDepth(11);
      }
      for (const off of [-70, 70]) {
        const post = this.add.rectangle(this.PORT_X + off, this.PORT_Y + 70, 8, 18, 0x3b2208).setDepth(9);
        post.setStrokeStyle(1, 0x000000, 0.7);
      }
      const m1 = this.add.image(this.PORT_X - 100, this.PORT_Y + 60, "boat_top");
      m1.setScale(0.08).setDepth(11).setRotation(Math.PI / 2);
      this.tweens.add({ targets: m1, y: m1.y + 4, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      const m2 = this.add.image(this.PORT_X + 100, this.PORT_Y + 60, "boat_top");
      m2.setScale(0.08).setDepth(11).setRotation(-Math.PI / 2);
      this.tweens.add({ targets: m2, y: m2.y + 4, duration: 1500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

      this.add.text(this.PORT_X - 60, this.PORT_Y - 75, "⚓ 항구", {
        fontSize: "20px",
        color: "#facc15",
        fontStyle: "bold",
        stroke: "#020617",
        strokeThickness: 5,
        fontFamily: '"Press Start 2P", "Courier New", monospace',
      }).setDepth(20);

      const signTex = this.textures.exists("fish_nearby_sign") ? "fish_nearby_sign" : "";
      if (signTex) {
        const sign = this.add.image(this.PORT_X + 130, this.PORT_Y - 30, signTex);
        sign.setScale(0.4).setDepth(20).setAlpha(0.85);
        this.tweens.add({ targets: sign, y: sign.y - 4, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }

      const landmarks = [
        ["island_tropical", 520, 460, 0.28],
        ["island_rocky", 1150, 330, 0.26],
        ["island_sandbar", 2150, 420, 0.34],
        ["island_rocky", 620, 1550, 0.34],
        ["island_tropical", 2000, 1600, 0.28],
        ["island_sandbar", 2600, 1850, 0.26],
      ];

      for (const [texture, x, y, scale] of landmarks as any[]) {
        const island = this.add.image(x, y, texture);
        island.setScale(scale);
        island.setDepth(6);
        const ring = this.add.ellipse(x, y + 10, 200 * scale * 2, 50 * scale * 2, 0x020617, 0.35);
        ring.setDepth(5);
      }

      const wreck = this.add.image(2380, 1030, "island_rocky");
      wreck.setScale(0.18);
      wreck.setAngle(-32);
      wreck.setTint(0x1a0e02);
      wreck.setDepth(8);
      const wreckMast = this.add.rectangle(2380, 1010, 4, 70, 0x1e293b);
      wreckMast.setAngle(-32);
      wreckMast.setDepth(8);
      for (let i = 0; i < 5; i++) {
        const f = this.add.ellipse(
          2380 + Math.cos(i) * 60,
          1030 + Math.sin(i) * 30,
          30, 6, 0xffffff, 0.4
        );
        f.setDepth(7);
        this.tweens.add({ targets: f, alpha: 0.05, duration: Phaser.Math.Between(900, 1400), yoyo: true, repeat: -1 });
      }
      this.add.text(2310, 960, "난파선", {
        fontSize: "16px",
        color: "#fed7aa",
        fontStyle: "bold",
        stroke: "#020617",
        strokeThickness: 5,
        fontFamily: '"Press Start 2P", "Courier New", monospace',
      }).setDepth(20);

      this.add.circle(2450, 720, 280, 0xffffff, 0.08).setDepth(3);
      this.add.text(2360, 650, "🌫️ 안개 해역", {
        fontSize: "14px",
        color: "#e0f2fe",
        fontStyle: "bold",
        stroke: "#020617",
        strokeThickness: 5,
        fontFamily: '"Press Start 2P", "Courier New", monospace',
      }).setDepth(20);

      this.spawnBuoys();
      this.spawnCrates();
    }

    spawnFishField() {
      const radar = this.saveData.upgrades.radar || 0;
      const bait = this.saveData.prep?.bait || "basic";
      const timeInfo = this.timeSystem.current;
      const baseTextures = ["fish_common", "fish_common", "fish_common", "fish_rare", "fish_epic"];
      const rareTextures = ["fish_rare", "fish_epic", "fish_legend"];
      const deepTextures = ["fish_epic", "fish_legend", "fish_mythic", "fish_transcend"];

      if (radar >= 2 || bait === "rare") rareTextures.push("fish_legend");
      if (radar >= 4 || bait === "heavy") deepTextures.push("fish_mythic");
      if (this.dailyEvent.rareBonus >= 2) deepTextures.push("fish_transcend");
      // Magic Hour: extra rare/legendary entries in pools
      if (timeInfo.isMagicHour) {
        rareTextures.push("fish_legend", "fish_epic");
        deepTextures.push("fish_legend", "fish_mythic");
      }
      // Late night: nocturnal bonus (mythic more common)
      if (timeInfo.period === "latenight") {
        deepTextures.push("fish_mythic", "fish_transcend");
      }

      const fishCount = this.dailyEvent.id === "school" ? 58 : 46;

      for (let i = 0; i < fishCount; i++) {
        const x = Phaser.Math.Between(240, this.WORLD_WIDTH - 120);
        const y = Phaser.Math.Between(240, this.WORLD_HEIGHT - 120);
        const distance = Phaser.Math.Distance.Between(this.PORT_X, this.PORT_Y, x, y);
        let pool = baseTextures;
        if (distance > 900) pool = rareTextures;
        if (distance > 1650) pool = deepTextures;
        this.spawnOneFish(Phaser.Utils.Array.GetRandom(pool), x, y);
      }

      this.spawnBossShadow();
    }

    spawnOneFish(texture: string, x?: number, y?: number) {
      const fish = this.add.image(x ?? Phaser.Math.Between(220, this.WORLD_WIDTH - 120), y ?? Phaser.Math.Between(220, this.WORLD_HEIGHT - 120), texture);
      fish.setScale(Phaser.Math.FloatBetween(this.isMobile ? 0.15 : 0.09, this.isMobile ? 0.21 : 0.13));
      fish.setAlpha(Phaser.Math.FloatBetween(0.55, 0.92));
      fish.setDepth(14);
      fish.setData("textureName", texture);
      fish.setData("panic", texture.includes("legend") || texture.includes("mythic") || texture.includes("transcend"));
      fish.setData("dirX", Phaser.Math.FloatBetween(-0.35, 0.35));
      fish.setData("dirY", Phaser.Math.FloatBetween(-0.35, 0.35));
      this.fishes.push(fish);
    }

    spawnBossShadow() {
      const boss = this.add.ellipse(2460, 1400, 260, 90, 0x020617, 0.5);
      boss.setDepth(12);
      boss.setData("boss", true);
      boss.setData("dirX", 0.6);
      boss.setData("dirY", 0.1);
      this.fishes.push(boss);
      this.tweens.add({ targets: boss, scaleX: 1.14, scaleY: 0.88, duration: 1200, yoyo: true, repeat: -1 });
    }

    createHud() {
      const hs = 1 / this.CAM_ZOOM;
      const sw = this.SX, sh = this.SY;

      this.hudBox = this.add.graphics().setScrollFactor(0).setDepth(99);

      this.hudText = this.add.text(Math.round(20 * hs), Math.round(58 * hs), "", {
        fontSize: this.isMobile ? `${Math.round(13 * hs)}px` : "13px",
        color: "#facc15",
        fontStyle: "bold",
        stroke: "#020617",
        strokeThickness: 3,
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        lineSpacing: 6,
      }).setScrollFactor(0).setDepth(100);

      this.hintText = this.add.text(sw / 2, sh - (this.isMobile ? 150 : 138) * hs, "", {
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

      const ms = Math.round(6 * hs);
      this.minimap = this.add.graphics().setScrollFactor(0).setDepth(101);
      this.minimapPort = this.add.rectangle(0, 0, ms, ms, 0xfacc15, 1).setScrollFactor(0).setDepth(102);
      this.minimapWreck = this.add.rectangle(0, 0, Math.round(5 * hs), Math.round(5 * hs), 0xf87171, 1).setScrollFactor(0).setDepth(102);
      this.minimapBoat = this.add.rectangle(0, 0, ms, ms, 0x22d3ee, 1).setScrollFactor(0).setDepth(103);
    }

    drawHudBox() {
      if (!this.hudBox) return;
      this.hudBox.clear();
      const hs = 1 / this.CAM_ZOOM;
      const w = (this.isMobile ? 220 : 300) * hs, h = (this.isMobile ? 90 : 75) * hs;
      const x = 8 * hs, y = 50 * hs;
      this.hudBox.fillStyle(0x67e8f9, 1);
      this.hudBox.fillRect(x - 4, y - 4, w + 8, h + 8);
      this.hudBox.fillStyle(0x020617, 1);
      this.hudBox.fillRect(x - 2, y - 2, w + 4, h + 4);
      this.hudBox.fillStyle(0x07182b, 1);
      this.hudBox.fillRect(x, y, w, h);
      this.hudBox.fillStyle(0xfacc15, 1);
      this.hudBox.fillRect(x, y, 4, h);
    }

    drawMinimap() {
      if (!this.SX || !this.minimap) return;
      const hs = 1 / this.CAM_ZOOM;
      const w = (this.isMobile ? 90 : 132) * hs, h = (this.isMobile ? 68 : 100) * hs;
      const x = this.SX - w - 12 * hs, y = 58 * hs;
      this.minimap.clear();
      this.minimap.fillStyle(0x67e8f9, 1);
      this.minimap.fillRect(x - 3, y - 3, w + 6, h + 6);
      this.minimap.fillStyle(0x020617, 1);
      this.minimap.fillRect(x, y, w, h);
      const portX = x + (this.PORT_X / this.WORLD_WIDTH) * w;
      const portY = y + (this.PORT_Y / this.WORLD_HEIGHT) * h;
      this.minimap.fillStyle(0x0e7490, 0.7);
      this.minimap.fillCircle(portX, portY, (this.isMobile ? 12 : 18) * hs);
      this.minimap.fillStyle(0x0c1e2e, 0.9);
      this.minimap.fillRect(x + w * 0.5, y + h * 0.4, w * 0.5, h * 0.6);
      this.minimap.fillStyle(0xf59e0b, 0.7);
      this.minimap.fillCircle(x + w * 0.75, y + h * 0.65, (this.isMobile ? 3 : 4) * hs);
      this.minimap.lineStyle(1, 0x1e3a5f, 0.6);
      for (let gx = 0; gx <= 4; gx++) this.minimap.lineBetween(x + (gx * w) / 4, y, x + (gx * w) / 4, y + h);
      for (let gy = 0; gy <= 3; gy++) this.minimap.lineBetween(x, y + (gy * h) / 3, x + w, y + (gy * h) / 3);
      this.minimap.lineStyle(2, 0x67e8f9, 0.85);
      this.minimap.strokeRect(x + 1, y + 1, w - 2, h - 2);

      this.minimapBoat.setPosition(x + (this.boat.x / this.WORLD_WIDTH) * w, y + (this.boat.y / this.WORLD_HEIGHT) * h);
      this.minimapPort.setPosition(portX, portY);
      if (this.minimapWreck) {
        this.minimapWreck.setPosition(x + (2380 / this.WORLD_WIDTH) * w, y + (1030 / this.WORLD_HEIGHT) * h);
      }
    }

    createBattlePanel() {
      const hs = 1 / this.CAM_ZOOM;
      const width = this.SX, height = this.SY;
      this.panel = this.add.container(width / 2, height / 2).setScrollFactor(0).setVisible(false).setDepth(130);
      const bg = this.add.rectangle(0, 0, width * 0.92, Math.min(480, this.SY * 0.88) * hs, 0x020617, 0.96);
      bg.setStrokeStyle(5, 0x22d3ee);
      this.battleTitle = this.add.text(0, -210 * hs, "🎣 낚시 전투!", { fontSize: `${Math.round(34 * hs)}px`, color: "#ffffff", fontStyle: "bold", stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5);
      this.fishNameText = this.add.text(0, -168 * hs, "", { fontSize: `${Math.round(21 * hs)}px`, color: "#fde047", align: "center", fontStyle: "bold", stroke: "#000000", strokeThickness: 4, wordWrap: { width: width * 0.82 } }).setOrigin(0.5);
      this.battleGuide = this.add.text(0, -130 * hs, "", { fontSize: `${Math.round(18 * hs)}px`, color: "#cbd5e1", align: "center", fontStyle: "bold", stroke: "#000000", strokeThickness: 4, wordWrap: { width: width * 0.82 } }).setOrigin(0.5);
      this.directionArrow = this.add.image(-98 * hs, -58 * hs, "arrow_left");
      this.directionArrow.setDisplaySize(96 * hs, 96 * hs);
      this.directionArrow.setVisible(false);
      this.directionArrow.setDepth(8);

      this.directionLabel = this.add.text(-10 * hs, -58 * hs, "+", {
        fontSize: `${Math.round(52 * hs)}px`,
        color: "#ffffff",
        align: "center",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 8,
      }).setOrigin(0.5);
      this.directionLabel.setVisible(false);
      this.directionLabel.setDepth(8);

      this.promptHookButton = this.add.image(82 * hs, -58 * hs, "hook_button");
      this.promptHookButton.setDisplaySize(78 * hs, 78 * hs);
      this.promptHookButton.setVisible(false);
      this.promptHookButton.setDepth(8);

      const isMob = this.isMobile;
      const barH = (isMob ? 44 : 36) * hs;
      const hitH = (isMob ? 62 : 50) * hs;
      const ptrH = (isMob ? 90 : 80) * hs;
      const tensH = (isMob ? 32 : 28) * hs;
      this.timingBar = this.add.rectangle(0, 18 * hs, width * 0.72, barH, 0x172554);
      this.timingBar.setStrokeStyle(4, 0xffffff, 0.55);
      this.hitZone = this.add.rectangle(0, 18 * hs, width * 0.18, hitH, 0x22c55e, 0.92);
      this.hitZone.setStrokeStyle(3, 0xbbf7d0, 1);
      this.pointer = this.add.rectangle(-width * 0.34, 18 * hs, (isMob ? 16 : 12) * hs, ptrH, 0xfacc15);
      this.pointer.setStrokeStyle(2, 0xffffff, 0.9);
      const tensionBg = this.add.rectangle(0, 54 * hs, width * 0.72, tensH, 0x1e293b);
      tensionBg.setStrokeStyle(3, 0xffffff, 0.4);
      this.tensionFill = this.add.rectangle(-width * 0.36, 54 * hs, width * 0.36, tensH, 0x22c55e).setOrigin(0, 0.5);
      this.battleText = this.add.text(0, 126 * hs, "", { fontSize: `${Math.round(23 * hs)}px`, color: "#fde047", fontStyle: "bold", align: "center", stroke: "#000000", strokeThickness: 4, wordWrap: { width: width * 0.82 } }).setOrigin(0.5);
      const sub = this.add.text(0, 184 * hs, "가방에 담긴 물고기는 항구에서 판매됩니다.", { fontSize: `${Math.round(13 * hs)}px`, color: "#94a3b8", stroke: "#000000", strokeThickness: 3, align: "center", wordWrap: { width: width * 0.82 } }).setOrigin(0.5);
      this.panel.add([bg, this.battleTitle, this.fishNameText, this.battleGuide,
        this.directionArrow,
        this.directionLabel, this.promptHookButton, this.timingBar, this.hitZone, this.pointer, tensionBg, this.tensionFill, this.battleText, sub]);
    }

    refreshHud() {
      const weight = bagWeight(this.saveData);
      const limit = cargoLimit(this.saveData);
      const dist = this.boat ? Math.floor(Phaser.Math.Distance.Between(this.boat.x, this.boat.y, this.PORT_X, this.PORT_Y)) : 0;
      const maxDist = Math.hypot(this.WORLD_WIDTH, this.WORLD_HEIGHT);
      const ratio = dist / maxDist;
      const zone = ratio < 0.3 ? "🌊연안" : ratio < 0.6 ? "🌀중간" : "🌑심해";
      const timeInfo = this.timeSystem.current;
      const timeStr = `${timeInfo.emoji} ${formatGameTime(timeInfo)}${timeInfo.isMagicHour ? " ✦" : ""}`;
      this.hudText.setText(
        `🎒 ${weight.toFixed(1)} / ${limit}kg   ⛽ ${Math.max(0, Math.floor(this.fuel))}/${fuelLimit(this.saveData)}\n` +
        `💰 ${this.saveData.gold.toLocaleString()}G   Lv.${getPlayerLevel(this.saveData)}   🐟 ${this.saveData.caught}\n` +
        `${zone}   ⚓ ${dist}m   ${timeStr}`
      );
    }

    showEvent(message: string, color = "#fde047") {
      this.eventText.setText(message).setColor(color).setVisible(true).setAlpha(1);
      const hs = 1 / this.CAM_ZOOM;
      const sh = this.SY;
      this.eventText.y = sh / 2 - (this.isMobile ? 40 : 30) * hs;
      this.tweens.add({ targets: this.eventText, y: sh / 2 - (this.isMobile ? 120 : 100) * hs, alpha: 0, duration: 1900, onComplete: () => this.eventText.setVisible(false) });
    }

    makeFishSize(grade: string) {
      const bait = this.saveData.prep?.bait || "basic";
      const gradeBonus = grade === "common" ? 1 : grade === "rare" ? 1.25 : grade === "epic" ? 1.6 : grade === "legend" ? 2.2 : grade === "mythic" ? 3.1 : 4.5;
      const roll = Math.random() + (bait === "heavy" ? 0.05 : 0);
      const rank = roll > 0.985 ? "괴물급" : roll > 0.92 ? "초대형" : roll > 0.72 ? "대형" : roll > 0.28 ? "중형" : "소형";
      const rankMult = rank === "괴물급" ? 3.2 : rank === "초대형" ? 2.2 : rank === "대형" ? 1.45 : rank === "중형" ? 1 : 0.72;
      const cm = Math.round((25 + Math.random() * 70) * gradeBonus * rankMult * 10) / 10;
      const kg = Math.round((cm * cm * 0.0009 + Math.random() * 3) * gradeBonus * 10) / 10;
      return { cm, kg, sizeRank: rank, multiplier: Math.max(0.8, rankMult) };
    }

    onMove = (event: Event) => {
      const custom = event as CustomEvent<{ x: number; y: number }>;
      this.move = custom.detail;
      this.audio.resume();
    };

    onFish = () => {
      if (this.isResolving) return;
      if (this.isFishing) {
        this.handleBattleInput();
        return;
      }
      if (!this.canFish || !this.targetFish) {
        this.showEvent("🐟 물고기 실루엣 근처로 이동하세요.", "#bae6fd");
        return;
      }
      if (bagWeight(this.saveData) >= cargoLimit(this.saveData)) {
        this.showEvent("🎒 가방이 가득 찼습니다. 항구로 귀환하세요!", "#fca5a5");
        return;
      }
      this.startFishingBattle();
    };

    startFishingBattle() {
      if (this.isFishing || this.isResolving) return;
      this.audio.resume();
      this.audio.playCast();
      this.isFishing = true;
      this.phase = "bite";
      this.tension = 50;
      this.reelProgress = 0;
      this.battleTimer = 0;
      this.pullRound = 0;
      this.battleQuality = "good";
      this.move = { x: 0, y: 0 };
      this.selectedFish = pickFish(regionId);
      this.fishSize = this.makeFishSize(this.selectedFish.grade);
      const grade = gradeInfo[this.selectedFish.grade];

      const gradePulls =
        this.selectedFish.grade === "common" ? 1 :
        this.selectedFish.grade === "rare" ? 1 :
        this.selectedFish.grade === "epic" ? 2 :
        this.selectedFish.grade === "legend" ? 2 :
        this.selectedFish.grade === "mythic" ? 3 : 3;

      const sizeExtra = this.fishSize.sizeRank === "괴물급" || this.fishSize.sizeRank === "초대형" ? 1 : 0;
      this.maxPullRounds = gradePulls + sizeExtra;
      if (["legend", "mythic", "transcend"].includes(this.selectedFish.grade)) {
        this.cameras.main.shake(260, 0.012);
        this.showEvent(`${grade.emoji} 희귀한 기척이 느껴진다!`, grade.color);
        this.audio.playRareAlert();
      }
      this.fishNameText.setText(`${grade.emoji} ${grade.name} 입질!`).setColor(grade.color);
      this.battleText.setText("");
      const width = this.SX;
      const rodBonus = (this.saveData.upgrades.rod || 0) * 0.014;
      const sizePenalty =
        this.fishSize.sizeRank === "괴물급" ? 0.055 :
        this.fishSize.sizeRank === "초대형" ? 0.035 :
        this.fishSize.sizeRank === "대형" ? 0.018 : 0;

      this.hitZone.width = width * Math.max(0.075, Math.min(0.31, grade.zone + rodBonus - sizePenalty));
      this.hitZone.x = Phaser.Math.Between(-Math.floor(width * 0.25), Math.floor(width * 0.25));
      this.pointer.x = -this.timingBar.width / 2;
      this.pointerDirection = 1;
      this.hideDirectionPrompt();
      this.battleGuide.setText("1단계 입질: 초록 구간에서 낚시 버튼! PERFECT면 장력 보너스");
      this.panel.setVisible(true);
      this.hintText.setText("");
      this.updateTensionBar();
    }

    handleBattleInput() {
      if (this.phase === "bite") this.checkBite();
      else if (this.phase === "pull") this.checkPullInput();
      else if (this.phase === "reel") {
        const gradeHard =
          this.selectedFish.grade === "common" ? 0 :
          this.selectedFish.grade === "rare" ? 1 :
          this.selectedFish.grade === "epic" ? 2 :
          this.selectedFish.grade === "legend" ? 3 :
          this.selectedFish.grade === "mythic" ? 4 : 5;

        const sizeHard = this.fishSize.sizeRank === "괴물급" ? 3 : this.fishSize.sizeRank === "초대형" ? 2 : this.fishSize.sizeRank === "대형" ? 1 : 0;
        const rod = this.saveData.upgrades.rod || 0;

        this.reelProgress += Math.max(7, 13 + rod * 1.5 - gradeHard - sizeHard);
        this.tension += 8 + gradeHard + sizeHard;
        this.battleText.setText(`릴 감기! ${Math.min(100, Math.floor(this.reelProgress))}% · 장력 ${Math.floor(this.tension)}%`);
        this.updateTensionBar();
        if (this.reelProgress >= 100) this.finishCatch(true, this.battleQuality);
        if (this.tension >= 100) this.finishCatch(false, "miss");
      }
    }

    checkBite() {
      const center = this.pointer.x;
      const left = this.hitZone.x - this.hitZone.width / 2;
      const right = this.hitZone.x + this.hitZone.width / 2;
      const perfectRange = Math.max(12, this.hitZone.width * 0.18);
      const perfect = Math.abs(center - this.hitZone.x) <= perfectRange;
      const success = center >= left && center <= right;
      if (!success) { this.audio.playMiss(); return this.finishCatch(false, "miss"); }
      this.audio.playBite();

      this.battleQuality = perfect ? "perfect" : "good";
      this.phase = "pull";
      this.pullRound = 1;
      this.battleTimer = 0;
      this.requiredDirection = Phaser.Utils.Array.GetRandom(["LEFT", "RIGHT", "UP", "DOWN"]);
      this.showDirectionPrompt(this.requiredDirection, `2단계 저항 ${this.pullRound}/${this.maxPullRounds}`);
      this.battleText.setText(perfect ? "🌟 PERFECT! 장력이 낮아졌다!" : "✅ 입질 성공! 저항을 받아내자!");
      this.tension += perfect ? -14 : 6;
      this.updateTensionBar();
    }

    getArrowTexture(direction: string) {
      if (direction === "LEFT") return "arrow_left";
      if (direction === "RIGHT") return "arrow_right";
      if (direction === "UP") return "arrow_up";
      if (direction === "DOWN") return "arrow_down";
      return "arrow_left";
    }

    showDirectionPrompt(direction: string, prefix = "방향 입력") {
      if (this.directionArrow) {
        this.directionArrow.setTexture(this.getArrowTexture(direction));
        this.directionArrow.setDisplaySize(96, 96);
        this.directionArrow.setPosition(-98, -58);
        this.directionArrow.setVisible(true);
        this.tweens.add({
          targets: [this.directionArrow, this.directionLabel, this.promptHookButton].filter(Boolean),
          alpha: 0.72,
          duration: 160,
          yoyo: true,
          repeat: 1,
        });
      }

      if (this.directionLabel) {
        this.directionLabel.setText("+");
        this.directionLabel.setPosition(-10, -58);
        this.directionLabel.setVisible(true);
      }

      if (this.promptHookButton) {
        this.promptHookButton.setDisplaySize(78, 78);
        this.promptHookButton.setPosition(82, -58);
        this.promptHookButton.setVisible(true);
      }

      this.battleGuide.setText(prefix);
    }

    hideDirectionPrompt() {
      if (this.directionArrow) this.directionArrow.setVisible(false);
      if (this.directionLabel) this.directionLabel.setVisible(false);
      if (this.promptHookButton) this.promptHookButton.setVisible(false);
    }

    formatDirection(direction: string) {
      if (direction === "LEFT") return "왼쪽";
      if (direction === "RIGHT") return "오른쪽";
      if (direction === "UP") return "위쪽";
      if (direction === "DOWN") return "아래쪽";
      return direction;
    }

    getCurrentInputDirection() {
      if (this.keys.left?.isDown || this.keys.left2?.isDown || this.move.x < -0.25) return "LEFT";
      if (this.keys.right?.isDown || this.keys.right2?.isDown || this.move.x > 0.25) return "RIGHT";
      if (this.keys.up?.isDown || this.keys.up2?.isDown || this.move.y < -0.25) return "UP";
      if (this.keys.down?.isDown || this.keys.down2?.isDown || this.move.y > 0.25) return "DOWN";
      return "";
    }

    checkPullInput() {
      const input = this.getCurrentInputDirection();
      if (input === this.requiredDirection) {
        this.tension -= 14;
        this.audio.playPullSuccess();

        if (this.pullRound < this.maxPullRounds) {
          this.pullRound += 1;
          this.battleTimer = 0;
          const dirs = ["LEFT", "RIGHT", "UP", "DOWN"].filter((d) => d !== this.requiredDirection);
          this.requiredDirection = Phaser.Utils.Array.GetRandom(dirs);
          this.showDirectionPrompt(this.requiredDirection, `2단계 저항 ${this.pullRound}/${this.maxPullRounds}`);
          this.battleText.setText("✅ 저항을 받아냈다! 다음 방향!");
        } else {
          this.phase = "reel";
          this.battleTimer = 0;
          this.hideDirectionPrompt();
          this.battleGuide.setText("3단계 릴링: 낚시 버튼을 연타하되 장력이 터지지 않게!");
          this.battleText.setText("🎣 릴링 시작!");
          this.tension -= 12;
        }
      } else {
        this.audio.playPullFail();
        const penalty =
          this.selectedFish.grade === "mythic" || this.selectedFish.grade === "transcend" ? 32 :
          this.selectedFish.grade === "legend" ? 28 : 24;
        this.tension += penalty;
        this.requiredDirection = Phaser.Utils.Array.GetRandom(["LEFT", "RIGHT", "UP", "DOWN"]);
        this.showDirectionPrompt(this.requiredDirection, "방향이 틀렸다!");
        this.battleText.setText("⚠️ 장력이 크게 올라간다!");
        if (this.tension >= 100) this.finishCatch(false, "miss");
      }
      this.updateTensionBar();
    }

    updateTensionBar() {
      this.tension = Phaser.Math.Clamp(this.tension, 0, 100);
      const maxWidth = this.SX * 0.72;
      this.tensionFill.width = maxWidth * (this.tension / 100);
      this.tensionFill.fillColor = this.tension >= 80 ? 0xef4444 : this.tension >= 55 ? 0xfacc15 : 0x22c55e;
    }

    finishCatch(success: boolean, quality: "perfect" | "good" | "miss") {
      if (this.isResolving) return;
      this.isResolving = true;
      this.phase = "result";
      const grade = gradeInfo[this.selectedFish.grade];
      if (success) {
        const eventMult = this.dailyEvent.goldMultiplier;
        const timeMult = this.timeSystem.current.spawnMultiplier;
        const item: BagItem = {
          uid: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          fishId: this.selectedFish.id,
          name: this.selectedFish.name,
          grade: this.selectedFish.grade,
          cm: this.fishSize.cm,
          kg: this.fishSize.kg,
          baseValue: Math.floor(
            this.selectedFish.price *
            this.fishSize.multiplier *
            eventMult *
            timeMult *
            (quality === "perfect" ? 1.25 : 1)
          ),
          exp: Math.floor(this.selectedFish.exp * this.dailyEvent.expMultiplier * timeMult),
          freshness: 100,
          caughtAt: Date.now(),
          region: regionId,
          sizeRank: this.fishSize.sizeRank,
        };
        if (bagWeight(this.saveData) + item.kg > cargoLimit(this.saveData)) {
          this.audio.playMiss();
          this.battleText.setColor("#fca5a5").setText("MISS\n🎒 가방이 부족해서 놓쳤습니다!\n항구로 돌아가 적재량을 비우세요.");
        } else {
          this.saveData.bag = [...(this.saveData.bag || []), item];
          this.saveData.exp += item.exp;
          this.saveData.caught += 1;
          const isNew = (this.saveData.collection[item.fishId] || 0) === 0;
          this.saveData.collection[item.fishId] = (this.saveData.collection[item.fishId] || 0) + 1;
          if (!this.saveData.records) this.saveData.records = {};
          const old = this.saveData.records[item.fishId];
          const isRecord = !old || item.cm > old.cm;
          if (isRecord) this.saveData.records[item.fishId] = { cm: item.cm, kg: item.kg };
          saveGame(this.saveData);

          const isEpicCatch = ["legend", "mythic", "transcend"].includes(this.selectedFish.grade);
          if (isEpicCatch) {
            this.audio.playCatchRare();
          } else {
            this.audio.playCatchSuccess();
          }

          this.battleText.setColor(quality === "perfect" ? "#fde047" : "#86efac").setText(
            `${quality === "perfect" ? "PERFECT" : "SUCCESS"}\n${grade.emoji} ${item.name}\n${item.sizeRank} · ${item.cm}cm · ${item.kg}kg\n🎒 가방에 보관됨${isRecord ? "\n🏆 신기록!" : ""}`
          );
          if (item.sizeRank === "괴물급") {
            this.cameras.main.shake(320, 0.015);
            this.showEvent("🐋 괴물급 사이즈!", "#fde047");
          }

          // Dispatch discovery overlay for epic+ or new finds
          if (isEpicCatch || isNew || isRecord) {
            const detail: FishDiscoveredDetail = {
              fishName: item.name,
              grade: this.selectedFish.grade,
              gradeEmoji: grade.emoji,
              gradeColor: grade.color,
              gradeName: grade.name,
              cm: item.cm,
              kg: item.kg,
              sizeRank: item.sizeRank,
              isNew,
              isRecord,
              quality: quality === "perfect" ? "perfect" : "good",
            };
            window.dispatchEvent(new CustomEvent("fish-discovered", { detail }));
          }
        }
        if (this.targetFish) {
          const burst = this.add.image(this.targetFish.x, this.targetFish.y, grade.burst).setScale(0.42).setDepth(70);
          this.tweens.add({ targets: burst, scale: 1.1, alpha: 0, duration: 750, onComplete: () => burst.destroy() });
          this.targetFish.destroy();
          this.fishes = this.fishes.filter((f) => f !== this.targetFish);
          this.spawnOneFish(Phaser.Utils.Array.GetRandom(["fish_common", "fish_rare", "fish_epic"]));
        }
        this.targetFish = null;
        this.canFish = false;
        this.refreshHud();
      } else {
        this.audio.playMiss();
        if (this.targetFish) {
          this.targetFish.destroy();
          this.fishes = this.fishes.filter((f) => f !== this.targetFish);
          this.spawnOneFish(Phaser.Utils.Array.GetRandom(["fish_common", "fish_rare", "fish_epic"]));
        }
        this.targetFish = null;
        this.canFish = false;
        this.battleText.setColor("#fca5a5").setText("MISS\n줄이 풀렸다!\n물고기가 도망갔습니다.");
      }
      this.time.delayedCall(1850, () => {
        this.panel.setVisible(false);
        this.isFishing = false;
        this.isResolving = false;
        this.phase = "idle";
        this.battleText.setText("");
      });
    }

    returnToHarbor = () => {
      const dist = Phaser.Math.Distance.Between(this.boat.x, this.boat.y, this.PORT_X, this.PORT_Y);
      if (dist > 230) {
        this.showEvent("⚓ 항구 근처에서만 귀환/판매할 수 있습니다.", "#fca5a5");
        return;
      }
      saveGame(this.saveData);
      window.location.href = "/harbor";
    };

    handleKeyboardInput() {
      if (!this.keys) return;
      const x = (this.keys.left?.isDown || this.keys.left2?.isDown ? -1 : 0) + (this.keys.right?.isDown || this.keys.right2?.isDown ? 1 : 0);
      const y = (this.keys.up?.isDown || this.keys.up2?.isDown ? -1 : 0) + (this.keys.down?.isDown || this.keys.down2?.isDown ? 1 : 0);
      if (!this.isFishing) {
        if (x !== 0 || y !== 0) {
          this.keyboardActive = true;
          this.move = { x, y };
        } else if (this.keyboardActive) {
          this.keyboardActive = false;
          this.move = { x: 0, y: 0 };
        }
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.fish) || Phaser.Input.Keyboard.JustDown(this.keys.fish2)) this.onFish();
    }

    tickGameTime() {
      const { info, periodChanged } = this.timeSystem.tick();
      if (periodChanged || !this.lastPeriod) {
        this.applyTimePeriod();
        this.audio.setTimePeriod(info.period);
        if (this.lastPeriod) {
          const label = info.isMagicHour ? `${info.emoji} ${info.label} — Magic Hour! 희귀 어종 출현 증가!` : `${info.emoji} ${info.label}이 되었습니다.`;
          this.showEvent(label, info.isMagicHour ? "#fde047" : "#bae6fd");
        }
        this.lastPeriod = info.period;
      }
    }

    applyTimePeriod() {
      const info = this.timeSystem.current;
      const meta = PERIOD_META[info.period];
      if (this.skyOverlay) {
        this.skyOverlay.setFillStyle(meta.skyColor, meta.overlayAlpha);
      }
    }

    update(_time: number, delta: number) {
      this.animTimer += delta;
      this.tickGameTime();
      this.handleKeyboardInput();
      this.drawHudBox();
      this.drawMinimap();
      this.updateWaveOverlays();
      this.updateMultiplayer(delta);

      if (this.isFishing) {
        this.updateBattle(delta);
        this.refreshHud();
        return;
      }

      this.updateMovement(delta);
      this.updateFishAI(delta);
      this.detectFish();
      this.refreshHud();
    }

    updateWaveOverlays() {
      const frame = Math.floor(this.animTimer / 220) % 3;
      for (const w of this.waveOverlays) {
        const phase = (w.getData("phase") || 0) + this.animTimer * 0.001;
        w.x += Math.sin(phase) * 0.05;
        const newFrame = (frame + (Math.floor(phase) % 3)) % 3;
        const wantTex = `wave_${newFrame + 1}`;
        if (w.texture && w.texture.key !== wantTex) {
          w.setTexture(wantTex);
        } else if (!w.texture) {
          w.setTexture(`wave_${frame + 1}`);
        }
      }
    }

    initMultiplayer() {
      if (!supabase || !onlineDiscordId || !this.boat) {
        if (!supabase) console.warn("Supabase env is missing. Multiplayer disabled.");
        return;
      }

      this.multiplayerReady = true;
      this.lastOnlineX = this.boat.x;
      this.lastOnlineY = this.boat.y;

      this.loadInitialOnlinePlayers();

      this.onlineChannel = supabase
        .channel(`fishing-online-${regionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "fishing_online_players",
            filter: `region_id=eq.${regionId}`,
          },
          (payload: any) => this.handleOnlinePayload(payload)
        )
        .subscribe((status: string) => {
          if (status === "SUBSCRIBED") {
            this.sendOnlinePosition(true);
          }
        });
    }

    async loadInitialOnlinePlayers() {
      if (!supabase || !onlineDiscordId) return;

      const since = new Date(Date.now() - ONLINE_STALE_MS).toISOString();

      const { data, error } = await supabase
        .from("fishing_online_players")
        .select("discord_id, display_name, region_id, x, y, direction, is_fishing, updated_at")
        .eq("region_id", regionId)
        .gt("updated_at", since)
        .limit(MAX_REMOTE_PLAYERS + 1);

      if (error) {
        console.warn("Failed to load online players:", error.message);
        return;
      }

      for (const row of (data || []) as OnlinePlayerRow[]) {
        this.upsertRemotePlayer(row);
      }
    }

    handleOnlinePayload(payload: any) {
      const row = (payload.new || payload.old) as OnlinePlayerRow | undefined;
      if (!row || row.discord_id === onlineDiscordId) return;

      if (payload.eventType === "DELETE") {
        this.removeRemotePlayer(row.discord_id);
        return;
      }

      if (row.region_id !== regionId) {
        this.removeRemotePlayer(row.discord_id);
        return;
      }

      this.upsertRemotePlayer(row);
    }

    upsertRemotePlayer(row: OnlinePlayerRow) {
      if (!row.discord_id || row.discord_id === onlineDiscordId) return;

      const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
      if (Date.now() - updatedAt > ONLINE_STALE_MS) {
        this.removeRemotePlayer(row.discord_id);
        return;
      }

      if (!this.otherPlayers.has(row.discord_id) && this.otherPlayers.size >= MAX_REMOTE_PLAYERS) {
        return;
      }

      let remote = this.otherPlayers.get(row.discord_id);

      if (!remote) {
        const sprite = this.add.image(row.x, row.y, "boat_idle_1");
        sprite.setScale(0.105);
        sprite.setAlpha(0.78);
        sprite.setDepth(24);

        const safeName = String(row.display_name || "낚시꾼").slice(0, 12);
        const nameText = this.add.text(row.x, row.y - 34, safeName, {
          fontSize: "18px",
          color: "#e0f2fe",
          align: "center",
          fontStyle: "bold",
          stroke: "#020617",
          strokeThickness: 5,
        }).setOrigin(0.5);
        nameText.setDepth(25);

        const fishingText = this.add.text(row.x, row.y - 56, "", {
          fontSize: "16px",
          color: "#facc15",
          align: "center",
          fontStyle: "bold",
          stroke: "#020617",
          strokeThickness: 5,
        }).setOrigin(0.5);
        fishingText.setDepth(26);
        fishingText.setVisible(false);

        remote = {
          sprite,
          nameText,
          fishingText,
          targetX: row.x,
          targetY: row.y,
          lastSeen: Date.now(),
        };

        this.otherPlayers.set(row.discord_id, remote);
      }

      remote.targetX = Number(row.x) || remote.targetX;
      remote.targetY = Number(row.y) || remote.targetY;
      remote.lastSeen = Date.now();

      if (row.direction === "left") {
        remote.sprite.rotation = -Math.PI / 2;
        remote.sprite.setFlipX(false);
      } else if (row.direction === "right") {
        remote.sprite.rotation = Math.PI / 2;
        remote.sprite.setFlipX(false);
      } else if (row.direction === "up") {
        remote.sprite.rotation = 0;
        remote.sprite.setFlipX(false);
      } else if (row.direction === "down") {
        remote.sprite.rotation = Math.PI;
        remote.sprite.setFlipX(false);
      }

      if (remote.fishingText) {
        remote.fishingText.setText(row.is_fishing ? "🎣 낚시중" : "");
        remote.fishingText.setVisible(Boolean(row.is_fishing));
      }
    }

    removeRemotePlayer(discordId: string) {
      const remote = this.otherPlayers.get(discordId);
      if (!remote) return;

      remote.sprite.destroy();
      remote.nameText.destroy();
      if (remote.fishingText) remote.fishingText.destroy();
      this.otherPlayers.delete(discordId);
    }

    getBoatDirection() {
      if (this.move.x < -0.1) return "left";
      if (this.move.x > 0.1) return "right";
      if (this.move.y < -0.1) return "up";
      if (this.move.y > 0.1) return "down";
      return this.lastOnlineDirection || "down";
    }

    async sendOnlinePosition(force = false) {
      if (!supabase || !onlineDiscordId || !this.boat) return;

      const direction = this.getBoatDirection();
      const moved = Phaser.Math.Distance.Between(
        this.lastOnlineX,
        this.lastOnlineY,
        this.boat.x,
        this.boat.y
      );

      if (!force && moved < ONLINE_MOVE_THRESHOLD && direction === this.lastOnlineDirection) return;

      this.lastOnlineX = this.boat.x;
      this.lastOnlineY = this.boat.y;
      this.lastOnlineDirection = direction;

      await supabase
        .from("fishing_online_players")
        .upsert(
          {
            discord_id: onlineDiscordId,
            display_name: onlineDisplayName,
            region_id: regionId,
            x: Math.round(this.boat.x),
            y: Math.round(this.boat.y),
            direction,
            is_fishing: this.isFishing,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "discord_id" }
        );
    }

    updateMultiplayer(delta: number) {
      if (!this.multiplayerReady) return;

      this.onlineSyncTimer += delta;
      this.onlineForceSyncTimer += delta;

      if (this.onlineSyncTimer >= ONLINE_SYNC_INTERVAL_MS) {
        const force = this.onlineForceSyncTimer >= ONLINE_FORCE_SYNC_MS;
        this.onlineSyncTimer = 0;
        if (force) this.onlineForceSyncTimer = 0;
        this.sendOnlinePosition(force).catch((error: any) => {
          console.warn("Failed to sync online position:", error?.message || error);
        });
      }

      const now = Date.now();

      for (const [discordId, remote] of this.otherPlayers) {
        if (now - remote.lastSeen > ONLINE_STALE_MS) {
          this.removeRemotePlayer(discordId);
          continue;
        }

        remote.sprite.x = Phaser.Math.Linear(remote.sprite.x, remote.targetX, 0.22);
        remote.sprite.y = Phaser.Math.Linear(remote.sprite.y, remote.targetY, 0.22);
        remote.nameText.x = remote.sprite.x;
        remote.nameText.y = remote.sprite.y - 34;
        if (remote.fishingText) {
          remote.fishingText.x = remote.sprite.x;
          remote.fishingText.y = remote.sprite.y - 56;
        }
      }
    }

    cleanupMultiplayer() {
      for (const discordId of Array.from(this.otherPlayers.keys())) {
        this.removeRemotePlayer(discordId);
      }

      if (this.onlineChannel && supabase) {
        supabase.removeChannel(this.onlineChannel);
        this.onlineChannel = null;
      }

      if (supabase && onlineDiscordId) {
        supabase
          .from("fishing_online_players")
          .delete()
          .eq("discord_id", onlineDiscordId)
          .then(() => undefined);
      }
    }

    updateBattle(delta: number) {
      if (this.isResolving) return;
      if (this.phase === "bite") {
        const speed = gradeInfo[this.selectedFish.grade].speed;
        const limit = this.timingBar.width / 2;
        this.pointer.x += this.pointerDirection * speed;
        if (this.pointer.x >= limit) { this.pointer.x = limit; this.pointerDirection = -1; }
        if (this.pointer.x <= -limit) { this.pointer.x = -limit; this.pointerDirection = 1; }
      }
      if (this.phase === "pull") {
        this.battleTimer += delta;
        const gradeHard =
          this.selectedFish.grade === "common" ? 1 :
          this.selectedFish.grade === "rare" ? 1.15 :
          this.selectedFish.grade === "epic" ? 1.3 :
          this.selectedFish.grade === "legend" ? 1.55 :
          this.selectedFish.grade === "mythic" ? 1.8 : 2.1;

        this.tension += 0.016 * delta * gradeHard;
        this.updateTensionBar();
        if (this.battleTimer > 3900 || this.tension >= 100) this.finishCatch(false, "miss");
      }
      if (this.phase === "reel") {
        const relief = this.battleQuality === "perfect" ? 0.018 : 0.012;
        this.tension -= relief * delta;
        this.reelProgress -= 0.008 * delta;
        this.reelProgress = Phaser.Math.Clamp(this.reelProgress, 0, 100);
        this.updateTensionBar();
        if (this.tension <= 0) this.tension = 4;
      }
    }

    updateMovement(delta: number) {
      const engine = this.saveData.upgrades.engine || 0;
      const speed = 4.5 + engine * 0.7;
      const moving = this.move.x !== 0 || this.move.y !== 0;
      const dt = delta / 16.6;

      if (moving && this.fuel > 0) {
        this.boat.x += this.move.x * speed * dt;
        this.boat.y += this.move.y * speed * dt;
        this.fuel -= 0.018 * dt;
        if (Math.abs(this.move.x) > 0.6 || Math.abs(this.move.y) > 0.6) {
          if (Math.random() < 0.04) this.cameras.main.shake(80, 0.0025);
        }
      } else if (moving && this.fuel <= 0) {
        this.showEvent("⛽ 연료가 없습니다. 항구로 돌아가세요.", "#fca5a5");
      }
      this.boat.x = Phaser.Math.Clamp(this.boat.x, 50, this.WORLD_WIDTH - 50);
      this.boat.y = Phaser.Math.Clamp(this.boat.y, 50, this.WORLD_HEIGHT - 50);

      const bobAmp = moving ? 1.2 : 2.6;
      const bob = Math.sin(this.animTimer / 220) * bobAmp;
      this.boat.y = this.boat.y - this.lastBob + bob;
      this.lastBob = bob;

      if (moving) {
        this.boat.rotation = Math.atan2(this.move.y, this.move.x) + Math.PI / 2;
        this.boat.setTexture(Math.floor(this.animTimer / 180) % 2 === 0 ? "boat_move_1" : "boat_move_2");
        this.boat.setDepth(30);
      } else {
        this.boat.setTexture(Math.floor(this.animTimer / 550) % 2 === 0 ? "boat_idle_1" : "boat_idle_2");
      }
    }

    updateFishAI(delta: number) {
      for (const fish of this.fishes) {
        if (!fish.active) continue;
        const isBoss = fish.getData("boss");
        const dist = Phaser.Math.Distance.Between(this.boat.x, this.boat.y, fish.x, fish.y);
        const panic = fish.getData("panic");
        let dx = fish.getData("dirX") || 0;
        let dy = fish.getData("dirY") || 0;
        if (dist < (panic || isBoss ? 210 : 145)) {
          const angle = Phaser.Math.Angle.Between(this.boat.x, this.boat.y, fish.x, fish.y);
          dx = Math.cos(angle) * (isBoss ? 1.9 : panic ? 2.4 : 1.25);
          dy = Math.sin(angle) * (isBoss ? 1.9 : panic ? 2.4 : 1.25);
          fish.setAlpha(1);
          if ((panic || isBoss) && Math.random() < 0.006) this.showEvent(isBoss ? "🐋 거대한 그림자가 움직인다..." : "⚠️ 희귀 물고기가 도망친다!", "#fb7185");
        } else if (Math.random() < 0.006) {
          dx = Phaser.Math.FloatBetween(-0.45, 0.45);
          dy = Phaser.Math.FloatBetween(-0.45, 0.45);
          fish.setData("dirX", dx);
          fish.setData("dirY", dy);
        }
        fish.x += dx * (delta / 16.6);
        fish.y += dy * (delta / 16.6);
        fish.x = Phaser.Math.Clamp(fish.x, 60, this.WORLD_WIDTH - 60);
        fish.y = Phaser.Math.Clamp(fish.y, 60, this.WORLD_HEIGHT - 60);
        if (!isBoss && (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1)) fish.rotation = Math.atan2(dy, dx) + Math.PI / 2;
      }
    }

    detectFish() {
      this.canFish = false;
      this.targetFish = null;
      const detectRange = 128 + (this.saveData.upgrades.radar || 0) * 18;
      for (const fish of this.fishes) {
        const dist = Phaser.Math.Distance.Between(this.boat.x, this.boat.y, fish.x, fish.y);
        if (dist < detectRange) {
          this.canFish = true;
          this.targetFish = fish;
          this.hintText.setText(fish.getData("boss") ? "🐋 거대 그림자 발견! 낚시 버튼!" : "🎣 물고기 실루엣 발견! 낚시 버튼!");
          if (typeof fish.setTint === "function") {
            fish.setTint(0xffffaa);
          }
          break;
        } else {
          if (typeof fish.clearTint === "function") {
            fish.clearTint();
          }
        }
      }
      if (!this.canFish) this.hintText.setText("");
    }

    shutdown() {
      window.removeEventListener("ocean-move", this.onMove as EventListener);
      window.removeEventListener("ocean-fish", this.onFish as EventListener);
      window.removeEventListener("ocean-return", this.returnToHarbor as EventListener);
    }
  }

  return OceanScene;
}
