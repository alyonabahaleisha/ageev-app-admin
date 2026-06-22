/**
 * Creates the "Я ТОТ, КТО" mindset state: exercise, affirmations, a spiritual
 * breakfast audio (uploaded to Storage), and two external webinar/meditation
 * links. Reuses the self_awareness cover image.
 *
 *   npx tsx scripts/seed-ya-tot-kto.ts --dry-run
 *   npx tsx scripts/seed-ya-tot-kto.ts
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { readFileSync, existsSync } from "fs";
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

const ID = "ya_tot_kto";
const SORT_ORDER = 0;
const MP3 =
  "/Users/alyonayanuchek/ageev-app/music/breakfasts/Духовный_завтрак_6_9_к_упражнению_Я_тот_кто.mp3";
const STEP_BG = "/Users/alyonayanuchek/ageev-app-rn/tmp-stepbg/steps_bg.jpg";
const AFF_BG = "/Users/alyonayanuchek/ageev-app-rn/tmp-affbg/aff_bg.jpg";
const content = JSON.parse(readFileSync("/tmp/ya_tot_kto.json", "utf-8"));

async function uploadImage(local: string, storagePath: string): Promise<string> {
  if (!existsSync(local)) {
    console.log(`  ! image not found: ${local}`);
    return "";
  }
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

async function uploadAudio(): Promise<string> {
  if (!existsSync(MP3)) {
    console.log(`  ! breakfast mp3 not found: ${MP3}`);
    return "";
  }
  const storagePath = `audio/breakfasts/${ID}.mp3`;
  const token = randomUUID();
  await bucket.upload(MP3, {
    destination: storagePath,
    metadata: {
      contentType: "audio/mpeg",
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
    storagePath
  )}?alt=media&token=${token}`;
}

async function main() {
  // Reuse the self_awareness cover (same "Кто ты сегодня?" theme).
  const self = await db.doc("mindsetStates/self_awareness").get();
  const coverImage = (self.exists && (self.data()!.coverImage as string)) || "";
  // Existing values to preserve when a local source file is no longer present.
  const prev = (await db.doc(`mindsetStates/${ID}`).get()).data() || {};
  const prevSteps = (prev.exercise?.stepsBackground as string) || "";
  const prevAffBg = (prev.affirmationsBackground as string) || "";

  if (dryRun) {
    console.log(
      `[DRY] ${ID} «${content.title}»  affirm:${content.affirmations.length}  links:${content.externalLinks.length}  breakfast:${existsSync(MP3)}  cover:${!!coverImage}`
    );
    return;
  }

  const breakfastUrl = await uploadAudio();
  const stepsBackground = existsSync(STEP_BG)
    ? await uploadImage(STEP_BG, `images/states/${ID}_steps_bg.jpg`)
    : prevSteps;
  const affirmationsBackground = existsSync(AFF_BG)
    ? await uploadImage(AFF_BG, `images/states/${ID}_aff_bg.jpg`)
    : prevAffBg;

  await db.doc(`mindsetStates/${ID}`).set({
    title: content.title,
    subtitle: content.subtitle,
    emoji: "",
    coverImage,
    sortOrder: SORT_ORDER,
    exercise: { ...content.exercise, stepsBackground },
    affirmations: content.affirmations,
    affirmationsBackground,
    breakfastTitle: content.breakfastTitle,
    breakfastUrl,
    audioId: "",
    meditationIds: [],
    webinarIds: [],
    externalLinks: content.externalLinks,
  });

  console.log(`  ✓ ${ID} «${content.title}»`);
  console.log(`      breakfast: ${breakfastUrl ? "uploaded" : "MISSING"}`);
  console.log(`      stepsBackground: ${stepsBackground ? "ok" : "MISSING"}, affBg: ${affirmationsBackground ? "ok" : "MISSING"}`);
}

main().then(() => process.exit(0));
