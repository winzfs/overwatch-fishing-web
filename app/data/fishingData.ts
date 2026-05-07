export type FishGrade = "common" | "rare" | "epic" | "legend" | "mythic" | "transcend";

export type Region = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  level: number;
  theme: string;
};

export type Fish = {
  id: string;
  name: string;
  grade: FishGrade;
  region: string;
  price: number;
  exp: number;
  size: number;
};

export const gradeInfo: Record<FishGrade, {
  name: string;
  emoji: string;
  color: string;
  weight: number;
}> = {
  common: {
    name: "일반",
    emoji: "⚪",
    color: "#d4d4d8",
    weight: 1000,
  },
  rare: {
    name: "희귀",
    emoji: "🔵",
    color: "#7dd3fc",
    weight: 300,
  },
  epic: {
    name: "에픽",
    emoji: "🟣",
    color: "#c084fc",
    weight: 80,
  },
  legend: {
    name: "전설",
    emoji: "🟠",
    color: "#fbbf24",
    weight: 20,
  },
  mythic: {
    name: "신화",
    emoji: "🔴",
    color: "#fb7185",
    weight: 5,
  },
  transcend: {
    name: "초월",
    emoji: "✨",
    color: "#a5f3fc",
    weight: 1,
  },
};

export const regions: Region[] = [
  {
    id: "ilios",
    emoji: "⛲",
    name: "일리오스 우물",
    desc: "맑은 지중해 샘물. 초보 낚시꾼의 첫 낚시터입니다.",
    level: 1,
    theme: "from-cyan-500/30 to-blue-900/30",
  },
  {
    id: "hanamura",
    emoji: "🌸",
    name: "하나무라 정원 연못",
    desc: "벚꽃이 흩날리는 신성한 연못. 희귀 어종이 등장합니다.",
    level: 5,
    theme: "from-pink-500/30 to-rose-900/30",
  },
  {
    id: "route66",
    emoji: "🌵",
    name: "66번 국도 오아시스",
    desc: "사막 한가운데 솟은 오아시스. 석양 물고기가 출몰합니다.",
    level: 10,
    theme: "from-orange-500/30 to-yellow-900/30",
  },
  {
    id: "busan",
    emoji: "🏖️",
    name: "부산 해변",
    desc: "디바의 고향 부산. 활기찬 파도 아래 보물이 숨어 있습니다.",
    level: 15,
    theme: "from-sky-500/30 to-cyan-900/30",
  },
  {
    id: "numbani",
    emoji: "🌿",
    name: "눔바니 강 하류",
    desc: "옴닉과 인간이 함께하는 도시의 강. 독특한 생명체가 삽니다.",
    level: 20,
    theme: "from-green-500/30 to-emerald-900/30",
  },
  {
    id: "antarctica",
    emoji: "❄️",
    name: "아나타크틱 연구소",
    desc: "빙하 아래 신비한 심해어가 잠든 극지 낚시터입니다.",
    level: 25,
    theme: "from-blue-200/30 to-sky-900/30",
  },
  {
    id: "horizon",
    emoji: "🌙",
    name: "호라이즌 달 식민지",
    desc: "저중력 수경 구역. 이상한 변이 어종이 서식합니다.",
    level: 30,
    theme: "from-indigo-500/30 to-violet-950/30",
  },
  {
    id: "null_sector",
    emoji: "🌑",
    name: "널 섹터 심연",
    desc: "어둠 속에서 초월적 존재들이 기다리는 최종 낚시터입니다.",
    level: 35,
    theme: "from-zinc-700/40 to-black",
  },
];

