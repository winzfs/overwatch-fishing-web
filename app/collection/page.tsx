import { fishes, gradeInfo } from "../../data/fishingData";

export default function CollectionPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <a href="/" className="rounded-xl bg-white/10 px-4 py-2 font-bold">← 홈</a>
      <h1 className="mt-8 text-4xl font-black">📖 물고기 도감</h1>
      <p className="mt-3 text-slate-300">현재는 전체 어종 미리보기입니다. 다음 단계에서 저장 도감으로 바뀝니다.</p>
      <div className="mt-8 grid gap-3">
        {fishes.map((fish) => {
          const grade = gradeInfo[fish.grade];
          return (
            <div key={fish.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xl font-black" style={{ color: grade.color }}>
                {grade.emoji} {fish.name}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                {grade.name} · {fish.price.toLocaleString()}G · EXP {fish.exp}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
