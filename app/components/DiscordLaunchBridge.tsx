"use client";

import { useEffect, useState } from "react";

type DiscordLaunchInfo = {
  user_id?: string;
  username?: string;
  display_name?: string;
  guild_id?: string;
  channel_id?: string;
  iat?: number;
};

function decodeBase64Url(input: string) {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");

  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  } catch {
    return atob(base64);
  }
}

function parseDiscordLaunch(token: string): DiscordLaunchInfo | null {
  try {
    const body = token.split(".")[0];
    return JSON.parse(decodeBase64Url(body));
  } catch {
    return null;
  }
}

export default function DiscordLaunchBridge() {
  const [info, setInfo] = useState<DiscordLaunchInfo | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("discordLaunch");

    if (token) {
      localStorage.setItem("discord-launch-token", token);

      const parsed = parseDiscordLaunch(token);
      if (parsed) {
        localStorage.setItem("discord-user-id", parsed.user_id || "");
        localStorage.setItem("discord-display-name", parsed.display_name || parsed.username || "");
        localStorage.setItem("discord-guild-id", parsed.guild_id || "");
        setInfo(parsed);
      }

      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
      return;
    }

    const savedName = localStorage.getItem("discord-display-name");
    const savedUserId = localStorage.getItem("discord-user-id");

    if (savedUserId || savedName) {
      setInfo({
        user_id: savedUserId || "",
        display_name: savedName || "",
      });
    }
  }, []);

  if (!info?.display_name && !info?.user_id) return null;

  return (
    <div className="fixed left-1/2 top-3 z-[300] -translate-x-1/2 rounded-full border border-cyan-300/30 bg-slate-950/80 px-4 py-2 text-xs font-black text-cyan-100 shadow-xl backdrop-blur">
      디스코드 연결됨 · {info.display_name || info.username || info.user_id}
    </div>
  );
}
