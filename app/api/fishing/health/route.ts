import { envStatus, hasSupabaseConfig, getRankings } from "../_supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = envStatus();

  if (!hasSupabaseConfig()) {
    return Response.json({
      ok: false,
      reason: "supabase env missing",
      env,
    });
  }

  try {
    const rankings = await getRankings(1);

    return Response.json({
      ok: true,
      env,
      dbReachable: true,
      sampleRows: rankings.length,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      env,
      dbReachable: false,
      error: String(error),
    }, { status: 500 });
  }
}
