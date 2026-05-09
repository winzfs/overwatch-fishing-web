import Link from "next/link";

const pillars = [
  {
    icon: "🌐",
    title: "공유 해역 MMO",
    detail:
      "서버 전체가 같은 해류, 날씨, 희귀종 출현 정보를 보고 항구 채팅·파티 모집·월드 이벤트로 함께 움직입니다.",
  },
  {
    icon: "🤿",
    title: "다이빙 탐사 루프",
    detail:
      "낚시만 반복하지 않고 수중 폐허, 난파선, 심해 동굴을 직접 탐사해 재료·유물·보스 단서를 회수합니다.",
  },
  {
    icon: "🏪",
    title: "항구 경영 메타",
    detail:
      "잡은 어획물을 판매하는 단계를 넘어 식당, 수산시장, 연구소, 조선소를 업그레이드하는 장기 성장축을 둡니다.",
  },
  {
    icon: "🛡️",
    title: "협동 레이드",
    detail:
      "길드 선단이 역할을 나눠 거대 어종을 추적하고, 작살·그물·소나·구조 장비로 단계별 공략을 진행합니다.",
  },
];

const contentTracks = [
  "챕터형 스토리: 항구 NPC 의뢰, 해양 연구소 미스터리, 심해 문명 발견",
  "생활 콘텐츠: 양식장, 요리 레시피, 장비 제작, 희귀 미끼 배합",
  "경쟁 콘텐츠: 주간 최대어 랭킹, 시즌 도감 완성도, 선단 공헌도",
  "소셜 콘텐츠: 길드 항구, 공동 창고, 시장 거래, 파티 출항 매칭",
  "엔드게임: 심해 레이드, 전설종 추적전, 서버 단위 폭풍 이벤트",
];

const roadmap = [
  {
    phase: "1단계 · 항구를 허브로 확장",
    items: ["NPC 의뢰 게시판", "장비 제작/개조", "수산시장 시세", "플레이어 프로필"],
  },
  {
    phase: "2단계 · 해역 볼륨 확장",
    items: ["얕은 바다/난파선/심해 바이옴", "지역별 보스", "날씨·시간대 스폰", "탐사 자원"],
  },
  {
    phase: "3단계 · MMO 시스템",
    items: ["길드 선단", "협동 원정", "거래소", "시즌 패스와 서버 이벤트"],
  },
];

const mmoRoles = [
  { role: "선장", job: "항로 선택, 연료 관리, 파티 버프 지휘" },
  { role: "낚시꾼", job: "희귀종 포획, 장비 숙련도, 기록 경쟁" },
  { role: "다이버", job: "수중 채집, 유적 퍼즐, 위험 생물 회피" },
  { role: "정비사", job: "선박 개조, 소나 강화, 레이드 장비 제작" },
];

export default function MmoExpansionPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.28),_transparent_36%),linear-gradient(135deg,_#082f49,_#020617_48%,_#000)] px-5 py-8">
        <div className="absolute -right-20 top-16 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="rounded-xl bg-white/10 px-4 py-2 font-bold backdrop-blur">
              ← 홈
            </Link>
            <Link href="/harbor" className="rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-950">
              ⚓ 항구에서 시작
            </Link>
          </div>

          <div className="grid gap-8 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100">
                MMO VOLUME EXPANSION BLUEPRINT
              </p>
              <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight sm:text-7xl">
                낚시 RPG를
                <br />거대한 바다 생활 MMO로
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                현재의 낚시·가방·항구 판매 루프를 기반으로, 다이빙 탐사와 항구 경영,
                길드 원정, 시즌 이벤트를 얹어 오래 플레이할 수 있는 대형 콘텐츠 구조로 확장합니다.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/prepare" className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-slate-950 shadow-lg shadow-cyan-400/25">
                  🚤 출항 루프 체험
                </Link>
                <Link href="/quests" className="rounded-2xl border border-white/10 bg-white/10 px-6 py-4 font-black backdrop-blur">
                  📜 퀘스트 보기
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-[1.5rem] bg-black/30 p-5">
                <p className="text-sm font-bold text-cyan-200">핵심 목표</p>
                <p className="mt-3 text-3xl font-black">반복 낚시 → 탐사·경영·협동의 장기 성장</p>
                <div className="mt-5 grid gap-3 text-sm text-slate-300">
                  <div className="rounded-2xl bg-white/10 p-4">월드: 서버 공용 해역과 실시간 이벤트</div>
                  <div className="rounded-2xl bg-white/10 p-4">경제: 어획물, 요리, 제작 재료의 순환</div>
                  <div className="rounded-2xl bg-white/10 p-4">성장: 선박·장비·항구·길드의 다중 progression</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <div className="text-4xl">{pillar.icon}</div>
              <h2 className="mt-4 text-xl font-black">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{pillar.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <h2 className="text-3xl font-black">콘텐츠 볼륨 축</h2>
            <p className="mt-2 text-slate-300">플레이어가 매일 돌아올 이유를 만드는 다층 구조입니다.</p>
            <ul className="mt-5 space-y-3">
              {contentTracks.map((track) => (
                <li key={track} className="rounded-2xl bg-black/25 p-4 font-bold text-cyan-50">
                  {track}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-3xl font-black">협동 역할 설계</h2>
            <p className="mt-2 text-slate-300">MMO 확장 시 파티 플레이가 단순 딜 경쟁이 되지 않도록 역할을 분리합니다.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {mmoRoles.map((item) => (
                <div key={item.role} className="rounded-2xl bg-black/25 p-4">
                  <p className="text-lg font-black text-yellow-200">{item.role}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.job}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6">
          <h2 className="text-3xl font-black">개발 로드맵</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {roadmap.map((step) => (
              <article key={step.phase} className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <h3 className="text-xl font-black text-cyan-200">{step.phase}</h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {step.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
