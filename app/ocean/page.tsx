"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { gradeInfo, regions } from "../../data/fishingData";
import {
  type SaveData,
  defaultSave,
  loadSave,
  saveGame,
  bagWeight,
  cargoLimit,
  currentFreshness,
  itemSellValue,
} from "../gameSave";
import { createOceanScene } from "../../engine/scenes/OceanScene";
import { DiscoveryOverlay, type DiscoveryData, type FishDiscoveredDetail } from "../../components/ocean/DiscoveryOverlay";

const PIXEL_FONT = "'Press Start 2P', 'Courier New', monospace";

function compactPanelStyle(alpha = 0.7) {
  return {
    border: "1px solid rgba(125, 211, 252, 0.42)",
    background: `rgba(2, 6, 23, ${alpha})`,
    boxShadow: "0 2px 0 rgba(0, 0, 0, 0.48)",
    fontFamily: PIXEL_FONT,
    textShadow: "1px 1px 0 rgba(0, 0, 0, 0.85)",
  } as const;
}

function BagOverlay({
  onClose,
  refreshKey,
}: {
  onClose: () => void;
  refreshKey: number;
}) {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [sort, setSort] = useState<"value" | "weight" | "fresh" | "grade">("value");

  useEffect(() => {
    setSave(loadSave());
  }, [refreshKey]);

  const items = [...(save.bag || [])].sort((a, b) => {
    if (sort === "value") return itemSellValue(b, save) - itemSellValue(a, save);
    if (sort === "weight") return b.kg - a.kg;
    if (sort === "fresh") return currentFreshness(b, save) - currentFreshness(a, save);
    return String(b.grade).localeCompare(String(a.grade));
  });

  const totalValue = items.reduce((sum, item) => sum + itemSellValue(item, save), 0);

  function discard(uid: string) {
    const next: SaveData = {
      ...save,
      bag: (save.bag || []).filter((item) => item.uid !== uid),
    };

    saveGame(next);
    setSave(next);
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/65 p-3 backdrop-blur-sm"
      style={{ touchAction: "none" }}
    >
      <section className="mx-auto flex h-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-cyan-300/20 bg-slate-950/95 text-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <h2 className="text-2xl font-black">🎒 어획 가방</h2>
            <p className="mt-1 text-xs text-slate-400">
              {bagWeight(save).toFixed(1)} / {cargoLimit(save)}kg · 예상 판매가 {totalValue.toLocaleString()}G
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 active:scale-95"
          >
            닫기
          </button>
        </header>

        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-white/10 p-3">
          {[
            ["value", "가격순"],
            ["weight", "무게순"],
            ["fresh", "신선도순"],
            ["grade", "등급순"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSort(id as any)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold ${
                sort === id ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">
              아직 가방이 비어 있습니다.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((item) => {
                const grade = gradeInfo[item.grade as keyof typeof gradeInfo];
                const fresh = currentFreshness(item, save);
                const value = itemSellValue(item, save);

                return (
                  <div key={item.uid} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-black" style={{ color: grade?.color || "#fff" }}>
                          {grade?.emoji} {item.name}
                        </div>
                        <p className="mt-1 text-xs text-slate-300">
                          {item.sizeRank} · {item.cm}cm · {item.kg}kg
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          신선도 {fresh}% · {value.toLocaleString()}G
                        </p>
                      </div>

                      <button
                        onClick={() => discard(item.uid)}
                        className="rounded-xl bg-red-500/20 px-3 py-2 text-xs font-bold text-red-200"
                      >
                        버리기
                      </button>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
                      <div
                        className={fresh > 70 ? "h-full bg-cyan-400" : fresh > 40 ? "h-full bg-yellow-400" : "h-full bg-red-400"}
                        style={{ width: `${fresh}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-white/10 p-3 text-center text-xs font-bold text-slate-400">
          판매는 항구 정산소에서 가능합니다. 바다에서는 가방 확인과 버리기만 가능합니다.
        </footer>
      </section>
    </div>
  );
}

function OceanGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [bagOpen, setBagOpen] = useState(false);
  const [bagRefreshKey, setBagRefreshKey] = useState(0);
  const [discovery, setDiscovery] = useState<DiscoveryData | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const dismissDiscovery = useCallback(() => setDiscovery(null), []);

  type HudData = {
    weight: number; limit: number; fuel: number; fuelMax: number;
    gold: number; level: number; caught: number;
    zone: string; dist: number; timeStr: string;
    boatX?: number; boatY?: number; worldWidth?: number; worldHeight?: number;
    portX?: number; portY?: number; wreckX?: number; wreckY?: number;
  };
  const [hudData, setHudData] = useState<HudData | null>(null);

  useEffect(() => {
    function updateOrientation() {
      setIsLandscape(window.innerWidth > window.innerHeight);
    }
    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);
    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  useEffect(() => {
    function onHudUpdate(e: Event) {
      setHudData((e as CustomEvent<HudData>).detail);
    }
    window.addEventListener("hud-update", onHudUpdate);
    return () => window.removeEventListener("hud-update", onHudUpdate);
  }, []);

  const searchParams = useSearchParams();
  const regionId = searchParams.get("region") || "busan";

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("last-ocean-url", `/ocean?region=${regionId}`);
    }

    let game: any = null;
    const currentRegion = regions.find((r) => r.id === regionId) || regions[0];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabase =
      supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey, {
            realtime: {
              params: {
                eventsPerSecond: 6,
              },
            },
          })
        : null;

    const discordId =
      typeof window !== "undefined" ? localStorage.getItem("discord-user-id") || "" : "";
    const displayName =
      typeof window !== "undefined"
        ? localStorage.getItem("discord-display-name") || "낚시꾼"
        : "낚시꾼";

    async function startGame() {
      const Phaser = (await import("phaser")).default;
      const OceanSceneClass = createOceanScene(Phaser, {
        regionId,
        region: currentRegion,
        supabase,
        discordId,
        displayName,
      });

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: gameRef.current!,
        backgroundColor: "#082f49",
        scene: OceanSceneClass,
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.NO_CENTER },
        render: { pixelArt: true, antialias: false },
      });
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    }

    startGame();

    function onFishDiscovered(e: Event) {
      const detail = (e as CustomEvent<FishDiscoveredDetail>).detail;
      setDiscovery(detail);
    }
    window.addEventListener("fish-discovered", onFishDiscovered);

    return () => {
      if (game) game.destroy(true);
      window.removeEventListener("fish-discovered", onFishDiscovered);
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
  function returnHarbor() {
    window.dispatchEvent(new CustomEvent("ocean-return"));
  }

  function openBag() {
    setBagRefreshKey(Date.now());
    setBagOpen(true);
  }
  function releaseMove() {
    setStick({ x: 0, y: 0 });
    stopMove();
  }
  function updateJoystick(clientX: number, clientY: number) {
    const el = stickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const max = rect.width / 2 - 22;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > max && dist > 0) {
      dx = (dx / dist) * max;
      dy = (dy / dist) * max;
    }
    setStick({ x: dx, y: dy });
    move(dx / max, dy / max);
  }
  function pointerJoystick(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    updateJoystick(e.clientX, e.clientY);
  }

  const minimapW = isLandscape ? 86 : 78;
  const minimapH = isLandscape ? 58 : 70;
  const worldW = hudData?.worldWidth || 3000;
  const worldH = hudData?.worldHeight || 2300;
  const dotLeft = Math.max(5, Math.min(minimapW - 5, ((hudData?.boatX || 260) / worldW) * minimapW));
  const dotTop = Math.max(5, Math.min(minimapH - 5, ((hudData?.boatY || 260) / worldH) * minimapH));
  const portLeft = Math.max(4, Math.min(minimapW - 4, ((hudData?.portX || 180) / worldW) * minimapW));
  const portTop = Math.max(4, Math.min(minimapH - 4, ((hudData?.portY || 180) / worldH) * minimapH));

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-black select-none" style={{ touchAction: "none" }}>
      <div ref={gameRef} className="absolute inset-0" />

      <section className="absolute left-2 top-2 z-50 flex max-w-[calc(100vw-112px)] flex-col gap-1 text-cyan-50 sm:left-3 sm:top-3">
        <div
          className="pointer-events-auto flex w-fit items-center gap-2 px-2 py-1"
          style={{ ...compactPanelStyle(0.72), fontSize: "8px", lineHeight: 1.35 }}
        >
          <a href="/harbor" className="text-cyan-100 hover:text-yellow-200">⚓ HARBOR</a>
          <button onClick={openBag} className="text-yellow-200">🎒 BAG</button>
          <button onClick={returnHarbor} className="text-rose-200">⛵ 귀환</button>
        </div>

        {hudData && (
          <div className="grid w-fit gap-1">
            <div
              className="grid grid-cols-2 gap-x-2 gap-y-1 px-2 py-1"
              style={{ ...compactPanelStyle(0.64), fontSize: "7px", lineHeight: 1.55 }}
            >
              <span>🎒 {hudData.weight.toFixed(1)}/{hudData.limit}kg</span>
              <span>⛽ {hudData.fuel}/{hudData.fuelMax}</span>
              <span>💰 {hudData.gold.toLocaleString()}G</span>
              <span>Lv.{hudData.level} · 🐟{hudData.caught}</span>
            </div>
            <div
              className="w-fit px-2 py-1"
              style={{ ...compactPanelStyle(0.58), fontSize: "6px", lineHeight: 1.5, color: "#e0f2fe" }}
            >
              {hudData.zone} · ⚓{hudData.dist}m · {hudData.timeStr}
            </div>
          </div>
        )}
      </section>

      <section
        className="pointer-events-none absolute right-2 top-2 z-50 overflow-hidden sm:right-3 sm:top-3"
        style={{
          ...compactPanelStyle(0.66),
          width: `${minimapW}px`,
          height: `${minimapH}px`,
          padding: 3,
        }}
      >
        <div className="relative h-full w-full overflow-hidden bg-slate-950/90">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(103,232,249,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.25) 1px, transparent 1px)", backgroundSize: "25% 33%" }} />
          <div className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 bg-yellow-300" style={{ left: portLeft, top: portTop }} />
          <div className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 bg-cyan-300 shadow-[0_0_6px_rgba(103,232,249,0.9)]" style={{ left: dotLeft, top: dotTop }} />
        </div>
      </section>

      <div className="pointer-events-none absolute right-3 top-[88px] z-50 hidden sm:block">
        <div
          style={{ ...compactPanelStyle(0.62), padding: "3px 5px", fontSize: "8px", lineHeight: 1.35, color: "#e0f2fe" }}
        >
          PC: WASD/ARROW · SPACE/ENTER · E
        </div>
      </div>

      <div
        ref={stickRef}
        onPointerDown={pointerJoystick}
        onPointerMove={(e) => { if (e.buttons === 1 || e.pointerType === "touch") updateJoystick(e.clientX, e.clientY); }}
        onPointerUp={releaseMove}
        onPointerCancel={releaseMove}
        onLostPointerCapture={releaseMove}
        className={`absolute z-50 rounded-full border-4 border-cyan-300/40 bg-black/55 backdrop-blur ${isLandscape ? "bottom-3 left-2 h-20 w-20" : "bottom-4 left-3 h-28 w-28 sm:bottom-6 sm:left-5 sm:h-32 sm:w-32"}`}
        style={{ touchAction: "none" }}
      >
        <div className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-300/30 bg-cyan-400/10 ${isLandscape ? "h-14 w-14" : "h-20 w-20"}`} />
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 rounded-full border-2 border-cyan-200 bg-cyan-400/85 shadow-xl shadow-cyan-400/40 ${isLandscape ? "h-10 w-10" : "h-12 w-12"}`}
          style={{ transform: `translate(calc(-50% + ${stick.x}px), calc(-50% + ${stick.y}px))` }}
        />
      </div>

      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); fish(); }}
        className={`absolute z-50 ${isLandscape ? "bottom-3 right-2 h-20 w-20" : "bottom-4 right-3 h-24 w-24 sm:bottom-9 sm:right-5 sm:h-28 sm:w-28"}`}
        style={{
          backgroundImage: "url('/assets/ui/hook_button.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          touchAction: "none",
          color: "transparent",
          boxShadow: "0 0 0 3px #020617, 0 0 0 6px #facc15, 0 6px 0 rgba(0,0,0,0.5)",
          imageRendering: "pixelated",
        }}
      >
        낚시
      </button>

      {bagOpen && (
        <BagOverlay
          refreshKey={bagRefreshKey}
          onClose={() => {
            setBagOpen(false);
            setBagRefreshKey(Date.now());
          }}
        />
      )}

      {discovery && (
        <DiscoveryOverlay
          data={discovery}
          onDismiss={dismissDiscovery}
        />
      )}
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
