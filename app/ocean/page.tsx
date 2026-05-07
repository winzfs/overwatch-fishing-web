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
        boat!: Phaser.Physics.Arcade.Image;
        fishes: Phaser.Physics.Arcade.Image[] = [];

        move = { x: 0, y: 0 };

        preload() {
          this.load.image("ocean", "/assets/backgrounds/ocean_tile.png");
          this.load.image("boat", "/assets/sprites/boat_top.png");
          this.load.image("fish_common", "/assets/sprites/fish_shadow_common.png");
          this.load.image("fish_rare", "/assets/sprites/fish_shadow_rare.png");
          this.load.image("island", "/assets/effects/burst_legend.png");
        }

        create() {
          const WORLD_WIDTH = 4200;
          const WORLD_HEIGHT = 4200;

          for (let x = 0; x < WORLD_WIDTH; x += 512) {
            for (let y = 0; y < WORLD_HEIGHT; y += 512) {
              this.add.image(x, y, "ocean").setOrigin(0);
            }
          }

          this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

          this.addIsland(700, 900);
          this.addIsland(1900, 1200);
          this.addIsland(3000, 2400);
          this.addIsland(1200, 3200);

          this.spawnFish("fish_common", 24);
          this.spawnFish("fish_rare", 10);

          this.boat = this.physics.add.image(
            WORLD_WIDTH / 2,
            WORLD_HEIGHT / 2,
            "boat"
          );

          this.boat.setScale(0.35);
          this.boat.setCollideWorldBounds(true);
          this.boat.setDepth(20);

          this.cameras.main.startFollow(this.boat, true, 0.08, 0.08);
          this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

          this.add.text(30, 20, "🌊 오픈월드 바다", {
            fontSize: "28px",
            color: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.4)",
            padding: { x: 12, y: 8 },
          }).setScrollFactor(0).setDepth(100);

          this.add.text(30, 70, "🏝️ 섬 탐험 / 물고기 추적", {
            fontSize: "18px",
            color: "#cbd5e1",
            backgroundColor: "rgba(0,0,0,0.35)",
            padding: { x: 10, y: 6 },
          }).setScrollFactor(0).setDepth(100);

          window.addEventListener("ocean-move", this.onMove as EventListener);
        }

        addIsland(x: number, y: number) {
          const island = this.add.image(x, y, "island");
          island.setScale(0.7);
          island.setAlpha(0.8);

          this.add.circle(x, y, 120, 0xfacc15, 0.85);
          this.add.circle(x, y, 90, 0x65a30d, 1);
          this.add.circle(x, y, 60, 0x16a34a, 1);
        }

        spawnFish(texture: string, amount: number) {
          for (let i = 0; i < amount; i++) {
            const fish = this.physics.add.image(
              Phaser.Math.Between(150, 4050),
              Phaser.Math.Between(150, 4050),
              texture
            );

            fish.setScale(
              Phaser.Math.FloatBetween(0.45, 0.8)
            );

            fish.setAlpha(
              Phaser.Math.FloatBetween(0.5, 0.9)
            );

            this.fishes.push(fish);

            this.tweens.add({
              targets: fish,
              x: fish.x + Phaser.Math.Between(-240, 240),
              y: fish.y + Phaser.Math.Between(-240, 240),
              duration: Phaser.Math.Between(2500, 7000),
              yoyo: true,
              repeat: -1,
            });
          }
        }

        onMove = (event: Event) => {
          const custom = event as CustomEvent;
          this.move = custom.detail;
        };

        update() {
          const speed = 240;

          this.boat.setVelocity(
            this.move.x * speed,
            this.move.y * speed
          );

          if (this.move.x !== 0 || this.move.y !== 0) {
            this.boat.rotation =
              Math.atan2(this.move.y, this.move.x) +
              Math.PI / 2;
          }

          for (const fish of this.fishes) {
            const dist = Phaser.Math.Distance.Between(
              this.boat.x,
              this.boat.y,
              fish.x,
              fish.y
            );

            if (dist < 180) {
              const angle = Phaser.Math.Angle.Between(
                this.boat.x,
                this.boat.y,
                fish.x,
                fish.y
              );

              this.physics.velocityFromRotation(
                angle,
                160,
                fish.body.velocity
              );
            } else {
              fish.setVelocity(0, 0);
            }
          }
        }

        shutdown() {
          window.removeEventListener(
            "ocean-move",
            this.onMove as EventListener
          );
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: gameRef.current!,
        physics: {
          default: "arcade",
          arcade: {
            debug: false,
          },
        },
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

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <div ref={gameRef} className="h-full w-full" />

      <a
        href="/"
        className="absolute left-4 top-4 z-50 rounded-2xl bg-black/50 px-4 py-3 text-sm font-black text-white backdrop-blur"
      >
        ← 홈
      </a>

      <div className="absolute bottom-8 left-5 z-50 grid grid-cols-3 gap-2">
        <div />

        <button
          onTouchStart={() => move(0, -1)}
          onTouchEnd={stopMove}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white"
        >
          ▲
        </button>

        <div />

        <button
          onTouchStart={() => move(-1, 0)}
          onTouchEnd={stopMove}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white"
        >
          ◀
        </button>

        <div className="h-16 w-16 rounded-2xl bg-cyan-400/30" />

        <button
          onTouchStart={() => move(1, 0)}
          onTouchEnd={stopMove}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white"
        >
          ▶
        </button>

        <div />

        <button
          onTouchStart={() => move(0, 1)}
          onTouchEnd={stopMove}
          className="h-16 w-16 rounded-2xl bg-white/20 text-3xl font-black text-white"
        >
          ▼
        </button>

        <div />
      </div>
    </main>
  );
}

export default function OceanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OceanGame />
    </Suspense>
  );
}
