import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import type { Ayah } from "@/data/ayahs";

export interface DatabaseAyah {
  id: number;
  surah_id: number;
  ayah_number: number;
  arabic: string;
  english: string;
  nepali: string;
  bangla: string;
  surah_name?: string; // Optional for search results
}

class QuranDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private initializing: Promise<SQLite.SQLiteDatabase> | null = null;

  async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (Platform.OS === "web") {
      throw new Error("SQLite with assetSource not supported on web");
    }

    if (this.db) return this.db;
    
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("SQLITE_INIT_TIMEOUT")), 10000);
        });

        const initPromise = (async () => {
          const options: any = {
            assetSource: require("../assets/data/quran_v1.db"),
          };
          console.log("📂 Opening database: quran_v1.db...");
          const db = await SQLite.openDatabaseAsync("quran_v1.db", options);
          
          // Verify table existence
          const tableCheck = await db.getFirstAsync<{ count: number }>(
            "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='ayahs'"
          );
          
          if (!tableCheck || tableCheck.count === 0) {
            throw new Error("DATABASE_EMPTY_OR_CORRUPT: 'ayahs' table missing");
          }

          console.log("✅ Database opened successfully");
          // Ensure foreign keys are enabled
          await db.execAsync("PRAGMA foreign_keys = ON;");
          return db;
        })();

        this.db = (await Promise.race([initPromise, timeoutPromise])) as SQLite.SQLiteDatabase;
        return this.db;
      } catch (error) {
        console.error("❌ SQLITE_INIT_ERROR:", error);
        // Reset so that next attempt can try again
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
      },
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
      return []; // Return empty so the caller can fall back to remote
    }
  }

  async searchAyahs(query: string): Promise<(Ayah & { surahName: string })[]> {
    if (Platform.OS === "web") return [];
    try {
      const db = await this.getDb();
      // Use FTS5 MATCH with proper escaping for user query
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
      console.warn(`⚠️ Failed to get specific ayah ${surahId}:${ayahNumber}:`, error);
      return undefined;
    }
  }
}

export const dbService = new QuranDatabase();
