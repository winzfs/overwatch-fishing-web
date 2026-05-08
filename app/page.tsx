import DiscordLaunchBridge from "./components/DiscordLaunchBridge";
export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <DiscordLaunchBridge />
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/40 via-slate-950 to-black" />
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <div className="mb-6 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2 text-sm font-bold text-cyan-200">
          OVERWATCH FISHING RPG
        </div>

        <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">
          ⚓ 항구에서
          <br />
          출항 준비
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-xl">
          물고기를 잡아 가방에 담고, 항구에서 판매하고, 장비를 업그레이드해 더 먼 바다로 나아가세요.
        </p>

        <div className="mt-10 grid w-full max-w-md gap-3">
          <a href="/harbor" className="rounded-2xl bg-cyan-400 px-6 py-4 text-xl font-black text-slate-950 shadow-lg shadow-cyan-400/30 active:scale-95">
            ⚓ 항구 입장
          </a>

          <a href="/prepare" className="rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-lg font-bold backdrop-blur active:scale-95">
            🚤 바로 출항 준비
          </a>

          <div className="grid grid-cols-3 gap-3">
            <a href="/bag" className="rounded-2xl border border-white/10 bg-white/10 py-4 font-bold">🎒 가방</a>
            <a href="/collection" className="rounded-2xl border border-white/10 bg-white/10 py-4 font-bold">📖 도감</a>
            <a href="/events" className="rounded-2xl border border-white/10 bg-white/10 py-4 font-bold">🌦️ 바다</a>
          </div>
        </div>
      </section>
    </main>
  );
}
