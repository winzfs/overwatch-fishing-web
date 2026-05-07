"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { gradeInfo, pickFish, regions } from "../../data/fishingData";

type SaveData = {
  gold: number;
  exp: number;
  caught: number;
  collection: Record<string, number>;
  upgrades: {
    rod: number;
    engine: number;
    radar: number;
  };
  quests?: {
    date: string;
    claimed: Record<string, boolean>;
  };
  achievements?: Record<string, boolean>;
  records?: Record<string, { cm: number; kg: number }>;
};

const SAVE_KEY = "overwatch-fishing-save-v1";

type DailySeaEvent = {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  goldMultiplier: number;
  expMultiplier: number;
  rareBonus: number;
  bgTint: number;
};

const DAILY_EVENTS: DailySeaEvent[] = [
  {
    id: "calm",
    name: "잔잔한 바다",
    desc: "평범하지만 안정적인 낚시 날입니다.",
    emoji: "🌤️",
    goldMultiplier: 1,
    expMultiplier: 1,
    rareBonus: 0,
    bgTint: 0x000000,
  },
  {
    id: "gold_tide",
    name: "황금 물결",
    desc: "포획 보상 골드가 30% 증가합니다.",
    emoji: "🌅",
    goldMultiplier: 1.3,
    expMultiplier: 1,
    rareBonus: 0,
    bgTint: 0x78350f,
  },
  {
    id: "school",
    name: "물고기 떼 출몰",
    desc: "물고기 수가 증가하고 희귀 실루엣이 조금 더 자주 보입니다.",
    emoji: "🐟",
    goldMultiplier: 1,
    expMultiplier: 1.1,
    rareBonus: 1,
    bgTint: 0x075985,
  },
  {
    id: "storm",
    name: "폭풍 전야",
    desc: "낚시는 더 긴장되지만 경험치가 40% 증가합니다.",
    emoji: "⛈️",
    goldMultiplier: 1,
    expMultiplier: 1.4,
    rareBonus: 1,
    bgTint: 0x1e1b4b,
  },
  {
    id: "legend_scent",
    name: "전설의 기척",
    desc: "전설 이상 실루엣 등장률이 증가합니다.",
    emoji: "✨",
    goldMultiplier: 1.15,
    expMultiplier: 1.15,
    rareBonus: 2,
    bgTint: 0x581c87,
  },
];

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getDailySeaEvent(regionId: string): DailySeaEvent {
  const key = `${new Date().toISOString().slice(0, 10)}-${regionId}`;
  const index = hashString(key) % DAILY_EVENTS.length;
  return DAILY_EVENTS[index];
}


function defaultSave(): SaveData {
  return {
    gold: 3000,
    exp: 0,
    caught: 0,
    collection: {},
    upgrades: {
      rod: 0,
      engine: 0,
      radar: 0,
    },
    quests: {
      date: new Date().toISOString().slice(0, 10),
      claimed: {},
    },
    achievements: {},
    records: {},
  };
}

function loadSave(): SaveData {
  if (typeof window === "undefined") return defaultSave();

  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();

    const parsed = JSON.parse(raw);
    return {
      ...defaultSave(),
      ...parsed,
      collection: parsed.collection || {},
      upgrades: {
        ...defaultSave().upgrades,
        ...(parsed.upgrades || {}),
      },
      quests: parsed.quests || defaultSave().quests,
      achievements: parsed.achievements || {},
      records: parsed.records || {},
    };
  } catch {
    return defaultSave();
  }
}

