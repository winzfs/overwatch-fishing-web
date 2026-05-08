const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TABLE = "fishing_profiles";

export function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

export function envStatus() {
  return {
    hasSupabaseUrl: Boolean(SUPABASE_URL),
    hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    hasRareWebhook: Boolean(process.env.DISCORD_RARE_WEBHOOK_URL || ""),
  };
}

export function missingSupabaseResponse() {
  return Response.json(
    {
      error: "SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.",
      env: envStatus(),
    },
    { status: 500 }
  );
}

export async function getProfile(discordId: string) {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?discord_id=eq.${encodeURIComponent(discordId)}&select=*`;

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const rows = await res.json();
  return rows?.[0] || null;
}

export async function upsertProfile(input: {
  discordId: string;
  displayName: string;
  save: any;
}) {
  const save = input.save || {};
  const totalSold = Number(save.totalSold || 0);
  const totalCaught = Number(save.caught || 0);
  const gold = Number(save.gold || 0);
  const legendaryCaught = Number(save.legendaryCaught || 0);

  const payload = {
    discord_id: input.discordId,
    display_name: input.displayName || input.discordId,
    gold,
    total_caught: totalCaught,
    total_sold: totalSold,
    legendary_caught: legendaryCaught,
    save_data: save,
    updated_at: new Date().toISOString(),
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const rows = await res.json();
  return rows?.[0] || null;
}

export async function getRankings(limit = 10) {
  const safeLimit = Math.min(Math.max(limit, 1), 30);
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?select=discord_id,display_name,gold,total_caught,total_sold,legendary_caught,updated_at&order=total_sold.desc&limit=${safeLimit}`;

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}
