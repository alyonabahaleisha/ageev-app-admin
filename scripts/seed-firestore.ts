/**
 * Seed script: migrates translations.json into Firestore.
 *
 * ⚠️  SAFE MODE: uses { merge: true } on all writes.
 *     This means it will ADD or UPDATE fields from translations.json
 *     but will NEVER delete existing fields (coverUrl, coverColor,
 *     popular, audioUrl set by migrate-storage, etc.).
 *
 *     To fully replace a document, delete it in Firestore first,
 *     then run this script.
 *
 * Usage:
 *   1. Place your Firebase service account key as scripts/serviceAccountKey.json
 *   2. npx tsx scripts/seed-firestore.ts                # seed all collections
 *   3. npx tsx scripts/seed-firestore.ts --collection music   # seed only musicTracks
 *   4. npx tsx scripts/seed-firestore.ts --collection meditations
 *
 * Collections seeded: config/ui_strings, lifeAreas, meditations,
 *                     musicTracks, affirmations, programs, mindsetStates
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

// --- CLI args ---
const args = process.argv.slice(2);
const collectionArg =
  args.find((_, i) => args[i - 1] === "--collection") || "all";

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

// --- Audio base URLs (fallback — migrate-storage.ts sets the real ones) ---
const MEDITATION_BASE =
  "https://github.com/alyonabahaleisha/levelup-manifestation-android/releases/download/v1.0.0-meditations";

const MERGE = { merge: true };

function shouldSeed(collection: string): boolean {
  return collectionArg === "all" || collectionArg === collection;
}

async function seed() {
  const batch = db.batch();
  let docCount = 0;

  // 1. UI strings
  if (shouldSeed("ui")) {
    console.log("Seeding config/ui_strings...");
    batch.set(db.doc("config/ui_strings"), ru.ui, MERGE);
    docCount++;
  }

  // 2. Life areas
  if (shouldSeed("lifeAreas")) {
    console.log("Seeding lifeAreas...");
    const lifeAreas = ru.lifeAreas as Record<string, string>;
    for (const [key, label] of Object.entries(lifeAreas)) {
      const meta = lifeAreaMeta[key] || {
        emoji: "",
        color: "#888",
        sortOrder: 99,
      };
      batch.set(
        db.doc(`lifeAreas/${key}`),
        { label, emoji: meta.emoji, color: meta.color, sortOrder: meta.sortOrder },
        MERGE
      );
      docCount++;
    }
  }

  // 3. Meditations
  //    Only seeds: title, description, area, fileName, durationSeconds, sortOrder.
  //    Does NOT touch: coverUrl, coverColor, audioUrl, popular
  //    (those are managed by migrate-storage.ts and the admin dashboard).
  if (shouldSeed("meditations")) {
    console.log("Seeding meditations...");
    const meditations = ru.meditations as Record<
      string,
      Array<Record<string, unknown>>
    >;
    let medSortOrder = 0;
    for (const [area, items] of Object.entries(meditations)) {
      for (const item of items) {
        const id = item.id as string;
        batch.set(
          db.doc(`meditations/${id}`),
          {
            title: item.title,
            description: item.description || "",
            area,
            fileName: item.fileName,
            durationSeconds: item.durationSeconds,
            sortOrder: medSortOrder++,
          },
          MERGE
        );
        docCount++;
      }
    }
  }

  // 4. Music tracks
  //    Only seeds: title, artist, fileName, durationSeconds, sortOrder.
  //    Does NOT touch: audioUrl (managed by migrate-storage.ts).
  if (shouldSeed("music")) {
    console.log("Seeding musicTracks...");
    const music = ru.music as Array<Record<string, unknown>>;
    music.forEach((track, i) => {
      batch.set(
        db.doc(`musicTracks/${track.id}`),
        {
          title: track.title,
          artist: track.artist || "",
          fileName: track.fileName,
          durationSeconds: track.durationSeconds,
          sortOrder: i,
        },
        MERGE
      );
      docCount++;
    });
  }

  // 5. Affirmations
  if (shouldSeed("affirmations")) {
    console.log("Seeding affirmations...");
    const affirmations = ru.affirmations as Record<string, string[]>;
    for (const [area, texts] of Object.entries(affirmations)) {
      batch.set(db.doc(`affirmations/${area}`), { texts }, MERGE);
      docCount++;
    }
  }

  // 6. Programs
  if (shouldSeed("programs")) {
    console.log("Seeding programs...");
    const programs = ru.programs as Record<
      string,
      Array<{ limiting: string; rewrite: string }>
    >;
    for (const [area, pairs] of Object.entries(programs)) {
      batch.set(db.doc(`programs/${area}`), { pairs }, MERGE);
      docCount++;
    }
  }

  // 7. Mindset states
  if (shouldSeed("mindsetStates")) {
    console.log("Seeding mindsetStates...");
    const mindsetStateMeta: Record<
      string,
      { title: string; emoji: string; sortOrder: number }
    > = {
      love_creator: { title: "Любовь Творца", emoji: "💖", sortOrder: 0 },
      i_am_worthy: { title: "Я ценен(на)", emoji: "👑", sortOrder: 1 },
      trust_life: { title: "Доверие жизни", emoji: "🌿", sortOrder: 2 },
      abundance: { title: "Изобилие", emoji: "💎", sortOrder: 3 },
      calm: { title: "Спокойствие", emoji: "🌊", sortOrder: 4 },
      angel_support: {
        title: "Поддержка Ангелов",
        emoji: "😇",
        sortOrder: 5,
      },
    };
    for (const [id, meta] of Object.entries(mindsetStateMeta)) {
      batch.set(
        db.doc(`mindsetStates/${id}`),
        {
          title: meta.title,
          emoji: meta.emoji,
          sortOrder: meta.sortOrder,
        },
        MERGE
      );
      docCount++;
    }
  }

  // Commit
  console.log(`Committing batch write (${docCount} documents)...`);
  await batch.commit();
  console.log("Done! All data seeded successfully (merge mode — existing fields preserved).");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
