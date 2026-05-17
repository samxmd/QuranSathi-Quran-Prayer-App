import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const surahsFile = path.join(appRoot, "data", "surahs.ts");
const dbDir = path.join(appRoot, "assets", "data");
const dbFile = path.join(dbDir, "quran_v1.db");
const oldTsFile = path.join(appRoot, "data", "offlineQuran.ts");

const API_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions";
const ALQURAN_BASE = "https://api.alquran.cloud/v1";
const EDITIONS = {
  arabic: "ara-quranuthmanihaf",
  nepali: "nep-ahlalhadithcent",
  bangla: "ben-muhiuddinkhan",
  hindi: "hin-muhammadfarooqk",
};

const MIN_BUNDLED_DB_SIZE_BYTES = 1024 * 1024;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hasUsableBundledDb() {
  try {
    const stats = await fs.stat(dbFile);
    return stats.size >= MIN_BUNDLED_DB_SIZE_BYTES;
  } catch {
    return false;
  }
}

function shouldSkipRemoteGeneration() {
  if (process.env.FORCE_QURAN_DB_REBUILD === "1") {
    return false;
  }

  return Boolean(
    process.env.EAS_BUILD ||
    process.env.CI ||
    process.env.EXPO_OFFLINE_BUILD,
  );
}

async function fetchJsonWithRetry(url, label, maxAttempts = 5) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url);

      if (res.ok) {
        return res.json();
      }

      const retryAfterHeader = res.headers.get("retry-after");
      const retryAfterMs = retryAfterHeader
        ? Number(retryAfterHeader) * 1000
        : attempt * 2000;

      const error = new Error(`${label} request failed: ${res.status} ${url}`);
      error.status = res.status;
      lastError = error;

      if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
        await sleep(retryAfterMs);
        continue;
      }

      throw error;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(attempt * 2000);
        continue;
      }
    }
  }

  throw lastError;
}

async function fetchJson(url) {
  return fetchJsonWithRetry(url, "Generic");
}

async function fetchEnglishSurahData(surahId) {
  const json = await fetchJsonWithRetry(
    `${ALQURAN_BASE}/surah/${surahId}/editions/quran-uthmani,en.sahih`,
    `English surah ${surahId}`,
  );
  const editions = Array.isArray(json?.data) ? json.data : [];
  const englishEdition = editions[1]?.ayahs ?? [];

  return englishEdition.map((ayah) => ({
    verse: ayah?.numberInSurah,
    text: ayah?.text ?? "",
  }));
}

async function loadSurahMetadata() {
  const source = await fs.readFile(surahsFile, "utf8");
  // Basic regex to extract surah objects from the TS file
  // This is a bit fragile but works for the current format
  const surahs = [];
  const entries = source.matchAll(/\{\s*id:\s*(\d+),\s*nameArabic:\s*"([^"]+)",\s*nameEnglish:\s*"([^"]+)",\s*nameNepali:\s*"([^"]+)",\s*meaning:\s*"([^"]+)",\s*totalAyahs:\s*(\d+),\s*revelationType:\s*"([^"]+)",\s*juz:\s*(\d+)\s*\}/g);
  
  for (const match of entries) {
    surahs.push({
      id: Number(match[1]),
      nameArabic: match[2],
      nameEnglish: match[3],
      nameNepali: match[4],
      meaning: match[5],
      totalAyahs: Number(match[6]),
      revelationType: match[7],
      juz: Number(match[8])
    });
  }
  return surahs;
}

// Known typo corrections for the nep-ahlalhadithcent API source.
// Key format: "surahId:verseNumber" → [wrongText, correctText]
const NEPALI_CORRECTIONS = {
  "1:1": ["शुर गर्दछु", "शुरू गर्दछु"],
  "16:105": ["गर्दछन जसलाई", "गर्दछन् जसलाई"],
};

function applyNepaliCorrections(surahId, verseNumber, text) {
  let corrected = text;

  // Global cleanups for Legacy Preeti-to-Unicode conversion artifacts
  // 1. Icelandic Thorn (Þ) was mistakenly left instead of Devanagari Nukta (़)
  corrected = corrected.replace(/Þ/g, "़");

  // 2. The letter 'm' was left over from Preeti typing (where 'm' = 'फ')
  corrected = corrected.replace(/आपूmलाई/g, "आफूलाई");
  corrected = corrected.replace(/आप्mना/g, "आफ्ना");
  corrected = corrected.replace(/भूmठ्लाए/g, "झुठ्लाए");
  corrected = corrected.replace(/फुपूm/g, "फुपू");
  corrected = corrected.replace(/पि़mरऔन/g, "फ़िरऔन"); // The Þ became ़, so पि़mरऔन -> फ़िरऔन

  const key = `${surahId}:${verseNumber}`;
  const exactCorrection = NEPALI_CORRECTIONS[key];
  if (exactCorrection) {
    corrected = corrected.replace(exactCorrection[0], exactCorrection[1]);
  }
  return corrected;
}

