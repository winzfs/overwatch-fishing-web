"use client";

import { useEffect, useMemo, useState } from "react";
import { fishes, gradeInfo, regions } from "../../data/fishingData";
import { SaveData, defaultSave, loadSave } from "../gameSave";

export default function CollectionPage() {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [regionFilter, setRegionFilter] = useState("all");

  useEffect(() => setSave(loadSave()), []);

  const discovered = Object.keys(save.collection || {}).length;
  const total = fishes.length;
  const percent = total === 0 ? 0 : Math.floor((discovered / total) * 100);

  const visible = useMemo(() => {
    if (regionFilter === "all") return fishes;
    return fishes.filter((fish) => fish.region === regionFilter);
  }, [regionFilter]);

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <a href="/harbor" className="rounded-xl bg-white/10 px-4 py-2 font-bold">← 항구</a>
          <a href="/prepare" className="rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-950">🚤 출항</a>
        </div>

        <h1 className="mt-8 text-4xl font-black">📖 실루엣 도감</h1>
        <p className="mt-3 text-slate-300">발견 전에는 이름이 숨겨집니다. 발견률 {percent}%</p>

        <div className="mt-6 h-4 overflow-hidden rounded-full bg-black/40">
          <div className="h-full bg-cyan-400" style={{ width: `${percent}%` }} />
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setRegionFilter("all")} className={`shrink-0 rounded-xl px-4 py-2 font-bold ${regionFilter === "all" ? "bg-cyan-400 text-slate-950" : "bg-white/10"}`}>전체</button>
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => setRegionFilter(region.id)}
              className={`shrink-0 rounded-xl px-4 py-2 font-bold ${regionFilter === region.id ? "bg-cyan-400 text-slate-950" : "bg-white/10"}`}
            >
              {region.emoji} {region.name}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((fish) => {
            const grade = gradeInfo[fish.grade];
            const count = save.collection?.[fish.id] || 0;
            const found = count > 0;
            const record = save.records?.[fish.id];

            return (
              <div key={fish.id} className={`rounded-3xl border p-5 ${found ? "border-white/10 bg-white/5" : "border-white/5 bg-black/30 opacity-80"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-4xl">{found ? grade.emoji : "❓"}</div>
                    <h2 className="mt-3 text-xl font-black" style={{ color: found ? grade.color : "#64748b" }}>
                      {found ? fish.name : "미발견 어종"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">{grade.name} · {fish.price.toLocaleString()}G</p>
                  </div>
                  <div className="rounded-full bg-black/40 px-3 py-1 text-sm font-black">x{count}</div>
                </div>
                {found && record && (
                  <div className="mt-4 rounded-2xl bg-black/25 p-3 text-sm text-slate-300">
                    최고 기록: {record.cm}cm · {record.kg}kg
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
