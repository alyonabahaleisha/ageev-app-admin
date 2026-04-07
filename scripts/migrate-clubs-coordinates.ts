/**
 * Migration script: batch-updates all `clubs` Firestore documents with
 * latitude/longitude coordinates sourced from a hardcoded city map.
 *
 * Usage:
 *   1. Place your Firebase service account key as scripts/serviceAccountKey.json
 *   2. npx tsx scripts/migrate-clubs-coordinates.ts
 *
 * Idempotent — safe to run multiple times. Documents that already have
 * matching coordinates are still written (Firestore merge is a no-op for
 * unchanged fields). Documents whose ID is not in the coordinate map are
 * skipped with a warning so nothing is accidentally overwritten with zeros.
 *
 * Document IDs follow the pattern produced by seed scripts:
 *   `${slugify(country)}_${slugify(city)}`
 * The coordinate map keys match that pattern exactly.
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

// ---------------------------------------------------------------------------
// Coordinate map — keyed by Firestore document ID (slugified country_city).
// All 73 Russian clubs + all international clubs across both seed scripts.
// ---------------------------------------------------------------------------
const COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  // ── Russia ──────────────────────────────────────────────────────────────
  rossiya_abakan:                    { latitude: 53.7206,  longitude: 91.4424 },
  rossiya_almetevsk:                 { latitude: 54.9022,  longitude: 52.3006 },
  rossiya_anapa:                     { latitude: 44.8952,  longitude: 37.3160 },
  rossiya_apsheronsk:                { latitude: 44.4639,  longitude: 39.7320 },
  rossiya_astrakhan:                 { latitude: 46.3479,  longitude: 48.0337 },
  rossiya_barnaul:                   { latitude: 53.3606,  longitude: 83.7636 },
  rossiya_belgorod:                  { latitude: 50.5955,  longitude: 36.5875 },
  rossiya_berdsk:                    { latitude: 54.7572,  longitude: 83.0985 },
  rossiya_biysk:                     { latitude: 52.5400,  longitude: 85.1635 },
  rossiya_blagoveshchensk:           { latitude: 50.2897,  longitude: 127.5272 },
  rossiya_bolshoy_kamen:             { latitude: 43.1122,  longitude: 132.3539 },
  rossiya_bryansk:                   { latitude: 53.2434,  longitude: 34.3659 },
  rossiya_vladivostok:               { latitude: 43.1198,  longitude: 131.8869 },
  rossiya_vladikavkaz:               { latitude: 43.0355,  longitude: 44.6680 },
  rossiya_volgograd:                 { latitude: 48.7080,  longitude: 44.5133 },
  rossiya_vologda:                   { latitude: 59.2239,  longitude: 39.8845 },
  rossiya_voronezh:                  { latitude: 51.6720,  longitude: 39.1843 },
  rossiya_vyborg:                    { latitude: 60.7086,  longitude: 28.7539 },
  rossiya_ekaterinburg:              { latitude: 56.8389,  longitude: 60.6057 },
  rossiya_elabuga:                   { latitude: 55.7631,  longitude: 52.0572 },
  rossiya_essentuki:                 { latitude: 44.0461,  longitude: 42.8624 },
  rossiya_ivanovo:                   { latitude: 57.0005,  longitude: 40.9737 },
  rossiya_izhevsk:                   { latitude: 56.8527,  longitude: 53.2114 },
  rossiya_ishimbay:                  { latitude: 53.4524,  longitude: 56.0414 },
  rossiya_irkutsk:                   { latitude: 52.2978,  longitude: 104.2964 },
  rossiya_yoshkar_ola:               { latitude: 56.6344,  longitude: 47.8967 },
  rossiya_kazan:                     { latitude: 55.7887,  longitude: 49.1221 },
  rossiya_kaliningrad:               { latitude: 54.7104,  longitude: 20.4522 },
  rossiya_kaluga:                    { latitude: 54.5293,  longitude: 36.2754 },
  rossiya_kemerovo:                  { latitude: 55.3909,  longitude: 86.0627 },
  rossiya_kirov:                     { latitude: 58.6035,  longitude: 49.6680 },
  rossiya_korolev:                   { latitude: 55.9220,  longitude: 37.7951 },
  rossiya_krasnodar:                 { latitude: 45.0448,  longitude: 38.9760 },
  rossiya_krasnoyarsk:               { latitude: 56.0153,  longitude: 92.8932 },
  rossiya_kungur:                    { latitude: 57.4326,  longitude: 56.9374 },
  rossiya_kursk:                     { latitude: 51.7373,  longitude: 36.1873 },
  rossiya_lipetsk:                   { latitude: 52.6031,  longitude: 39.5708 },
  rossiya_lugansk:                   { latitude: 48.5740,  longitude: 39.3078 },
  rossiya_lysva:                     { latitude: 58.1033,  longitude: 57.8072 },
  rossiya_makhachkala:               { latitude: 42.9849,  longitude: 47.5047 },
  rossiya_moskva:                    { latitude: 55.7558,  longitude: 37.6173 },
  rossiya_naberezhnye_chelny:        { latitude: 55.7432,  longitude: 52.3958 },
  rossiya_nakhodka:                  { latitude: 42.8188,  longitude: 132.8966 },
  rossiya_nizhnevartovsk:            { latitude: 60.9344,  longitude: 76.5547 },
  rossiya_nizhnekamsk:               { latitude: 55.6385,  longitude: 51.8224 },
  rossiya_nizhniy_novgorod:          { latitude: 56.2965,  longitude: 43.9361 },
  rossiya_novokuznetsk:              { latitude: 53.7557,  longitude: 87.1099 },
  rossiya_novosibirsk:               { latitude: 54.9884,  longitude: 82.9357 },
  rossiya_oktyabrskiy:               { latitude: 54.4752,  longitude: 53.4692 },
  rossiya_omsk:                      { latitude: 54.9885,  longitude: 73.3242 },
  rossiya_orenburg:                  { latitude: 51.7727,  longitude: 55.0988 },
  rossiya_perm:                      { latitude: 58.0105,  longitude: 56.2502 },
  rossiya_petropavlovsk_kamchatskiy: { latitude: 53.0452,  longitude: 158.6509 },
  rossiya_rostov_na_donu:            { latitude: 47.2357,  longitude: 39.7015 },
  rossiya_ryazan:                    { latitude: 54.6269,  longitude: 39.6916 },
  rossiya_samara:                    { latitude: 53.1959,  longitude: 50.1456 },
  rossiya_sankt_peterburg:           { latitude: 59.9311,  longitude: 30.3609 },
  rossiya_saransk:                   { latitude: 54.1838,  longitude: 45.1749 },
  rossiya_saratov:                   { latitude: 51.5924,  longitude: 46.0340 },
  rossiya_sevastopol:                { latitude: 44.6166,  longitude: 33.5254 },
  rossiya_serov:                     { latitude: 59.6010,  longitude: 60.5729 },
  rossiya_simferopol:                { latitude: 44.9521,  longitude: 34.1024 },
  rossiya_slavyansk_na_kubani:       { latitude: 45.2640,  longitude: 38.1258 },
  rossiya_solnechnogorsk:            { latitude: 56.1836,  longitude: 36.9929 },
  rossiya_sochi:                     { latitude: 43.6028,  longitude: 39.7342 },
  rossiya_stavropol:                 { latitude: 45.0449,  longitude: 41.9691 },
  rossiya_sterlitamak:               { latitude: 53.6311,  longitude: 55.9310 },
  rossiya_surgut:                    { latitude: 61.2540,  longitude: 73.3964 },
  rossiya_taganrog:                  { latitude: 47.2086,  longitude: 38.8975 },
  rossiya_tolyatti:                  { latitude: 53.5303,  longitude: 49.3461 },
  rossiya_tomsk:                     { latitude: 56.4977,  longitude: 84.9744 },
  rossiya_tuymazy:                   { latitude: 54.6007,  longitude: 53.6985 },
  rossiya_tyumen:                    { latitude: 57.1522,  longitude: 65.5272 },
  rossiya_ulan_ude:                  { latitude: 51.8272,  longitude: 107.6069 },
  rossiya_ulyanovsk:                 { latitude: 54.3142,  longitude: 48.4031 },
  rossiya_ust_ilimsk:                { latitude: 57.9529,  longitude: 102.6540 },
  rossiya_ufa:                       { latitude: 54.7388,  longitude: 55.9721 },
  rossiya_khabarovsk:                { latitude: 48.4827,  longitude: 135.0839 },
  rossiya_cheboksary:                { latitude: 56.1439,  longitude: 47.2489 },
  rossiya_chelyabinsk:               { latitude: 55.1644,  longitude: 61.4368 },
  rossiya_cherepovets:               { latitude: 59.1255,  longitude: 37.9023 },
  rossiya_chekhov:                   { latitude: 55.1473,  longitude: 37.4706 },
  rossiya_chita:                     { latitude: 52.0336,  longitude: 113.5007 },
  rossiya_yakutsk:                   { latitude: 62.0355,  longitude: 129.6755 },
  rossiya_yaroslavl:                 { latitude: 57.6261,  longitude: 39.8845 },

  // ── International (seed-clubs.ts) ───────────────────────────────────────
  turtsiya_antalya:                  { latitude: 36.8969,  longitude: 30.7133 },
  uzbekistan_samarkand:              { latitude: 39.6542,  longitude: 66.9597 },
  uzbekistan_tashkent:               { latitude: 41.2995,  longitude: 69.2401 },
  ukraina_belgorod_dnestrovskiy:     { latitude: 46.1879,  longitude: 30.3463 },
  ukraina_dnepr:                     { latitude: 48.4647,  longitude: 35.0462 },
  ukraina_kiev:                      { latitude: 50.4501,  longitude: 30.5234 },
  ukraina_lvov:                      { latitude: 49.8397,  longitude: 24.0297 },
  ukraina_odessa:                    { latitude: 46.4825,  longitude: 30.7233 },
  ukraina_kharkov:                   { latitude: 49.9935,  longitude: 36.2304 },
  finlyandiya_khelsinki:             { latitude: 60.1699,  longitude: 24.9384 },
  frantsiya_parizh:                  { latitude: 48.8566,  longitude: 2.3522 },
  frantsiya_fugerol:                 { latitude: 45.6167,  longitude: 2.6833 },
  shvetsiya_sundsval:                { latitude: 62.3913,  longitude: 17.3069 },
  estoniya_tallin:                   { latitude: 59.4370,  longitude: 24.7536 },

  // ── International (seed-extra-clubs.ts) ─────────────────────────────────
  avstraliya_melbourne:              { latitude: -37.8136, longitude: 144.9631 },
  avstriya_vena:                     { latitude: 48.2082,  longitude: 16.3738 },
  azerbaydzhan_baku:                 { latitude: 40.4093,  longitude: 49.8671 },
  angliya_london:                    { latitude: 51.5074,  longitude: -0.1278 },
  belarus_bobruysk:                  { latitude: 53.1381,  longitude: 29.2213 },
  belarus_lida:                      { latitude: 53.8882,  longitude: 25.2986 },
  belarus_minsk:                     { latitude: 53.9045,  longitude: 27.5615 },
  belgiya_temse:                     { latitude: 51.1239,  longitude: 4.2097 },
  germaniya_berlin:                  { latitude: 52.5200,  longitude: 13.4050 },
  germaniya_braunshvayg:             { latitude: 52.2689,  longitude: 10.5268 },
  germaniya_valdyurn:                { latitude: 49.5733,  longitude: 9.3711 },
  germaniya_gamburg:                 { latitude: 53.5753,  longitude: 10.0153 },
  germaniya_gannover:                { latitude: 52.3759,  longitude: 9.7320 },
  germaniya_dyusseldorf:             { latitude: 51.2217,  longitude: 6.7762 },
  germaniya_zenden:                  { latitude: 51.8569,  longitude: 7.4917 },
  germaniya_kassel:                  { latitude: 51.3127,  longitude: 9.4797 },
  germaniya_bonn:                    { latitude: 50.7374,  longitude: 7.0982 },
  germaniya_kraylskhaym:             { latitude: 49.1289,  longitude: 10.0700 },
  germaniya_memmingen:               { latitude: 47.9875,  longitude: 10.1814 },
  germaniya_nyurnberg:               { latitude: 49.4521,  longitude: 11.0767 },
  germaniya_frankfurt_na_mayne:      { latitude: 50.1109,  longitude: 8.6821 },
  gruziya_tbilisi:                   { latitude: 41.6938,  longitude: 44.8015 },
  izrail_petakh_tikva:               { latitude: 32.0840,  longitude: 34.8878 },
  izrail_khayfa:                     { latitude: 32.7940,  longitude: 34.9896 },
  italiya_milan:                     { latitude: 45.4642,  longitude: 9.1900 },
  italiya_padua:                     { latitude: 45.4064,  longitude: 11.8768 },
  italiya_rim:                       { latitude: 41.9028,  longitude: 12.4964 },

  // ── Previously skipped — slug fixes + new entries ──────────────────────
  rossiya_korolyov:                  { latitude: 55.9220,  longitude: 37.7951 },
  shvetsiya_sundsvall:               { latitude: 62.3913,  longitude: 17.3069 },
  avstraliya_melburn:                { latitude: -37.8136, longitude: 144.9631 },
  italiya_paduya:                    { latitude: 45.4064,  longitude: 11.8768 },
  kanada_monreal:                    { latitude: 45.5017,  longitude: -73.5673 },
  kanada_toronto:                    { latitude: 43.6532,  longitude: -79.3832 },
  kanada_vankuver:                   { latitude: 49.2827,  longitude: -123.1207 },
  kazakhstan_aktobe:                 { latitude: 50.2839,  longitude: 57.1670 },
  kazakhstan_almaty:                 { latitude: 43.2220,  longitude: 76.8512 },
  kazakhstan_astana:                 { latitude: 51.1694,  longitude: 71.4491 },
  kazakhstan_karaganda:              { latitude: 49.8047,  longitude: 73.1094 },
  kazakhstan_kokshetau:              { latitude: 53.2833,  longitude: 69.3833 },
  kazakhstan_pavlodar:               { latitude: 52.2873,  longitude: 76.9674 },
  kazakhstan_uralsk:                 { latitude: 51.2333,  longitude: 51.3667 },
  kazakhstan_ust_kamenogorsk:        { latitude: 49.9480,  longitude: 82.6282 },
  latviya_riga:                      { latitude: 56.9496,  longitude: 24.1052 },
  litva_klaypeda:                    { latitude: 55.7033,  longitude: 21.1443 },
  litva_vilnyus:                     { latitude: 54.6872,  longitude: 25.2797 },
  moldova_kishinyov:                 { latitude: 47.0105,  longitude: 28.8638 },
  oae_dubay:                         { latitude: 25.2048,  longitude: 55.2708 },
  polsha_lodz:                       { latitude: 51.7592,  longitude: 19.4560 },
  polsha_varshava:                   { latitude: 52.2297,  longitude: 21.0122 },
  polsha_vrotslav:                   { latitude: 51.1079,  longitude: 17.0385 },
  ssha_los_andzheles:                { latitude: 34.0522,  longitude: -118.2437 },
  ssha_nyu_york:                     { latitude: 40.7128,  longitude: -74.0060 },
  ssha_san_frantsisko:               { latitude: 37.7749,  longitude: -122.4194 },
};

async function migrate() {
  console.log("Fetching all clubs from Firestore...");
  const snapshot = await db.collection("clubs").get();
  console.log(`Found ${snapshot.size} club documents.`);

  // Firestore limits batches to 500 operations.
  const BATCH_SIZE = 400;
  let batch = db.batch();
  let batchCount = 0;
  let updated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const coords = COORDINATES[doc.id];
    if (!coords) {
      console.warn(`  SKIP — no coordinates for document ID: ${doc.id}`);
      skipped++;
      continue;
    }

    batch.set(
      db.collection("clubs").doc(doc.id),
      { latitude: coords.latitude, longitude: coords.longitude },
      { merge: true }
    );
    batchCount++;
    updated++;

    if (batchCount >= BATCH_SIZE) {
      console.log(`  Committing batch of ${batchCount}...`);
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    console.log(`  Committing final batch of ${batchCount}...`);
    await batch.commit();
  }

  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}.`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
