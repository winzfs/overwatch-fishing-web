"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { fishes, gradeInfo, pickFish, regions } from "../../data/fishingData";

function OceanGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const regionId = searchParams.get("region") || "ilios";

  useEffect(() => {
    let game: any;
    const currentRegion = regions.find((region) => region.id === regionId) || regions[0];

    async function startGame() {
      const Phaser = (await import("phaser")).default;

      class OceanScene extends Phaser.Scene {
        boat!: Phaser.GameObjects.Container;
        fishes: Phaser.GameObjects.Ellipse[] = [];
        fishText!: Phaser.GameObjects.Text;
        hudText!: Phaser.GameObjects.Text;
        move = { x: 0, y: 0 };
        canFish = false;
        targetFish: Phaser.GameObjects.Ellipse | null = null;

        fishingPanel!: Phaser.GameObjects.Container;
        timingBar!: Phaser.GameObjects.Rectangle;
        hitZone!: Phaser.GameObjects.Rectangle;
        pointer!: Phaser.GameObjects.Rectangle;
        resultText!: Phaser.GameObjects.Text;
        fishNameText!: Phaser.GameObjects.Text;

        isFishing = false;
        pointerDirection = 1;
        selectedFish = pickFish(regionId);
        caughtCount = 0;
        gold = 3000;
        exp = 0;

        constructor() {
          super("OceanScene");
        }

        create() {
          const width = this.scale.width;
          const height = this.scale.height;

          this.add.rectangle(width / 2, height / 2, width, height, 0x082f49);

          for (let i = 0; i < 45; i++) {
            this.add.ellipse(
              Phaser.Math.Between(0, width),
              Phaser.Math.Between(0, height),
              Phaser.Math.Between(90, 260),
              Phaser.Math.Between(18, 70),
              0x67e8f9,
              0.08
            );
          }

          for (let i = 0; i < 16; i++) {
            const fish = this.add.ellipse(
              Phaser.Math.Between(80, width - 80),
              Phaser.Math.Between(130, height - 130),
              Phaser.Math.Between(42, 75),
              Phaser.Math.Between(16, 28),
              0x000000,
              0.34
            );

            this.fishes.push(fish);

            this.tweens.add({
              targets: fish,
              x: fish.x + Phaser.Math.Between(-150, 150),
              y: fish.y + Phaser.Math.Between(-100, 100),
              duration: Phaser.Math.Between(2800, 7600),
              yoyo: true,
              repeat: -1,
            });
          }

          this.createBoat(width / 2, height / 2);

          this.hudText = this.add.text(16, 74, "", {
            fontSize: "18px",
            color: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.35)",
            padding: { x: 10, y: 8 },
          });
          this.hudText.setDepth(20);

          this.add.text(16, 20, `${currentRegion.emoji} ${currentRegion.name}`, {
            fontSize: "22px",
            color: "#ffffff",
            fontStyle: "bold",
            backgroundColor: "rgba(0,0,0,0.35)",
            padding: { x: 10, y: 8 },
          }).setDepth(20);

          this.fishText = this.add.text(width / 2, height - 118, "", {
            fontSize: "25px",
            color: "#fde047",
            align: "center",
            fontStyle: "bold",
          });
          this.fishText.setOrigin(0.5);
          this.fishText.setDepth(20);

          this.createFishingPanel();
          this.refreshHud();

          window.addEventListener("ocean-move", this.onMove as EventListener);
          window.addEventListener("ocean-fish", this.onFish as EventListener);
        }

        createBoat(x: number, y: number) {
          this.boat = this.add.container(x, y);

          const shadow = this.add.ellipse(0, 22, 92, 28, 0x000000, 0.2);
          const body = this.add.rectangle(0, 0, 82, 44, 0xf8fafc);
          body.setStrokeStyle(4, 0x38bdf8);

          const nose = this.add.triangle(52, 0, 0, -22, 0, 22, 34, 0, 0xe0f2fe);
          nose.setStrokeStyle(3, 0x38bdf8);

          const cabin = this.add.rectangle(-12, -3, 28, 22, 0x0ea5e9);
          cabin.setStrokeStyle(2, 0xffffff);

          this.boat.add([shadow, body, nose, cabin]);
          this.boat.setDepth(10);
        }

        createFishingPanel() {
          const width = this.scale.width;
          const height = this.scale.height;

          this.fishingPanel = this.add.container(width / 2, height / 2);
          this.fishingPanel.setVisible(false);
          this.fishingPanel.setDepth(100);

          const bg = this.add.rectangle(0, 0, width * 0.9, 390, 0x020617, 0.95);
          bg.setStrokeStyle(4, 0x22d3ee);

          const title = this.add.text(0, -155, "🎣 낚시 시작!", {
            fontSize: "34px",
            color: "#ffffff",
            fontStyle: "bold",
          });
          title.setOrigin(0.5);

          this.fishNameText = this.add.text(0, -108, "", {
            fontSize: "22px",
            color: "#fde047",
            align: "center",
            fontStyle: "bold",
            wordWrap: { width: width * 0.78 },
          });
          this.fishNameText.setOrigin(0.5);

          const guide = this.add.text(0, -62, "바늘이 초록 구간에 들어왔을 때 낚시 버튼을 누르세요.", {
            fontSize: "17px",
            color: "#cbd5e1",
            align: "center",
            wordWrap: { width: width * 0.76 },
          });
          guide.setOrigin(0.5);

          this.timingBar = this.add.rectangle(0, 15, width * 0.72, 34, 0x334155);
          this.timingBar.setStrokeStyle(3, 0xffffff, 0.4);

          this.hitZone = this.add.rectangle(0, 15, width * 0.17, 48, 0x22c55e, 0.92);

          this.pointer = this.add.rectangle(-width * 0.34, 15, 12, 74, 0xfacc15);

          this.resultText = this.add.text(0, 108, "", {
            fontSize: "27px",
            color: "#fde047",
            fontStyle: "bold",
            align: "center",
            wordWrap: { width: width * 0.78 },
          });
          this.resultText.setOrigin(0.5);

          const closeGuide = this.add.text(0, 160, "PERFECT면 보상 증가. MISS면 도망갑니다.", {
            fontSize: "15px",
            color: "#94a3b8",
          });
          closeGuide.setOrigin(0.5);

          this.fishingPanel.add([
            bg,
            title,
            this.fishNameText,
            guide,
            this.timingBar,
            this.hitZone,
            this.pointer,
            this.resultText,
            closeGuide,
          ]);
        }

        refreshHud() {
          this.hudText.setText(`💰 ${this.gold.toLocaleString()}G   ✨ EXP ${this.exp}   🐟 ${this.caughtCount}마리`);
        }

        onMove = (event: Event) => {
          if (this.isFishing) return;
          const custom = event as CustomEvent;
          this.move = custom.detail;
        };

        onFish = () => {
          if (this.isFishing) {
            this.tryCatch();
            return;
          }

          if (!this.canFish || !this.targetFish) return;

          this.startFishingBattle();
        };

        startFishingBattle() {
          this.isFishing = true;
          this.move = { x: 0, y: 0 };
          this.selectedFish = pickFish(regionId);

          const grade = gradeInfo[this.selectedFish.grade];
          this.fishNameText.setText(`${grade.emoji} ${grade.name} 어종의 입질!`);
          this.fishNameText.setColor(grade.color);
          this.resultText.setText("");

          const width = this.scale.width;
          const minZone = width * 0.09;
          const maxZone = width * 0.2;
          const zoneSize =
            this.selectedFish.grade === "common" ? maxZone :
            this.selectedFish.grade === "rare" ? width * 0.17 :
            this.selectedFish.grade === "epic" ? width * 0.14 :
            this.selectedFish.grade === "legend" ? width * 0.12 :
            minZone;

          this.hitZone.width = zoneSize;
          this.hitZone.x = Phaser.Math.Between(-Math.floor(width * 0.22), Math.floor(width * 0.22));
          this.pointer.x = -this.timingBar.width / 2;
          this.pointerDirection = 1;

          this.fishingPanel.setVisible(true);
          this.fishText.setText("");
        }

        tryCatch() {
          const pointerCenter = this.pointer.x;
          const zoneLeft = this.hitZone.x - this.hitZone.width / 2;
          const zoneRight = this.hitZone.x + this.hitZone.width / 2;
          const zoneCenter = this.hitZone.x;
          const distanceFromCenter = Math.abs(pointerCenter - zoneCenter);
          const perfectRange = Math.max(12, this.hitZone.width * 0.18);

          const success = pointerCenter >= zoneLeft && pointerCenter <= zoneRight;
          const perfect = success && distanceFromCenter <= perfectRange;

          const grade = gradeInfo[this.selectedFish.grade];

          if (success) {
            const bonus = perfect ? 1.5 : 1;
            const goldGain = Math.floor(this.selectedFish.price * bonus);
            const expGain = Math.floor(this.selectedFish.exp * bonus);

            this.gold += goldGain;
            this.exp += expGain;
            this.caughtCount += 1;

            if (this.targetFish) {
              this.targetFish.destroy();
              this.fishes = this.fishes.filter((fish) => fish !== this.targetFish);
            }

            this.resultText.setColor(perfect ? "#fde047" : "#86efac");
            this.resultText.setText(
              `${perfect ? "🌟 PERFECT!" : "✅ GOOD!"}\n${grade.emoji} ${this.selectedFish.name}\n+${goldGain.toLocaleString()}G / +${expGain}EXP`
            );

            this.targetFish = null;
            this.canFish = false;
            this.refreshHud();

            this.time.delayedCall(1650, () => {
              this.fishingPanel.setVisible(false);
              this.isFishing = false;
              this.resultText.setText("");
            });
          } else {
            this.resultText.setColor("#fca5a5");
            this.resultText.setText("💨 MISS!\n물고기가 도망갔습니다.");

            if (this.targetFish) {
              this.targetFish.destroy();
              this.fishes = this.fishes.filter((fish) => fish !== this.targetFish);
            }

            this.targetFish = null;
            this.canFish = false;

            this.time.delayedCall(1350, () => {
              this.fishingPanel.setVisible(false);
              this.isFishing = false;
              this.resultText.setText("");
            });
          }
        }

        update() {
          if (this.isFishing) {
            const gradeSpeed =
              this.selectedFish.grade === "common" ? 5 :
              this.selectedFish.grade === "rare" ? 6 :
              this.selectedFish.grade === "epic" ? 7 :
              this.selectedFish.grade === "legend" ? 8 :
              this.selectedFish.grade === "mythic" ? 9 :
              10;

            const limit = this.timingBar.width / 2;
            this.pointer.x += this.pointerDirection * gradeSpeed;

            if (this.pointer.x > limit) {
              this.pointer.x = limit;
              this.pointerDirection = -1;
            }

            if (this.pointer.x < -limit) {
              this.pointer.x = -limit;
              this.pointerDirection = 1;
            }

            return;
          }

          const speed = 5;
          this.boat.x += this.move.x * speed;
          this.boat.y += this.move.y * speed;

          this.boat.x = Phaser.Math.Clamp(this.boat.x, 45, this.scale.width - 45);
          this.boat.y = Phaser.Math.Clamp(this.boat.y, 75, this.scale.height - 75);

          if (this.move.x !== 0 || this.move.y !== 0) {
            this.boat.rotation = Math.atan2(this.move.y, this.move.x);
          }

          this.canFish = false;
          this.targetFish = null;

          for (const fish of this.fishes) {
            const dist = Phaser.Math.Distance.Between(
              this.boat.x,
              this.boat.y,
              fish.x,
              fish.y
            );

            if (dist < 88) {
              this.canFish = true;
              this.targetFish = fish;
              this.fishText.setText("🎣 물고기 실루엣 발견!\n낚시 버튼을 누르세요");
              break;
            }
          }

          if (!this.canFish) {
            this.fishText.setText("");
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
        backgroundColor: "#020617",
        scene: OceanScene,
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

  function fish() {
    window.dispatchEvent(new CustomEvent("ocean-fish"));
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <div ref={gameRef} className="h-full w-full" />

      <a
        href="/regions"
        className="absolute left-4 top-4 z-50 rounded-2xl bg-black/50 px-4 py-3 text-sm font-black text-white backdrop-blur"
      >
        ← 지역
      </a>

      <div className="absolute bottom-8 left-5 z-50 grid grid-cols-3 gap-2">
        <div />
        <button
          onTouchStart={() => move(0, -1)}
          onTouchEnd={() => move(0, 0)}
          onMouseDown={() => move(0, -1)}
          onMouseUp={() => move(0, 0)}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur active:scale-95"
        >
          ▲
        </button>
        <div />

        <button
          onTouchStart={() => move(-1, 0)}
          onTouchEnd={() => move(0, 0)}
          onMouseDown={() => move(-1, 0)}
          onMouseUp={() => move(0, 0)}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur active:scale-95"
        >
          ◀
        </button>

        <div className="h-16 w-16 rounded-2xl bg-cyan-400/30 backdrop-blur" />

        <button
          onTouchStart={() => move(1, 0)}
          onTouchEnd={() => move(0, 0)}
          onMouseDown={() => move(1, 0)}
          onMouseUp={() => move(0, 0)}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur active:scale-95"
        >
          ▶
        </button>

        <div />
        <button
          onTouchStart={() => move(0, 1)}
          onTouchEnd={() => move(0, 0)}
          onMouseDown={() => move(0, 1)}
          onMouseUp={() => move(0, 0)}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur active:scale-95"
        >
          ▼
        </button>
        <div />
      </div>

      <button
        onClick={fish}
        className="absolute bottom-10 right-5 z-50 h-24 w-24 rounded-full bg-cyan-400 text-xl font-black text-slate-950 shadow-2xl shadow-cyan-400/40 active:scale-95"
      >
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
