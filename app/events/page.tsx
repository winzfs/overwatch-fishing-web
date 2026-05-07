"use client";

import { useMemo, useState } from "react";
import { regions } from "../../data/fishingData";

type DailySeaEvent = {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  goldMultiplier: number;
  expMultiplier: number;
  rareBonus: number;
};

const DAILY_EVENTS: DailySeaEvent[] = [
  {
    id: "calm",
    name: "잔잔한 바다",
    desc: "평범하지만 안정적인 낚시 날입니다.",
    emoji: "🌤️",
    goldMultiplier: 1,
    expMultiplier: 1,
    rareBonus: 0,
  },
  {
    id: "gold_tide",
    name: "황금 물결",
    desc: "포획 보상 골드가 30% 증가합니다.",
    emoji: "🌅",
    goldMultiplier: 1.3,
    expMultiplier: 1,
    rareBonus: 0,
  },
  {
    id: "school",
    name: "물고기 떼 출몰",
    desc: "물고기 수가 증가하고 희귀 실루엣이 조금 더 자주 보입니다.",
    emoji: "🐟",
    goldMultiplier: 1,
    expMultiplier: 1.1,
    rareBonus: 1,
  },
  {
    id: "storm",
    name: "폭풍 전야",
    desc: "낚시는 더 긴장되지만 경험치가 40% 증가합니다.",
    emoji: "⛈️",
    goldMultiplier: 1,
    expMultiplier: 1.4,
    rareBonus: 1,
  },
  {
    id: "legend_scent",
    name: "전설의 기척",
    desc: "전설 이상 실루엣 등장률이 증가합니다.",
    emoji: "✨",
    goldMultiplier: 1.15,
    expMultiplier: 1.15,
    rareBonus: 2,
  },
];

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getDailySeaEvent(regionId: string): DailySeaEvent {
  const key = `${new Date().toISOString().slice(0, 10)}-${regionId}`;
  return DAILY_EVENTS[hashString(key) % DAILY_EVENTS.length];
}

export default function EventsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [selected, setSelected] = useState("all");

  const visibleRegions = useMemo(() => {
    if (selected === "all") return regions;
    return regions.filter((region) => region.id === selected);
  }, [selected]);

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <a href="/" className="rounded-xl bg-white/10 px-4 py-2 font-bold">
            ← 홈
          </a>

          <a href="/regions" className="rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-950">
            🗺️ 지역
          </a>
        </div>

        <h1 className="mt-8 text-4xl font-black">🌦️ 오늘의 바다 이벤트</h1>
        <p className="mt-3 text-slate-300">
          지역마다 매일 다른 바다 상태가 적용됩니다. 오늘 날짜: {today}
        </p>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelected("all")}
            className={`shrink-0 rounded-xl px-4 py-2 font-bold ${
              selected === "all" ? "bg-cyan-400 text-slate-950" : "bg-white/10"
            }`}
          >
            전체
          </button>

          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => setSelected(region.id)}
              className={`shrink-0 rounded-xl px-4 py-2 font-bold ${
                selected === region.id ? "bg-cyan-400 text-slate-950" : "bg-white/10"
              }`}
            >
              {region.emoji} {region.name}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {visibleRegions.map((region) => {
            const event = getDailySeaEvent(region.id);

            return (
              <a
                key={region.id}
                href={`/ocean?region=${region.id}`}
                className={`rounded-3xl border border-white/10 bg-gradient-to-br ${region.theme} p-5 shadow-xl active:scale-[0.98]`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-4xl">{region.emoji}</div>
                    <h2 className="mt-3 text-2xl font-black">{region.name}</h2>
                  </div>

                  <div className="rounded-full bg-black/35 px-3 py-1 text-sm font-black">
                    {event.emoji} {event.name}
                  </div>
                </div>

                <p className="mt-4 text-slate-200">{event.desc}</p>

                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-2xl bg-black/25 p-3">
                    <p className="text-slate-300">골드</p>
                    <p className="font-black text-yellow-300">x{event.goldMultiplier}</p>
                  </div>
                  <div className="rounded-2xl bg-black/25 p-3">
                    <p className="text-slate-300">EXP</p>
                    <p className="font-black text-cyan-300">x{event.expMultiplier}</p>
                  </div>
                  <div className="rounded-2xl bg-black/25 p-3">
                    <p className="text-slate-300">희귀</p>
                    <p className="font-black text-pink-300">+{event.rareBonus}</p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
}
