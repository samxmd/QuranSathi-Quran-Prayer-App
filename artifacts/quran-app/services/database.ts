import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import type { Ayah } from "@/data/ayahs";

export interface DatabaseAyah {
  id: number;
  surah_id: number;
  ayah_number: number;
  arabic: string;
  english: string;
  nepali: string;
  bangla: string;
  hindi: string;
  arabic_tajweed?: string;
  surah_name?: string;
}

export class QuranDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private initializing: Promise<SQLite.SQLiteDatabase> | null = null;

  private escapeSqlString(value: string): string {
    return value.replace(/'/g, "''");
  }

  async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (Platform.OS === "web") {
      throw new Error("SQLite with assetSource not supported on web");
    }

    if (this.db) return this.db;
    if (this.initializing) return this.initializing;

    this.initializing = (async (): Promise<SQLite.SQLiteDatabase> => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("SQLITE_INIT_TIMEOUT")), 60000);
        });

        const initPromise = (async (): Promise<SQLite.SQLiteDatabase> => {
          console.log("📂 Initializing database...");
          const dbDir = `${FileSystem.documentDirectory}SQLite/`;
          const dbPath = `${dbDir}quran_v1.db`;

          const dirInfo = await FileSystem.getInfoAsync(dbDir);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
          }

          const fileInfo = await FileSystem.getInfoAsync(dbPath);
          if (!fileInfo.exists) {
            console.log("🚚 Preparing database asset...");
            const asset = Asset.fromModule(require("../assets/data/quran_v1.db"));
            await asset.downloadAsync();
            if (!asset.localUri) throw new Error("ASSET_NOT_DOWNLOADED");

            await FileSystem.copyAsync({ from: asset.localUri, to: dbPath });
          }

          const finalInfo = await FileSystem.getInfoAsync(dbPath);
          if (finalInfo.exists && finalInfo.size === 0) {
            await FileSystem.deleteAsync(dbPath, { idempotent: true });
            throw new Error("DB_ZERO_BYTES");
          }

          const database = await SQLite.openDatabaseAsync("quran_v1.db");

          // Verify tables
          const tableCheck = await database.getFirstAsync<{ count: number }>(
            "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='ayahs'"
          );

          if (!tableCheck || tableCheck.count === 0) {
            await database.closeAsync();
            await FileSystem.deleteAsync(dbPath, { idempotent: true });
            throw new Error("DATABASE_EMPTY_OR_CORRUPT");
          }

          console.log("✅ Database opened successfully");
          await database.execAsync("PRAGMA foreign_keys = ON;");

          // User Progress Tables
          await database.execAsync(`
            CREATE TABLE IF NOT EXISTS surah_completions (
              surah_id INTEGER PRIMARY KEY,
              completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS daily_activity (
              date TEXT PRIMARY KEY,
              ayahs_read_count INTEGER DEFAULT 0,
              last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS on_demand_translations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              surah_id INTEGER NOT NULL,
              ayah_number INTEGER NOT NULL,
              language_code TEXT NOT NULL,
              text TEXT NOT NULL,
              UNIQUE(surah_id, ayah_number, language_code)
            );
            CREATE INDEX IF NOT EXISTS idx_translations_surah_lang ON on_demand_translations (surah_id, language_code);
          `);

          return database;
        })();

        this.db = await Promise.race([initPromise, timeoutPromise]);
        return this.db;
      } catch (error) {
        console.error("❌ SQLITE_INIT_ERROR:", error);
        this.initializing = null;
        throw error;
      }
    })();

    return this.initializing;
  }

  private mapToAyah(row: DatabaseAyah): Ayah {
    return {
      id: `${row.surah_id}:${row.ayah_number}`,
      surahId: row.surah_id,
      ayahNumber: row.ayah_number,
      arabic: row.arabic,
      translations: {
        en: row.english,
        ne: row.nepali,
        bn: row.bangla,
        hi: row.hindi,
      },
      tajweed: row.arabic_tajweed ?? undefined,
    };
  }

  async getAyahsBySurah(surahId: number): Promise<Ayah[]> {
    if (Platform.OS === "web") return [];
    try {
      const db = await this.getDb();
      const rows = await db.getAllAsync<DatabaseAyah>(
        "SELECT * FROM ayahs WHERE surah_id = ? ORDER BY ayah_number ASC",
        [surahId]
      );
      return rows.map((row) => this.mapToAyah(row));
    } catch (error) {
      console.warn(`⚠️ Failed to fetch ayahs for surah ${surahId}:`, error);
      return [];
    }
  }

  async searchAyahs(query: string): Promise<(Ayah & { surahName: string })[]> {
    if (Platform.OS === "web") return [];
    try {
      const db = await this.getDb();
      const sanitizedQuery = query.replace(/["*]/g, " ").trim();
      if (!sanitizedQuery) return [];

      const rows = await db.getAllAsync<DatabaseAyah>(
        `SELECT a.*, s.name_english as surah_name 
         FROM ayahs_fts f
         JOIN ayahs a ON f.rowid = a.id
         JOIN surahs s ON a.surah_id = s.id
         WHERE ayahs_fts MATCH ?
         ORDER BY rank
         LIMIT 50`,
        [`${sanitizedQuery}*`]
      );

      return rows.map((row) => ({
        ...this.mapToAyah(row),
        surahName: row.surah_name ?? "Unknown Surah",
      }));
    } catch (error) {
      console.warn("⚠️ Search failed:", error);
      return [];
    }
  }

  async getAyah(surahId: number, ayahNumber: number): Promise<Ayah | undefined> {
    if (Platform.OS === "web") return undefined;
    try {
      const db = await this.getDb();
      const row = await db.getFirstAsync<DatabaseAyah>(
        "SELECT * FROM ayahs WHERE surah_id = ? AND ayah_number = ?",
        [surahId, ayahNumber]
      );
      return row ? this.mapToAyah(row) : undefined;
    } catch (error) {
      return undefined;
    }
  }

  async markSurahComplete(surahId: number): Promise<void> {
    if (Platform.OS === "web") return;
    try {
      const db = await this.getDb();
      await db.runAsync(
        "INSERT OR REPLACE INTO surah_completions (surah_id, completed_at) VALUES (?, CURRENT_TIMESTAMP)",
        [surahId]
      );
    } catch (e) {
      console.warn("⚠️ Failed to mark surah complete:", e);
    }
  }

  async unmarkSurahComplete(surahId: number): Promise<void> {
    if (Platform.OS === "web") return;
    try {
      const db = await this.getDb();
      await db.runAsync("DELETE FROM surah_completions WHERE surah_id = ?", [surahId]);
    } catch (e) {
      console.warn("⚠️ Failed to unmark surah complete:", e);
    }
  }

  async getCompletedSurahIds(): Promise<number[]> {
    if (Platform.OS === "web") return [];
    try {
      const db = await this.getDb();
      const rows = await db.getAllAsync<{ surah_id: number }>("SELECT surah_id FROM surah_completions");
      return rows.map((r) => r.surah_id);
    } catch (e) {
      console.warn("⚠️ Failed to fetch completed surahs:", e);
      return [];
    }
  }

  async isSurahCompletedToday(surahId: number): Promise<boolean> {
    if (Platform.OS === "web") return false;
    try {
      const db = await this.getDb();
      const row = await db.getFirstAsync<{ count: number }>(
        "SELECT count(*) as count FROM surah_completions WHERE surah_id = ? AND date(completed_at) = date('now')",
        [surahId]
      );
      return (row?.count ?? 0) > 0;
    } catch (e) {
      return false;
    }
  }

  async saveOnDemandTranslation(
    surahId: number,
    ayahNumber: number,
    langCode: string,
    text: string
  ): Promise<void> {
    if (Platform.OS === "web") return;
    try {
      const db = await this.getDb();
      await db.runAsync(
        "INSERT OR REPLACE INTO on_demand_translations (surah_id, ayah_number, language_code, text) VALUES (?, ?, ?, ?)",
        [surahId, ayahNumber, langCode, text]
      );
    } catch (e) {
      console.warn("⚠️ Failed to save translation:", e);
      throw e;
    }
  }

  async saveOnDemandTranslationsBatch(
    translations: { surahId: number; ayahNumber: number; langCode: string; text: string }[]
  ): Promise<void> {
    if (Platform.OS === "web") return;
    if (translations.length === 0) return;
    try {
      const db = await this.getDb();
      await db.withExclusiveTransactionAsync(async () => {
        const batchSize = 250;

        for (let i = 0; i < translations.length; i += batchSize) {
          const batch = translations.slice(i, i + batchSize);
          const values = batch
            .map((t) =>
              `(${t.surahId},${t.ayahNumber},'${this.escapeSqlString(t.langCode)}','${this.escapeSqlString(t.text)}')`
            )
            .join(",");

          await db.execAsync(
            `INSERT OR REPLACE INTO on_demand_translations (surah_id, ayah_number, language_code, text) VALUES ${values};`
          );
        }
      });
    } catch (e) {
      console.warn("⚠️ Failed to batch save translations:", e);
      throw e;
    }
  }

  async getOnDemandTranslations(surahId: number, langCode: string): Promise<Record<number, string>> {
    if (Platform.OS === "web") return {};
    try {
      const db = await this.getDb();
      const rows = await db.getAllAsync<{ ayah_number: number; text: string }>(
        "SELECT ayah_number, text FROM on_demand_translations WHERE surah_id = ? AND language_code = ?",
        [surahId, langCode]
      );
      const result: Record<number, string> = {};
      rows.forEach((row) => {
        result[row.ayah_number] = row.text;
      });
      return result;
    } catch (e) {
      console.warn("⚠️ Failed to fetch on-demand translations:", e);
      return {};
    }
  }

  async deleteOnDemandTranslation(langCode: string): Promise<void> {
    if (Platform.OS === "web") return;
    try {
      const db = await this.getDb();
      await db.runAsync("DELETE FROM on_demand_translations WHERE language_code = ?", [langCode]);
    } catch (e) {
      console.warn("⚠️ Failed to delete translation:", e);
    }
  }
}

export const dbService = new QuranDatabase();
