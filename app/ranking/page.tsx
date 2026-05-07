const ranks = [
  { name: "D.Va", score: 982000 },
  { name: "Kiriko", score: 721000 },
  { name: "Lucio", score: 510000 },
  { name: "Winston", score: 400000 },
];

export default function RankingPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <a href="/" className="rounded-xl bg-white/10 px-4 py-2 font-bold">← 홈</a>
      <h1 className="mt-8 text-4xl font-black">🏆 랭킹</h1>
      <p className="mt-3 text-slate-300">다음 단계에서 Supabase/Discord 계정 랭킹으로 연결합니다.</p>
      <div className="mt-8 grid gap-3">
        {ranks.map((rank, idx) => (
          <div key={rank.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-2xl font-black">#{idx + 1} {rank.name}</div>
            <div className="text-xl font-black text-yellow-300">{rank.score.toLocaleString()}G</div>
          </div>
        ))}
      </div>
    </main>
  );
}
