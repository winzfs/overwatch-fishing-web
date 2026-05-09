"use client";

import { useEffect, useState } from "react";
import { regions } from "../../data/fishingData";
import {
  SaveData,
  defaultSave,
  loadSave,
  saveGame,
  getDailySeaEvent,
  fuelLimit,
  cargoLimit,
  bagWeight,
  getPlayerLevel,
  getNextLevelExp,
  getRegionRequiredLevel,
  isRegionUnlocked,
} from "../gameSave";

const baitOptions = [
  { id: "basic", name: "기본 미끼", desc: "안정적인 기본 출항", price: 0 },
  { id: "rare", name: "희귀 미끼", desc: "희귀 실루엣 확률 증가", price: 1200 },
  { id: "heavy", name: "대형 미끼", desc: "대형/괴물급 기대값 증가", price: 1800 },
] as const;

export default function PreparePage() {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [selectedRegion, setSelectedRegion] = useState("busan");
  const [bait, setBait] = useState<"basic" | "rare" | "heavy">("basic");
  const [ice, setIce] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loaded = loadSave();
    setSave(loaded);
    setBait(loaded.prep?.bait || "basic");
    setIce(loaded.prep?.ice || 0);
  }, []);

  function start() {
    if (!isRegionUnlocked(selectedRegion, save)) {
      const need = getRegionRequiredLevel(selectedRegion);
      setMessage(`이 지역은 Lv.${need}부터 출항할 수 있습니다.`);
      return;
    }

    const baitInfo = baitOptions.find((b) => b.id === bait)!;
    const iceCost = ice * 350;
    const totalCost = baitInfo.price + iceCost;

    if (save.gold < totalCost) {
      setMessage(`출항 준비 비용이 부족합니다. 필요: ${totalCost.toLocaleString()}G`);
      return;
    }

    const next: SaveData = {
      ...save,
      gold: save.gold - totalCost,
      prep: { bait, ice },
    };

    saveGame(next);
    window.location.href = `/ocean?region=${selectedRegion}`;
  }

  const region = regions.find((r) => r.id === selectedRegion) || regions[0];
  const event = getDailySeaEvent(selectedRegion);
  const playerLevel = getPlayerLevel(save);
  const nextExp = getNextLevelExp(playerLevel);
  const baitInfo = baitOptions.find((b) => b.id === bait)!;
  const totalCost = baitInfo.price + ice * 350;

  return (
    <main
      className="pixel-vignette relative min-h-screen overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, rgba(34,211,238,0.22), transparent 40%), linear-gradient(180deg,#082f49 0%, #061524 45%, #020617 100%)",
      }}
    >
      {/* Animated wave strip at the bottom */}
      <div
        aria-hidden
        className="wave-strip pointer-events-none absolute inset-x-0 bottom-0 h-24 opacity-40"
      />

      <div className="relative z-10 mx-auto max-w-6xl p-3 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <a href="/harbor" className="pixel-btn pixel-btn-cyan">
            ← 항구
          </a>
          <button
            onClick={start}
            className={`pixel-btn ${
              isRegionUnlocked(selectedRegion, save) ? "" : "pixel-btn-rose"
            }`}
          >
            {isRegionUnlocked(selectedRegion, save)
              ? "🚤 출항"
              : `🔒 Lv.${getRegionRequiredLevel(selectedRegion)} 필요`}
          </button>
        </div>

        <header className="mt-6 sm:mt-10">
          <h1 className="pixel-text text-2xl text-yellow-300 sm:text-3xl">🚤 출항 준비</h1>
          <p className="pixel-text-sm mt-3 text-slate-300">
            지역, 미끼, 얼음을 선택하고 출항하세요.
          </p>
        </header>

        <div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.85fr]">
          <section>
            <h2 className="pixel-text text-base text-cyan-100 sm:text-lg">🗺️ 지역 선택</h2>
            <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 sm:grid-cols-2">
              {regions.map((r) => {
                const e = getDailySeaEvent(r.id);
                const requiredLevel = getRegionRequiredLevel(r.id);
                const unlocked = playerLevel >= requiredLevel;
                const isSelected = selectedRegion === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRegion(r.id);
                      if (!unlocked) {
                        setMessage(`${r.name}은 Lv.${requiredLevel}부터 출항할 수 있습니다.`);
                      } else {
                        setMessage("");
                      }
                    }}
                    className={`pixel-panel relative overflow-hidden p-4 text-left active:scale-[0.98] ${
                      isSelected ? "ring-4 ring-yellow-300/70" : ""
                    } ${unlocked ? "" : "opacity-70"}`}
                  >
                    {/* mini wave bg */}
                    <div
                      aria-hidden
                      className="wave-strip pointer-events-none absolute inset-x-0 bottom-0 h-10 opacity-30"
                    />
                    <div className="relative flex items-start justify-between gap-3">
                      <div>
                        <div className="text-3xl sm:text-4xl">{r.emoji}</div>
                        <h3 className="pixel-text mt-3 text-sm text-white sm:text-base">{r.name}</h3>
                      </div>
                      <span
                        className={`pixel-text-sm px-2 py-1 ${
                          unlocked ? "bg-cyan-400/15 text-cyan-100" : "bg-rose-400/20 text-rose-100"
                        }`}
                        style={{ boxShadow: "0 0 0 2px #020617, 0 0 0 3px #67e8f9" }}
                      >
                        {unlocked ? `${e.emoji} ${e.name}` : `🔒 Lv.${requiredLevel}`}
                      </span>
                    </div>
                    <p className="relative mt-3 text-xs leading-5 text-slate-300 sm:text-sm">
                      {r.desc}
                    </p>
                    {!unlocked && (
                      <p className="pixel-text-sm relative mt-3 bg-rose-500/20 px-3 py-2 text-rose-100">
                        Lv.{playerLevel} · Lv.{requiredLevel} 필요
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="grid gap-4">
            <div className="pixel-panel p-4 sm:p-5">
              <p className="pixel-text-sm text-cyan-100">내 항해 레벨</p>
              <p className="pixel-text mt-2 text-xl text-yellow-200 sm:text-2xl">Lv.{playerLevel}</p>
              <p className="pixel-text-sm mt-2 text-slate-300">
                EXP {save.exp || 0} / {nextExp}
              </p>
              <div
                className="mt-3 h-3 overflow-hidden bg-black/60"
                style={{ boxShadow: "inset 0 0 0 2px #020617, 0 0 0 2px #67e8f9" }}
              >
                <div
                  className="h-full bg-cyan-300"
                  style={{ width: `${Math.min(100, ((save.exp || 0) / nextExp) * 100)}%` }}
                />
              </div>
            </div>

            <div className="pixel-panel-deep relative overflow-hidden p-4 sm:p-5">
              <div
                aria-hidden
                className="wave-strip pointer-events-none absolute inset-x-0 bottom-0 h-12 opacity-25"
              />
              <h2 className="pixel-text text-base text-yellow-200 sm:text-lg">
                {region.emoji} {region.name}
              </h2>
              <p className="relative mt-3 text-xs leading-5 text-slate-200 sm:text-sm">
                {region.desc}
              </p>
              <div className="relative mt-4 bg-black/45 p-3" style={{ boxShadow: "inset 0 0 0 2px rgba(103,232,249,0.35)" }}>
                <p className="pixel-text-sm text-slate-300">오늘의 바다</p>
                <p className="pixel-text mt-2 text-base text-cyan-100">
                  {event.emoji} {event.name}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-300 sm:text-sm">{event.desc}</p>
              </div>
            </div>

            <div className="pixel-panel p-4 sm:p-5">
              <h2 className="pixel-text text-base text-cyan-100 sm:text-lg">🪱 미끼</h2>
              <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3">
                {baitOptions.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBait(b.id)}
                    className={`p-3 text-left active:scale-[0.98] sm:p-4 ${
                      bait === b.id ? "bg-cyan-400/20" : "bg-black/40"
                    }`}
                    style={{
                      boxShadow:
                        bait === b.id
                          ? "0 0 0 2px #020617, 0 0 0 4px #facc15"
                          : "0 0 0 2px #020617, 0 0 0 3px #1e3a5f",
                    }}
                  >
                    <div className="pixel-text-sm text-white">
                      {b.name} {b.price > 0 ? `${b.price.toLocaleString()}G` : "FREE"}
                    </div>
                    <p className="mt-2 text-xs text-slate-300">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="pixel-panel p-4 sm:p-5">
              <h2 className="pixel-text text-base text-cyan-100 sm:text-lg">🧊 얼음</h2>
              <p className="pixel-text-sm mt-2 text-slate-300">
                얼음은 신선도 하락을 늦춥니다. 1개당 350G
              </p>
              <div className="mt-3 flex items-center gap-2 sm:mt-4 sm:gap-3">
                <button
                  onClick={() => setIce(Math.max(0, ice - 1))}
                  className="pixel-btn pixel-btn-cyan"
                >
                  -
                </button>
                <div
                  className="pixel-text flex-1 bg-black/50 p-3 text-center text-base text-cyan-100"
                  style={{ boxShadow: "inset 0 0 0 2px rgba(103,232,249,0.45)" }}
                >
                  {ice}
                </div>
                <button
                  onClick={() => setIce(Math.min(10, ice + 1))}
                  className="pixel-btn pixel-btn-cyan"
                >
                  +
                </button>
              </div>
            </div>

            <div className="pixel-panel-amber p-4 sm:p-5">
              <p className="pixel-text-sm text-yellow-100">출항 정보</p>
              <p className="pixel-text mt-2 text-base text-yellow-200 sm:text-lg">
                비용 {totalCost.toLocaleString()}G
              </p>
              <p className="pixel-text-sm mt-2 text-slate-200">
                보유 {save.gold.toLocaleString()}G
              </p>
              <p className="pixel-text-sm mt-2 text-slate-200">
                연료 {fuelLimit(save)} / 적재 {bagWeight(save).toFixed(1)} / {cargoLimit(save)}kg
              </p>
              {message && (
                <p className="pixel-text-sm mt-3 bg-rose-500/30 px-3 py-2 text-rose-100">
                  {message}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
