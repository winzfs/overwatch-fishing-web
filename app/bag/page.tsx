"use client";

import { useEffect, useMemo, useState } from "react";
import { gradeInfo } from "../../data/fishingData";
import { SaveData, defaultSave, loadSave, saveGame, bagWeight, cargoLimit, currentFreshness, itemSellValue } from "../gameSave";

export default function BagPage() {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [sort, setSort] = useState<"grade" | "value" | "weight" | "fresh">("value");

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const items = useMemo(() => {
    const list = [...(save.bag || [])];
    return list.sort((a, b) => {
      if (sort === "value") return itemSellValue(b, save) - itemSellValue(a, save);
      if (sort === "weight") return b.kg - a.kg;
      if (sort === "fresh") return currentFreshness(b, save) - currentFreshness(a, save);
      return String(b.grade).localeCompare(String(a.grade));
    });
  }, [save, sort]);

  function discard(uid: string) {
    const next = { ...save, bag: (save.bag || []).filter((item) => item.uid !== uid) };
    saveGame(next);
    setSave(next);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-2">
          <a href="/harbor" className="rounded-xl bg-white/10 px-4 py-2 font-bold">← 항구</a>
        </div>

        <h1 className="mt-8 text-4xl font-black">🎒 어획 가방</h1>
        <p className="mt-3 text-slate-300">항구에서 판매하기 전까지 신선도가 계속 떨어집니다.</p>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">무게</p>
            <p className="mt-1 text-2xl font-black text-cyan-300">{bagWeight(save).toFixed(1)} / {cargoLimit(save)}kg</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">판매 예상</p>
            <p className="mt-1 text-2xl font-black text-green-300">{items.reduce((s, i) => s + itemSellValue(i, save), 0).toLocaleString()}G</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">어획 수</p>
            <p className="mt-1 text-2xl font-black text-yellow-300">{items.length}</p>
          </div>
        </section>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {[
            ["value", "가격순"],
            ["weight", "무게순"],
            ["fresh", "신선도순"],
            ["grade", "등급순"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSort(id as any)}
              className={`shrink-0 rounded-xl px-4 py-2 font-bold ${sort === id ? "bg-cyan-400 text-slate-950" : "bg-white/10"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">가방이 비어 있습니다.</div>
          )}

          {items.map((item) => {
            const grade = gradeInfo[item.grade as keyof typeof gradeInfo];
            const fresh = currentFreshness(item, save);
            const value = itemSellValue(item, save);

            return (
              <div key={item.uid} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-2xl font-black" style={{ color: grade?.color || "#fff" }}>
                      {grade?.emoji} {item.name}
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{item.sizeRank} · {item.cm}cm · {item.kg}kg</p>
                    <p className="mt-1 text-sm text-slate-400">신선도 {fresh}% · {value.toLocaleString()}G</p>
                  </div>
                  <button onClick={() => discard(item.uid)} className="rounded-xl bg-red-500/20 px-3 py-2 text-sm font-bold text-red-200">버리기</button>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/40">
                  <div className={fresh > 70 ? "h-full bg-cyan-400" : fresh > 40 ? "h-full bg-yellow-400" : "h-full bg-red-400"} style={{ width: `${fresh}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
