"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { gradeInfo, pickFish, regions } from "../../data/fishingData";

function OceanGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const regionId = searchParams.get("region") || "busan";

  useEffect(() => {
    let game: Phaser.Game | null = null;
    const currentRegion = regions.find((r) => r.id === regionId) || regions[0];

    async function startGame() {
      const Phaser = (await import("phaser")).default;

      class RegionalFishingScene extends Phaser.Scene {
        boat!: Phaser.GameObjects.Image;
        fishes: Phaser.GameObjects.Image[] = [];
        fishText!: Phaser.GameObjects.Text;
        hudText!: Phaser.GameObjects.Text;
        catchHint!: Phaser.GameObjects.Text;

        move = { x: 0, y: 0 };
        canFish = false;
        targetFish: Phaser.GameObjects.Image | null = null;

        fishingPanel!: Phaser.GameObjects.Container;
        timingBar!: Phaser.GameObjects.Rectangle;
        hitZone!: Phaser.GameObjects.Rectangle;
        pointer!: Phaser.GameObjects.Rectangle;
        fishNameText!: Phaser.GameObjects.Text;
        resultText!: Phaser.GameObjects.Text;

        isFishing = false;
        isResolving = false;
        pointerDirection = 1;
        selectedFish = pickFish(regionId);

        gold = 3000;
        exp = 0;
        caught = 0;

        constructor() {
          super("RegionalFishingScene");
        }

        preload() {
          this.load.image("ocean", "/assets/backgrounds/ocean_tile.png");
          this.load.image("boat", "/assets/sprites/boat_top.png");
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
        }

        create() {
          const width = this.scale.width;
          const height = this.scale.height;

          this.add.rectangle(width / 2, height / 2, width, height, currentRegion.bg);

          for (let x = 0; x < width + 512; x += 512) {
            for (let y = 0; y < height + 512; y += 512) {
              this.add.image(x, y, "ocean").setOrigin(0).setAlpha(0.55);
            }
          }

          this.spawnRegionFish();

          this.boat = this.add.image(width / 2, height / 2, "boat");
          this.boat.setScale(0.34);
          this.boat.setDepth(20);

          this.add
            .text(16, 18, `${currentRegion.emoji} ${currentRegion.name}`, {
              fontSize: "22px",
              color: "#ffffff",
              fontStyle: "bold",
              backgroundColor: "rgba(0,0,0,0.4)",
              padding: { x: 10, y: 8 },
            })
            .setDepth(50);

          this.hudText = this.add
            .text(16, 72, "", {
              fontSize: "18px",
              color: "#ffffff",
              backgroundColor: "rgba(0,0,0,0.35)",
              padding: { x: 10, y: 8 },
            })
            .setDepth(50);

          this.fishText = this.add.text(width / 2, height - 128, "", {
            fontSize: "25px",
            color: "#fde047",
            align: "center",
            fontStyle: "bold",
          });
          this.fishText.setOrigin(0.5);
          this.fishText.setDepth(50);

          this.catchHint = this.add.text(width / 2, height - 78, "", {
            fontSize: "18px",
            color: "#ffffff",
            align: "center",
            backgroundColor: "rgba(34,211,238,0.25)",
            padding: { x: 12, y: 8 },
          });
          this.catchHint.setOrigin(0.5);
          this.catchHint.setDepth(50);

          this.createFishingPanel();
          this.refreshHud();

          window.addEventListener("ocean-move", this.onMove as EventListener);
          window.addEventListener("ocean-fish", this.onFish as EventListener);
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

          for (let i = 0; i < 15; i++) {
            const texture = Phaser.Utils.Array.GetRandom(textures);
            this.spawnOneFish(texture);
          }
        }

        spawnOneFish(texture?: string) {
          const width = this.scale.width;
          const height = this.scale.height;
          const chosenTexture = texture || Phaser.Utils.Array.GetRandom(["fish_common", "fish_common", "fish_rare", "fish_epic"]);

          const fish = this.add.image(
            Phaser.Math.Between(80, width - 80),
            Phaser.Math.Between(130, height - 150),
            chosenTexture
          );

          fish.setScale(Phaser.Math.FloatBetween(0.46, 0.82));
          fish.setAlpha(Phaser.Math.FloatBetween(0.58, 0.95));
          this.fishes.push(fish);

          this.tweens.add({
            targets: fish,
            x: fish.x + Phaser.Math.Between(-170, 170),
            y: fish.y + Phaser.Math.Between(-90, 90),
            angle: Phaser.Math.Between(-12, 12),
            duration: Phaser.Math.Between(2600, 7200),
            yoyo: true,
            repeat: -1,
          });
        }

        createFishingPanel() {
          const width = this.scale.width;
          const height = this.scale.height;

          this.fishingPanel = this.add.container(width / 2, height / 2);
          this.fishingPanel.setVisible(false);
          this.fishingPanel.setDepth(100);

          const bg = this.add.rectangle(0, 0, width * 0.9, 395, 0x020617, 0.96);
          bg.setStrokeStyle(4, 0x22d3ee);

          const title = this.add.text(0, -158, "🎣 낚시 시작!", {
            fontSize: "34px",
            color: "#ffffff",
            fontStyle: "bold",
          });
          title.setOrigin(0.5);

          this.fishNameText = this.add.text(0, -112, "", {
            fontSize: "22px",
            color: "#fde047",
            align: "center",
            fontStyle: "bold",
            wordWrap: { width: width * 0.78 },
          });
          this.fishNameText.setOrigin(0.5);

          const guide = this.add.text(0, -64, "바늘이 초록 구간에 들어왔을 때 낚시 버튼!", {
            fontSize: "18px",
            color: "#cbd5e1",
            align: "center",
            wordWrap: { width: width * 0.76 },
          });
          guide.setOrigin(0.5);

          this.timingBar = this.add.rectangle(0, 15, width * 0.72, 34, 0x334155);
          this.timingBar.setStrokeStyle(3, 0xffffff, 0.4);

          this.hitZone = this.add.rectangle(0, 15, width * 0.18, 48, 0x22c55e, 0.92);
          this.pointer = this.add.rectangle(-width * 0.34, 15, 12, 74, 0xfacc15);

          this.resultText = this.add.text(0, 112, "", {
            fontSize: "27px",
            color: "#fde047",
            fontStyle: "bold",
            align: "center",
            wordWrap: { width: width * 0.78 },
          });
          this.resultText.setOrigin(0.5);

          const sub = this.add.text(0, 166, "한 마리씩만 잡힙니다. 결과 중 연타는 무시됩니다.", {
            fontSize: "15px",
            color: "#94a3b8",
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

          const width = this.scale.width;
          this.hitZone.width = width * grade.zone;
          this.hitZone.x = Phaser.Math.Between(-Math.floor(width * 0.22), Math.floor(width * 0.22));
          this.pointer.x = -this.timingBar.width / 2;
          this.pointerDirection = 1;

          this.fishingPanel.setVisible(true);
          this.fishText.setText("");
          this.catchHint.setText("");
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
              burst.setScale(0.25);
              burst.setDepth(40);

              this.tweens.add({
                targets: burst,
                scale: 1.4,
                alpha: 0,
                duration: 700,
                onComplete: () => burst.destroy(),
              });

              this.targetFish.destroy();
              this.fishes = this.fishes.filter((f) => f !== this.targetFish);
              this.spawnOneFish();
            }

            this.targetFish = null;
            this.canFish = false;

            this.resultText.setColor(perfect ? "#fde047" : "#86efac");
            this.resultText.setText(
              `${perfect ? "🌟 PERFECT!" : "✅ GOOD!"}\n${grade.emoji} ${this.selectedFish.name}\n+${goldGain.toLocaleString()}G / +${expGain}EXP`
            );
          } else {
            if (this.targetFish) {
              this.targetFish.destroy();
              this.fishes = this.fishes.filter((f) => f !== this.targetFish);
              this.spawnOneFish();
            }

            this.targetFish = null;
            this.canFish = false;
            this.resultText.setColor("#fca5a5");
            this.resultText.setText("💨 MISS!\n물고기가 도망갔습니다.");
          }

          this.time.delayedCall(1500, () => {
            this.fishingPanel.setVisible(false);
            this.isFishing = false;
            this.isResolving = false;
            this.resultText.setText("");
          });
        }

        update() {
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
          this.boat.x += this.move.x * speed;
          this.boat.y += this.move.y * speed;

          this.boat.x = Phaser.Math.Clamp(this.boat.x, 55, this.scale.width - 55);
          this.boat.y = Phaser.Math.Clamp(this.boat.y, 80, this.scale.height - 90);

          if (this.move.x !== 0 || this.move.y !== 0) {
            this.boat.rotation = Math.atan2(this.move.y, this.move.x) + Math.PI / 2;
          }

          this.canFish = false;
          this.targetFish = null;

          for (const fish of this.fishes) {
            const dist = Phaser.Math.Distance.Between(this.boat.x, this.boat.y, fish.x, fish.y);

            if (dist < 120) {
              this.canFish = true;
              this.targetFish = fish;
              this.fishText.setText("🎣 물고기 실루엣 발견!");
              this.catchHint.setText("오른쪽 🎣 낚시 버튼을 누르세요");
              fish.setTint(0xffffaa);
              break;
            } else {
              fish.clearTint();
            }
          }

          if (!this.canFish) {
            this.fishText.setText("");
            this.catchHint.setText("");
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

      <a href="/regions" className="absolute left-4 top-4 z-50 rounded-2xl bg-black/50 px-4 py-3 text-sm font-black text-white backdrop-blur">
        ← 지역
      </a>

      <div className="absolute bottom-8 left-5 z-50 grid grid-cols-3 gap-2">
        <div />
        <button onTouchStart={() => move(0, -1)} onTouchEnd={stopMove} onMouseDown={() => move(0, -1)} onMouseUp={stopMove} className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur active:scale-95">▲</button>
        <div />

        <button onTouchStart={() => move(-1, 0)} onTouchEnd={stopMove} onMouseDown={() => move(-1, 0)} onMouseUp={stopMove} className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur active:scale-95">◀</button>
        <div className="h-16 w-16 rounded-2xl bg-cyan-400/30 backdrop-blur" />
        <button onTouchStart={() => move(1, 0)} onTouchEnd={stopMove} onMouseDown={() => move(1, 0)} onMouseUp={stopMove} className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur active:scale-95">▶</button>

        <div />
        <button onTouchStart={() => move(0, 1)} onTouchEnd={stopMove} onMouseDown={() => move(0, 1)} onMouseUp={stopMove} className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur active:scale-95">▼</button>
        <div />
      </div>

      <button onClick={fish} className="absolute bottom-10 right-5 z-50 h-24 w-24 rounded-full bg-cyan-400 text-xl font-black text-slate-950 shadow-2xl shadow-cyan-400/40 active:scale-95">
        🎣
        <br />
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
