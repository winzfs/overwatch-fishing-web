"use client";

import { useEffect } from "react";

function isMobileLike() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 900 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function forceMobileScale() {
  if (!isMobileLike()) return;

  document.documentElement.style.width = "100%";
  document.documentElement.style.minHeight = "100%";
  document.body.style.width = "100%";
  document.body.style.minHeight = "100dvh";
  document.body.style.overflow = "hidden";

  const canvases = Array.from(document.querySelectorAll("canvas"));

  for (const canvas of canvases) {
    const el = canvas as HTMLCanvasElement;
    const isMiniMap = el.className?.toString().includes("pixel-mini-map");

    if (isMiniMap) {
      el.style.display = "none";
      continue;
    }

    el.style.width = "100vw";
    el.style.height = "100dvh";
    el.style.maxWidth = "none";
    el.style.maxHeight = "none";
    el.style.objectFit = "cover";
    el.style.imageRendering = "pixelated";

    if (!el.className?.toString().includes("sea-bloom")) {
      el.style.transformOrigin = "center center";
      el.style.transform = "scale(1.38)";
    }
  }

  const buttons = Array.from(document.querySelectorAll("button, a"));
  for (const node of buttons) {
    const el = node as HTMLElement;
    el.style.minHeight = "48px";
    if (el.className?.toString().includes("pixel-btn")) {
      el.style.fontSize = "13px";
      el.style.padding = "15px 20px";
    }
  }

  const smallTexts = Array.from(document.querySelectorAll(".text-xs, .text-sm, .pixel-text-sm"));
  for (const node of smallTexts) {
    const el = node as HTMLElement;
    el.style.fontSize = "14px";
    el.style.lineHeight = "1.6";
  }

  const huds = Array.from(document.querySelectorAll(".pixel-hud-bar, .pixel-stat-pill"));
  for (const node of huds) {
    const el = node as HTMLElement;
    el.style.fontSize = "13px";
    el.style.lineHeight = "1.7";
  }
}

export default function MobileViewportFix() {
  useEffect(() => {
    if (!isMobileLike()) return;

    forceMobileScale();

    const interval = window.setInterval(forceMobileScale, 400);
    window.addEventListener("resize", forceMobileScale);
    window.addEventListener("orientationchange", forceMobileScale);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", forceMobileScale);
      window.removeEventListener("orientationchange", forceMobileScale);
    };
  }, []);

  return null;
}
