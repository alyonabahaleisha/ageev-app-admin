/**
 * Migration script: uploads local media files to Firebase Storage
 * and updates Firestore documents with download URLs.
 *
 * Usage:
 *   npx tsx scripts/migrate-storage.ts                     # all phases
 *   npx tsx scripts/migrate-storage.ts --phase music       # music only
 *   npx tsx scripts/migrate-storage.ts --phase images      # cover images only
 *   npx tsx scripts/migrate-storage.ts --phase meditations # meditation audio only
 *   npx tsx scripts/migrate-storage.ts --dry-run           # preview only
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { writeFileSync, unlinkSync } from "fs";

// --- CLI args ---
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const phaseArg = args.find((_, i) => args[i - 1] === "--phase") || "all";

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

// --- Paths ---
const REPO_ROOT = resolve(__dirname, "../..");
const ANDROID_RES = resolve(
  REPO_ROOT,
  "levelup-manifestation-android/app/src/main/res"
);
const MUSIC_DIR = resolve(REPO_ROOT, "music");

// --- GitHub Release base URLs ---
const MEDITATION_RELEASE_BASE =
  "https://github.com/alyonabahaleisha/levelup-manifestation-android/releases/download/v1.0.0-meditations";

// --- Mappings ---

// Local music filename → Storage filename
const musicFileMap: Record<string, string> = {
  "Пропитка 180 минут.mp3": "propitka_180.mp3",
  "Clifford White - A Blessing.mp3": "a_blessing.mp3",
  "Clifford White - Sanctuary.mp3": "sanctuary.mp3",
};

// Music storage filename → Firestore doc ID
const musicDocMap: Record<string, string> = {
  "propitka_180.mp3": "propitka_180",
  "a_blessing.mp3": "a_blessing",
  "sanctuary.mp3": "sanctuary",
};

// Meditation ID → cover image filename
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

// Cover image filename → local path (relative to Android res/)
const imageSourceMap: Record<string, string> = {
  "med_abundance.png": "drawable-nodpi/med_abundance.png",
  "med_divine_dna.gif": "raw/med_divine_dna.gif",
  "med_karmic_release.png": "drawable/med_karmic_release.png",
  "med_return_to_self.png": "drawable-nodpi/med_return_to_self.png",
  "med_chakra_harmony.png": "drawable-nodpi/med_chakra_harmony.png",
  "med_harmonize_life.png": "drawable-nodpi/med_harmonize_life.png",
  "med_create_reality.png": "drawable-nodpi/med_create_reality.png",
  "med_angel_activation.png": "drawable-nodpi/med_angel_activation.png",
  "med_subtle_bodies.png": "drawable-nodpi/med_subtle_bodies.png",
  "med_cleansing.png": "drawable-nodpi/med_cleansing.png",
};

// Meditation ID → fileName (all 12 docs, 10 unique files)
const meditationFiles: Record<string, string> = {
  abundance: "abundance_activation.mp3",
  divine_dna: "divine_dna.mp3",
  karmic_release: "karmic_release.mp3",
  return_to_self: "return_to_self.mp3",
  chakra_harmony: "chakra_harmony.mp3",
  harmonize_life: "harmonize_life.mp3",
  create_reality: "create_reality.mp3",
  angel_activation: "angel_activation.mp3",
  subtle_bodies: "subtle_bodies.mp3",
  cleansing: "cleansing.mp3",
  return_to_self_2: "return_to_self.mp3",
  chakra_harmony_2: "chakra_harmony.mp3",
};

// _2 variants share the same cover as the parent
const coverAliases: Record<string, string> = {
  return_to_self_2: "return_to_self",
  chakra_harmony_2: "chakra_harmony",
};

// --- Helpers ---

function contentType(fileName: string): string {
  if (fileName.endsWith(".mp3")) return "audio/mpeg";
  if (fileName.endsWith(".gif")) return "image/gif";
  if (fileName.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

async function uploadAndGetUrl(
  localPath: string,
  storagePath: string
): Promise<string> {
  const [exists] = await bucket.file(storagePath).exists();
  if (exists) {
    console.log(`  ⏭  Already exists: ${storagePath}`);
    // Still need to return the URL
    return getDownloadUrl(storagePath);
  }

  console.log(`  ⬆  Uploading: ${localPath} → ${storagePath}`);
  const token = randomUUID();
  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: {
      contentType: contentType(storagePath),
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
}

async function getDownloadUrl(storagePath: string): Promise<string> {
  const [metadata] = await bucket.file(storagePath).getMetadata();
  const token =
    (metadata.metadata as Record<string, string>)
      ?.firebaseStorageDownloadTokens || "";
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
}

// --- Phase 1: Music Audio ---
async function migrateMusic() {
  console.log("\n[MUSIC] Phase 1: Upload music audio files\n");
  let uploaded = 0,
    failed = 0;
  const skipped = 0;

  for (const [localName, storageName] of Object.entries(musicFileMap)) {
    const localPath = resolve(MUSIC_DIR, localName);
    const storagePath = `audio/music/${storageName}`;
    const docId = musicDocMap[storageName];

    if (!existsSync(localPath)) {
      console.log(`  ✗  Not found: ${localPath}`);
      failed++;
      continue;
    }

    if (dryRun) {
      console.log(`  [DRY] ${localPath} → ${storagePath} → musicTracks/${docId}`);
      continue;
    }

    try {
      const url = await uploadAndGetUrl(localPath, storagePath);
      await db.doc(`musicTracks/${docId}`).update({ audioUrl: url });
      console.log(`  ✓  Updated musicTracks/${docId}`);
      uploaded++;
    } catch (err) {
      console.error(`  ✗  Failed ${storageName}:`, err);
      failed++;
    }
  }

  console.log(
    `\n[MUSIC] Done: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`
  );
}

// --- Phase 2: Cover Images ---
async function migrateImages() {
  console.log("\n[IMAGES] Phase 2: Upload meditation cover images\n");
  let uploaded = 0,
    failed = 0;
  const skipped = 0;

  // Upload unique images and collect URLs
  const imageUrls: Record<string, string> = {};

  for (const [medId, imageFile] of Object.entries(coverImages)) {
    const relPath = imageSourceMap[imageFile];
    const localPath = resolve(ANDROID_RES, relPath);
    const storagePath = `images/meditations/${imageFile}`;

    if (!existsSync(localPath)) {
      console.log(`  ✗  Not found: ${localPath}`);
      failed++;
      continue;
    }

    if (dryRun) {
      console.log(
        `  [DRY] ${localPath} → ${storagePath} → meditations/${medId}`
      );
      continue;
    }

    try {
      const url = await uploadAndGetUrl(localPath, storagePath);
      imageUrls[medId] = url;
      await db.doc(`meditations/${medId}`).update({ coverUrl: url });
      console.log(`  ✓  Updated meditations/${medId}`);
      uploaded++;
    } catch (err) {
      console.error(`  ✗  Failed ${imageFile}:`, err);
      failed++;
    }
  }

  // Update _2 variant docs with the same coverUrl as parent
  if (!dryRun) {
    for (const [variantId, parentId] of Object.entries(coverAliases)) {
      const url = imageUrls[parentId];
      if (url) {
        try {
          await db.doc(`meditations/${variantId}`).update({ coverUrl: url });
          console.log(`  ✓  Updated meditations/${variantId} (alias of ${parentId})`);
        } catch (err) {
          console.error(`  ✗  Failed alias ${variantId}:`, err);
          failed++;
        }
      }
    }
  } else {
    for (const [variantId, parentId] of Object.entries(coverAliases)) {
      console.log(
        `  [DRY] meditations/${variantId}.coverUrl = same as ${parentId}`
      );
    }
  }

  console.log(
    `\n[IMAGES] Done: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`
  );
}

// --- Phase 3: Meditation Audio ---
async function migrateMeditationAudio() {
  console.log("\n[MEDITATION-AUDIO] Phase 3: Download from GitHub + upload to Storage\n");
  let uploaded = 0,
    skipped = 0,
    failed = 0;

  // Deduplicate: only download each unique file once
  const uniqueFiles = [...new Set(Object.values(meditationFiles))];
  const fileUrls: Record<string, string> = {};

  for (const fileName of uniqueFiles) {
    const storagePath = `audio/meditations/${fileName}`;
    const githubUrl = `${MEDITATION_RELEASE_BASE}/${fileName}`;

    if (dryRun) {
      console.log(`  [DRY] ${githubUrl} → ${storagePath}`);
      continue;
    }

    // Check if already in Storage
    const [exists] = await bucket.file(storagePath).exists();
    if (exists) {
      console.log(`  ⏭  Already exists: ${storagePath}`);
      fileUrls[fileName] = await getDownloadUrl(storagePath);
      skipped++;
      continue;
    }

    try {
      console.log(`  ⬇  Downloading: ${githubUrl}`);
      const response = await fetch(githubUrl, { redirect: "follow" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());

      // Write to temp file, then upload
      const tmpPath = resolve(tmpdir(), `migrate_${fileName}`);
      writeFileSync(tmpPath, buffer);

      console.log(`  ⬆  Uploading: ${storagePath} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
      const token = randomUUID();
      await bucket.upload(tmpPath, {
        destination: storagePath,
        metadata: {
          contentType: "audio/mpeg",
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
      unlinkSync(tmpPath);

      fileUrls[fileName] = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
      console.log(`  ✓  Uploaded ${fileName}`);
      uploaded++;
    } catch (err) {
      console.error(`  ✗  Failed ${fileName}:`, err);
      failed++;
    }
  }

  // Update all 12 Firestore meditation docs
  if (!dryRun) {
    for (const [medId, fileName] of Object.entries(meditationFiles)) {
      const url = fileUrls[fileName];
      if (url) {
        try {
          await db.doc(`meditations/${medId}`).update({ audioUrl: url });
          console.log(`  ✓  Updated meditations/${medId}`);
        } catch (err) {
          console.error(`  ✗  Failed update ${medId}:`, err);
          failed++;
        }
      }
    }
  }

  console.log(
    `\n[MEDITATION-AUDIO] Done: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`
  );
}

// --- Main ---
async function main() {
  console.log(`\nFirebase Storage Migration ${dryRun ? "(DRY RUN)" : ""}`);
  console.log(`Bucket: ${bucket.name}`);
  console.log(`Phase: ${phaseArg}\n`);

  if (phaseArg === "all" || phaseArg === "music") await migrateMusic();
  if (phaseArg === "all" || phaseArg === "images") await migrateImages();
  if (phaseArg === "all" || phaseArg === "meditations")
    await migrateMeditationAudio();

  console.log("\nMigration complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
