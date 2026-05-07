const regions = [
      {
          name: "하나무라 항구",
              desc: "잔잔한 바다와 초보자용 물고기",
                  level: 1,
                    },
                      {
                          name: "부산 해안",
                              desc: "희귀 어종이 출몰하는 해안",
                                  level: 5,
                                    },
                                      {
                                          name: "쓰레기촌 하수구",
                                              desc: "수상한 변종 물고기들이 서식",
                                                  level: 10,
                                                    },
                                                      {
                                                          name: "남극 연구기지",
                                                              desc: "얼어붙은 바다의 전설 어종",
                                                                  level: 15,
                                                                    },
                                                                    ];

                                                                    export default function RegionsPage() {
                                                                      return (
                                                                          <main className="min-h-screen bg-slate-950 text-white p-5">
                                                                                <h1 className="mb-8 text-4xl font-black">
                                                                                        🗺️ 지역 선택
                                                                                              </h1>

                                                                                                    <div className="grid gap-4">
                                                                                                            {regions.map((region) => (
                                                                                                                      <button
                                                                                                                                  key={region.name}
                                                                                                                                              className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-cyan-400/10"
                                                                                                                                                        >
                                                                                                                                                                    <div className="flex items-center justify-between">
                                                                                                                                                                                  <h2 className="text-2xl font-black">
                                                                                                                                                                                                  {region.name}
                                                                                                                                                                                                                </h2>

                                                                                                                                                                                                                              <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-sm text-cyan-300">
                                                                                                                                                                                                                                              Lv.{region.level}+
                                                                                                                                                                                                                                                            </span>
                                                                                                                                                                                                                                                                        </div>

                                                                                                                                                                                                                                                                                    <p className="mt-2 text-slate-300">
                                                                                                                                                                                                                                                                                                  {region.desc}
                                                                                                                                                                                                                                                                                                              </p>
                                                                                                                                                                                                                                                                                                                        </button>
                                                                                                                                                                                                                                                                                                                                ))}
                                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                          </main>
                                                                                                                                                                                                                                                                                                                                            );
                                                                                                                                                                                                                                                                                                                                            }