import { regions } from "../data/fishingData";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-black">🎣 OVERWATCH FISHING</h1>
        <p className="mt-4 text-slate-300">실제 바다 탐험 낚시 게임</p>

        <a
          href="/regions"
          className="mt-8 inline-block rounded-2xl bg-cyan-400 px-8 py-4 text-2xl font-black text-slate-950"
        >
          게임 시작
        </a>

        <p className="mt-6 text-sm text-slate-500">
          지역 수: {regions.length}
        </p>
      </div>
    </main>
  );
}
