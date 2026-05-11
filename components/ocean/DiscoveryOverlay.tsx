"use client";

import { useEffect, useRef, useState } from "react";

export interface DiscoveryData {
  fishName: string;
  grade: string;
  gradeEmoji: string;
  gradeColor: string;
  gradeName: string;
  cm: number;
  kg: number;
  sizeRank: string;
  isNew: boolean;
  isRecord: boolean;
  quality: "perfect" | "good";
}

const GRADE_BG: Record<string, string> = {
  common: "from-slate-900 to-slate-800",
  rare: "from-blue-950 to-blue-900",
  epic: "from-purple-950 to-purple-900",
  legend: "from-yellow-950 to-amber-900",
  mythic: "from-red-950 to-rose-900",
  transcend: "from-cyan-950 to-teal-900",
};

const GRADE_GLOW: Record<string, string> = {
  common: "shadow-slate-400/30",
  rare: "shadow-blue-400/50",
  epic: "shadow-purple-500/60",
  legend: "shadow-yellow-400/70",
  mythic: "shadow-rose-400/80",
  transcend: "shadow-cyan-300/90",
};

const GRADE_BORDER: Record<string, string> = {
  common: "border-slate-400/40",
  rare: "border-blue-400/60",
  epic: "border-purple-400/70",
  legend: "border-yellow-400/80",
  mythic: "border-rose-400/90",
  transcend: "border-cyan-300",
};

const AUTO_DISMISS_MS = 4200;

export function DiscoveryOverlay({
  data,
  onDismiss,
}: {
  data: DiscoveryData;
  onDismiss: () => void;
}) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const enterTimeout = setTimeout(() => setPhase("show"), 80);
    timerRef.current = setTimeout(() => {
      setPhase("exit");
      setTimeout(onDismiss, 400);
    }, AUTO_DISMISS_MS);

    return () => {
      clearTimeout(enterTimeout);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  function dismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("exit");
    setTimeout(onDismiss, 380);
  }

  const bg = GRADE_BG[data.grade] ?? GRADE_BG.common;
  const glow = GRADE_GLOW[data.grade] ?? GRADE_GLOW.common;
  const border = GRADE_BORDER[data.grade] ?? GRADE_BORDER.common;
  const isEpic = ["legend", "mythic", "transcend"].includes(data.grade);

  const containerCls = [
    "fixed inset-0 z-[500] flex items-center justify-center p-4",
    "transition-all duration-300",
    phase === "enter" ? "opacity-0 scale-95" : phase === "exit" ? "opacity-0 scale-110" : "opacity-100 scale-100",
  ].join(" ");

  return (
    <div className={containerCls} onClick={dismiss}>
      {/* Backdrop */}
      <div
        className={[
          "absolute inset-0 transition-opacity duration-300",
          phase === "show" ? "opacity-100" : "opacity-0",
          isEpic ? "bg-black/85" : "bg-black/70",
        ].join(" ")}
      />

      {/* Radial glow for epic+ */}
      {isEpic && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${data.gradeColor}22 0%, transparent 65%)`,
            transition: "opacity 0.3s",
            opacity: phase === "show" ? 1 : 0,
          }}
        />
      )}

      {/* Card */}
      <div
        className={[
          `relative max-w-sm w-full rounded-3xl border-2 ${border} bg-gradient-to-b ${bg} p-7`,
          `shadow-2xl ${glow}`,
          "transition-transform duration-300",
          phase === "show" ? "translate-y-0" : "translate-y-8",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header badges */}
        <div className="flex items-center justify-between mb-4">
          {data.isNew ? (
            <span className="rounded-xl bg-white/15 px-3 py-1 text-xs font-black text-white tracking-widest">
              ✦ NEW
            </span>
          ) : (
            <span />
          )}
          {data.isRecord && (
            <span className="rounded-xl bg-yellow-400/20 px-3 py-1 text-xs font-black text-yellow-300 tracking-widest">
              🏆 RECORD
            </span>
          )}
          {data.quality === "perfect" && (
            <span className="rounded-xl bg-cyan-400/20 px-3 py-1 text-xs font-black text-cyan-300 tracking-widest">
              ★ PERFECT
            </span>
          )}
        </div>

        {/* Fish icon */}
        <div className="flex justify-center mb-4">
          <div
            className={[
              "flex h-28 w-28 items-center justify-center rounded-full border-4",
              border,
              isEpic ? "animate-pulse" : "",
            ].join(" ")}
            style={{
              background: `radial-gradient(circle, ${data.gradeColor}30 0%, transparent 70%)`,
              boxShadow: `0 0 40px ${data.gradeColor}50`,
            }}
          >
            <span className="text-6xl">{data.gradeEmoji}</span>
          </div>
        </div>

        {/* Grade label */}
        <p
          className="text-center text-xs font-black tracking-[0.25em] mb-1"
          style={{ color: data.gradeColor }}
        >
          {data.gradeName}
        </p>

        {/* Fish name */}
        <h2
          className="text-center text-2xl font-black mb-4"
          style={{ color: data.gradeColor, textShadow: `0 0 20px ${data.gradeColor}80` }}
        >
          {data.fishName}
        </h2>

        {/* Stats */}
        <div className="flex justify-center gap-5 text-sm mb-5">
          <div className="text-center">
            <div className="text-slate-400 text-xs">크기</div>
            <div className="font-bold text-white">{data.sizeRank}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400 text-xs">길이</div>
            <div className="font-bold text-white">{data.cm} cm</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400 text-xs">무게</div>
            <div className="font-bold text-white">{data.kg} kg</div>
          </div>
        </div>

        {/* Dismiss hint */}
        <p className="text-center text-xs text-slate-500">탭하여 닫기</p>
      </div>
    </div>
  );
}

// Custom event type for dispatching from Phaser scene
export interface FishDiscoveredDetail {
  fishName: string;
  grade: string;
  gradeEmoji: string;
  gradeColor: string;
  gradeName: string;
  cm: number;
  kg: number;
  sizeRank: string;
  isNew: boolean;
  isRecord: boolean;
  quality: "perfect" | "good";
}
