"use client";

import { useEffect, useRef, useState } from "react";

type MinimapData = {
  boatX: number;
  boatY: number;
  worldW: number;
  worldH: number;
  portX: number;
  portY: number;
};

export default function MinimapWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const dataRef = useRef<MinimapData | null>(null);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 900);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    function draw(data: MinimapData) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Border
      ctx.fillStyle = "#67e8f9";
      ctx.fillRect(0, 0, W, H);

      // Ocean background
      ctx.fillStyle = "#020617";
      ctx.fillRect(2, 2, W - 4, H - 4);

      const mx = 2, my = 2, mw = W - 4, mh = H - 4;

      // Island shape (dark area, bottom-right quadrant)
      ctx.fillStyle = "rgba(12,30,46,0.9)";
      ctx.fillRect(mx + mw * 0.5, my + mh * 0.4, mw * 0.5, mh * 0.6);

      // Wreck marker
      ctx.fillStyle = "rgba(245,158,11,0.7)";
      const wreckX = mx + (2380 / data.worldW) * mw;
      const wreckY = my + (1030 / data.worldH) * mh;
      ctx.beginPath();
      ctx.arc(wreckX, wreckY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Grid lines
      ctx.strokeStyle = "rgba(30,58,95,0.6)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const gx = mx + (i * mw) / 4;
        ctx.beginPath(); ctx.moveTo(gx, my); ctx.lineTo(gx, my + mh); ctx.stroke();
      }
      for (let i = 0; i <= 3; i++) {
        const gy = my + (i * mh) / 3;
        ctx.beginPath(); ctx.moveTo(mx, gy); ctx.lineTo(mx + mw, gy); ctx.stroke();
      }

      // Port marker (harbor)
      const portScreenX = mx + (data.portX / data.worldW) * mw;
      const portScreenY = my + (data.portY / data.worldH) * mh;
      ctx.fillStyle = "rgba(14,116,144,0.85)";
      ctx.beginPath();
      ctx.arc(portScreenX, portScreenY, isMobile ? 6 : 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#facc15";
      ctx.font = `bold ${isMobile ? 7 : 9}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⚓", portScreenX, portScreenY);

      // Boat marker
      const boatScreenX = mx + (data.boatX / data.worldW) * mw;
      const boatScreenY = my + (data.boatY / data.worldH) * mh;
      ctx.fillStyle = "#22d3ee";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(boatScreenX, boatScreenY, isMobile ? 3.5 : 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner border
      ctx.strokeStyle = "rgba(103,232,249,0.85)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
    }

    function onMinimapUpdate(e: Event) {
      const data = (e as CustomEvent<MinimapData>).detail;
      dataRef.current = data;
      draw(data);
    }

    window.addEventListener("minimap-update", onMinimapUpdate);
    return () => window.removeEventListener("minimap-update", onMinimapUpdate);
  }, [isMobile]);

  const w = isMobile ? 90 : 132;
  const h = isMobile ? 68 : 100;

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      style={{
        position: "absolute",
        top: "40px",
        right: "8px",
        width: `${w}px`,
        height: `${h}px`,
        imageRendering: "pixelated",
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
}
