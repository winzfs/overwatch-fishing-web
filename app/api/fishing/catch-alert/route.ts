import { hasSupabaseConfig, missingSupabaseResponse, upsertProfile } from "../_supabase";

export const dynamic = "force-dynamic";

const gradeColor: Record<string, number> = {
  legend: 0xfacc15,
  mythic: 0xa855f7,
  transcend: 0xef4444,
};

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) return missingSupabaseResponse();

  const webhookUrl = process.env.DISCORD_RARE_WEBHOOK_URL || "";

  try {
    const body = await request.json();
    const discordId = body.discordId || request.headers.get("x-discord-id");
    const displayName = body.displayName || discordId;
    const fish = body.fish;
    const save = body.save;

    if (!discordId || !fish || !save) {
      return Response.json({ error: "discordId, fish, save가 필요합니다." }, { status: 400 });
    }

    await upsertProfile({
      discordId,
      displayName,
      save,
    });

    let webhookSent = false;

    if (webhookUrl && ["legend", "mythic", "transcend"].includes(fish.grade)) {
      const title =
        fish.grade === "transcend"
          ? "🚨 초월 어종 포획!"
          : fish.grade === "mythic"
          ? "🌌 신화 어종 포획!"
          : "✨ 전설 어종 포획!";

      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embeds: [
            {
              title,
              description: `**${displayName}** 님이 희귀 어종을 포획했습니다!`,
              color: gradeColor[fish.grade] || 0x22d3ee,
              fields: [
                { name: "어종", value: `${fish.name}`, inline: true },
                { name: "등급", value: `${fish.grade}`, inline: true },
                { name: "크기", value: `${fish.cm}cm / ${fish.kg}kg`, inline: true },
                { name: "지역", value: `${fish.region || "unknown"}`, inline: true },
                { name: "사이즈", value: `${fish.sizeRank || "-"}`, inline: true },
                { name: "가치", value: `${Number(fish.baseValue || 0).toLocaleString()}G`, inline: true },
              ],
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      webhookSent = webhookRes.ok;
    }

    return Response.json({
      ok: true,
      webhookConfigured: Boolean(webhookUrl),
      webhookSent,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
