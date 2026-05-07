const items = [
  { name: "카본 낚싯대", price: 2000, desc: "PERFECT 범위 증가 예정" },
  { name: "디바 레이더", price: 50000, desc: "희귀 실루엣 표시 예정" },
  { name: "고급 엔진", price: 80000, desc: "배 이동속도 증가 예정" },
];

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <a href="/" className="rounded-xl bg-white/10 px-4 py-2 font-bold">← 홈</a>
      <h1 className="mt-8 text-4xl font-black">🏪 상점</h1>
      <p className="mt-3 text-slate-300">다음 단계에서 골드 저장/구매 기능이 붙습니다.</p>
      <div className="mt-8 grid gap-4">
        {items.map((item) => (
          <div key={item.name} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl font-black">{item.name}</h2>
            <p className="mt-2 text-slate-300">{item.desc}</p>
            <div className="mt-4 text-xl font-black text-yellow-300">{item.price.toLocaleString()}G</div>
          </div>
        ))}
      </div>
    </main>
  );
}
