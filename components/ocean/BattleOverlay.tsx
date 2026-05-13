"use client";

import { useEffect, useRef, useState } from "react";

type BattlePhase = "idle" | "bite" | "pull" | "reel" | "result";

type BattleStartData = {
  fishName: string;
  gradeColor: string;
};

type BattleStateData = {
  phase: BattlePhase;
  pointerXRatio: number;
  hitZoneCenterRatio: number;
  hitZoneWidthRatio: number;
  tension: number;
  pullRound: number;
  maxPullRounds: number;
  requiredDirection: string;
  guide: string;
  message: string;
  messageColor: string;
};

type BattleResultData = {
  success: boolean;
  quality: string;
  message: string;
  messageColor: string;
};

function DirectionArrow({ direction }: { direction: string }) {
  const arrows: Record<string, string> = {
    LEFT: "←",
    RIGHT: "→",
    UP: "↑",
    DOWN: "↓",
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        margin: "8px 0",
      }}
    >
      <span
        style={{
          fontSize: "clamp(32px, 8vw, 52px)",
          color: "#fde047",
          fontWeight: "bold",
          textShadow: "0 0 12px #fde047, 0 2px 4px #000",
          lineHeight: 1,
        }}
      >
        {arrows[direction] || "?"}
      </span>
      <span
        style={{
          fontSize: "clamp(14px, 3.5vw, 20px)",
          color: "#cbd5e1",
          fontWeight: "bold",
          textShadow: "0 1px 3px #000",
        }}
      >
        낚시버튼 →
      </span>
    </div>
  );
}

