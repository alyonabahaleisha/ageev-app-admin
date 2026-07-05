import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, "serviceAccountKey.json"), "utf-8")
);
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "mikhail-app.firebasestorage.app",
});
const db = getFirestore();

async function main() {
  for (const col of ["meditations", "webinars"]) {
    const snap = await db.collection(col).orderBy("sortOrder").get();
    console.log(`\n===== ${col} (${snap.size}) =====`);
    snap.forEach((d) => {
      const x = d.data();
      const hasCover = x.coverUrl ? "cover✓" : "cover✗";
      console.log(`${d.id}\t${hasCover}\t${x.title}`);
    });
  }
}

main().then(() => process.exit(0));