export const fishes: Fish[] = [
  { id: "f001", name: "파치마리 복어", grade: "common", region: "ilios", price: 100, exp: 8, size: 1 },
  { id: "f041", name: "루시우 개구리어", grade: "rare", region: "ilios", price: 400, exp: 20, size: 1 },
  { id: "f076", name: "라인하르트 방벽 거북어", grade: "epic", region: "ilios", price: 1500, exp: 50, size: 2 },
  { id: "f106", name: "아나 나노 거대뱀장어", grade: "legend", region: "ilios", price: 8000, exp: 120, size: 3 },
  { id: "f146", name: "⚡ 번개의 신 트레이서 용왕", grade: "transcend", region: "ilios", price: 200000, exp: 800, size: 4 },

  { id: "f048", name: "키리코 여우 금붕어", grade: "rare", region: "hanamura", price: 620, exp: 20, size: 1 },
  { id: "f080", name: "한조 용의 뱀장어", grade: "epic", region: "hanamura", price: 2500, exp: 50, size: 2 },
  { id: "f109", name: "한조 쌍룡 황제어", grade: "legend", region: "hanamura", price: 12000, exp: 120, size: 3 },
  { id: "f147", name: "🐉 한조의 쌍룡 화신", grade: "transcend", region: "hanamura", price: 300000, exp: 800, size: 4 },

  { id: "f051", name: "캐시디 석양 농어", grade: "rare", region: "route66", price: 700, exp: 20, size: 1 },
  { id: "f084", name: "솜브라 투명 가오리", grade: "epic", region: "route66", price: 2600, exp: 50, size: 2 },
  { id: "f111", name: "솜브라 EMP 투명 상어", grade: "legend", region: "route66", price: 14000, exp: 120, size: 3 },

  { id: "f056", name: "디바 메카 새우어", grade: "rare", region: "busan", price: 650, exp: 20, size: 1 },
  { id: "f088", name: "디바 네오나 쥐가오리", grade: "epic", region: "busan", price: 3000, exp: 50, size: 2 },
  { id: "f114", name: "디바 메카 대가오리", grade: "legend", region: "busan", price: 14000, exp: 120, size: 3 },
  { id: "f134", name: "디바 나노 메카 대고래", grade: "mythic", region: "busan", price: 70000, exp: 300, size: 4 },

  { id: "f061", name: "오리사 수호자 메기", grade: "rare", region: "numbani", price: 700, exp: 20, size: 1 },
  { id: "f092", name: "라마트라 공허 뱀장어", grade: "epic", region: "numbani", price: 3500, exp: 50, size: 2 },
  { id: "f117", name: "라마트라 절멸 대뱀장어", grade: "legend", region: "numbani", price: 16000, exp: 120, size: 3 },

  { id: "f066", name: "윈스턴 고릴라 숭어", grade: "rare", region: "antarctica", price: 800, exp: 20, size: 1 },
  { id: "f096", name: "남극 심해 킹크랩어", grade: "epic", region: "antarctica", price: 3500, exp: 50, size: 2 },
  { id: "f136", name: "윈스턴 원시 신화 고래", grade: "mythic", region: "antarctica", price: 70000, exp: 300, size: 4 },
  { id: "f149", name: "🌊 해양 여신 아나", grade: "transcend", region: "antarctica", price: 400000, exp: 800, size: 4 },

  { id: "f071", name: "달 저중력 부레어", grade: "rare", region: "horizon", price: 800, exp: 20, size: 1 },
  { id: "f100", name: "호라이즌 진공 가오리", grade: "epic", region: "horizon", price: 3800, exp: 50, size: 2 },
  { id: "f139", name: "호라이즌 프로메테우스 상어", grade: "mythic", region: "horizon", price: 80000, exp: 300, size: 4 },

  { id: "f103", name: "널 섹터 기계 상어", grade: "epic", region: "null_sector", price: 4500, exp: 50, size: 2 },
  { id: "f127", name: "옴닉 신경망 크라켄", grade: "legend", region: "null_sector", price: 22000, exp: 120, size: 3 },
  { id: "f141", name: "옴닉 크라켄 신화", grade: "mythic", region: "null_sector", price: 85000, exp: 300, size: 4 },
  { id: "f150", name: "✨ 옴닉 창조주 초월체", grade: "transcend", region: "null_sector", price: 1000000, exp: 800, size: 5 },
];

export function pickFish(regionId: string): Fish {
  const pool = fishes.filter((fish) => fish.region === regionId);
  const candidates = pool.length > 0 ? pool : fishes.filter((fish) => fish.region === "ilios");

  const totalWeight = candidates.reduce((sum, fish) => {
    return sum + gradeInfo[fish.grade].weight;
  }, 0);

  let roll = Math.random() * totalWeight;

  for (const fish of candidates) {
    roll -= gradeInfo[fish.grade].weight;
    if (roll <= 0) {
      return fish;
    }
  }

  return candidates[0];
}
