/**
 * Upload all new meditations & webinars to Firebase Storage + Firestore.
 *
 * Usage: npx tsx scripts/add-meditations.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";

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

const MEDITATIONS_DIR = resolve(__dirname, "../../music/meditations");

interface MeditationEntry {
  id: string;
  title: string;
  description: string;
  area: string;
  localFile: string;
  storageFile: string;
  durationSeconds: number;
  sortOrder: number;
  popular: boolean;
}

const newMeditations: MeditationEntry[] = [
  // ── Meditations ──
  {
    id: "gratitude_meditation",
    title: "Медитация благодарности",
    description: "Медитация для развития чувства благодарности",
    area: "calm",
    localFile: "Михаил_Агеев_–_Медитация_благодарности.mp3",
    storageFile: "gratitude_meditation.mp3",
    durationSeconds: 1165,
    sortOrder: 12,
    popular: false,
  },
  {
    id: "love_temple",
    title: "Медитация в храме любви",
    description: "Медитация для раскрытия энергии любви",
    area: "love",
    localFile: "МЕДИТАЦИЯ_В_ХРАМЕ_ЛЮБВИ_−_Михаил_Агеев.mp3",
    storageFile: "love_temple.mp3",
    durationSeconds: 3023,
    sortOrder: 13,
    popular: false,
  },
  {
    id: "slim_rejuvenation",
    title: "Медитация стройности и омоложения",
    description: "Медитация для стройности тела и омоложения",
    area: "body",
    localFile: "МЕДИТАЦИЯ_СТРОЙНОСТИ_И_ОМОЛОЖЕНИЯ_–_Михаил_Агеев.mp3",
    storageFile: "slim_rejuvenation.mp3",
    durationSeconds: 2356,
    sortOrder: 14,
    popular: false,
  },
  {
    id: "healing_creator_sep2021",
    title: "Исцеляющая медитация в потоке Творца (Сентябрь 2021)",
    description: "Исцеляющая медитация для восстановления связи с Творцом",
    area: "body",
    localFile: "ИСЦЕЛЯЮЩАЯ_МЕДИТАЦИЯ_в_потоке_Творца_Сентябрь_2021_–_Михаил_Агеев.mp3",
    storageFile: "healing_creator_sep2021.mp3",
    durationSeconds: 5155,
    sortOrder: 15,
    popular: false,
  },
  {
    id: "healing_creator_feb2022",
    title: "Исцеляющая медитация в потоке Творца (Февраль 2022)",
    description: "Исцеляющая медитация для восстановления в потоке Творца",
    area: "body",
    localFile: "ИСЦЕЛЯЮЩАЯ_МЕДИТАЦИЯ_в_потоке_ТВОРЦА_Февраль_2022_–_Михаил_Агеев.mp3",
    storageFile: "healing_creator_feb2022.mp3",
    durationSeconds: 4080,
    sortOrder: 16,
    popular: false,
  },
  {
    id: "healing_creator_aug2022",
    title: "Исцеляющая медитация в потоке Творца (Август 2022)",
    description: "Исцеляющая медитация в потоке Творца",
    area: "body",
    localFile: "ИСЦЕЛЯЮЩАЯ_МЕДИТАЦИЯ_в_потоке_ТВОРЦА_Август_2022_−_Михаил_Агеев.mp3",
    storageFile: "healing_creator_aug2022.mp3",
    durationSeconds: 4816,
    sortOrder: 17,
    popular: false,
  },
  {
    id: "healing_creator_oct2022",
    title: "Исцеляющая медитация в потоке Творца (Октябрь 2022)",
    description: "Исцеляющая медитация в потоке Творца",
    area: "body",
    localFile: "ИСЦЕЛЯЮЩАЯ_МЕДИТАЦИЯ_В_ПОТОКЕ_ТВОРЦА_Октябрь_2022_−_Михаил_Агеев.mp3",
    storageFile: "healing_creator_oct2022.mp3",
    durationSeconds: 4665,
    sortOrder: 18,
    popular: false,
  },
  {
    id: "healing_creator_2",
    title: "Исцеляющая медитация в потоке Творца 2",
    description: "Вторая часть исцеляющей медитации в потоке Творца",
    area: "body",
    localFile: "ИСЦЕЛЯЮЩАЯ_МЕДИТАЦИЯ_В_ПОТОКЕ_ТВОРЦА_2–_Михаил_Агеев.mp3",
    storageFile: "healing_creator_2.mp3",
    durationSeconds: 3656,
    sortOrder: 19,
    popular: false,
  },
  {
    id: "energy_protection_psalm26",
    title: "Мощная энергетическая защита. Псалом 26",
    description: "Как поставить мощную энергетическую защиту с помощью Псалма 26",
    area: "selfWorth",
    localFile: "КАК_ПОСТАВИТЬ_МОЩНУЮ_ЭНЕРГЕТИЧЕСКУЮ_ЗАЩИТУ_ПСАЛОМ_26_⎼_Михаил_Агеев.mp3",
    storageFile: "energy_protection_psalm26.mp3",
    durationSeconds: 4063,
    sortOrder: 20,
    popular: false,
  },
  {
    id: "fear_protection_psalm90",
    title: "Мощная защита от страха. Псалом 90",
    description: "Мистическое значение 90 Псалма — мощная защита от страха",
    area: "fear",
    localFile: "МОЩНАЯ_ЗАЩИТА_ОТ_СТРАХА_МИСТИЧЕСКОЕ_ЗНАЧЕНИЕ_90_ПСАЛМА_Псалом_90.mp3",
    storageFile: "fear_protection_psalm90.mp3",
    durationSeconds: 7385,
    sortOrder: 21,
    popular: false,
  },
  {
    id: "gods_free_medicine",
    title: "Рецепт бесплатного лекарства от Бога",
    description: "5 ингредиентов бесплатного лекарства от Бога",
    area: "body",
    localFile: "РЕЦЕПТ_БЕСПЛАТНОГО_ЛЕКАРСТВА_ОТ_БОГА_5_ингредиентов_−_Михаил_Агеев.mp3",
    storageFile: "gods_free_medicine.mp3",
    durationSeconds: 6297,
    sortOrder: 22,
    popular: false,
  },
  // ── Webinars ──
  {
    id: "webinar_abundance_laws",
    title: "Вебинар: Что значит изобилие. Законы и секреты энергии канала изобилия",
    description: "Вебинар о законах и секретах энергии канала изобилия",
    area: "money",
    localFile: 'Вебинар_"ЧТО_ЗНАЧИТ_ИЗОБИЛИЕ_ЗАКОНЫ_И_СЕКРЕТЫ_ЭНЕРГИИ_КАНАЛА_ИЗОБИЛИЯ".mp3',
    storageFile: "webinar_abundance_laws.mp3",
    durationSeconds: 6289,
    sortOrder: 23,
    popular: false,
  },
  {
    id: "webinar_happiness_part1",
    title: "Вебинар: Что нам мешает быть счастливыми. Часть 1",
    description: "Что нам мешает быть счастливыми прямо сейчас — первая часть",
    area: "calm",
    localFile: 'Вебинар_"ЧТО_НАМ_МЕШАЕТ_БЫТЬ_СЧАСТЛИВЫМИ_ПРЯМО_СЕЙЧАС_1_часть"_–.mp3',
    storageFile: "webinar_happiness_part1.mp3",
    durationSeconds: 4267,
    sortOrder: 24,
    popular: false,
  },
  {
    id: "webinar_happiness_part2",
    title: "Вебинар: Что нам мешает быть счастливыми. Часть 2",
    description: "Что нам мешает быть счастливыми прямо сейчас — вторая часть",
    area: "calm",
    localFile: 'Вебинар_"ЧТО_НАМ_МЕШАЕТ_БЫТЬ_СЧАСТЛИВЫМИ_ПРЯМО_СЕЙЧАС_2_часть"_–.mp3',
    storageFile: "webinar_happiness_part2.mp3",
    durationSeconds: 4863,
    sortOrder: 25,
    popular: false,
  },
  {
    id: "webinar_self_confidence",
    title: "Вебинар: Как развить уверенность в себе",
    description: "Вебинар о развитии уверенности в себе",
    area: "confidence",
    localFile: 'Вебинар_"КАК_РАЗВИТЬ_УВЕРЕННОСТЬ_В_СЕБЕ"_–_Михаил_Агеев.mp3',
    storageFile: "webinar_self_confidence.mp3",
    durationSeconds: 5945,
    sortOrder: 26,
    popular: false,
  },
  {
    id: "webinar_find_purpose",
    title: "Вебинар: Как найти своё призвание",
    description: "Вебинар о поиске своего призвания в жизни",
    area: "career",
    localFile: 'Вебинар_"КАК_НАЙТИ_СВОЁ_ПРИЗВАНИЕ"_−_Михаил_Агеев.mp3',
    storageFile: "webinar_find_purpose.mp3",
    durationSeconds: 5190,
    sortOrder: 27,
    popular: false,
  },
  {
    id: "webinar_creation_keys_part1",
    title: "Вебинар: Ключи сотворения своей жизни. Часть 1",
    description: "Ключи сотворения своей жизни — первая часть",
    area: "career",
    localFile: 'Вебинар_"КЛЮЧИ_СОТВОРЕНИЯ_СВОЕЙ_ЖИЗНИ"_Часть_1_–_Михаил_Агеев.mp3',
    storageFile: "webinar_creation_keys_part1.mp3",
    durationSeconds: 4514,
    sortOrder: 28,
    popular: false,
  },
  {
    id: "webinar_creation_keys_part2",
    title: "Вебинар: Ключи сотворения своей жизни. Часть 2",
    description: "Ключи сотворения своей жизни — вторая часть",
    area: "career",
    localFile: 'Вебинар_"КЛЮЧИ_СОТВОРЕНИЯ_СВОЕЙ_ЖИЗНИ"_Часть_2_–_Михаил_Агеев.mp3',
    storageFile: "webinar_creation_keys_part2.mp3",
    durationSeconds: 5341,
    sortOrder: 29,
    popular: false,
  },
  {
    id: "webinar_spiritual_money_laws",
    title: "Вебинар: Духовные законы денег",
    description: "Вебинар о духовных законах денег",
    area: "money",
    localFile: 'Вебинар_"ДУХОВНЫЕ_ЗАКОНЫ_ДЕНЕГ"_–_Михаил_Агеев.mp3',
    storageFile: "webinar_spiritual_money_laws.mp3",
    durationSeconds: 4362,
    sortOrder: 30,
    popular: false,
  },
  {
    id: "webinar_overcome_fear",
    title: "Вебинар: Как побороть страх",
    description: "Вебинар о преодолении страха",
    area: "fear",
    localFile: 'Вебинар_"КАК_ПОБОРОТЬ_СТРАХ"_–_Михаил_Агеев.mp3',
    storageFile: "webinar_overcome_fear.mp3",
    durationSeconds: 3616,
    sortOrder: 31,
    popular: false,
  },
  {
    id: "webinar_best_prayers",
    title: "Вебинар: 5 лучших молитв для счастливой жизни",
    description: "5 лучших молитв для счастливой жизни",
    area: "calm",
    localFile: 'Вебинар_"5_ЛУЧШИХ_МОЛИТВ_ДЛЯ_СЧАСТЛИВОЙ_ЖИЗНИ"_–_Михаил_Агеев.mp3',
    storageFile: "webinar_best_prayers.mp3",
    durationSeconds: 4532,
    sortOrder: 32,
    popular: false,
  },
  {
    id: "webinar_7_steps_stronger",
    title: "Вебинар: 7 шагов к себе настоящему или как стать сильнее",
    description: "7 шагов к себе настоящему — как стать сильнее",
    area: "confidence",
    localFile: 'Вебинар_"7_ШАГОВ_К_СЕБЕ_НАСТОЯЩЕМУ_ИЛИ_КАК_СТАТЬ_СИЛЬНЕЕ"_–_Михаил.mp3',
    storageFile: "webinar_7_steps_stronger.mp3",
    durationSeconds: 6065,
    sortOrder: 33,
    popular: false,
  },
];

async function main() {
  // Check which already exist
  const existing = new Set(
    (await db.collection("meditations").get()).docs.map((d) => d.id)
  );

  const toAdd = newMeditations.filter((m) => !existing.has(m.id));
  console.log(
    `\n${toAdd.length} new items to add (${existing.size} already in Firestore)\n`
  );

  if (toAdd.length === 0) {
    console.log("Nothing to add.");
    return;
  }

  for (const med of toAdd) {
    const localPath = resolve(MEDITATIONS_DIR, med.localFile);

    if (!existsSync(localPath)) {
      console.error(`✗ File not found: ${localPath}`);
      continue;
    }

    // Upload audio
    const storagePath = `audio/meditations/${med.storageFile}`;
    const [exists] = await bucket.file(storagePath).exists();
    let audioUrl: string;

    if (exists) {
      console.log(`⏭ Already in Storage: ${med.storageFile}`);
      const [metadata] = await bucket.file(storagePath).getMetadata();
      const token =
        (metadata.metadata as Record<string, string>)
          ?.firebaseStorageDownloadTokens || "";
      audioUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
    } else {
      const sizeMB = (
        require("fs").statSync(localPath).size /
        1024 /
        1024
      ).toFixed(0);
      console.log(`⬆ Uploading: ${med.title} (${sizeMB} MB)...`);
      const token = randomUUID();
      await bucket.upload(localPath, {
        destination: storagePath,
        metadata: {
          contentType: "audio/mpeg",
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
      audioUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
      console.log(`  ✓ Uploaded`);
    }

    // Create Firestore document
    await db.doc(`meditations/${med.id}`).set({
      title: med.title,
      description: med.description,
      area: med.area,
      fileName: med.storageFile,
      durationSeconds: med.durationSeconds,
      audioUrl,
      coverUrl: "",
      coverColor: "",
      sortOrder: med.sortOrder,
      popular: med.popular,
    });
    console.log(`  ✓ Firestore: meditations/${med.id}\n`);
  }

  console.log("Done! All new meditations and webinars added.");
  console.log("Note: Cover images not set — upload via admin dashboard.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
