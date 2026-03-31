export const LIFE_AREAS = [
  "money",
  "confidence",
  "love",
  "calm",
  "career",
  "feminineEnergy",
  "relationships",
  "selfWorth",
  "fear",
  "body",
] as const;

export type LifeArea = (typeof LIFE_AREAS)[number];

export interface LifeAreaDoc {
  label: string;
  emoji: string;
  color: string;
  sortOrder: number;
}

export interface MeditationDoc {
  id: string;
  title: string;
  description: string;
  area: LifeArea;
  fileName: string;
  durationSeconds: number;
  audioUrl: string;
  coverUrl: string;
  sortOrder: number;
  popular?: boolean;
  coverColor?: string;
}

export interface MusicTrackDoc {
  id: string;
  title: string;
  artist: string;
  fileName: string;
  durationSeconds: number;
  audioUrl: string;
  sortOrder: number;
}

export interface AffirmationsDoc {
  texts: string[];
}

export interface ProgramPair {
  limiting: string;
  rewrite: string;
}

export interface ProgramsDoc {
  pairs: ProgramPair[];
}

export const AREA_LABELS: Record<LifeArea, string> = {
  money: "Деньги 💰",
  confidence: "Уверенность ✨",
  love: "Любовь 🌹",
  calm: "Спокойствие 🌊",
  career: "Карьера 🚀",
  feminineEnergy: "Женская энергия 🌸",
  relationships: "Отношения 💞",
  selfWorth: "Самоценность 👑",
  fear: "Страх 🦋",
  body: "Тело 🌿",
};
