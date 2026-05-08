"use client";

import { useState } from "react";
import { regions } from "../../data/fishingData";
import { getDailySeaEvent } from "../gameSave";

export default function EventsPage() {
  const [selected, setSelected] = useState("all");
  const visible = selected === "all" ? regions : regions.filter((r) => r.id === selected);

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <a href="/harbor" className="rounded-xl bg-white/10 px-4 py-2 font-bold">← 항구</a>
          <a href="/prepare" className="rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-950">🚤 출항</a>
        </div>

        <h1 className="mt-8 text-4xl font-black">🌦️ 오늘의 바다 정보</h1>
        <p className="mt-3 text-slate-300">지역별 시세/이벤트를 보고 출항 계획을 세우세요.</p>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setSelected("all")} className={`shrink-0 rounded-xl px-4 py-2 font-bold ${selected === "all" ? "bg-cyan-400 text-slate-950" : "bg-white/10"}`}>전체</button>
          {regions.map((region) => (
            <button key={region.id} onClick={() => setSelected(region.id)} className={`shrink-0 rounded-xl px-4 py-2 font-bold ${selected === region.id ? "bg-cyan-400 text-slate-950" : "bg-white/10"}`}>
              {region.emoji} {region.name}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {visible.map((region) => {
            const event = getDailySeaEvent(region.id);
            return (
              <a key={region.id} href={`/prepare`} className={`rounded-3xl border border-white/10 bg-gradient-to-br ${region.theme} p-5 shadow-xl active:scale-[0.98]`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-4xl">{region.emoji}</div>
                    <h2 className="mt-3 text-2xl font-black">{region.name}</h2>
                  </div>
                  <span className="rounded-full bg-black/35 px-3 py-1 text-sm font-black">{event.emoji} {event.name}</span>
                </div>
                <p className="mt-4 text-slate-200">{event.desc}</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-2xl bg-black/25 p-3"><p className="text-slate-300">골드</p><p className="font-black text-yellow-300">x{event.goldMultiplier}</p></div>
                  <div className="rounded-2xl bg-black/25 p-3"><p className="text-slate-300">EXP</p><p className="font-black text-cyan-300">x{event.expMultiplier}</p></div>
                  <div className="rounded-2xl bg-black/25 p-3"><p className="text-slate-300">희귀</p><p className="font-black text-pink-300">+{event.rareBonus}</p></div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
}
