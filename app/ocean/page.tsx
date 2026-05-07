"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { regions } from "../../data/fishingData";

function OceanInner() {
  const params = useSearchParams();
  const regionId = params.get("region") || "busan";

  const region =
    regions.find((r) => r.id === regionId) || regions[0];

  return (
    <main className="min-h-screen bg-cyan-950 text-white p-6">
      <h1 className="text-4xl font-black">
        🚤 {region.name}
      </h1>

      <p className="mt-4 text-cyan-100">
        실제 바다 이동 + 물고기 실루엣 + 낚시 시스템
      </p>

      <div className="mt-10 rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-10 text-center">
        <div className="text-7xl">🌊</div>

        <p className="mt-6 text-2xl font-black">
          바다 시스템 연결 완료
        </p>

        <button className="mt-8 rounded-2xl bg-cyan-400 px-8 py-4 text-2xl font-black text-slate-950">
          🎣 낚시 시작
        </button>
      </div>
    </main>
  );
}

export default function OceanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OceanInner />
    </Suspense>
  );
}
