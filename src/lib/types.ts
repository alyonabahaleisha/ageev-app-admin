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

export interface WebinarDoc {
  id: string;
  title: string;
  description: string;
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

export interface ClubDoc {
  id: string;
  country: string;
  city: string;
  leader: string;
  telegramUrl: string;
  region: "abroad" | "russia";
  sortOrder: number;
}

// ── Daily Stories (Сторис) ───────────────────────────────────────────────────
// Content pools the admin curates once, then schedules per calendar day.

/** Reel 1 image: a photo of Mikhail. */
export interface StoryPhotoDoc {
  id: string;
  /** Optional admin label to tell photos apart. */
  title: string;
  imageUrl: string;
  sortOrder: number;
}

/** Reel 1 text: a quote shown over the photo. */
export interface StoryQuoteDoc {
  id: string;
  text: string;
  author: string;
  sortOrder: number;
}

/** Reel 2: "Духовный завтрак" — an audio practice, modeled like a meditation. */
export interface BreakfastDoc {
  id: string;
  title: string;
  /** Prompt text shown on the story (e.g. "Кто ты сегодня?"). */
  description: string;
  fileName: string;
  durationSeconds: number;
  audioUrl: string;
  /** Full-bleed background image for the story. */
  coverUrl: string;
  sortOrder: number;
}

/** Reel 3: a daily affirmation with its own background. */
export interface StoryAffirmationDoc {
  id: string;
  text: string;
  background: string;
  sortOrder: number;
}

/** One scheduled day. Document id is the date, "YYYY-MM-DD". */
export interface DailyStoryDoc {
  date: string;
  /** Reel 1 = photo + quote. */
  photoId: string;
  quoteId: string;
  /** Reel 2 = breakfast audio. */
  breakfastId: string;
  /** Reel 3 = a story-affirmation pool item (has its own background). */
  affirmationId: string;
  /** Reel 3 alternative = an inline affirmation text chosen from the app's
   *  existing affirmations library (no per-item background). */
  affirmationText?: string;
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

export const MINDSET_STATES = [
  "self_awareness",
  "wellbeing",
  "relationships_family",
  "purpose",
  "money_abundance",
  "new_level",
  "anxiety_fears",
  "energy_development",
  "resource_state",
  "creator_angels",
] as const;

export type MindsetStateId = (typeof MINDSET_STATES)[number];

/** One screen of the guided exercise flow (a step, or a recommendation). */
export interface ExerciseStep {
  title: string;
  body: string;
}

/**
 * "Упражнение дня" — a guided multi-screen flow: an intro card, a sequence of
 * `steps` (Назад/Далее), then a final `recommendations` screen.
 */
export interface MindsetStateExercise {
  title: string;
  durationText: string;
  /** Short subtitle shown on the compact card (e.g. "Практика для опоры."). */
  description: string;
  /** Long intro paragraph shown on the flow's first screen. */
  intro: string;
  /** Contained image on the intro screen (falls back to the state cover). */
  image: string;
  /** Full-bleed background photo for the step/recommendation screens. */
  stepsBackground: string;
  steps: ExerciseStep[];
  recommendations: ExerciseStep[];
}

/** A single affirmation card. Background is optional; falls back to the
 *  shared affirmationsBackground, then the state cover. */
export interface MindsetAffirmation {
  text: string;
  /** Optional per-card background image. */
  background?: string;
}

/** A free-form linked webinar/meditation (e.g. a YouTube live URL). */
export interface MindsetStateLink {
  title: string;
  url: string;
  /** Optional cover image; falls back to the YouTube thumbnail in the app. */
  image?: string;
}

export interface MindsetStateDoc {
  title: string;
  subtitle: string;
  emoji: string;
  coverImage: string;
  sortOrder: number;
  exercise: MindsetStateExercise;
  affirmations: MindsetAffirmation[];
  /** Default background behind the affirmation cards & flow (per-card override possible). */
  affirmationsBackground: string;
  /** Spiritual breakfast audio hosted on Firebase Storage. */
  breakfastTitle: string;
  breakfastUrl: string;
  /** Spiritual breakfast / music track id (catalog, optional). */
  audioId: string;
  /** Linked meditation doc ids (catalog). */
  meditationIds: string[];
  /** Linked webinar doc ids (catalog). */
  webinarIds: string[];
  /** External webinar/meditation links (title + url). */
  externalLinks: MindsetStateLink[];
}

export const MINDSET_STATE_LABELS: Record<MindsetStateId, string> = {
  self_awareness: "Самосознание, развитие уверенности",
  wellbeing: "Самочувствие, здоровье",
  relationships_family: "Отношения, семья, род",
  purpose: "Призвание, реализация",
  money_abundance: "Деньги и изобилие",
  new_level: "Новый уровень жизни",
  anxiety_fears: "Тревога и страхи",
  energy_development: "Энергетическое развитие, активация способностей",
  resource_state: "Ресурсное состояние",
  creator_angels: "Связь с Творцом и Ангелами",
};
