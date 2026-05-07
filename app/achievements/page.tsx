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
      date: new Date().toISOString().slice(0, 10),
      claimed: {},
    },
    achievements: {},
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
      achievements: parsed.achievements || {},
    };
  } catch {
    return defaultSave();
  }
}

function saveGame(data: SaveData) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

const achievementList = [
  {
    id: "first_catch",
    title: "첫 손맛",
    desc: "물고기 1마리 이상 포획",
    reward: 500,
    check: (save: SaveData) => save.caught >= 1,
  },
  {
    id: "catch_10",
    title: "초보 낚시꾼",
    desc: "물고기 10마리 이상 포획",
    reward: 2500,
    check: (save: SaveData) => save.caught >= 10,
  },
  {
    id: "catch_50",
    title: "바다의 단골",
    desc: "물고기 50마리 이상 포획",
    reward: 15000,
    check: (save: SaveData) => save.caught >= 50,
  },
  {
    id: "collector_5",
    title: "도감 수집가",
    desc: "서로 다른 어종 5종 발견",
    reward: 5000,
    check: (save: SaveData) => Object.keys(save.collection).length >= 5,
  },
  {
    id: "collector_15",
    title: "전문 조사원",
    desc: "서로 다른 어종 15종 발견",
    reward: 25000,
    check: (save: SaveData) => Object.keys(save.collection).length >= 15,
  },
  {
    id: "upgrade_total_3",
    title: "장비 맛보기",
    desc: "상점 업그레이드 총합 3 달성",
    reward: 8000,
    check: (save: SaveData) =>
      save.upgrades.rod + save.upgrades.engine + save.upgrades.radar >= 3,
  },
  {
    id: "upgrade_total_10",
    title: "풀튜닝 선장",
    desc: "상점 업그레이드 총합 10 달성",
    reward: 35000,
    check: (save: SaveData) =>
      save.upgrades.rod + save.upgrades.engine + save.upgrades.radar >= 10,
  },
];

export default function AchievementsPage() {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSave(loadSave());
  }, []);

  function claim(id: string, reward: number, unlocked: boolean) {
    if (!unlocked) {
      setMessage("아직 달성하지 못한 업적이야.");
      return;
    }

    if (save.achievements?.[id]) {
      setMessage("이미 받은 업적 보상이야.");
      return;
    }

    const next: SaveData = {
      ...save,
      gold: save.gold + reward,
      achievements: {
        ...(save.achievements || {}),
        [id]: true,
      },
    };

    saveGame(next);
    setSave(next);
    setMessage(`업적 보상 수령! +${reward.toLocaleString()}G`);
  }

  const completed = achievementList.filter((item) => save.achievements?.[item.id] || item.check(save)).length;

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <a href="/" className="rounded-xl bg-white/10 px-4 py-2 font-bold">
            ← 홈
          </a>

          <a href="/quests" className="rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-950">
            📅 퀘스트
          </a>
        </div>

        <h1 className="mt-8 text-4xl font-black">🏆 업적</h1>
        <p className="mt-3 text-slate-300">
          장기 목표야. 달성하면 보상을 직접 수령할 수 있어.
        </p>

        <section className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">달성 가능</p>
            <p className="mt-1 text-2xl font-black text-cyan-300">
              {completed}/{achievementList.length}
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

        {message && (
          <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 font-bold text-cyan-100">
            {message}
          </div>
        )}

        <div className="mt-8 grid gap-4">
          {achievementList.map((item) => {
            const unlocked = item.check(save);
            const claimed = Boolean(save.achievements?.[item.id]);

            return (
              <div
                key={item.id}
                className={`rounded-3xl border p-5 ${
                  claimed
                    ? "border-cyan-300/30 bg-cyan-300/10"
                    : unlocked
                    ? "border-yellow-300/30 bg-yellow-300/10"
                    : "border-white/10 bg-white/5 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black">
                      {claimed ? "✅" : unlocked ? "🎁" : "🔒"} {item.title}
                    </h2>
                    <p className="mt-2 text-slate-300">{item.desc}</p>
                    <p className="mt-3 text-sm font-bold text-yellow-200">
                      보상 {item.reward.toLocaleString()}G
                    </p>
                  </div>

                  <button
                    onClick={() => claim(item.id, item.reward, unlocked)}
                    className={`shrink-0 rounded-2xl px-4 py-3 font-black ${
                      claimed
                        ? "bg-white/10 text-slate-400"
                        : unlocked
                        ? "bg-cyan-400 text-slate-950"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {claimed ? "완료" : unlocked ? "수령" : "잠김"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