export default function BattleOverlay() {
  const [visible, setVisible] = useState(false);
  const [fishName, setFishName] = useState("");
  const [gradeColor, setGradeColor] = useState("#ffffff");
  const [state, setState] = useState<BattleStateData | null>(null);
  const [result, setResult] = useState<BattleResultData | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    function onBattleStart(e: Event) {
      const d = (e as CustomEvent<BattleStartData>).detail;
      setFishName(d.fishName);
      setGradeColor(d.gradeColor);
      setResult(null);
      setVisible(true);
    }

    function onBattleState(e: Event) {
      const d = (e as CustomEvent<BattleStateData>).detail;
      setState(d);
    }

    function onBattleResult(e: Event) {
      const d = (e as CustomEvent<BattleResultData>).detail;
      setResult(d);
    }

    function onBattleHide() {
      setVisible(false);
      setState(null);
      setResult(null);
    }

    window.addEventListener("battle-start", onBattleStart);
    window.addEventListener("battle-state", onBattleState);
    window.addEventListener("battle-result", onBattleResult);
    window.addEventListener("battle-hide", onBattleHide);
    return () => {
      window.removeEventListener("battle-start", onBattleStart);
      window.removeEventListener("battle-state", onBattleState);
      window.removeEventListener("battle-result", onBattleResult);
      window.removeEventListener("battle-hide", onBattleHide);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (!visible) return null;

  const isResult = result !== null;
  const isPull = state?.phase === "pull";
  const isBite = state?.phase === "bite";
  const isReel = state?.phase === "reel";

  const tensionColor =
    (state?.tension ?? 50) >= 80
      ? "#ef4444"
      : (state?.tension ?? 50) >= 55
      ? "#facc15"
      : "#22c55e";

  const font = '"Press Start 2P", "Courier New", monospace';
  const px = (v: number) => `${v}px`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 120,
        pointerEvents: "none",
        padding: "0 8px",
      }}
    >
      <div
        style={{
          width: "min(92vw, 480px)",
          background: "linear-gradient(180deg, rgba(2,6,23,0.97) 0%, rgba(7,24,43,0.97) 100%)",
          border: "3px solid #22d3ee",
          boxShadow: "0 0 0 1px #020617, 0 0 24px rgba(34,211,238,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
          borderRadius: "2px",
          padding: "clamp(12px, 3vw, 20px) clamp(10px, 3vw, 20px)",
          fontFamily: font,
          display: "flex",
          flexDirection: "column",
          gap: "clamp(6px, 2vw, 10px)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "clamp(11px, 2.8vw, 16px)",
              color: "#ffffff",
              fontWeight: "bold",
              textShadow: "0 0 8px rgba(255,255,255,0.4)",
              letterSpacing: "0.05em",
            }}
          >
            🎣 낚시 전투!
          </div>
          <div
            style={{
              fontSize: "clamp(9px, 2.2vw, 13px)",
              color: gradeColor,
              marginTop: "4px",
              textShadow: `0 0 8px ${gradeColor}80`,
            }}
          >
            {fishName}
          </div>
        </div>

        {/* Guide text */}
        {state?.guide && !isResult && (
          <div
            style={{
              fontSize: "clamp(7px, 1.8vw, 10px)",
              color: "#cbd5e1",
              textAlign: "center",
              lineHeight: 1.6,
              padding: "4px 0",
              borderTop: "1px solid rgba(103,232,249,0.2)",
              borderBottom: "1px solid rgba(103,232,249,0.2)",
            }}
          >
            {state.guide}
          </div>
        )}

        {/* Direction prompt for pull phase */}
        {isPull && state && !isResult && (
          <DirectionArrow direction={state.requiredDirection} />
        )}

        {/* Timing bar (bite phase) */}
        {(isBite || isReel) && state && !isResult && (
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "100%",
                height: "clamp(28px, 7vw, 40px)",
                background: "#172554",
                border: "2px solid rgba(255,255,255,0.3)",
                borderRadius: "2px",
                position: "relative",
                overflow: "visible",
              }}
            >
              {/* Hit zone */}
              {isBite && (
                <div
                  style={{
                    position: "absolute",
                    top: "-4px",
                    bottom: "-4px",
                    background: "rgba(34,197,94,0.92)",
                    border: "2px solid #bbf7d0",
                    borderRadius: "1px",
                    left: `${((state.hitZoneCenterRatio + 1) / 2 - state.hitZoneWidthRatio / 2) * 100}%`,
                    width: `${state.hitZoneWidthRatio * 100}%`,
                  }}
                />
              )}
              {/* Pointer */}
              <div
                style={{
                  position: "absolute",
                  top: "-6px",
                  bottom: "-6px",
                  width: "clamp(8px, 2vw, 14px)",
                  background: "#facc15",
                  border: "1px solid rgba(255,255,255,0.9)",
                  borderRadius: "1px",
                  left: `calc(${((state.pointerXRatio + 1) / 2) * 100}% - clamp(4px, 1vw, 7px))`,
                  boxShadow: "0 0 6px #facc15",
                  transition: "none",
                }}
              />
            </div>
          </div>
        )}

        {/* Tension bar */}
        {!isResult && state && (
          <div>
            <div
              style={{
                fontSize: "clamp(6px, 1.5vw, 8px)",
                color: "#94a3b8",
                marginBottom: "3px",
                textAlign: "right",
              }}
            >
              장력 {Math.floor(state.tension)}%
            </div>
            <div
              style={{
                width: "100%",
                height: "clamp(12px, 3vw, 18px)",
                background: "#1e293b",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${state.tension}%`,
                  background: tensionColor,
                  transition: "width 0.06s linear, background 0.2s",
                  boxShadow: `0 0 6px ${tensionColor}80`,
                }}
              />
            </div>
          </div>
        )}

        {/* Message */}
        {state?.message && !isResult && (
          <div
            style={{
              fontSize: "clamp(8px, 2vw, 11px)",
              color: state.messageColor,
              textAlign: "center",
              lineHeight: 1.7,
              whiteSpace: "pre-line",
              textShadow: "0 1px 3px #000",
            }}
          >
            {state.message}
          </div>
        )}

        {/* Result */}
        {isResult && result && (
          <div
            style={{
              fontSize: "clamp(8px, 2.2vw, 12px)",
              color: result.messageColor,
              textAlign: "center",
              lineHeight: 1.8,
              whiteSpace: "pre-line",
              padding: "8px 0",
              textShadow: `0 0 10px ${result.messageColor}60, 0 1px 3px #000`,
            }}
          >
            {result.message}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            fontSize: "clamp(6px, 1.4vw, 8px)",
            color: "#475569",
            textAlign: "center",
            borderTop: "1px solid rgba(71,85,105,0.3)",
            paddingTop: "6px",
          }}
        >
          가방에 담긴 물고기는 항구에서 판매됩니다.
        </div>
      </div>
    </div>
  );
}
