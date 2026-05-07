"use client";

import { useEffect, useState } from "react";

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
  quests?: {
    date: string;
    claimed: Record<string, boolean>;
  };
  achievements?: Record<string, boolean>;
};

const SAVE_KEY = "overwatch-fishing-save-v1";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

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
    quests: {
      date: todayKey(),
      claimed: {},
    },
    achievements: {},
  };
}

function normalizeSave(data: Partial<SaveData>): SaveData {
  const base = defaultSave();
  const isToday = data.quests?.date === todayKey();

  return {
    ...base,
    ...data,
    collection: data.collection || {},
    upgrades: {
      ...base.upgrades,
      ...(data.upgrades || {}),
    },
    quests: {
      date: todayKey(),
      claimed: isToday ? data.quests?.claimed || {} : {},
    },
    achievements: data.achievements || {},
  };
}

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return normalizeSave(JSON.parse(raw));
  } catch {
    return defaultSave();
  }
}

function saveGame(data: SaveData) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(normalizeSave(data)));
}

const dailyQuests = [
  {
    id: "catch_3",
    title: "오늘의 손맛",
    desc: "물고기 3마리 이상 잡기",
    reward: 1500,
    goal: 3,
    progress: (save: SaveData) => Math.min(save.caught, 3),
  },
  {
    id: "catch_10",
    title: "꾸준한 낚시꾼",
    desc: "총 포획 수 10마리 달성",
    reward: 3000,
    goal: 10,
    progress: (save: SaveData) => Math.min(save.caught, 10),
  },
  {
    id: "discover_3",
    title: "도감 조사",
    desc: "도감에서 서로 다른 어종 3종 발견",
    reward: 2500,
    goal: 3,
    progress: (save: SaveData) => Math.min(Object.keys(save.collection).length, 3),
  },
  {
    id: "upgrade_1",
    title: "장비 투자",
    desc: "상점 업그레이드 총합 1 이상 달성",
    reward: 2000,
    goal: 1,
    progress: (save: SaveData) =>
      Math.min(save.upgrades.rod + save.upgrades.engine + save.upgrades.radar, 1),
  },
];

export default function QuestsPage() {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loaded = loadSave();
    saveGame(loaded);
    setSave(loaded);
  }, []);

  function claim(id: string, reward: number, done: boolean) {
    if (!done) {
      setMessage("아직 조건을 완료하지 못했어.");
      return;
    }

    if (save.quests?.claimed[id]) {
      setMessage("이미 받은 보상이야.");
      return;
    }

    const next: SaveData = {
      ...save,
      gold: save.gold + reward,
      quests: {
        date: todayKey(),
        claimed: {
          ...(save.quests?.claimed || {}),
          [id]: true,
        },
      },
    };

    saveGame(next);
    setSave(next);
    setMessage(`보상 수령 완료! +${reward.toLocaleString()}G`);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <a href="/" className="rounded-xl bg-white/10 px-4 py-2 font-bold">
            ← 홈
          </a>

          <a href="/achievements" className="rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-950">
            🏆 업적
          </a>
        </div>

        <h1 className="mt-8 text-4xl font-black">📅 일일 퀘스트</h1>
        <p className="mt-3 text-slate-300">
          매일 초기화되는 보상 목표야. 현재 날짜: {todayKey()}
        </p>

        <section className="mt-6 rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5">
          <p className="text-sm text-yellow-100">보유 골드</p>
          <p className="mt-1 text-3xl font-black text-yellow-300">
            {save.gold.toLocaleString()}G
          </p>
          {message && <p className="mt-3 font-bold text-cyan-200">{message}</p>}
        </section>

        <div className="mt-8 grid gap-4">
          {dailyQuests.map((quest) => {
            const progress = quest.progress(save);
            const done = progress >= quest.goal;
            const claimed = Boolean(save.quests?.claimed[quest.id]);

            return (
              <div key={quest.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black">{quest.title}</h2>
                    <p className="mt-2 text-slate-300">{quest.desc}</p>
                    <p className="mt-3 text-sm font-bold text-cyan-200">
                      진행도 {progress}/{quest.goal}
                    </p>
                  </div>

                  <button
                    onClick={() => claim(quest.id, quest.reward, done)}
                    className={`shrink-0 rounded-2xl px-4 py-3 font-black ${
                      claimed
                        ? "bg-white/10 text-slate-400"
                        : done
                        ? "bg-cyan-400 text-slate-950"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {claimed ? "완료" : `+${quest.reward.toLocaleString()}G`}
                  </button>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${(progress / quest.goal) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <a href="/regions" className="rounded-2xl bg-white/10 p-4 text-center font-bold">
            🗺️ 지역
          </a>
          <a href="/collection" className="rounded-2xl bg-white/10 p-4 text-center font-bold">
            📖 도감
          </a>
          <a href="/shop" className="rounded-2xl bg-white/10 p-4 text-center font-bold">
            🏪 상점
          </a>
        </div>
      </div>
    </main>
  );
}
