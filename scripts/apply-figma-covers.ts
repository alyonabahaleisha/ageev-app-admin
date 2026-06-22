/**
 * Applies cover images extracted from the Figma "Школа Михаила Агеева" design
 * to webinar & meditation docs. Backs up current covers first.
 *   npx tsx scripts/apply-figma-covers.ts --dry-run   # preview
 *   npx tsx scripts/apply-figma-covers.ts             # apply
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

const MAP = JSON.parse(readFileSync("/tmp/cover_map.json", "utf-8")) as Record<
  string,
  Record<string, { imageRef: string; title: string }>
>;
const COLORS = JSON.parse(readFileSync("/tmp/cover_colors.json", "utf-8")) as Record<string, string>;
const IMG_DIR = "/Users/alyonayanuchek/ageev-app-rn/tmp-figma-covers/opt";

async function uploadAndGetUrl(localPath: string, storagePath: string) {
  const token = randomUUID();
  await bucket.upload(localPath, {
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
  const backup: Record<string, { coverUrl?: string; coverColor?: string }> = {};
  const urlCache: Record<string, string> = {}; // imageRef -> uploaded url

  for (const col of ["webinars", "meditations"] as const) {
    for (const [docId, v] of Object.entries(MAP[col] || {})) {
      const local = resolve(IMG_DIR, `${v.imageRef}.jpg`);
      if (!existsSync(local)) {
        console.log(`  ✗ missing image file for ${col}/${docId}: ${local}`);
        continue;
      }
      const snap = await db.doc(`${col}/${docId}`).get();
      if (!snap.exists) {
        console.log(`  ✗ ${col}/${docId} not found in Firestore`);
        continue;
      }
      backup[`${col}/${docId}`] = {
        coverUrl: snap.data()!.coverUrl,
        coverColor: snap.data()!.coverColor,
      };
      const color = COLORS[v.imageRef] || "";
      const storagePath = `images/${col}/figma-${v.imageRef}.jpg`;

      if (dryRun) {
        console.log(`  [DRY] ${col}/${docId}  «${v.title}»  color=${color}`);
        continue;
      }

      let url = urlCache[v.imageRef];
      if (!url) {
        url = await uploadAndGetUrl(local, storagePath);
        urlCache[v.imageRef] = url;
      }
      await db.doc(`${col}/${docId}`).update({ coverUrl: url, coverColor: color });
      console.log(`  ✓ ${col}/${docId}  «${v.title}»`);
    }
  }

  if (!dryRun) {
    writeFileSync("/tmp/cover-backup.json", JSON.stringify(backup, null, 2));
    console.log(`\nBackup of previous covers → /tmp/cover-backup.json (${Object.keys(backup).length} docs)`);
  }
}

main().then(() => process.exit(0));
