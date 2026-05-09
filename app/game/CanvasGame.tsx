"use client";

import { useEffect, useRef, useState } from "react";
import { Game } from "../../src/game/core/Game";

type UiState = {
  mode?: string;
  gold: number;
  cargo: number;
  collection: number;
  metaDepth: number;
};

export default function CanvasGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("게임 엔진을 초기화하는 중...");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<UiState>({ gold: 0, cargo: 0, collection: 0, metaDepth: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let mounted = true;
    const game = new Game(canvas, {
      onReady: () => {
        if (mounted) setReady(true);
      },
      onToast: (message) => {
        if (mounted) setToast(message);
      },
      onState: (nextState) => {
        if (mounted) setState(nextState);
      },
    });
    gameRef.current = game;
    game.start().catch((reason: unknown) => {
      if (!mounted) return;
      const message = reason instanceof Error ? reason.message : "게임 엔진 시작에 실패했습니다.";
      setError(message);
      setToast(message);
    });
    return () => {
      mounted = false;
      game.stop();
      gameRef.current = null;
    };
  }, []);

  return (
    <section className="game-shell" aria-label="Overwatch Fishing playable canvas game">
      <div className="game-canvas-frame">
        {!ready && <div className="game-canvas-loading">스프라이트와 해류 데이터를 불러오는 중...</div>}
        {error && <div className="game-canvas-error">{error}</div>}
        <canvas ref={canvasRef} className="game-canvas" width={960} height={540} />
      </div>
      <aside className="game-side-panel">
        <p className="eyebrow">LIVE GAME STATE</p>
        <h2>{state.mode === "ocean" ? "실시간 바다 필드" : state.mode === "dive" ? "횡스크롤 잠수" : "플레이 가능한 항구"}</h2>
        <p>{toast}</p>
        <div className="stat-grid">
          <span>골드 <b>{state.gold.toLocaleString()}G</b></span>
          <span>도감 <b>{state.collection}</b></span>
          <span>화물 <b>{state.cargo}/18</b></span>
          <span>심도 <b>Lv.{state.metaDepth}</b></span>
        </div>
        <div className="controls-help">
          <b>Keyboard</b> WASD/방향키 이동 · E 상호작용 · Space 작살/잠수 · Shift 부스트 · H 항구 · Esc 상승
          <b>Touch</b> 화면 드래그 이동 · 탭으로 작살/잠수 액션
        </div>
      </aside>
    </section>
  );
}
