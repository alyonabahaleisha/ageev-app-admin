/**
 * Seed script: migrates translations.json into Firestore.
 *
 * Usage:
 *   1. Place your Firebase service account key as scripts/serviceAccountKey.json
 *   2. npx tsx scripts/seed-firestore.ts
 *
 * This will populate: config/ui_strings, lifeAreas, meditations, musicTracks, affirmations, programs
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

// --- Firebase Admin init ---
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, "serviceAccountKey.json"), "utf-8")
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// --- Load translations.json ---
const translationsPath = resolve(
  __dirname,
  "../../levelup-manifestation-android/app/src/main/assets/translations.json"
);
const translations = JSON.parse(readFileSync(translationsPath, "utf-8"));
const ru = translations.ru;

// --- Life area metadata (from Theme.kt) ---
const lifeAreaMeta: Record<
  string,
  { emoji: string; color: string; sortOrder: number }
> = {
  money: { emoji: "💰", color: "#FFD966", sortOrder: 0 },
  confidence: { emoji: "✨", color: "#FFE566", sortOrder: 1 },
  love: { emoji: "🌹", color: "#FF7A9A", sortOrder: 2 },
  calm: { emoji: "🌊", color: "#7EC8E3", sortOrder: 3 },
  career: { emoji: "🚀", color: "#FFB347", sortOrder: 4 },
  feminineEnergy: { emoji: "🌸", color: "#FFB3DE", sortOrder: 5 },
  relationships: { emoji: "💞", color: "#FF9AAF", sortOrder: 6 },
  selfWorth: { emoji: "👑", color: "#B39DFF", sortOrder: 7 },
  fear: { emoji: "🦋", color: "#80D4FF", sortOrder: 8 },
  body: { emoji: "🌿", color: "#7FFFD4", sortOrder: 9 },
};

// --- Audio base URLs (current GitHub Releases) ---
const MEDITATION_BASE =
  "https://github.com/alyonabahaleisha/levelup-manifestation-android/releases/download/v1.0.0-meditations";
const MUSIC_BASE =
  "https://github.com/alyonabahaleisha/levelup-manifestation-android/releases/download/v1.0.0-music";

// --- Cover image mapping (meditation id -> local filename) ---
const coverImages: Record<string, string> = {
  abundance: "med_abundance.png",
  divine_dna: "med_divine_dna.gif",
  karmic_release: "med_karmic_release.png",
  return_to_self: "med_return_to_self.png",
  chakra_harmony: "med_chakra_harmony.png",
  harmonize_life: "med_harmonize_life.png",
  create_reality: "med_create_reality.png",
  angel_activation: "med_angel_activation.png",
  subtle_bodies: "med_subtle_bodies.png",
  cleansing: "med_cleansing.png",
};

async function seed() {
  const batch = db.batch();

  // 1. UI strings
  console.log("Seeding config/ui_strings...");
  batch.set(db.doc("config/ui_strings"), ru.ui);

  // 2. Life areas
  console.log("Seeding lifeAreas...");
  const lifeAreas = ru.lifeAreas as Record<string, string>;
  for (const [key, label] of Object.entries(lifeAreas)) {
    const meta = lifeAreaMeta[key] || { emoji: "", color: "#888", sortOrder: 99 };
    batch.set(db.doc(`lifeAreas/${key}`), {
      label,
      emoji: meta.emoji,
      color: meta.color,
      sortOrder: meta.sortOrder,
    });
  }

  // 3. Meditations
  console.log("Seeding meditations...");
  const meditations = ru.meditations as Record<string, Array<Record<string, unknown>>>;
  let medSortOrder = 0;
  for (const [area, items] of Object.entries(meditations)) {
    for (const item of items) {
      const id = item.id as string;
      const fileName = item.fileName as string;
      batch.set(db.doc(`meditations/${id}`), {
        title: item.title,
        description: item.description || "",
        area,
        fileName,
        durationSeconds: item.durationSeconds,
        audioUrl: `${MEDITATION_BASE}/${fileName}`,
        coverUrl: "", // Will be updated when images are uploaded to Storage
        sortOrder: medSortOrder++,
      });
    }
  }

  // 4. Music tracks
  console.log("Seeding musicTracks...");
  const music = ru.music as Array<Record<string, unknown>>;
  music.forEach((track, i) => {
    const fileName = track.fileName as string;
    batch.set(db.doc(`musicTracks/${track.id}`), {
      title: track.title,
      artist: track.artist || "",
      fileName,
      durationSeconds: track.durationSeconds,
      audioUrl: `${MUSIC_BASE}/${fileName}`,
      sortOrder: i,
    });
  });

  // 5. Affirmations
  console.log("Seeding affirmations...");
  const affirmations = ru.affirmations as Record<string, string[]>;
  for (const [area, texts] of Object.entries(affirmations)) {
    batch.set(db.doc(`affirmations/${area}`), { texts });
  }

  // 6. Programs
  console.log("Seeding programs...");
  const programs = ru.programs as Record<
    string,
    Array<{ limiting: string; rewrite: string }>
  >;
  for (const [area, pairs] of Object.entries(programs)) {
    batch.set(db.doc(`programs/${area}`), { pairs });
  }

  // Commit
  console.log("Committing batch write...");
  await batch.commit();
  console.log("Done! All data seeded successfully.");
  console.log(
    "\nNote: coverUrl fields are empty. Upload images to Firebase Storage"
  );
  console.log(
    "and update the coverUrl fields via the dashboard, or run an upload script."
  );
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
