import { getRankings, hasSupabaseConfig, missingSupabaseResponse } from "../_supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasSupabaseConfig()) return missingSupabaseResponse();

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || 10);

  try {
    const rankings = await getRankings(limit);
    return Response.json({ rankings });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
