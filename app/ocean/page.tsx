"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

function OceanGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const regionId = searchParams.get("region") || "busan";

  useEffect(() => {
    let game: any;

    async function startGame() {
      const Phaser = (await import("phaser")).default;

      class OceanScene extends Phaser.Scene {
        boat!: Phaser.GameObjects.Image;
        fishes: Phaser.GameObjects.Image[] = [];
        fishText!: Phaser.GameObjects.Text;

        move = { x: 0, y: 0 };

        constructor() {
          super("OceanScene");
        }

        preload() {
          this.load.image(
            "ocean",
            "/assets/backgrounds/ocean_tile.png"
          );

          this.load.image(
            "boat",
            "/assets/sprites/boat_top.png"
          );

          this.load.image(
            "fish_common",
            "/assets/sprites/fish_shadow_common.png"
          );

          this.load.image(
            "fish_rare",
            "/assets/sprites/fish_shadow_rare.png"
          );

          this.load.image(
            "fish_epic",
            "/assets/sprites/fish_shadow_epic.png"
          );

          this.load.image(
            "fish_legend",
            "/assets/sprites/fish_shadow_legend.png"
          );

          this.load.image(
            "burst_legend",
            "/assets/effects/burst_legend.png"
          );
        }

        create() {
          const width = this.scale.width;
          const height = this.scale.height;

          for (let x = 0; x < width + 512; x += 512) {
            for (let y = 0; y < height + 512; y += 512) {
              this.add.image(x, y, "ocean").setOrigin(0);
            }
          }

          this.createFish("fish_common", 10);
          this.createFish("fish_rare", 4);
          this.createFish("fish_epic", 2);
          this.createFish("fish_legend", 1);

          this.boat = this.add.image(
            width / 2,
            height / 2,
            "boat"
          );

          this.boat.setScale(0.35);
          this.boat.setDepth(10);

          this.add.text(
            20,
            20,
            "🚤 터치 조작으로 이동",
            {
              fontSize: "24px",
              color: "#ffffff",
              backgroundColor: "rgba(0,0,0,0.35)",
              padding: {
                x: 10,
                y: 8,
              },
            }
          ).setDepth(50);

          this.fishText = this.add.text(
            width / 2,
            height - 110,
            "",
            {
              fontSize: "28px",
              color: "#fde047",
              fontStyle: "bold",
              align: "center",
            }
          );

          this.fishText.setOrigin(0.5);
          this.fishText.setDepth(50);

          window.addEventListener(
            "ocean-move",
            this.onMove as EventListener
          );

          window.addEventListener(
            "ocean-fish",
            this.onFish as EventListener
          );
        }

        createFish(texture: string, amount: number) {
          const width = this.scale.width;
          const height = this.scale.height;

          for (let i = 0; i < amount; i++) {
            const fish = this.add.image(
              Phaser.Math.Between(100, width - 100),
              Phaser.Math.Between(120, height - 120),
              texture
            );

            fish.setScale(
              Phaser.Math.FloatBetween(0.45, 0.8)
            );

            fish.setAlpha(
              Phaser.Math.FloatBetween(0.55, 0.95)
            );

            this.fishes.push(fish);

            this.tweens.add({
              targets: fish,
              x: fish.x + Phaser.Math.Between(-200, 200),
              y: fish.y + Phaser.Math.Between(-120, 120),
              angle: Phaser.Math.Between(-15, 15),
              duration: Phaser.Math.Between(2500, 8000),
              yoyo: true,
              repeat: -1,
            });
          }
        }

        onMove = (event: Event) => {
          const custom = event as CustomEvent;
          this.move = custom.detail;
        };

        onFish = () => {
          let foundFish: Phaser.GameObjects.Image | null = null;

          for (const fish of this.fishes) {
            const dist = Phaser.Math.Distance.Between(
              this.boat.x,
              this.boat.y,
              fish.x,
              fish.y
            );

            if (dist < 110) {
              foundFish = fish;
              break;
            }
          }

          if (!foundFish) {
            this.fishText.setText(
              "🐟 물고기 실루엣 근처로 이동하세요!"
            );

            this.time.delayedCall(1200, () => {
              this.fishText.setText("");
            });

            return;
          }

          const burst = this.add.image(
            foundFish.x,
            foundFish.y,
            "burst_legend"
          );

          burst.setScale(0.2);
          burst.setAlpha(0);

          this.tweens.add({
            targets: burst,
            scale: 1.4,
            alpha: 1,
            duration: 450,
            onComplete: () => {
              burst.destroy();
            },
          });

          foundFish.destroy();

          this.fishes = this.fishes.filter(
            (f) => f !== foundFish
          );

          this.fishText.setText(
            "🎣 입질 발생!\n낚시 미니게임 연결 예정"
          );

          this.time.delayedCall(1500, () => {
            this.fishText.setText("");
          });
        };

        update() {
          const speed = 5;

          this.boat.x += this.move.x * speed;
          this.boat.y += this.move.y * speed;

          this.boat.x = Phaser.Math.Clamp(
            this.boat.x,
            50,
            this.scale.width - 50
          );

          this.boat.y = Phaser.Math.Clamp(
            this.boat.y,
            50,
            this.scale.height - 50
          );

          if (this.move.x !== 0 || this.move.y !== 0) {
            this.boat.rotation =
              Math.atan2(this.move.y, this.move.x) +
              Math.PI / 2;
          }
        }

        shutdown() {
          window.removeEventListener(
            "ocean-move",
            this.onMove as EventListener
          );

          window.removeEventListener(
            "ocean-fish",
            this.onFish as EventListener
          );
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: gameRef.current!,
        backgroundColor: "#082f49",
        scene: OceanScene,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      });
    }

    startGame();

    return () => {
      if (game) {
        game.destroy(true);
      }
    };
  }, [regionId]);

  function move(x: number, y: number) {
    window.dispatchEvent(
      new CustomEvent("ocean-move", {
        detail: { x, y },
      })
    );
  }

  function stopMove() {
    window.dispatchEvent(
      new CustomEvent("ocean-move", {
        detail: { x: 0, y: 0 },
      })
    );
  }

  function fish() {
    window.dispatchEvent(
      new CustomEvent("ocean-fish")
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <div
        ref={gameRef}
        className="h-full w-full"
      />

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
          onTouchEnd={stopMove}
          onMouseDown={() => move(0, -1)}
          onMouseUp={stopMove}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur active:scale-95"
        >
          ▲
        </button>

        <div />

        <button
          onTouchStart={() => move(-1, 0)}
          onTouchEnd={stopMove}
          onMouseDown={() => move(-1, 0)}
          onMouseUp={stopMove}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur active:scale-95"
        >
          ◀
        </button>

        <div className="h-16 w-16 rounded-2xl bg-cyan-400/30 backdrop-blur" />

        <button
          onTouchStart={() => move(1, 0)}
          onTouchEnd={stopMove}
          onMouseDown={() => move(1, 0)}
          onMouseUp={stopMove}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur active:scale-95"
        >
          ▶
        </button>

        <div />

        <button
          onTouchStart={() => move(0, 1)}
          onTouchEnd={stopMove}
          onMouseDown={() => move(0, 1)}
          onMouseUp={stopMove}
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
    <Suspense fallback={<div>로딩 중...</div>}>
      <OceanGame />
    </Suspense>
  );
}
