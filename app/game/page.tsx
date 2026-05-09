import Link from "next/link";
import GameShell from "./GameShell";

export default function GamePrototypePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="game-backdrop" />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="game-launcher-header">
          <div>
            <p className="eyebrow">EXPERIMENTAL CANVAS PROTOTYPE</p>
            <h1>Canvas 기반 항구·바다·잠수 엔진 실험 모드</h1>
          </div>
          <nav aria-label="stable game shortcuts">
            <Link href="/">홈</Link>
            <Link href="/harbor">기존 항구</Link>
            <Link href="/ocean">기존 바다</Link>
          </nav>
        </header>
        <GameShell />
      </section>
    </main>
  );
}
