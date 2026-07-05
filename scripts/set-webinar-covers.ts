/**
 * Sets cover images (from the Figma home design) on matching webinar docs.
 *   npx tsx scripts/set-webinar-covers.ts            # apply
 *   npx tsx scripts/set-webinar-covers.ts --dry-run  # preview
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

const SRC = "/tmp/webinar-covers";

// webinar doc id -> local cover file (named by doc id)
const covers: Record<string, string> = {
  webinar_creation_keys_part1: "webinar_creation_keys_part1.jpg",
  webinar_best_prayers: "webinar_best_prayers.jpg",
  fear_protection_psalm90: "fear_protection_psalm90.jpg",
};

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
  for (const [id, file] of Object.entries(covers)) {
    const local = resolve(SRC, file);
    if (!existsSync(local)) {
      console.log(`  ✗ missing local file: ${local}`);
      continue;
    }
    const doc = await db.doc(`webinars/${id}`).get();
    if (!doc.exists) {
      console.log(`  ✗ webinars/${id} not found`);
      continue;
    }
    const storagePath = `images/webinars/${file}`;
    if (dryRun) {
      console.log(`  [DRY] ${local} → ${storagePath} → webinars/${id} (${doc.data()!.title})`);
      continue;
    }
    const url = await uploadAndGetUrl(local, storagePath);
    await db.doc(`webinars/${id}`).update({ coverUrl: url });
    console.log(`  ✓ webinars/${id} (${doc.data()!.title})\n      ${url}`);
  }
}

main().then(() => process.exit(0));
