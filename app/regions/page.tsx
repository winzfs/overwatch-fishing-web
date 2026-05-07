"use client";

import { regions } from "../../data/fishingData";

export default function RegionsPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="text-4xl font-black">🗺️ 지역 선택</h1>

      <div className="mt-8 grid gap-4">
        {regions.map((region) => (
          <button
            key={region.id}
            onClick={() => {
              window.location.href = `/ocean?region=${region.id}`;
            }}
            className="rounded-2xl bg-white/10 p-5 text-left"
          >
            <div className="text-3xl">{region.emoji}</div>
            <div className="mt-2 text-2xl font-black">{region.name}</div>
            <div className="mt-2 text-slate-300">{region.desc}</div>
          </button>
        ))}
      </div>
    </main>
  );
}
