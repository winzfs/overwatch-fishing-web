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
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <a href="/harbor" className="rounded-xl bg-white/10 px-4 py-2 font-bold">← 항구</a>
          <button
            onClick={start}
            className={`rounded-xl px-5 py-3 font-black ${
              isRegionUnlocked(selectedRegion, save)
                ? "bg-cyan-400 text-slate-950"
                : "bg-red-500/30 text-red-100"
            }`}
          >
            {isRegionUnlocked(selectedRegion, save) ? "🚤 출항" : `🔒 Lv.${getRegionRequiredLevel(selectedRegion)} 필요`}
          </button>
        </div>

        <h1 className="mt-8 text-4xl font-black">🚤 출항 준비</h1>
        <p className="mt-3 text-slate-300">지역, 미끼, 얼음을 선택하고 출항하세요.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <h2 className="text-2xl font-black">🗺️ 지역 선택</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {regions.map((r) => {
                const e = getDailySeaEvent(r.id);
                const requiredLevel = getRegionRequiredLevel(r.id);
                const unlocked = playerLevel >= requiredLevel;
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
                    className={`rounded-3xl border p-5 text-left active:scale-[0.98] ${
                      selectedRegion === r.id
                        ? unlocked
                          ? "border-cyan-300 bg-cyan-300/10"
                          : "border-red-300 bg-red-500/10"
                        : unlocked
                        ? "border-white/10 bg-white/5"
                        : "border-white/5 bg-black/35 opacity-70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-4xl">{r.emoji}</div>
                        <h3 className="mt-3 text-xl font-black">{r.name}</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${unlocked ? "bg-black/35" : "bg-red-500/25 text-red-100"}`}>
                        {unlocked ? `${e.emoji} ${e.name}` : `🔒 Lv.${requiredLevel}`}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{r.desc}</p>
                    {!unlocked && (
                      <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-xs font-bold text-red-100">
                        현재 Lv.{playerLevel} · Lv.{requiredLevel} 필요
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <aside>
            <div className="mb-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <p className="text-sm font-bold text-cyan-100">내 항해 레벨</p>
              <p className="mt-1 text-3xl font-black text-cyan-300">Lv.{playerLevel}</p>
              <p className="mt-2 text-xs text-slate-300">EXP {save.exp || 0} / {nextExp}</p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${Math.min(100, ((save.exp || 0) / nextExp) * 100)}%` }}
                />
              </div>
            </div>

            <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${region.theme} p-5`}>
              <h2 className="text-2xl font-black">{region.emoji} {region.name}</h2>
              <p className="mt-3 text-slate-200">{region.desc}</p>
              <div className="mt-5 rounded-2xl bg-black/30 p-4">
                <p className="text-sm text-slate-300">오늘의 바다</p>
                <p className="mt-1 text-xl font-black">{event.emoji} {event.name}</p>
                <p className="mt-2 text-sm text-slate-300">{event.desc}</p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-2xl font-black">🪱 미끼</h2>
              <div className="mt-4 grid gap-3">
                {baitOptions.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBait(b.id)}
                    className={`rounded-2xl border p-4 text-left ${
                      bait === b.id ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="font-black">{b.name} {b.price > 0 ? `${b.price.toLocaleString()}G` : "무료"}</div>
                    <p className="mt-1 text-sm text-slate-300">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-2xl font-black">🧊 얼음</h2>
              <p className="mt-2 text-sm text-slate-300">얼음은 신선도 하락을 늦춥니다. 1개당 350G</p>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={() => setIce(Math.max(0, ice - 1))} className="rounded-xl bg-white/10 px-4 py-3 font-black">-</button>
                <div className="flex-1 rounded-xl bg-black/30 p-3 text-center text-xl font-black">{ice}</div>
                <button onClick={() => setIce(Math.min(10, ice + 1))} className="rounded-xl bg-white/10 px-4 py-3 font-black">+</button>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5">
              <p className="text-sm text-yellow-100">출항 정보</p>
              <p className="mt-1 text-xl font-black text-yellow-300">비용 {totalCost.toLocaleString()}G</p>
              <p className="mt-2 text-sm text-slate-300">보유 {save.gold.toLocaleString()}G</p>
              <p className="mt-2 text-sm text-slate-300">연료 {fuelLimit(save)} / 적재 {bagWeight(save).toFixed(1)} / {cargoLimit(save)}kg</p>
              {message && <p className="mt-3 font-bold text-red-200">{message}</p>}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
