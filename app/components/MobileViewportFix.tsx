"use client";

import { useEffect } from "react";

function isGamePage() {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/ocean") || window.location.pathname.startsWith("/harbor");
}

function fixViewport() {
  if (!isGamePage()) return;

  document.documentElement.style.width = "100%";
  document.documentElement.style.minHeight = "100%";
  document.body.style.width = "100%";
  document.body.style.minHeight = "100dvh";
  document.body.style.overflow = "hidden";
}

export default function MobileViewportFix() {
  useEffect(() => {
    fixViewport();

    window.addEventListener("resize", fixViewport);
    window.addEventListener("orientationchange", fixViewport);

    return () => {
      window.removeEventListener("resize", fixViewport);
      window.removeEventListener("orientationchange", fixViewport);
    };
  }, []);

  return null;
}