async function fetchSurahData(surahId) {

  const [arabicJson, englishAyahs, nepaliJson, banglaJson, hindiJson, tajweedJson] = await Promise.all([
    fetchJson(`${API_BASE}/${EDITIONS.arabic}/${surahId}.min.json`),
    fetchEnglishSurahData(surahId),
    fetchJson(`${API_BASE}/${EDITIONS.nepali}/${surahId}.min.json`),
    fetchJson(`${API_BASE}/${EDITIONS.bangla}/${surahId}.min.json`),
    fetchJson(`${API_BASE}/${EDITIONS.hindi}/${surahId}.min.json`),
    fetchJson(`https://api.quran.com/api/v4/verses/by_chapter/${surahId}?fields=text_uthmani_tajweed&per_page=300`),
  ]);

  const arabic = arabicJson?.chapter ?? [];
  const english = englishAyahs ?? [];
  const nepali = nepaliJson?.chapter ?? [];
  const bangla = banglaJson?.chapter ?? [];
  const hindi = hindiJson?.chapter ?? [];
  const tajweedVerses = tajweedJson?.verses ?? [];

  if (arabic.length !== english.length || arabic.length !== nepali.length || arabic.length !== bangla.length || arabic.length !== hindi.length) {
    throw new Error(`Mismatched ayah counts for surah ${surahId}`);
  }

  return arabic.map((ayah, index) => ({
    surahId,
    ayahNumber: ayah.verse,
    arabic: ayah.text,
    arabicTajweed: tajweedVerses[index]?.text_uthmani_tajweed ?? "",
    english: english[index]?.text ?? "",
    nepali: applyNepaliCorrections(surahId, ayah.verse, nepali[index]?.text ?? ""),
    bangla: bangla[index]?.text ?? "",
    hindi: hindi[index]?.text ?? "",
  }));
}

async function main() {
  console.log("🚀 Starting SQLite Database Generation...");
  
  // Ensure directory exists
  await fs.mkdir(dbDir, { recursive: true });

  if (shouldSkipRemoteGeneration() && await hasUsableBundledDb()) {
    const dbStats = await fs.stat(dbFile);
    console.log(
      `Using bundled Quran database (${(dbStats.size / 1024 / 1024).toFixed(2)} MB); skipping remote regeneration.`,
    );
    return;
  }

  // Create/Replace database
  try {
    await fs.access(dbFile);
    await fs.unlink(dbFile);
  } catch (e) {}
  
  const db = new Database(dbFile);
  db.pragma("journal_mode = WAL");

  // Create tables
  db.exec(`
    CREATE TABLE surahs (
      id INTEGER PRIMARY KEY,
      name_arabic TEXT,
      name_english TEXT,
      name_nepali TEXT,
      meaning TEXT,
      total_ayahs INTEGER,
      revelation_type TEXT,
      juz INTEGER
    );

    CREATE TABLE ayahs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      surah_id INTEGER,
      ayah_number INTEGER,
      arabic TEXT,
      english TEXT,
      nepali TEXT,
      bangla TEXT,
      hindi TEXT,
      arabic_tajweed TEXT,
      FOREIGN KEY (surah_id) REFERENCES surahs(id)
    );

    CREATE INDEX idx_ayahs_surah ON ayahs(surah_id);

    CREATE VIRTUAL TABLE ayahs_fts USING fts5(
      arabic, english, nepali, bangla, hindi,
      content='ayahs', content_rowid='id'
    );
  `);

  const insertSurah = db.prepare(`
    INSERT INTO surahs (id, name_arabic, name_english, name_nepali, meaning, total_ayahs, revelation_type, juz)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAyah = db.prepare(`
    INSERT INTO ayahs (surah_id, ayah_number, arabic, english, nepali, bangla, hindi, arabic_tajweed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFts = db.prepare(`
    INSERT INTO ayahs_fts (rowid, arabic, english, nepali, bangla, hindi)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const surahs = await loadSurahMetadata();
  let totalAyahs = 0;

  for (const surah of surahs) {
    console.log(`📦 Processing Surah ${surah.id}: ${surah.nameEnglish}...`);
    
    insertSurah.run(
      surah.id,
      surah.nameArabic,
      surah.nameEnglish,
      surah.nameNepali,
      surah.meaning,
      surah.totalAyahs,
      surah.revelationType,
      surah.juz
    );

    const ayahs = await fetchSurahData(surah.id);
    for (const ayah of ayahs) {
      const info = insertAyah.run(
        ayah.surahId,
        ayah.ayahNumber,
        ayah.arabic,
        ayah.english,
        ayah.nepali,
        ayah.bangla,
        ayah.hindi,
        ayah.arabicTajweed
      );
      
      // Sync with FTS
      insertFts.run(
        info.lastInsertRowid,
        ayah.arabic,
        ayah.english,
        ayah.nepali,
        ayah.bangla,
        ayah.hindi
      );
      totalAyahs++;
    }
  }

  console.log("🧹 Vacuuming database for maximum size reduction...");
  db.exec("VACUUM");

  db.close();
  console.log("\n✅ Database generation complete!");
  
  // Stats
  const dbStats = await fs.stat(dbFile);
  let oldSize = 0;
  try {
    oldSize = (await fs.stat(oldTsFile)).size;
  } catch (e) {}

  console.log("------------------------------------------");
  console.log(`Total Surahs: 114`);
  console.log(`Total Ayahs: ${totalAyahs}`);
  console.log(`SQLite DB Size: ${(dbStats.size / 1024 / 1024).toFixed(2)} MB`);
  if (oldSize) {
    console.log(`Original .ts Size: ${(oldSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Reduction: ${(((oldSize - dbStats.size) / oldSize) * 100).toFixed(1)}%`);
  }
  console.log("------------------------------------------\n");
}

main().catch((error) => {
  console.error("❌ Error generating database:", error);
  process.exitCode = 1;
});
