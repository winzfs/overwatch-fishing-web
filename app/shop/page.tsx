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

function saveGame(data: SaveData) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

const items = [
  {
    key: "rod",
    emoji: "🎣",
    name: "낚싯대 강화",
    desc: "낚시 미니게임 성공 구간이 넓어집니다.",
    basePrice: 1800,
    max: 5,
  },
  {
    key: "engine",
    emoji: "🚤",
    name: "엔진 강화",
    desc: "배 이동속도가 증가합니다.",
    basePrice: 2200,
    max: 5,
  },
  {
    key: "radar",
    emoji: "📡",
    name: "레이더 강화",
    desc: "물고기 감지 범위가 넓어지고 희귀 실루엣 등장률이 조금 오릅니다.",
    basePrice: 3500,
    max: 5,
  },
] as const;

export default function ShopPage() {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSave(loadSave());
  }, []);

  function price(basePrice: number, level: number) {
    return Math.floor(basePrice * Math.pow(1.85, level));
  }

  function buy(key: "rod" | "engine" | "radar", basePrice: number, max: number) {
    const level = save.upgrades[key];

    if (level >= max) {
      setMessage("이미 최대 레벨입니다.");
      return;
    }

    const cost = price(basePrice, level);

    if (save.gold < cost) {
      setMessage(`골드가 부족합니다. 필요 골드: ${cost.toLocaleString()}G`);
      return;
    }

    const next: SaveData = {
      ...save,
      gold: save.gold - cost,
      upgrades: {
        ...save.upgrades,
        [key]: level + 1,
      },
    };

    saveGame(next);
    setSave(next);
    setMessage("구매 완료! 낚시터에서 바로 적용됩니다.");
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <a href="/" className="rounded-xl bg-white/10 px-4 py-2 font-bold">
            ← 홈
          </a>

          <a href="/collection" className="rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-950">
            📖 도감
          </a>
        </div>

        <h1 className="mt-8 text-4xl font-black">🏪 낚시 상점</h1>
        <p className="mt-3 text-slate-300">
          골드로 장비를 강화합니다. 구매한 장비는 브라우저에 저장됩니다.
        </p>

        <section className="mt-6 rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5">
          <p className="text-sm text-yellow-100">보유 골드</p>
          <p className="mt-1 text-3xl font-black text-yellow-300">{save.gold.toLocaleString()}G</p>
          {message && <p className="mt-3 font-bold text-cyan-200">{message}</p>}
        </section>

        <div className="mt-8 grid gap-4">
          {items.map((item) => {
            const level = save.upgrades[item.key];
            const maxed = level >= item.max;
            const cost = price(item.basePrice, level);

            return (
              <div key={item.key} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black">
                      {item.emoji} {item.name}
                    </h2>
                    <p className="mt-2 text-slate-300">{item.desc}</p>
                    <p className="mt-3 text-sm font-bold text-cyan-200">
                      현재 Lv.{level} / 최대 Lv.{item.max}
                    </p>
                  </div>

                  <button
                    onClick={() => buy(item.key, item.basePrice, item.max)}
                    className={`shrink-0 rounded-2xl px-4 py-3 font-black ${
                      maxed
                        ? "bg-white/10 text-slate-400"
                        : save.gold >= cost
                        ? "bg-cyan-400 text-slate-950"
                        : "bg-red-500/20 text-red-200"
                    }`}
                  >
                    {maxed ? "MAX" : `${cost.toLocaleString()}G`}
                  </button>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${(level / item.max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
