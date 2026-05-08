import { getProfile, hasSupabaseConfig, missingSupabaseResponse, upsertProfile } from "../_supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasSupabaseConfig()) return missingSupabaseResponse();

  const { searchParams } = new URL(request.url);
  const discordId = searchParams.get("discordId");

  if (!discordId) {
    return Response.json({ error: "discordId가 필요합니다." }, { status: 400 });
  }

  try {
    const profile = await getProfile(discordId);

    if (!profile) {
      return Response.json({ save: null });
    }

    return Response.json({
      discordId: profile.discord_id,
      displayName: profile.display_name,
      save: profile.save_data,
      updatedAt: profile.updated_at,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) return missingSupabaseResponse();

  try {
    const body = await request.json();
    const discordId = body.discordId || request.headers.get("x-discord-id");
    const displayName = body.displayName || discordId;
    const save = body.save;

    if (!discordId || !save) {
      return Response.json({ error: "discordId와 save가 필요합니다." }, { status: 400 });
    }

    const profile = await upsertProfile({
      discordId,
      displayName,
      save,
    });

    return Response.json({ ok: true, profile });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
