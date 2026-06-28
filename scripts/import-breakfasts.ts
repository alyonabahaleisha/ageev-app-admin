/**
 * Bulk-import "Духовный завтрак" mp3 files into the `breakfasts` collection.
 *
 * Uploads each audio file to Storage (audio/breakfasts/<id>.mp3) with an
 * audio/mpeg content type + download token, then writes a breakfasts doc.
 * Doc ids are derived from the filename, so re-running overwrites rather than
 * duplicates. Duration is left 0 — the app's player reports it at playback.
 *
 * Usage:
 *   npx tsx scripts/import-breakfasts.ts "<folder>"        # import
 *   npx tsx scripts/import-breakfasts.ts "<folder>" --dry-run
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { createHash } from "crypto";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const DEFAULT_DIR =
  "/Users/alyonayanuchek/Downloads/drive-download-20260627T220559Z-3-001";
const dir = args.find((a) => !a.startsWith("--")) || DEFAULT_DIR;

// --- Firebase Admin init ---
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, "serviceAccountKey.json"), "utf-8")
);
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "mikhail-app.firebasestorage.app",
});
const db = getFirestore();
const bucket = getStorage().bucket();

/** Strip extension, author, separators → a human title. */
function cleanTitle(file: string): string {
  let t = file.replace(/\.mp3$/i, "");
  t = t.replace(/_/g, " ");
  t = t.replace(/Михаил\s+Агеев/gi, "");
  t = t.replace(/[-–−]/g, " ");
  t = t.replace(/\s+/g, " ").trim();
  return t || file.replace(/\.mp3$/i, "");
}

/** Stable id from the filename so re-imports overwrite the same doc. */
function idFor(file: string): string {
  const hash = createHash("md5").update(file).digest("hex").slice(0, 10);
  return `breakfast_${hash}`;
}

async function main() {
  const files = readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".mp3"))
    .sort((a, b) => a.localeCompare(b, "ru"));

  console.log(`Found ${files.length} mp3 file(s) in:\n  ${dir}\n`);

  let i = 0;
  for (const file of files) {
    const id = idFor(file);
    const title = cleanTitle(file);
    const storagePath = `audio/breakfasts/${id}.mp3`;
    console.log(`[${++i}/${files.length}] ${title}`);
    console.log(`        file: ${file}`);
    console.log(`        id:   ${id}`);

    if (dryRun) continue;

    const token = createHash("md5")
      .update(id + ":token")
      .digest("hex");
    await bucket.upload(join(dir, file), {
      destination: storagePath,
      metadata: {
        contentType: "audio/mpeg",
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
    const audioUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      storagePath
    )}?alt=media&token=${token}`;

    await db
      .collection("breakfasts")
      .doc(id)
      .set({
        title,
        description: "",
        fileName: file,
        durationSeconds: 0,
        audioUrl,
        coverUrl: "",
        sortOrder: i - 1,
      });
    console.log(`        ✓ uploaded + saved\n`);
  }

  console.log(
    dryRun
      ? "\nDry run — nothing uploaded."
      : `\nDone. Imported ${files.length} breakfast(s).`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