function saveGame(data: SaveData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

type BattlePhase = "idle" | "bite" | "pull" | "reel" | "result";

function OceanGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const regionId = searchParams.get("region") || "busan";

  useEffect(() => {
    let game: any = null;
    const currentRegion = regions.find((r) => r.id === regionId) || regions[0];

    async function startGame() {
      const Phaser = (await import("phaser")).default;

      class FunFishingScene extends Phaser.Scene {
        boat: any;
        fishes: any[] = [];
        fishText: any;
        hudText: any;
        catchHint: any;
        nearbySign: any;
        eventText: any;

        move = { x: 0, y: 0 };
        keyboardActive = false;
        keys: any = {};
        canFish = false;
        targetFish: any = null;

        panel: any;
        timingBar: any;
        hitZone: any;
        pointer: any;
        battleTitle: any;
        fishNameText: any;
        battleGuide: any;
        battleText: any;
        resultBadge: any;
        tensionBg: any;
        tensionFill: any;

        isFishing = false;
        isResolving = false;
        phase: BattlePhase = "idle";
        pointerDirection = 1;
        tension = 50;
        reelProgress = 0;
        battleTimer = 0;
        requiredDirection = "LEFT";
        selectedFish = pickFish(regionId);
        dailyEvent: DailySeaEvent = getDailySeaEvent(regionId);
        fishSize = { cm: 0, kg: 0, sizeRank: "중형", multiplier: 1 };

        saveData: SaveData = defaultSave();
        gold = 3000;
        exp = 0;
        caught = 0;
        animTimer = 0;

        constructor() {
          super("FunFishingScene");
        }

        preload() {
          this.load.image("ocean", "/assets/backgrounds/ocean_tile.png");
          this.load.image("shallow", "/assets/backgrounds/shallow_water_tile.png");
          this.load.image("island_tropical", "/assets/backgrounds/island_tropical.png");
          this.load.image("island_rocky", "/assets/backgrounds/island_rocky.png");
          this.load.image("island_sandbar", "/assets/backgrounds/island_sandbar.png");

          this.load.image("boat_idle_1", "/assets/sprites/boat_idle_1.png");
          this.load.image("boat_idle_2", "/assets/sprites/boat_idle_2.png");
          this.load.image("boat_move_1", "/assets/sprites/boat_move_1.png");
          this.load.image("boat_move_2", "/assets/sprites/boat_move_2.png");

          this.load.image("fish_common", "/assets/sprites/fish_shadow_common.png");
          this.load.image("fish_rare", "/assets/sprites/fish_shadow_rare.png");
          this.load.image("fish_epic", "/assets/sprites/fish_shadow_epic.png");
          this.load.image("fish_legend", "/assets/sprites/fish_shadow_legend.png");
          this.load.image("fish_mythic", "/assets/sprites/fish_shadow_mythic.png");
          this.load.image("fish_transcend", "/assets/sprites/fish_shadow_transcend.png");

          this.load.image("burst_rare", "/assets/effects/burst_rare.png");
          this.load.image("burst_epic", "/assets/effects/burst_epic.png");
          this.load.image("burst_legend", "/assets/effects/burst_legend.png");
          this.load.image("burst_mythic", "/assets/effects/burst_mythic.png");
          this.load.image("burst_transcend", "/assets/effects/burst_transcend.png");

          this.load.image("fish_nearby_sign", "/assets/ui/fish_nearby_sign.png");
          this.load.image("result_perfect", "/assets/ui/result_perfect.png");
          this.load.image("result_good", "/assets/ui/result_good.png");
          this.load.image("result_miss", "/assets/ui/result_miss.png");
        }

        create() {
          this.saveData = loadSave();
          this.gold = this.saveData.gold;
          this.exp = this.saveData.exp;
          this.caught = this.saveData.caught;

          const width = this.scale.width;
          const height = this.scale.height;

          this.add.rectangle(width / 2, height / 2, width, height, currentRegion.bg);
          this.drawPixelOcean(width, height);
          this.placeRegionDecor(width, height);
          this.spawnRegionFish();

          this.boat = this.add.image(width / 2, height / 2, "boat_idle_1");
          this.boat.setScale(0.13);
          this.boat.setDepth(30);

          this.keys = this.input.keyboard?.addKeys({
            up: "W",
            down: "S",
            left: "A",
            right: "D",
            up2: "UP",
            down2: "DOWN",
            left2: "LEFT",
            right2: "RIGHT",
            fish: "SPACE",
            fish2: "ENTER",
          });

          this.add
            .text(16, 18, `${currentRegion.emoji} ${currentRegion.name}`, {
              fontSize: "22px",
              color: "#ffffff",
              fontStyle: "bold",
              backgroundColor: "rgba(0,0,0,0.55)",
              padding: { x: 10, y: 8 },
            })
            .setDepth(80);

          this.add
            .text(16, 124, `${this.dailyEvent.emoji} ${this.dailyEvent.name}\n${this.dailyEvent.desc}`, {
              fontSize: "14px",
              color: "#e0f2fe",
              fontStyle: "bold",
              backgroundColor: "rgba(0,0,0,0.45)",
              padding: { x: 10, y: 8 },
              wordWrap: { width: 260 },
            })
            .setDepth(80);

          if (this.dailyEvent.id !== "calm") {
            const overlay = this.add.rectangle(width / 2, height / 2, width, height, this.dailyEvent.bgTint, 0.18);
            overlay.setDepth(2);
          }

          this.hudText = this.add
            .text(16, 72, "", {
              fontSize: "17px",
              color: "#ffffff",
              backgroundColor: "rgba(0,0,0,0.45)",
              padding: { x: 10, y: 8 },
            })
            .setDepth(80);

          this.eventText = this.add.text(width / 2, 118, "", {
            fontSize: "20px",
            color: "#fde047",
            align: "center",
            fontStyle: "bold",
            backgroundColor: "rgba(0,0,0,0.55)",
            padding: { x: 14, y: 8 },
          });
          this.eventText.setOrigin(0.5);
          this.eventText.setVisible(false);
          this.eventText.setDepth(95);

          this.fishText = this.add.text(width / 2, height - 142, "", {
            fontSize: "23px",
            color: "#fde047",
            align: "center",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 5,
          });
          this.fishText.setOrigin(0.5);
          this.fishText.setDepth(90);

          this.nearbySign = this.add.image(width / 2, height - 88, "fish_nearby_sign");
          this.nearbySign.setScale(0.34);
          this.nearbySign.setVisible(false);
          this.nearbySign.setDepth(85);

          this.catchHint = this.add.text(width / 2, height - 76, "", {
            fontSize: "15px",
            color: "#ffffff",
            align: "center",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4,
          });
          this.catchHint.setOrigin(0.5);
          this.catchHint.setDepth(90);

          this.createBattlePanel();
          this.refreshHud();

          window.addEventListener("ocean-move", this.onMove as EventListener);
          window.addEventListener("ocean-fish", this.onFish as EventListener);
        }

        drawPixelOcean(width: number, height: number) {
          for (let x = -20; x < width + 120; x += 100) {
            for (let y = -20; y < height + 120; y += 100) {
              const texture = (x + y) % 300 === 0 ? "shallow" : "ocean";
              const tile = this.add.image(x, y, texture).setOrigin(0);
              tile.setAlpha(texture === "shallow" ? 0.2 : 0.85);
            }
          }

          for (let i = 0; i < 34; i++) {
            const sparkle = this.add.circle(
              Phaser.Math.Between(20, width - 20),
              Phaser.Math.Between(110, height - 120),
              Phaser.Math.Between(1, 3),
              0xffffff,
              Phaser.Math.FloatBetween(0.22, 0.5)
            );

            this.tweens.add({
              targets: sparkle,
              alpha: 0.04,
              duration: Phaser.Math.Between(900, 1800),
              yoyo: true,
              repeat: -1,
            });
          }
        }

        placeRegionDecor(width: number, height: number) {
          const islandData =
            regionId === "hanamura"
              ? [["island_sandbar", width * 0.2, height * 0.27, 0.28]]
              : regionId === "null_sector"
              ? [["island_rocky", width * 0.78, height * 0.25, 0.28]]
              : [
                  ["island_tropical", width * 0.22, height * 0.25, 0.28],
                  ["island_rocky", width * 0.82, height * 0.75, 0.22],
                ];

          for (const [texture, x, y, scale] of islandData as any[]) {
            const island = this.add.image(x, y, texture);
            island.setScale(scale);
            island.setAlpha(0.92);
            island.setDepth(5);
          }
        }

        spawnRegionFish() {
          const radar = this.saveData.upgrades.radar;

          const textures = [
            "fish_common",
            "fish_common",
            "fish_common",
            "fish_rare",
            "fish_rare",
            "fish_epic",
            "fish_legend",
          ];

          if (radar >= 1) textures.push("fish_epic");
          if (radar >= 2) textures.push("fish_legend");
          if (radar >= 3) textures.push("fish_mythic");

          if (this.dailyEvent.rareBonus >= 1) {
            textures.push("fish_rare", "fish_epic");
          }

          if (this.dailyEvent.rareBonus >= 2) {
            textures.push("fish_legend", "fish_mythic");
          }

          if (regionId === "null_sector" || regionId === "horizon" || regionId === "antarctica") {
            textures.push("fish_mythic", "fish_transcend");
          }

          const fishCount = this.dailyEvent.id === "school" ? 21 : 15;

          for (let i = 0; i < fishCount; i++) {
            this.spawnOneFish(Phaser.Utils.Array.GetRandom(textures));
          }
        }

        spawnOneFish(texture?: string) {
          const width = this.scale.width;
          const height = this.scale.height;
          const chosen =
            texture || Phaser.Utils.Array.GetRandom(["fish_common", "fish_common", "fish_rare", "fish_epic"]);

          const fish = this.add.image(
            Phaser.Math.Between(80, width - 80),
            Phaser.Math.Between(135, height - 165),
            chosen
          );

          fish.setScale(Phaser.Math.FloatBetween(0.073, 0.115));
          fish.setAlpha(Phaser.Math.FloatBetween(0.62, 0.9));
          fish.setDepth(15);
          fish.setData("textureName", chosen);
          fish.setData("panic", chosen.includes("legend") || chosen.includes("mythic") || chosen.includes("transcend"));
          fish.setData("dirX", Phaser.Math.FloatBetween(-0.35, 0.35));
          fish.setData("dirY", Phaser.Math.FloatBetween(-0.35, 0.35));

          this.fishes.push(fish);

          this.tweens.add({
            targets: fish,
            scaleX: fish.scaleX * 1.05,
            scaleY: fish.scaleY * 0.97,
            duration: Phaser.Math.Between(600, 1100),
            yoyo: true,
            repeat: -1,
          });
        }

        createBattlePanel() {
          const width = this.scale.width;
          const height = this.scale.height;

          this.panel = this.add.container(width / 2, height / 2);
          this.panel.setVisible(false);
          this.panel.setDepth(130);

          const bg = this.add.rectangle(0, 0, width * 0.92, 430, 0x020617, 0.96);
          bg.setStrokeStyle(5, 0x22d3ee);

          this.battleTitle = this.add.text(0, -175, "🎣 낚시 전투!", {
            fontSize: "34px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 5,
          });
          this.battleTitle.setOrigin(0.5);

          this.fishNameText = this.add.text(0, -130, "", {
            fontSize: "21px",
            color: "#fde047",
            align: "center",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4,
            wordWrap: { width: width * 0.82 },
          });
          this.fishNameText.setOrigin(0.5);

          this.battleGuide = this.add.text(0, -86, "", {
            fontSize: "18px",
            color: "#cbd5e1",
            align: "center",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4,
            wordWrap: { width: width * 0.82 },
          });
          this.battleGuide.setOrigin(0.5);

          this.timingBar = this.add.rectangle(0, -20, width * 0.72, 32, 0x172554);
          this.timingBar.setStrokeStyle(4, 0xffffff, 0.55);

          this.hitZone = this.add.rectangle(0, -20, width * 0.18, 46, 0x22c55e, 0.92);
          this.hitZone.setStrokeStyle(3, 0xbbf7d0, 1);

          this.pointer = this.add.rectangle(-width * 0.34, -20, 12, 72, 0xfacc15);
          this.pointer.setStrokeStyle(2, 0xffffff, 0.9);

          this.tensionBg = this.add.rectangle(0, 54, width * 0.72, 24, 0x1e293b);
          this.tensionBg.setStrokeStyle(3, 0xffffff, 0.4);

          this.tensionFill = this.add.rectangle(-width * 0.36, 54, width * 0.36, 24, 0x22c55e);
          this.tensionFill.setOrigin(0, 0.5);

          this.resultBadge = this.add.image(0, 92, "result_good");
          this.resultBadge.setScale(0.42);
          this.resultBadge.setVisible(false);

          this.battleText = this.add.text(0, 126, "", {
            fontSize: "25px",
            color: "#fde047",
            fontStyle: "bold",
            align: "center",
            stroke: "#000000",
            strokeThickness: 4,
            wordWrap: { width: width * 0.82 },
          });
          this.battleText.setOrigin(0.5);

          const sub = this.add.text(0, 184, "PC: WASD/방향키 이동, Space/Enter 낚시 · 모바일: 버튼 조작", {
            fontSize: "13px",
            color: "#94a3b8",
            stroke: "#000000",
            strokeThickness: 3,
            align: "center",
            wordWrap: { width: width * 0.82 },
          });
          sub.setOrigin(0.5);

          this.panel.add([
            bg,
            this.battleTitle,
            this.fishNameText,
            this.battleGuide,
            this.timingBar,
            this.hitZone,
            this.pointer,
            this.tensionBg,
            this.tensionFill,
            this.resultBadge,
            this.battleText,
            sub,
          ]);
        }

        refreshHud() {
          const { rod, engine, radar } = this.saveData.upgrades;
          this.hudText.setText(
            `💰 ${this.gold.toLocaleString()}G   ✨ EXP ${this.exp}   🐟 ${this.caught}\n🎣 Lv.${rod}  🚤 Lv.${engine}  📡 Lv.${radar}\n${this.dailyEvent.emoji} ${this.dailyEvent.name}`
          );
        }

        showEvent(message: string, color = "#fde047") {
          this.eventText.setText(message);
          this.eventText.setColor(color);
          this.eventText.setVisible(true);
          this.eventText.setAlpha(1);
          this.eventText.y = 118;

          this.tweens.add({
            targets: this.eventText,
            y: 94,
            alpha: 0,
            duration: 1900,
            onComplete: () => this.eventText.setVisible(false),
          });
        }

        persist() {
          this.saveData.gold = this.gold;
          this.saveData.exp = this.exp;
          this.saveData.caught = this.caught;
          saveGame(this.saveData);
        }

        makeFishSize(grade: string) {
          const gradeBonus =
            grade === "common" ? 1 :
            grade === "rare" ? 1.25 :
            grade === "epic" ? 1.6 :
            grade === "legend" ? 2.2 :
            grade === "mythic" ? 3.1 : 4.5;

          const roll = Math.random();
          const rank =
            roll > 0.985 ? "괴물급" :
            roll > 0.92 ? "초대형" :
            roll > 0.72 ? "대형" :
            roll > 0.28 ? "중형" : "소형";

          const rankMult =
            rank === "괴물급" ? 3.2 :
            rank === "초대형" ? 2.2 :
            rank === "대형" ? 1.45 :
            rank === "중형" ? 1 : 0.72;

          const cm = Math.round((25 + Math.random() * 70) * gradeBonus * rankMult * 10) / 10;
          const kg = Math.round((cm * cm * 0.0009 + Math.random() * 3) * gradeBonus * 10) / 10;
          const multiplier = Math.max(0.8, rankMult);

          return { cm, kg, sizeRank: rank, multiplier };
        }

        onMove = (event: Event) => {
          const custom = event as CustomEvent<{ x: number; y: number }>;

          // 모바일에서는 낚시 전투 2단계에서도 방향 입력이 필요함.
          // 배 이동은 update()에서 isFishing일 때 막히므로,
          // 여기서는 move 값을 항상 갱신해도 배가 움직이지 않음.
          this.move = custom.detail;
        };

        onFish = () => {
          if (this.isResolving) return;

          if (this.isFishing) {
            this.handleBattleInput();
            return;
          }

          if (!this.canFish || !this.targetFish) {
            this.fishText.setText("🐟 물고기 실루엣 근처로 이동하세요!");
            this.catchHint.setText("");
            this.nearbySign.setVisible(false);

            this.time.delayedCall(850, () => {
              if (!this.canFish) this.fishText.setText("");
            });
            return;
          }

          this.startFishingBattle();
        };

        startFishingBattle() {
          if (this.isFishing || this.isResolving) return;

          this.isFishing = true;
          this.isResolving = false;
          this.phase = "bite";
          this.tension = 50;
          this.reelProgress = 0;
          this.battleTimer = 0;
          this.move = { x: 0, y: 0 };
          this.selectedFish = pickFish(regionId);
        dailyEvent: DailySeaEvent = getDailySeaEvent(regionId);
          this.fishSize = this.makeFishSize(this.selectedFish.grade);

          const grade = gradeInfo[this.selectedFish.grade];

          if (["legend", "mythic", "transcend"].includes(this.selectedFish.grade)) {
            this.cameras.main.shake(260, 0.012);
            this.showEvent(`${grade.emoji} 희귀한 기척이 느껴진다!`, grade.color);
          }

          this.fishNameText.setText(`${grade.emoji} ${grade.name} 입질!`);
          this.fishNameText.setColor(grade.color);
          this.battleText.setText("");
          this.resultBadge.setVisible(false);

          const width = this.scale.width;
          const rodBonus = this.saveData.upgrades.rod * 0.018;
          this.hitZone.width = width * Math.min(0.34, grade.zone + rodBonus);
          this.hitZone.x = Phaser.Math.Between(-Math.floor(width * 0.22), Math.floor(width * 0.22));
          this.pointer.x = -this.timingBar.width / 2;
          this.pointerDirection = 1;

          this.battleGuide.setText("1단계 입질: 초록 구간에서 낚시 버튼!");
          this.panel.setVisible(true);
          this.fishText.setText("");
          this.catchHint.setText("");
          this.nearbySign.setVisible(false);
          this.updateTensionBar();
        }

        handleBattleInput() {
          if (this.phase === "bite") {
            this.checkBite();
            return;
          }

          if (this.phase === "pull") {
            this.checkPullInput();
            return;
          }

          if (this.phase === "reel") {
            this.reelProgress += 14 + this.saveData.upgrades.rod * 2;
            this.tension += 7;
            this.battleText.setText(`릴 감기! ${Math.min(100, Math.floor(this.reelProgress))}%`);
            this.updateTensionBar();

            if (this.reelProgress >= 100) {
              this.finishCatch(true, "perfect");
            }

            if (this.tension >= 100) {
              this.finishCatch(false, "miss");
            }
          }
        }

        checkBite() {
          const center = this.pointer.x;
          const left = this.hitZone.x - this.hitZone.width / 2;
          const right = this.hitZone.x + this.hitZone.width / 2;
          const perfectRange = Math.max(12, this.hitZone.width * 0.18);
          const perfect = Math.abs(center - this.hitZone.x) <= perfectRange;
          const success = center >= left && center <= right;

          if (!success) {
            this.finishCatch(false, "miss");
            return;
          }

          this.phase = "pull";
          this.resultBadge.setVisible(false);
          this.requiredDirection = Phaser.Utils.Array.GetRandom(["LEFT", "RIGHT", "UP", "DOWN"]);
          this.battleGuide.setText(`2단계 저항: ${this.requiredDirection} 방향을 누른 뒤 낚시 버튼!`);
          this.battleText.setText(perfect ? "🌟 완벽한 입질! 저항을 받아내자!" : "✅ 입질 성공! 저항을 받아내자!");
          this.tension += perfect ? -8 : 4;
          this.updateTensionBar();
        }

        getCurrentInputDirection() {
          if (this.keys.left?.isDown || this.keys.left2?.isDown || this.move.x < 0) return "LEFT";
          if (this.keys.right?.isDown || this.keys.right2?.isDown || this.move.x > 0) return "RIGHT";
          if (this.keys.up?.isDown || this.keys.up2?.isDown || this.move.y < 0) return "UP";
          if (this.keys.down?.isDown || this.keys.down2?.isDown || this.move.y > 0) return "DOWN";
          return "";
        }

        checkPullInput() {
          const input = this.getCurrentInputDirection();

          if (input === this.requiredDirection) {
            this.phase = "reel";
            this.battleGuide.setText("3단계 릴링: 낚시 버튼을 연타하되 장력이 터지지 않게!");
            this.battleText.setText("🎣 릴링 시작!");
            this.tension -= 18;
            this.updateTensionBar();
          } else {
            this.tension += 24;
            this.requiredDirection = Phaser.Utils.Array.GetRandom(["LEFT", "RIGHT", "UP", "DOWN"]);
            this.battleGuide.setText(`방향이 틀렸다! ${this.requiredDirection} 방향 후 낚시 버튼!`);
            this.battleText.setText("⚠️ 장력이 올라간다!");

            if (this.tension >= 100) {
              this.finishCatch(false, "miss");
            }

            this.updateTensionBar();
          }
        }

        updateTensionBar() {
          this.tension = Phaser.Math.Clamp(this.tension, 0, 100);
          const maxWidth = this.scale.width * 0.72;
          this.tensionFill.width = maxWidth * (this.tension / 100);

          if (this.tension >= 80) this.tensionFill.fillColor = 0xef4444;
          else if (this.tension >= 55) this.tensionFill.fillColor = 0xfacc15;
          else this.tensionFill.fillColor = 0x22c55e;
        }

        finishCatch(success: boolean, quality: "perfect" | "good" | "miss") {
          if (this.isResolving) return;
          this.isResolving = true;
          this.phase = "result";

          const grade = gradeInfo[this.selectedFish.grade];

          if (success) {
            const qualityBonus = quality === "perfect" ? 1.35 : 1;
            const sizeBonus = this.fishSize.multiplier;
            const goldGain = Math.floor(
              this.selectedFish.price * qualityBonus * sizeBonus * this.dailyEvent.goldMultiplier
            );
            const expGain = Math.floor(
              this.selectedFish.exp * qualityBonus * Math.max(1, sizeBonus * 0.7) * this.dailyEvent.expMultiplier
            );

            this.gold += goldGain;
            this.exp += expGain;
            this.caught += 1;

            this.saveData.collection[this.selectedFish.id] =
              (this.saveData.collection[this.selectedFish.id] || 0) + 1;

            const oldRecord = this.saveData.records?.[this.selectedFish.id];
            if (!this.saveData.records) this.saveData.records = {};

            const isRecord = !oldRecord || this.fishSize.cm > oldRecord.cm;
            if (isRecord) {
              this.saveData.records[this.selectedFish.id] = {
                cm: this.fishSize.cm,
                kg: this.fishSize.kg,
              };
            }

            this.persist();
            this.refreshHud();

            if (this.targetFish) {
              const burst = this.add.image(this.targetFish.x, this.targetFish.y, grade.burst);
              burst.setScale(0.42);
              burst.setDepth(70);

              this.tweens.add({
                targets: burst,
                scale: 1.1,
                alpha: 0,
                duration: 750,
                onComplete: () => burst.destroy(),
              });

              this.targetFish.destroy();
              this.fishes = this.fishes.filter((f) => f !== this.targetFish);
              this.spawnOneFish();
            }

            this.targetFish = null;
            this.canFish = false;

            this.resultBadge.setTexture(quality === "perfect" ? "result_perfect" : "result_good");
            this.resultBadge.setVisible(true);
            this.battleText.setColor(quality === "perfect" ? "#fde047" : "#86efac");
            this.battleText.setText(
              `${grade.emoji} ${this.selectedFish.name}\n${this.fishSize.sizeRank} · ${this.fishSize.cm}cm · ${this.fishSize.kg}kg\n+${goldGain.toLocaleString()}G / +${expGain}EXP${isRecord ? "\n🏆 신기록!" : ""}${this.dailyEvent.id !== "calm" ? "\n" + this.dailyEvent.emoji + " 이벤트 보너스 적용" : ""}`
            );

            if (this.fishSize.sizeRank === "괴물급") {
              this.cameras.main.shake(320, 0.015);
              this.showEvent("🐋 괴물급 사이즈!", "#fde047");
            }
          } else {
            if (this.targetFish) {
              this.targetFish.destroy();
              this.fishes = this.fishes.filter((f) => f !== this.targetFish);
              this.spawnOneFish();
            }

            this.targetFish = null;
            this.canFish = false;
            this.resultBadge.setTexture("result_miss");
            this.resultBadge.setVisible(true);
            this.battleText.setColor("#fca5a5");
            this.battleText.setText("줄이 풀렸다!\n물고기가 도망갔습니다.");
          }

          this.time.delayedCall(1850, () => {
            this.panel.setVisible(false);
            this.isFishing = false;
            this.isResolving = false;
            this.phase = "idle";
            this.battleText.setText("");
            this.resultBadge.setVisible(false);
          });
        }

        handleKeyboardInput() {
          if (!this.keys) return;

          const x =
            (this.keys.left?.isDown || this.keys.left2?.isDown ? -1 : 0) +
            (this.keys.right?.isDown || this.keys.right2?.isDown ? 1 : 0);

          const y =
            (this.keys.up?.isDown || this.keys.up2?.isDown ? -1 : 0) +
            (this.keys.down?.isDown || this.keys.down2?.isDown ? 1 : 0);

          if (!this.isFishing) {
            if (x !== 0 || y !== 0) {
              this.keyboardActive = true;
              this.move = { x, y };
            } else if (this.keyboardActive) {
              this.keyboardActive = false;
              this.move = { x: 0, y: 0 };
            }
          }

          if (Phaser.Input.Keyboard.JustDown(this.keys.fish) || Phaser.Input.Keyboard.JustDown(this.keys.fish2)) {
            this.onFish();
          }
        }

        update(_time: number, delta: number) {
          this.animTimer += delta;
          this.handleKeyboardInput();

          if (this.isFishing) {
            if (!this.isResolving) {
              if (this.phase === "bite") {
                const speed = gradeInfo[this.selectedFish.grade].speed;
                const limit = this.timingBar.width / 2;

                this.pointer.x += this.pointerDirection * speed;

                if (this.pointer.x >= limit) {
                  this.pointer.x = limit;
                  this.pointerDirection = -1;
                }

                if (this.pointer.x <= -limit) {
                  this.pointer.x = -limit;
                  this.pointerDirection = 1;
                }
              }

              if (this.phase === "pull") {
                this.battleTimer += delta;
                this.tension += 0.018 * delta;
                this.updateTensionBar();

                if (this.battleTimer > 4200 || this.tension >= 100) {
                  this.finishCatch(false, "miss");
                }
              }

              if (this.phase === "reel") {
                this.tension -= 0.018 * delta;
                this.reelProgress -= 0.006 * delta;
                this.reelProgress = Phaser.Math.Clamp(this.reelProgress, 0, 100);
                this.updateTensionBar();

                if (this.tension <= 0) this.tension = 4;
              }
            }

            return;
          }

          const engineBonus = this.saveData.upgrades.engine * 0.7;
          const speed = 5 + engineBonus;
          const moving = this.move.x !== 0 || this.move.y !== 0;

          this.boat.x += this.move.x * speed;
          this.boat.y += this.move.y * speed;

          this.boat.x = Phaser.Math.Clamp(this.boat.x, 55, this.scale.width - 55);
          this.boat.y = Phaser.Math.Clamp(this.boat.y, 82, this.scale.height - 92);

          if (moving) {
            this.boat.rotation = Math.atan2(this.move.y, this.move.x) + Math.PI / 2;
            this.boat.setTexture(Math.floor(this.animTimer / 180) % 2 === 0 ? "boat_move_1" : "boat_move_2");
          } else {
            this.boat.setTexture(Math.floor(this.animTimer / 550) % 2 === 0 ? "boat_idle_1" : "boat_idle_2");
          }

          this.updateFishAI(delta);
          this.detectFish();
        }

        updateFishAI(delta: number) {
          const width = this.scale.width;
          const height = this.scale.height;

          for (const fish of this.fishes) {
            const dist = Phaser.Math.Distance.Between(this.boat.x, this.boat.y, fish.x, fish.y);
            const panic = fish.getData("panic");

            let dx = fish.getData("dirX") || 0;
            let dy = fish.getData("dirY") || 0;

            if (dist < (panic ? 190 : 145)) {
              const angle = Phaser.Math.Angle.Between(this.boat.x, this.boat.y, fish.x, fish.y);
              dx = Math.cos(angle) * (panic ? 2.6 : 1.3);
              dy = Math.sin(angle) * (panic ? 2.6 : 1.3);
              fish.setAlpha(1);

              if (panic && Math.random() < 0.012) {
                this.showEvent("⚠️ 희귀 물고기가 도망친다!", "#fb7185");
              }
            } else if (Math.random() < 0.008) {
              dx = Phaser.Math.FloatBetween(-0.45, 0.45);
              dy = Phaser.Math.FloatBetween(-0.45, 0.45);
              fish.setData("dirX", dx);
              fish.setData("dirY", dy);
            }

            fish.x += dx * (delta / 16.6);
            fish.y += dy * (delta / 16.6);

            fish.x = Phaser.Math.Clamp(fish.x, 60, width - 60);
            fish.y = Phaser.Math.Clamp(fish.y, 122, height - 140);

            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
              fish.rotation = Math.atan2(dy, dx) + Math.PI / 2;
            }
          }
        }

        detectFish() {
          this.canFish = false;
          this.targetFish = null;

          const detectRange = 122 + this.saveData.upgrades.radar * 18;

          for (const fish of this.fishes) {
            const dist = Phaser.Math.Distance.Between(this.boat.x, this.boat.y, fish.x, fish.y);

            if (dist < detectRange) {
              this.canFish = true;
              this.targetFish = fish;
              this.fishText.setText("🎣 물고기 실루엣 발견!");
              this.catchHint.setText("PC: Space/Enter · 모바일: 오른쪽 🎣 버튼");
              this.nearbySign.setVisible(true);
              fish.setTint(0xffffaa);
              fish.setAlpha(1);
              break;
            } else {
              fish.clearTint();
            }
          }

          if (!this.canFish) {
            this.fishText.setText("");
            this.catchHint.setText("");
            this.nearbySign.setVisible(false);
          }
        }

        shutdown() {
          window.removeEventListener("ocean-move", this.onMove as EventListener);
          window.removeEventListener("ocean-fish", this.onFish as EventListener);
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: gameRef.current!,
        backgroundColor: "#082f49",
        scene: FunFishingScene,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: {
          pixelArt: true,
          antialias: false,
        },
      });
    }

    startGame();

    return () => {
      if (game) game.destroy(true);
    };
  }, [regionId]);

  function move(x: number, y: number) {
    window.dispatchEvent(new CustomEvent("ocean-move", { detail: { x, y } }));
  }

  function stopMove() {
    window.dispatchEvent(new CustomEvent("ocean-move", { detail: { x: 0, y: 0 } }));
  }

  function fish() {
    window.dispatchEvent(new CustomEvent("ocean-fish"));
  }

  function holdMove(x: number, y: number) {
    move(x, y);
  }

  function releaseMove() {
    stopMove();
  }

  return (
    <main
      className="relative h-[100dvh] w-screen overflow-hidden bg-black select-none"
      style={{ touchAction: "none" }}
    >
      <div ref={gameRef} className="h-full w-full" />

      {/* 모바일에서는 상단 UI를 작게 정리 */}
      <div className="absolute left-3 top-3 z-50 flex gap-2">
        <a
          href="/regions"
          className="rounded-xl bg-black/55 px-3 py-2 text-xs font-black text-white backdrop-blur"
        >
          ← 지역
        </a>

        <a
          href="/collection"
          className="rounded-xl bg-black/55 px-3 py-2 text-xs font-black text-white backdrop-blur"
        >
          📖
        </a>

        <a
          href="/shop"
          className="rounded-xl bg-black/55 px-3 py-2 text-xs font-black text-white backdrop-blur"
        >
          🏪
        </a>
      </div>

      {/* PC 안내는 큰 화면에서만 표시 */}
      <div className="pointer-events-none absolute right-3 top-3 z-50 hidden rounded-xl bg-black/45 px-3 py-2 text-xs font-bold text-white/80 backdrop-blur sm:block">
        PC: WASD/방향키 이동 · Space/Enter 낚시
      </div>

      {/* 모바일 조이스틱: 작고 아래쪽, 멀티터치 대응 */}
      <div
        className="absolute bottom-5 left-4 z-50 grid grid-cols-3 gap-1.5 rounded-3xl border border-white/10 bg-black/25 p-2 backdrop-blur"
        style={{ touchAction: "none" }}
      >
        <div />
        <button
          type="button"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            holdMove(0, -1);
          }}
          onPointerUp={releaseMove}
          onPointerCancel={releaseMove}
          onPointerLeave={releaseMove}
          className="h-12 w-12 rounded-xl border border-white/25 bg-blue-950/70 text-xl font-black text-white active:scale-95 sm:h-14 sm:w-14"
        >
          ▲
        </button>
        <div />

        <button
          type="button"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            holdMove(-1, 0);
          }}
          onPointerUp={releaseMove}
          onPointerCancel={releaseMove}
          onPointerLeave={releaseMove}
          className="h-12 w-12 rounded-xl border border-white/25 bg-blue-950/70 text-xl font-black text-white active:scale-95 sm:h-14 sm:w-14"
        >
          ◀
        </button>

        <button
          type="button"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            holdMove(0, 0);
          }}
          onPointerUp={releaseMove}
          onPointerCancel={releaseMove}
          className="h-12 w-12 rounded-xl border border-cyan-300/40 bg-cyan-400/20 text-sm font-black text-cyan-100 sm:h-14 sm:w-14"
        >
          ●
        </button>

        <button
          type="button"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            holdMove(1, 0);
          }}
          onPointerUp={releaseMove}
          onPointerCancel={releaseMove}
          onPointerLeave={releaseMove}
          className="h-12 w-12 rounded-xl border border-white/25 bg-blue-950/70 text-xl font-black text-white active:scale-95 sm:h-14 sm:w-14"
        >
          ▶
        </button>

        <div />
        <button
          type="button"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            holdMove(0, 1);
          }}
          onPointerUp={releaseMove}
          onPointerCancel={releaseMove}
          onPointerLeave={releaseMove}
          className="h-12 w-12 rounded-xl border border-white/25 bg-blue-950/70 text-xl font-black text-white active:scale-95 sm:h-14 sm:w-14"
        >
          ▼
        </button>
        <div />
      </div>

      {/* 낚시 버튼: 오른쪽 아래로 분리, 멀티터치 대응 */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          fish();
        }}
        className="absolute bottom-8 right-5 z-50 h-20 w-20 rounded-full border-4 border-amber-800 bg-blue-600 text-lg font-black text-white shadow-2xl active:scale-95 sm:h-24 sm:w-24"
        style={{
          backgroundImage: "url('/assets/ui/hook_button.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          touchAction: "none",
          color: "transparent",
        }}
      >
        낚시
      </button>

      {/* 하단 중앙 여백 확보용 미니 안내 */}
      <div className="pointer-events-none absolute bottom-1 left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/35 px-3 py-1 text-[11px] font-bold text-white/70 backdrop-blur sm:hidden">
        왼쪽 이동 · 오른쪽 낚시
      </div>
    </main>
  );
}

export default function OceanPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-950 text-white">로딩 중...</main>}>
      <OceanGame />
    </Suspense>
  );
}
