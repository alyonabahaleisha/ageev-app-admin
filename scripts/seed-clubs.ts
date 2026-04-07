/**
 * Seed script: populates the `clubs` Firestore collection with the initial
 * 14 community club entries, and sets clubs_master_telegram_url in config/ui_strings.
 *
 * Usage:
 *   1. Place your Firebase service account key as scripts/serviceAccountKey.json
 *   2. npx tsx scripts/seed-clubs.ts
 *
 * Document IDs are derived from country + city using transliteration so that
 * Cyrillic names produce stable, readable slugs (e.g. "turtsiya_antalya").
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

// Transliterates Cyrillic to Latin before stripping non-alphanumeric characters.
// The bare regex /[^a-z0-9_]/ strips Cyrillic entirely, producing empty or
// colliding document IDs — transliteration must happen first.
function slugify(text: string): string {
  const translitMap: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
    ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return text
    .toLowerCase()
    .split("")
    .map((c) => translitMap[c] ?? c)
    .join("")
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

const clubs = [
  {
    country: "Турция",
    city: "Анталья",
    leader: "Оксана Улькер",
    telegramUrl: "https://t.me/+U41MH43L3Nw0YmY6",
    region: "abroad",
    sortOrder: 0,
    latitude: 36.8969,
    longitude: 30.7133,
  },
  {
    country: "Узбекистан",
    city: "Самарканд",
    leader: "Гульбахор Арипова",
    telegramUrl: "https://t.me/+S2vvG7GMEG9jY2Uy",
    region: "abroad",
    sortOrder: 0,
    latitude: 39.6542,
    longitude: 66.9597,
  },
  {
    country: "Узбекистан",
    city: "Ташкент",
    leader: "Фердаус Шахабутдинова",
    telegramUrl: "https://t.me/+m8tzqjyp3O9lNzVi",
    region: "abroad",
    sortOrder: 0,
    latitude: 41.2995,
    longitude: 69.2401,
  },
  {
    country: "Украина",
    city: "Белгород-Днестровский",
    leader: "Наталья Маковская",
    telegramUrl: "https://t.me/+KUAmYbHbJGRjYWEy",
    region: "abroad",
    sortOrder: 0,
    latitude: 46.1879,
    longitude: 30.3463,
  },
  {
    country: "Украина",
    city: "Днепр",
    leader: "Наталия Соловей",
    telegramUrl: "https://t.me/+dsyOrpdolns5ODgy",
    region: "abroad",
    sortOrder: 0,
    latitude: 48.4647,
    longitude: 35.0462,
  },
  {
    country: "Украина",
    city: "Киев",
    leader: "Татьяна Котова",
    telegramUrl: "https://t.me/+mdNdH7Kx1KQ1ODgy",
    region: "abroad",
    sortOrder: 0,
    latitude: 50.4501,
    longitude: 30.5234,
  },
  {
    country: "Украина",
    city: "Львов",
    leader: "Ирина Лещишин",
    telegramUrl: "https://t.me/+Ld1pD4J-TpMyYjBi",
    region: "abroad",
    sortOrder: 0,
    latitude: 49.8397,
    longitude: 24.0297,
  },
  {
    country: "Украина",
    city: "Одесса",
    leader: "Ольга Дрогомирецкая",
    telegramUrl: "https://t.me/+L14jqD2GLh8zZDhi",
    region: "abroad",
    sortOrder: 0,
    latitude: 46.4825,
    longitude: 30.7233,
  },
  {
    country: "Украина",
    city: "Харьков",
    leader: "Александра Великая",
    telegramUrl: "https://t.me/+Aqdt6t2wIz5jOTAy",
    region: "abroad",
    sortOrder: 0,
    latitude: 49.9935,
    longitude: 36.2304,
  },
  {
    country: "Финляндия",
    city: "Хельсинки",
    leader: "Рами Отман",
    telegramUrl: "https://t.me/+bR4x7FMYh5E1MDli",
    region: "abroad",
    sortOrder: 0,
    latitude: 60.1699,
    longitude: 24.9384,
  },
  {
    country: "Франция",
    city: "Париж",
    leader: "Наталия Борисенко",
    telegramUrl: "https://t.me/+pdSmwCRgTRNiOGFi",
    region: "abroad",
    sortOrder: 0,
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    country: "Франция",
    city: "Фугероль",
    leader: "Арина Хейльман",
    telegramUrl: "https://t.me/+Q48v-xfRJAIwODRi",
    region: "abroad",
    sortOrder: 0,
    latitude: 45.6167,
    longitude: 2.6833,
  },
  {
    country: "Швеция",
    city: "Сундсвалль",
    leader: "Polina Reznichenko",
    telegramUrl: "https://t.me/+Z75DQOFm2thhMjNi",
    region: "abroad",
    sortOrder: 0,
    latitude: 62.3913,
    longitude: 17.3069,
  },
  {
    country: "Эстония",
    city: "Таллин",
    leader: "Марина Карасева",
    telegramUrl: "https://t.me/+tZ7zueGflexhNDgy",
    region: "abroad",
    sortOrder: 0,
    latitude: 59.4370,
    longitude: 24.7536,
  },
] as const;

async function seed() {
  const batch = db.batch();

  console.log("Seeding clubs...");
  for (const club of clubs) {
    const id = `${slugify(club.country)}_${slugify(club.city)}`;
    console.log(`  ${id} → ${club.country} / ${club.city}`);
    batch.set(db.collection("clubs").doc(id), { ...club });
  }

  // Store the master Telegram link in config/ui_strings so mobile apps can
  // update it without an app release.
  console.log("Setting clubs_master_telegram_url in config/ui_strings...");
  batch.set(
    db.collection("config").doc("ui_strings"),
    { clubs_master_telegram_url: "https://t.me/ageevschool/1224" },
    { merge: true }
  );

  console.log("Committing batch write...");
  await batch.commit();
  console.log(`Done! Seeded ${clubs.length} clubs + master telegram URL.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
