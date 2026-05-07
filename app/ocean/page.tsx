"use client";

import { useEffect, useRef } from "react";

export default function OceanPage() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: any;

    async function startGame() {
      const Phaser = (await import("phaser")).default;

      class OceanScene extends Phaser.Scene {
        boat!: Phaser.GameObjects.Rectangle;
        fishes: Phaser.GameObjects.Ellipse[] = [];
        fishText!: Phaser.GameObjects.Text;
        move = { x: 0, y: 0 };
        canFish = false;
        targetFish: Phaser.GameObjects.Ellipse | null = null;

        constructor() {
          super("OceanScene");
        }

        create() {
          const width = this.scale.width;
          const height = this.scale.height;

          this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a);

          for (let i = 0; i < 35; i++) {
            this.add.ellipse(
              Phaser.Math.Between(0, width),
              Phaser.Math.Between(0, height),
              Phaser.Math.Between(80, 220),
              Phaser.Math.Between(20, 70),
              0x22d3ee,
              0.08
            );
          }

          for (let i = 0; i < 14; i++) {
            const fish = this.add.ellipse(
              Phaser.Math.Between(80, width - 80),
              Phaser.Math.Between(120, height - 120),
              55,
              22,
              0x000000,
              0.35
            );

            this.fishes.push(fish);

            this.tweens.add({
              targets: fish,
              x: fish.x + Phaser.Math.Between(-130, 130),
              y: fish.y + Phaser.Math.Between(-90, 90),
              duration: Phaser.Math.Between(3000, 7000),
              yoyo: true,
              repeat: -1,
            });
          }

          this.boat = this.add.rectangle(width / 2, height / 2, 76, 44, 0xf8fafc);
          this.boat.setStrokeStyle(4, 0x38bdf8);

          this.add.text(20, 20, "🚤 터치 조이스틱으로 이동", {
            fontSize: "22px",
            color: "#ffffff",
          });

          this.fishText = this.add.text(width / 2, height - 110, "", {
            fontSize: "28px",
            color: "#fde047",
          });
          this.fishText.setOrigin(0.5);

          window.addEventListener("ocean-move", this.onMove as EventListener);
          window.addEventListener("ocean-fish", this.onFish as EventListener);
        }

        onMove = (event: Event) => {
          const custom = event as CustomEvent;
          this.move = custom.detail;
        };

        onFish = () => {
          if (!this.canFish || !this.targetFish) return;

          this.targetFish.destroy();
          this.fishes = this.fishes.filter((fish) => fish !== this.targetFish);
          this.targetFish = null;
          this.canFish = false;

          this.fishText.setText("✨ 물고기 포획 성공!");

          this.time.delayedCall(1500, () => {
            this.fishText.setText("");
          });
        };

        update() {
          const speed = 5;

          this.boat.x += this.move.x * speed;
          this.boat.y += this.move.y * speed;

          this.boat.x = Phaser.Math.Clamp(this.boat.x, 40, this.scale.width - 40);
          this.boat.y = Phaser.Math.Clamp(this.boat.y, 70, this.scale.height - 70);

          this.canFish = false;
          this.targetFish = null;

          for (const fish of this.fishes) {
            const dist = Phaser.Math.Distance.Between(
              this.boat.x,
              this.boat.y,
              fish.x,
              fish.y
            );

            if (dist < 85) {
              this.canFish = true;
              this.targetFish = fish;
              this.fishText.setText("🎣 물고기 발견! 낚시 버튼을 누르세요");
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
      });
    }

    startGame();

    return () => {
      if (game) game.destroy(true);
    };
  }, []);

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
        href="/"
        className="absolute left-5 top-5 z-50 rounded-2xl bg-black/50 px-5 py-3 font-black text-white backdrop-blur"
      >
        ← 홈
      </a>

      <div className="absolute bottom-8 left-6 z-50 grid grid-cols-3 gap-2">
        <div />
        <button
          onTouchStart={() => move(0, -1)}
          onTouchEnd={() => move(0, 0)}
          onMouseDown={() => move(0, -1)}
          onMouseUp={() => move(0, 0)}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur"
        >
          ▲
        </button>
        <div />

        <button
          onTouchStart={() => move(-1, 0)}
          onTouchEnd={() => move(0, 0)}
          onMouseDown={() => move(-1, 0)}
          onMouseUp={() => move(0, 0)}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur"
        >
          ◀
        </button>

        <div className="h-16 w-16 rounded-2xl bg-cyan-400/30 backdrop-blur" />

        <button
          onTouchStart={() => move(1, 0)}
          onTouchEnd={() => move(0, 0)}
          onMouseDown={() => move(1, 0)}
          onMouseUp={() => move(0, 0)}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur"
        >
          ▶
        </button>

        <div />
        <button
          onTouchStart={() => move(0, 1)}
          onTouchEnd={() => move(0, 0)}
          onMouseDown={() => move(0, 1)}
          onMouseUp={() => move(0, 0)}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white backdrop-blur"
        >
          ▼
        </button>
        <div />
      </div>

      <button
        onClick={fish}
        className="absolute bottom-10 right-6 z-50 h-24 w-24 rounded-full bg-cyan-400 text-xl font-black text-slate-950 shadow-2xl shadow-cyan-400/40 active:scale-95"
      >
        🎣
        <br />
        낚시
      </button>
    </main>
  );
}
