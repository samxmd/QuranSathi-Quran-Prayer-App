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
const EDITIONS = {
  arabic: "ara-quranuthmanihaf",
  english: "eng-ummmuhammad",
  nepali: "nep-ahlalhadithcent",
  bangla: "ben-muhiuddinkhan",
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${url}`);
  }
  return res.json();
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

async function fetchSurahData(surahId) {
  const [arabicJson, englishJson, nepaliJson, banglaJson] = await Promise.all([
    fetchJson(`${API_BASE}/${EDITIONS.arabic}/${surahId}.min.json`),
    fetchJson(`${API_BASE}/${EDITIONS.english}/${surahId}.min.json`),
    fetchJson(`${API_BASE}/${EDITIONS.nepali}/${surahId}.min.json`),
    fetchJson(`${API_BASE}/${EDITIONS.bangla}/${surahId}.min.json`),
  ]);

  const arabic = arabicJson?.chapter ?? [];
  const english = englishJson?.chapter ?? [];
  const nepali = nepaliJson?.chapter ?? [];
  const bangla = banglaJson?.chapter ?? [];

  if (arabic.length !== english.length || arabic.length !== nepali.length || arabic.length !== bangla.length) {
    throw new Error(`Mismatched ayah counts for surah ${surahId}`);
  }

  return arabic.map((ayah, index) => ({
    surahId,
    ayahNumber: ayah.verse,
    arabic: ayah.text,
    english: english[index]?.text ?? "",
    nepali: nepali[index]?.text ?? "",
    bangla: bangla[index]?.text ?? "",
  }));
}

async function main() {
  console.log("🚀 Starting SQLite Database Generation...");
  
  // Ensure directory exists
  await fs.mkdir(dbDir, { recursive: true });
  
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
      FOREIGN KEY (surah_id) REFERENCES surahs(id)
    );

    CREATE INDEX idx_ayahs_surah ON ayahs(surah_id);

    CREATE VIRTUAL TABLE ayahs_fts USING fts5(
      arabic, english, nepali, bangla,
      content='ayahs', content_rowid='id'
    );
  `);

  const insertSurah = db.prepare(`
    INSERT INTO surahs (id, name_arabic, name_english, name_nepali, meaning, total_ayahs, revelation_type, juz)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAyah = db.prepare(`
    INSERT INTO ayahs (surah_id, ayah_number, arabic, english, nepali, bangla)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertFts = db.prepare(`
    INSERT INTO ayahs_fts (rowid, arabic, english, nepali, bangla)
    VALUES (?, ?, ?, ?, ?)
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
        ayah.bangla
      );
      
      // Sync with FTS
      insertFts.run(
        info.lastInsertRowid,
        ayah.arabic,
        ayah.english,
        ayah.nepali,
        ayah.bangla
      );
      totalAyahs++;
    }
  }

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
