export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const webhookUrl = process.env.DISCORD_RARE_WEBHOOK_URL || "";

  if (!webhookUrl) {
    return Response.json(
      { ok: false, error: "DISCORD_RARE_WEBHOOK_URL 환경변수가 없습니다." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const displayName = body.displayName || "테스트 유저";

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "🚨 낚시 속보 테스트",
            description: `**${displayName}** 님이 테스트용 전설 어종을 포획했습니다!`,
            color: 0xfacc15,
            fields: [
              { name: "어종", value: "테스트 황금 고래", inline: true },
              { name: "등급", value: "legend", inline: true },
              { name: "크기", value: "220cm / 180kg", inline: true },
              { name: "상태", value: "웹훅 정상 작동 확인", inline: false },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!res.ok) {
      return Response.json(
        { ok: false, status: res.status, error: await res.text() },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, webhookSent: true });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
