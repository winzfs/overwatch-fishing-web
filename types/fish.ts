export type FishGrade =
  | "common"
  | "rare"
  | "epic"
  | "legend"
  | "mythic"
  | "transcend";

export type Fish = {
  id: string;
  name: string;
  grade: FishGrade;
  region: string;
  price: number;
  exp: number;
};

export type FishGradeInfo = {
  name: string;
  emoji: string;
  color: string;
  weight: number;
  speed: number;
  zone: number;
  texture: string;
  burst: string;
};
