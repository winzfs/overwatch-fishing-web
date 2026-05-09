"use client";

import dynamic from "next/dynamic";

const CanvasGame = dynamic(() => import("./CanvasGame"), {
  ssr: false,
  loading: () => (
    <div className="game-loading">
      <span>해류 데이터와 픽셀 항구를 불러오는 중...</span>
    </div>
  ),
});

export default function GameShell() {
  return <CanvasGame />;
}
