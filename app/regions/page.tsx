"use client";

import { regions } from "../../data/fishingData";

export default function RegionsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => (window.location.href = "/")} className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold">
            ← 홈
          </button>

          <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-200">
            지역 선택
          </div>
        </div>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">🗺️ 낚시터 선택</h1>
        <p className="mt-3 text-slate-300">지역을 선택하면 실제 바다 맵으로 이동합니다.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {regions.map((region) => (
            <button
              key={region.id}
              type="button"
              onClick={() => {
                window.location.href = `/ocean?region=${region.id}`;
              }}
              className={`w-full rounded-3xl border border-white/10 bg-gradient-to-br ${region.theme} p-5 text-left shadow-xl transition active:scale-[0.98]`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-4xl">{region.emoji}</div>
                  <h2 className="mt-3 text-2xl font-black">{region.name}</h2>
                </div>

                <span className="rounded-full bg-black/30 px-3 py-1 text-sm font-bold text-cyan-200">
                  Lv.{region.level}+
                </span>
              </div>

              <p className="mt-4 leading-6 text-slate-200">{region.desc}</p>

              <div className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-center font-black">
                🚤 이 지역 바다로 출항
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
