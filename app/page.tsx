import GameShell from "./game/GameShell";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="game-backdrop" />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="game-launcher-header">
          <div>
            <p className="eyebrow">OVERWATCH FISHING: BLUE SHIFT</p>
            <h1>항구 생활에서 심해 작살전까지 이어지는 2D 하이브리드 바다 RPG</h1>
          </div>
          <nav aria-label="legacy management shortcuts">
            <a href="/bag">가방</a>
            <a href="/collection">도감</a>
            <a href="/quests">퀘스트</a>
          </nav>
        </header>
        <GameShell />
      </section>
    </main>
  );
}
