/**
 * Rebuilds the `mindsetStates` collection to the 10 states from the Figma
 * "Выберите состояние" design, uploads their cover images, and fully populates
 * "Новый уровень жизни" (9 affirmations + linked meditation).
 *
 *   npx tsx scripts/seed-mindset-states.ts --dry-run   # preview
 *   npx tsx scripts/seed-mindset-states.ts             # apply
 *
 * Backs up the previous mindsetStates to /tmp/mindset-states-backup.json.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";

const dryRun = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, "serviceAccountKey.json"), "utf-8")
);
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "mikhail-app.firebasestorage.app",
});
const db = getFirestore();
const bucket = getStorage().bucket();

const IMG_DIR = "/Users/alyonayanuchek/ageev-app-rn/tmp-figma-states/opt";
const newLevelAffirmations: string[] = JSON.parse(
  readFileSync("/tmp/new_level_affirmations.json", "utf-8")
);

interface Exercise {
  title: string;
  durationText: string;
  description: string;
  practiceText: string;
}
interface State {
  id: string;
  title: string;
  subtitle: string;
  affirmations: string[];
  meditationIds: string[];
  webinarIds: string[];
}

const EMPTY_EXERCISE: Exercise = {
  title: "",
  durationText: "",
  description: "",
  practiceText: "",
};

// Order matches the Figma grid; sortOrder = index.
const STATES: State[] = [
  {
    id: "self_awareness",
    title: "Самосознание, развитие уверенности",
    subtitle:
      "Укрепите внутреннюю опору, доверие к себе и ощущение собственной ценности.",
    affirmations: [],
    meditationIds: [],
    webinarIds: [],
  },
  { id: "wellbeing", title: "Самочувствие, здоровье", subtitle: "", affirmations: [], meditationIds: [], webinarIds: [] },
  { id: "relationships_family", title: "Отношения, семья, род", subtitle: "", affirmations: [], meditationIds: [], webinarIds: [] },
  { id: "purpose", title: "Призвание, реализация", subtitle: "", affirmations: [], meditationIds: [], webinarIds: [] },
  { id: "money_abundance", title: "Деньги и изобилие", subtitle: "", affirmations: [], meditationIds: [], webinarIds: [] },
  {
    id: "new_level",
    title: "Новый уровень жизни",
    subtitle: "",
    affirmations: newLevelAffirmations,
    meditationIds: ["create_reality"], // «Создание желаемой реальности»
    webinarIds: [], // «Где брать энергию…» not yet in catalog
  },
  { id: "anxiety_fears", title: "Тревога и страхи", subtitle: "", affirmations: [], meditationIds: [], webinarIds: [] },
  { id: "energy_development", title: "Энергетическое развитие, активация способностей", subtitle: "", affirmations: [], meditationIds: [], webinarIds: [] },
  { id: "resource_state", title: "Ресурсное состояние", subtitle: "", affirmations: [], meditationIds: [], webinarIds: [] },
  { id: "creator_angels", title: "Связь с Творцом и Ангелами", subtitle: "", affirmations: [], meditationIds: [], webinarIds: [] },
];

async function uploadCover(id: string): Promise<string> {
  const local = resolve(IMG_DIR, `${id}.jpg`);
  if (!existsSync(local)) {
    console.log(`  ! no cover image for ${id}`);
    return "";
  }
  const storagePath = `images/states/${id}.jpg`;
  const token = randomUUID();
  await bucket.upload(local, {
    destination: storagePath,
    metadata: {
      contentType: "image/jpeg",
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
    storagePath
  )}?alt=media&token=${token}`;
}

async function main() {
  // Back up + delete existing states
  const existing = await db.collection("mindsetStates").get();
  const backup: Record<string, unknown> = {};
  existing.forEach((d) => (backup[d.id] = d.data()));

  if (dryRun) {
    console.log(`[DRY] would back up ${existing.size} existing states`);
    for (const s of STATES) {
      console.log(
        `  [DRY] ${s.id}  «${s.title}»  affirm:${s.affirmations.length}  med:${s.meditationIds.length}  web:${s.webinarIds.length}`
      );
    }
    return;
  }

  writeFileSync(
    "/tmp/mindset-states-backup.json",
    JSON.stringify(backup, null, 2)
  );
  for (const d of existing.docs) {
    if (!STATES.find((s) => s.id === d.id)) await d.ref.delete();
  }

  for (let i = 0; i < STATES.length; i++) {
    const s = STATES[i];
    const coverImage = await uploadCover(s.id);
    await db.doc(`mindsetStates/${s.id}`).set({
      title: s.title,
      subtitle: s.subtitle,
      emoji: "",
      coverImage,
      sortOrder: i,
      exercise: { ...EMPTY_EXERCISE },
      affirmations: s.affirmations,
      audioId: "",
      meditationIds: s.meditationIds,
      webinarIds: s.webinarIds,
    });
    console.log(
      `  ✓ ${s.id}  «${s.title}»  affirm:${s.affirmations.length}  med:${s.meditationIds.length}`
    );
  }

  console.log(
    `\nBackup of previous states → /tmp/mindset-states-backup.json (${existing.size} docs)`
  );
}

main().then(() => process.exit(0));
