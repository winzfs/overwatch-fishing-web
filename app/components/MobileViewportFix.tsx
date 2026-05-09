"use client";

import { useEffect } from "react";

function isGamePage() {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/ocean") || window.location.pathname.startsWith("/harbor");
}

function forceMobileScale() {
  if (!isGamePage()) return;

  const visualWidth = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0);
  const visualHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
  const dpr = Math.max(window.devicePixelRatio || 1, 1);

  document.documentElement.style.width = "100%";
  document.documentElement.style.minHeight = "100%";
  document.body.style.width = "100%";
  document.body.style.minHeight = "100dvh";
  document.body.style.overflow = "hidden";

  const canvases = Array.from(document.querySelectorAll("canvas"));

  for (const canvas of canvases) {
    const el = canvas as HTMLCanvasElement;
    const classText = el.className?.toString() || "";
    const isMiniMap = classText.includes("pixel-mini-map");
    const isHarborCanvas = classText.includes("sea-bloom");

    if (isMiniMap) {
      el.style.display = "none";
      continue;
    }

    const parent = el.parentElement;
    if (parent) {
      parent.style.width = "100vw";
      parent.style.height = "100dvh";
      parent.style.maxWidth = "none";
      parent.style.maxHeight = "none";
      parent.style.overflow = "hidden";
      parent.style.position = parent.style.position || "relative";
    }

    if (!isHarborCanvas) {
      const nextWidth = Math.round(visualWidth * dpr * 1.65);
      const nextHeight = Math.round(visualHeight * dpr * 1.65);

      if (el.width !== nextWidth) el.width = nextWidth;
      if (el.height !== nextHeight) el.height = nextHeight;
    }

    el.style.display = "block";
    el.style.width = "100vw";
    el.style.height = "100dvh";
    el.style.maxWidth = "none";
    el.style.maxHeight = "none";
    el.style.objectFit = "cover";
    el.style.imageRendering = "pixelated";

    if (!isHarborCanvas) {
      el.style.transformOrigin = "center center";
      el.style.transform = "scale(1.35)";
    }
  }

  const buttons = Array.from(document.querySelectorAll("button, a"));
  for (const node of buttons) {
    const el = node as HTMLElement;
    el.style.minHeight = "50px";
    if (el.className?.toString().includes("pixel-btn")) {
      el.style.fontSize = "14px";
      el.style.padding = "16px 22px";
    }
  }

  const smallTexts = Array.from(document.querySelectorAll(".text-xs, .text-sm, .pixel-text-sm"));
  for (const node of smallTexts) {
    const el = node as HTMLElement;
    el.style.fontSize = "15px";
    el.style.lineHeight = "1.65";
  }

  const huds = Array.from(document.querySelectorAll(".pixel-hud-bar, .pixel-stat-pill"));
  for (const node of huds) {
    const el = node as HTMLElement;
    el.style.fontSize = "14px";
    el.style.lineHeight = "1.75";
  }
}

export default function MobileViewportFix() {
  useEffect(() => {
    forceMobileScale();

    const interval = window.setInterval(forceMobileScale, 250);
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
