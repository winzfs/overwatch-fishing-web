"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { gradeInfo, pickFish, regions } from "../../data/fishingData";

function OceanGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const regionId = searchParams.get("region") || "busan";

  useEffect(() => {
    let game: any = null;
    const currentRegion = regions.find((r) => r.id === regionId) || regions[0];

    async function startGame() {
      const Phaser = (await import("phaser")).default;

      class RegionalFishingScene extends Phaser.Scene {
        boat: any;
        fishes: any[] = [];
        fishText: any;
        hudText: any;
        catchHint: any;
        nearbySign: any;
        islands: any[] = [];

        move = { x: 0, y: 0 };
        canFish = false;
        targetFish: any = null;

        fishingPanel: any;
        timingBar: any;
        hitZone: any;
        pointer: any;
        fishNameText: any;
        resultText: any;
        resultBadge: any;

        isFishing = false;
        isResolving = false;
        pointerDirection = 1;
        selectedFish = pickFish(regionId);

        gold = 3000;
        exp = 0;
        caught = 0;
        animTimer = 0;

        constructor() {
          super("RegionalFishingScene");
        }

        preload() {
          this.load.image("ocean", "/assets/backgrounds/ocean_tile.png");
          this.load.image("shallow", "/assets/backgrounds/shallow_water_tile.png");
          this.load.image("island_tropical", "/assets/backgrounds/island_tropical.png");
          this.load.image("island_rocky", "/assets/backgrounds/island_rocky.png");
          this.load.image("island_sandbar", "/assets/backgrounds/island_sandbar.png");

          this.load.image("boat_top", "/assets/sprites/boat_top.png");
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
          const width = this.scale.width;
          const height = this.scale.height;

          this.add.rectangle(width / 2, height / 2, width, height, currentRegion.bg);

          this.drawPixelOcean(width, height);
          this.placeRegionDecor(width, height);
          this.spawnRegionFish();

          this.boat = this.add.image(width / 2, height / 2, "boat_idle_1");
          this.boat.setScale(0.13);
          this.boat.setDepth(30);

          this.add
            .text(16, 18, `${currentRegion.emoji} ${currentRegion.name}`, {
              fontSize: "22px",
              color: "#ffffff",
              fontStyle: "bold",
              backgroundColor: "rgba(0,0,0,0.55)",
              padding: { x: 10, y: 8 },
            })
            .setDepth(80);

          this.hudText = this.add
            .text(16, 72, "", {
              fontSize: "18px",
              color: "#ffffff",
              backgroundColor: "rgba(0,0,0,0.45)",
              padding: { x: 10, y: 8 },
            })
            .setDepth(80);

          this.fishText = this.add.text(width / 2, height - 138, "", {
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
            fontSize: "16px",
            color: "#ffffff",
            align: "center",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4,
          });
          this.catchHint.setOrigin(0.5);
          this.catchHint.setDepth(90);

          this.createFishingPanel();
          this.refreshHud();

          window.addEventListener("ocean-move", this.onMove as EventListener);
          window.addEventListener("ocean-fish", this.onFish as EventListener);
        }

        drawPixelOcean(width: number, height: number) {
          for (let x = -20; x < width + 120; x += 100) {
            for (let y = -20; y < height + 120; y += 100) {
              const texture = (x + y) % 300 === 0 ? "shallow" : "ocean";
              const tile = this.add.image(x, y, texture).setOrigin(0);
              tile.setAlpha(texture === "shallow" ? 0.18 : 0.8);
            }
          }

          for (let i = 0; i < 28; i++) {
            const sparkle = this.add.circle(
              Phaser.Math.Between(20, width - 20),
              Phaser.Math.Between(110, height - 120),
              Phaser.Math.Between(1, 3),
              0xffffff,
              Phaser.Math.FloatBetween(0.25, 0.55)
            );

            this.tweens.add({
              targets: sparkle,
              alpha: 0.05,
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
            this.islands.push(island);
          }
        }

        spawnRegionFish() {
          const textures = [
            "fish_common",
            "fish_common",
            "fish_common",
            "fish_rare",
            "fish_rare",
            "fish_epic",
            "fish_legend",
          ];

          if (regionId === "null_sector" || regionId === "horizon" || regionId === "antarctica") {
            textures.push("fish_mythic", "fish_transcend");
          }

          for (let i = 0; i < 14; i++) {
            const texture = Phaser.Utils.Array.GetRandom(textures);
            this.spawnOneFish(texture);
          }
        }

        spawnOneFish(texture?: string) {
          const width = this.scale.width;
          const height = this.scale.height;
          const chosenTexture =
            texture || Phaser.Utils.Array.GetRandom(["fish_common", "fish_common", "fish_rare", "fish_epic"]);

          const fish = this.add.image(
            Phaser.Math.Between(80, width - 80),
            Phaser.Math.Between(135, height - 165),
            chosenTexture
          );

          fish.setScale(Phaser.Math.FloatBetween(0.075, 0.115));
          fish.setAlpha(Phaser.Math.FloatBetween(0.62, 0.9));
          fish.setDepth(15);
          fish.setData("baseScale", fish.scaleX);
          fish.setData("textureName", chosenTexture);
          this.fishes.push(fish);

          this.tweens.add({
            targets: fish,
            x: fish.x + Phaser.Math.Between(-150, 150),
            y: fish.y + Phaser.Math.Between(-85, 85),
            angle: Phaser.Math.Between(-10, 10),
            duration: Phaser.Math.Between(2500, 7000),
            yoyo: true,
            repeat: -1,
          });

          this.tweens.add({
            targets: fish,
            scaleX: fish.scaleX * 1.05,
            scaleY: fish.scaleY * 0.97,
            duration: Phaser.Math.Between(600, 1100),
            yoyo: true,
            repeat: -1,
          });
        }

        createFishingPanel() {
          const width = this.scale.width;
          const height = this.scale.height;

          this.fishingPanel = this.add.container(width / 2, height / 2);
          this.fishingPanel.setVisible(false);
          this.fishingPanel.setDepth(120);

          const bg = this.add.rectangle(0, 0, width * 0.9, 405, 0x020617, 0.96);
          bg.setStrokeStyle(5, 0x22d3ee);

          const title = this.add.text(0, -165, "🎣 낚시 시작!", {
            fontSize: "34px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 5,
          });
          title.setOrigin(0.5);

          this.fishNameText = this.add.text(0, -118, "", {
            fontSize: "22px",
            color: "#fde047",
            align: "center",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4,
            wordWrap: { width: width * 0.78 },
          });
          this.fishNameText.setOrigin(0.5);

          const guide = this.add.text(0, -70, "바늘이 초록 구간에 들어왔을 때 낚시 버튼!", {
            fontSize: "18px",
            color: "#cbd5e1",
            align: "center",
            stroke: "#000000",
            strokeThickness: 4,
            wordWrap: { width: width * 0.76 },
          });
          guide.setOrigin(0.5);

          this.timingBar = this.add.rectangle(0, 12, width * 0.72, 34, 0x172554);
          this.timingBar.setStrokeStyle(4, 0xffffff, 0.55);

          this.hitZone = this.add.rectangle(0, 12, width * 0.18, 48, 0x22c55e, 0.92);
          this.hitZone.setStrokeStyle(3, 0xbbf7d0, 1);

          this.pointer = this.add.rectangle(-width * 0.34, 12, 12, 76, 0xfacc15);
          this.pointer.setStrokeStyle(2, 0xffffff, 0.9);

          this.resultBadge = this.add.image(0, 92, "result_good");
          this.resultBadge.setScale(0.45);
          this.resultBadge.setVisible(false);

          this.resultText = this.add.text(0, 128, "", {
            fontSize: "25px",
            color: "#fde047",
            fontStyle: "bold",
            align: "center",
            stroke: "#000000",
            strokeThickness: 4,
            wordWrap: { width: width * 0.78 },
          });
          this.resultText.setOrigin(0.5);

          const sub = this.add.text(0, 176, "한 마리씩만 잡힙니다. 결과 중 연타는 무시됩니다.", {
            fontSize: "14px",
            color: "#94a3b8",
            stroke: "#000000",
            strokeThickness: 3,
          });
          sub.setOrigin(0.5);

          this.fishingPanel.add([
            bg,
            title,
            this.fishNameText,
            guide,
            this.timingBar,
            this.hitZone,
            this.pointer,
            this.resultBadge,
            this.resultText,
            sub,
          ]);
        }

        refreshHud() {
          this.hudText.setText(`💰 ${this.gold.toLocaleString()}G   ✨ EXP ${this.exp}   🐟 ${this.caught}`);
        }

        onMove = (event: Event) => {
          if (this.isFishing) return;
          const custom = event as CustomEvent<{ x: number; y: number }>;
          this.move = custom.detail;
        };

        onFish = () => {
          if (this.isResolving) return;

          if (this.isFishing) {
            this.tryCatch();
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
          this.move = { x: 0, y: 0 };
          this.selectedFish = pickFish(regionId);

          const grade = gradeInfo[this.selectedFish.grade];
          this.fishNameText.setText(`${grade.emoji} ${grade.name} 어종의 입질!`);
          this.fishNameText.setColor(grade.color);
          this.resultText.setText("");
          this.resultText.setColor("#fde047");
          this.resultBadge.setVisible(false);

          const width = this.scale.width;
          this.hitZone.width = width * grade.zone;
          this.hitZone.x = Phaser.Math.Between(-Math.floor(width * 0.22), Math.floor(width * 0.22));
          this.pointer.x = -this.timingBar.width / 2;
          this.pointerDirection = 1;

          this.fishingPanel.setVisible(true);
          this.fishText.setText("");
          this.catchHint.setText("");
          this.nearbySign.setVisible(false);
        }

        tryCatch() {
          if (this.isResolving) return;
          this.isResolving = true;

          const center = this.pointer.x;
          const left = this.hitZone.x - this.hitZone.width / 2;
          const right = this.hitZone.x + this.hitZone.width / 2;
          const perfectRange = Math.max(12, this.hitZone.width * 0.18);
          const perfect = Math.abs(center - this.hitZone.x) <= perfectRange;
          const success = center >= left && center <= right;
          const grade = gradeInfo[this.selectedFish.grade];

          if (success) {
            const bonus = perfect ? 1.5 : 1;
            const goldGain = Math.floor(this.selectedFish.price * bonus);
            const expGain = Math.floor(this.selectedFish.exp * bonus);

            this.gold += goldGain;
            this.exp += expGain;
            this.caught += 1;
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

            this.resultBadge.setTexture(perfect ? "result_perfect" : "result_good");
            this.resultBadge.setVisible(true);
            this.resultText.setColor(perfect ? "#fde047" : "#86efac");
            this.resultText.setText(
              `${grade.emoji} ${this.selectedFish.name}\n+${goldGain.toLocaleString()}G / +${expGain}EXP`
            );
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
            this.resultText.setColor("#fca5a5");
            this.resultText.setText("물고기가 도망갔습니다.");
          }

          this.time.delayedCall(1550, () => {
            this.fishingPanel.setVisible(false);
            this.isFishing = false;
            this.isResolving = false;
            this.resultText.setText("");
            this.resultBadge.setVisible(false);
          });
        }

        update(_time: number, delta: number) {
          this.animTimer += delta;

          if (this.isFishing) {
            if (!this.isResolving) {
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

            return;
          }

          const speed = 5;
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

          this.canFish = false;
          this.targetFish = null;

          for (const fish of this.fishes) {
            const dist = Phaser.Math.Distance.Between(this.boat.x, this.boat.y, fish.x, fish.y);

            if (dist < 122) {
              this.canFish = true;
              this.targetFish = fish;
              this.fishText.setText("🎣 물고기 실루엣 발견!");
              this.catchHint.setText("오른쪽 🎣 버튼을 누르세요");
              this.nearbySign.setVisible(true);
              this.tweens.killTweensOf(fish);
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
        scene: RegionalFishingScene,
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

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <div ref={gameRef} className="h-full w-full" />

      <a
        href="/regions"
        className="absolute left-4 top-4 z-50 rounded-2xl bg-black/60 px-4 py-3 text-sm font-black text-white backdrop-blur"
      >
        ← 지역
      </a>

      <div className="absolute bottom-8 left-5 z-50 grid grid-cols-3 gap-2">
        <div />
        <button
          onTouchStart={() => move(0, -1)}
          onTouchEnd={stopMove}
          onMouseDown={() => move(0, -1)}
          onMouseUp={stopMove}
          className="h-16 w-16 rounded-xl border-2 border-slate-300 bg-blue-950/70 text-3xl font-black text-white shadow-lg active:scale-95"
        >
          ▲
        </button>
        <div />

        <button
          onTouchStart={() => move(-1, 0)}
          onTouchEnd={stopMove}
          onMouseDown={() => move(-1, 0)}
          onMouseUp={stopMove}
          className="h-16 w-16 rounded-xl border-2 border-slate-300 bg-blue-950/70 text-3xl font-black text-white shadow-lg active:scale-95"
        >
          ◀
        </button>

        <div className="h-16 w-16 rounded-xl border-2 border-cyan-300 bg-cyan-400/20 shadow-lg" />

        <button
          onTouchStart={() => move(1, 0)}
          onTouchEnd={stopMove}
          onMouseDown={() => move(1, 0)}
          onMouseUp={stopMove}
          className="h-16 w-16 rounded-xl border-2 border-slate-300 bg-blue-950/70 text-3xl font-black text-white shadow-lg active:scale-95"
        >
          ▶
        </button>

        <div />
        <button
          onTouchStart={() => move(0, 1)}
          onTouchEnd={stopMove}
          onMouseDown={() => move(0, 1)}
          onMouseUp={stopMove}
          className="h-16 w-16 rounded-xl border-2 border-slate-300 bg-blue-950/70 text-3xl font-black text-white shadow-lg active:scale-95"
        >
          ▼
        </button>
        <div />
      </div>

      <button
        onClick={fish}
        className="absolute bottom-9 right-5 z-50 h-24 w-24 rounded-full border-4 border-amber-900 bg-blue-600 text-xl font-black text-white shadow-2xl active:scale-95"
        style={{
          backgroundImage: "url('/assets/ui/hook_button.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "transparent",
        }}
      >
        낚시
      </button>
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
