"use client";

import DiscordLaunchBridge from "../components/DiscordLaunchBridge";

import { useEffect, useMemo, useState } from "react";
import { gradeInfo } from "../../data/fishingData";
import {
  SaveData,
  loadSave,
  saveGame,
  defaultSave,
  bagWeight,
  cargoLimit,
  currentFreshness,
  itemSellValue,
  upgradeList,
  upgradePrice,
} from "../gameSave";

export default function HarborPage() {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [message, setMessage] = useState("");

  useEffect(() => setSave(loadSave()), []);

  const totalValue = useMemo(
    () => (save.bag || []).reduce((sum, item) => sum + itemSellValue(item, save), 0),
    [save]
  );

  const discovered = Object.keys(save.collection || {}).length;
  const upgradeTotal = Object.values(save.upgrades || {}).reduce((a, b) => a + (b || 0), 0);

  function sellAll() {
    if (!save.bag || save.bag.length === 0) {
      setMessage("판매할 물고기가 없습니다.");
      return;
    }

    const next: SaveData = { ...save, gold: save.gold + totalValue, bag: [] };
    saveGame(next);
    setSave(next);
    setMessage(`어획물 판매 완료! +${totalValue.toLocaleString()}G`);
  }

  function buyUpgrade(key: keyof SaveData["upgrades"], base: number, max: number) {
    const level = save.upgrades[key] || 0;
    if (level >= max) {
      setMessage("이미 최대 레벨입니다.");
      return;
    }

    const cost = upgradePrice(base, level);
    if (save.gold < cost) {
      setMessage(`골드가 부족합니다. 필요: ${cost.toLocaleString()}G`);
      return;
    }

    const next: SaveData = {
      ...save,
      gold: save.gold - cost,
      upgrades: { ...save.upgrades, [key]: level + 1 },
    };

    saveGame(next);
    setSave(next);
    setMessage(`${key} 업그레이드 완료!`);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <DiscordLaunchBridge />
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-cyan-900/30 via-slate-950 to-black px-5 py-8">
        <div className="absolute right-10 top-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            <a href="/" className="rounded-xl bg-white/10 px-4 py-2 font-bold">← 홈</a>
            <a href="/prepare" className="rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-950">🚤 출항 준비</a>
          </div>

          <h1 className="mt-8 text-5xl font-black">⚓ 네온 항구</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            이곳에서 어획물을 판매하고, 장비를 강화하고, 오늘의 바다 정보를 확인한 뒤 출항합니다.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-5">
            <a href="/prepare" className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 active:scale-[0.98]">
              <div className="text-3xl">🚤</div>
              <div className="mt-3 text-xl font-black">출항</div>
              <p className="mt-1 text-sm text-slate-300">지역/미끼 선택</p>
            </a>
            <a href="/bag" className="rounded-3xl border border-white/10 bg-white/5 p-5 active:scale-[0.98]">
              <div className="text-3xl">🎒</div>
              <div className="mt-3 text-xl font-black">가방</div>
              <p className="mt-1 text-sm text-slate-300">{bagWeight(save).toFixed(1)} / {cargoLimit(save)}kg</p>
            </a>
            <a href="/collection" className="rounded-3xl border border-white/10 bg-white/5 p-5 active:scale-[0.98]">
              <div className="text-3xl">📖</div>
              <div className="mt-3 text-xl font-black">도감</div>
              <p className="mt-1 text-sm text-slate-300">{discovered}종 발견</p>
            </a>
            <a href="/events" className="rounded-3xl border border-white/10 bg-white/5 p-5 active:scale-[0.98]">
              <div className="text-3xl">🌦️</div>
              <div className="mt-3 text-xl font-black">오늘 바다</div>
              <p className="mt-1 text-sm text-slate-300">시세/이벤트</p>
            </a>
            <button onClick={sellAll} className="rounded-3xl border border-emerald-300/20 bg-emerald-300/15 p-5 text-left active:scale-[0.98]">
              <div className="text-3xl">💰</div>
              <div className="mt-3 text-xl font-black">전부 판매</div>
              <p className="mt-1 text-sm text-emerald-200">{totalValue.toLocaleString()}G</p>
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-8 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5">
            <p className="text-sm text-yellow-100">보유 골드</p>
            <p className="mt-1 text-4xl font-black text-yellow-300">{save.gold.toLocaleString()}G</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-2xl bg-black/25 p-3">
                <p className="text-slate-300">포획</p>
                <p className="font-black">{save.caught}</p>
              </div>
              <div className="rounded-2xl bg-black/25 p-3">
                <p className="text-slate-300">도감</p>
                <p className="font-black">{discovered}</p>
              </div>
              <div className="rounded-2xl bg-black/25 p-3">
                <p className="text-slate-300">강화</p>
                <p className="font-black">{upgradeTotal}</p>
              </div>
            </div>
            {message && <p className="mt-4 font-bold text-cyan-200">{message}</p>}
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl font-black">📜 항구 게시판</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <p>🌊 멀리 나갈수록 희귀 실루엣이 늘어납니다.</p>
              <p>🧊 냉장고를 올리면 신선도 하락이 느려집니다.</p>
              <p>🎒 가방이 가득 차면 대형어를 놓칠 수 있습니다.</p>
              <p>🐋 거대 그림자는 높은 가치의 어획물을 암시합니다.</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-black">🧑‍🔧 장비 강화</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {upgradeList.map((item) => {
              const level = save.upgrades[item.key] || 0;
              const cost = upgradePrice(item.base, level);
              const maxed = level >= item.max;

              return (
                <div key={item.key} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-black">{item.emoji} {item.name}</h3>
                      <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
                      <p className="mt-2 text-sm font-bold text-cyan-200">Lv.{level} / {item.max}</p>
                    </div>

                    <button
                      onClick={() => buyUpgrade(item.key, item.base, item.max)}
                      className={`shrink-0 rounded-2xl px-4 py-3 font-black ${
                        maxed ? "bg-white/10 text-slate-400" : save.gold >= cost ? "bg-cyan-400 text-slate-950" : "bg-red-500/20 text-red-200"
                      }`}
                    >
                      {maxed ? "MAX" : `${cost.toLocaleString()}G`}
                    </button>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/40">
                    <div className="h-full bg-cyan-400" style={{ width: `${(level / item.max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
