import { regions } from "../data/fishingData";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/40 via-slate-950 to-black" />
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <div className="mb-6 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2 text-sm font-bold text-cyan-200">
          REGIONAL FISHING BUILD
        </div>

        <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">
          🎣 OVERWATCH
          <br />
          FISHING
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-xl">
          지역을 선택하고, 해당 낚시터에서 물고기 실루엣을 찾아 한 마리씩 낚으세요.
        </p>

        <div className="mt-10 grid w-full max-w-md gap-3">
          <a href="/regions" className="rounded-2xl bg-cyan-400 px-6 py-4 text-xl font-black text-slate-950 shadow-lg shadow-cyan-400/30 active:scale-95">
            🎮 지역 선택하기
          </a>

          <div className="grid grid-cols-3 gap-3">
            <a href="/collection" className="rounded-2xl border border-white/10 bg-white/10 py-4 font-bold">📖 도감</a>
            <a href="/shop" className="rounded-2xl border border-white/10 bg-white/10 py-4 font-bold">🏪 상점</a>
            <a href="/ranking" className="rounded-2xl border border-white/10 bg-white/10 py-4 font-bold">🏆 랭킹</a>
          </div>
        </div>

        <div className="mt-10 grid w-full max-w-3xl grid-cols-3 gap-3 text-left">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">지역</p>
            <p className="mt-1 text-xl font-black text-cyan-300">{regions.length}곳</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">방식</p>
            <p className="mt-1 text-xl font-black text-yellow-300">지역형</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">목표</p>
            <p className="mt-1 text-xl font-black text-pink-300">도감</p>
          </div>
        </div>
      </section>
    </main>
  );
}
