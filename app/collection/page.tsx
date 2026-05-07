"use client";

import { useEffect, useMemo, useState } from "react";
import { fishes, gradeInfo, regions } from "../../data/fishingData";

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
};

const SAVE_KEY = "overwatch-fishing-save-v1";

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
  };
}

function loadSave(): SaveData {
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
    };
  } catch {
    return defaultSave();
  }
}

export default function CollectionPage() {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [regionFilter, setRegionFilter] = useState("all");

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const discovered = Object.keys(save.collection).length;
  const total = fishes.length;
  const percent = total === 0 ? 0 : Math.floor((discovered / total) * 100);

  const visibleFishes = useMemo(() => {
    if (regionFilter === "all") return fishes;
    return fishes.filter((fish) => fish.region === regionFilter);
  }, [regionFilter]);

  function resetSave() {
    if (!confirm("정말 저장 데이터를 초기화할까요?")) return;
    localStorage.removeItem(SAVE_KEY);
    setSave(defaultSave());
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <a href="/" className="rounded-xl bg-white/10 px-4 py-2 font-bold">
            ← 홈
          </a>

          <a href="/shop" className="rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-950">
            🏪 상점
          </a>
        </div>

        <h1 className="mt-8 text-4xl font-black">📖 물고기 도감</h1>
        <p className="mt-3 text-slate-300">
          잡은 물고기는 자동 저장됩니다. 현재 발견률 {percent}%입니다.
        </p>

        <section className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">발견</p>
            <p className="mt-1 text-2xl font-black text-cyan-300">
              {discovered}/{total}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">총 포획</p>
            <p className="mt-1 text-2xl font-black text-yellow-300">{save.caught}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">골드</p>
            <p className="mt-1 text-2xl font-black text-amber-300">{save.gold.toLocaleString()}G</p>
          </div>
        </section>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setRegionFilter("all")}
            className={`shrink-0 rounded-xl px-4 py-2 font-bold ${
              regionFilter === "all" ? "bg-cyan-400 text-slate-950" : "bg-white/10"
            }`}
          >
            전체
          </button>

          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => setRegionFilter(region.id)}
              className={`shrink-0 rounded-xl px-4 py-2 font-bold ${
                regionFilter === region.id ? "bg-cyan-400 text-slate-950" : "bg-white/10"
              }`}
            >
              {region.emoji} {region.name}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {visibleFishes.map((fish) => {
            const grade = gradeInfo[fish.grade];
            const count = save.collection[fish.id] || 0;
            const found = count > 0;

            return (
              <div
                key={fish.id}
                className={`rounded-2xl border p-4 ${
                  found
                    ? "border-white/10 bg-white/5"
                    : "border-white/5 bg-black/30 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xl font-black" style={{ color: found ? grade.color : "#64748b" }}>
                      {found ? `${grade.emoji} ${fish.name}` : "??? 미발견 어종"}
                    </div>

                    <div className="mt-1 text-sm text-slate-400">
                      {grade.name} · {fish.price.toLocaleString()}G · EXP {fish.exp}
                    </div>
                  </div>

                  <div className="rounded-full bg-black/40 px-3 py-1 text-sm font-black">
                    x{count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={resetSave}
          className="mt-8 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 font-bold text-red-200"
        >
          저장 초기화
        </button>
      </div>
    </main>
  );
}
