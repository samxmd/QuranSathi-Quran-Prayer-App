import { dbService } from "./database";

const ALQURAN_BASE = "https://api.alquran.cloud/v1";
const EDITIONS_CACHE_KEY = "quran_translation_editions_cache_v1";
const EDITIONS_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const TOTAL_SURAHS = 114;
const REQUEST_TIMEOUT_MS = 30000;
const WHOLE_EDITION_TIMEOUT_MS = 60000;
const CATALOG_TIMEOUT_MS = 8000;
const SURAH_DOWNLOAD_DELAY_MS = 120;

export interface TranslationEdition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
}

export type DownloadProgressCallback = (progress: number) => void;

export type TranslationDownloadResult = {
  success: boolean;
  errorMessage?: string;
};

type EditionsCachePayload = {
  savedAt: number;
  editions: TranslationEdition[];
};

type FetchAvailableEditionsOptions = {
  allowNetwork?: boolean;
};

type TranslationAyahPayload = {
  numberInSurah?: number;
  text?: string;
};

type TranslationSurahPayload = {
  number?: number;
  ayahs?: TranslationAyahPayload[];
};

class TranslationDownloadService {
  private editionsCache: TranslationEdition[] | null = null;
  private editionsCacheExpiresAt = 0;

  private getErrorMessage(error: unknown): string {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "The translation download timed out. Please try again on a stable connection.";
    }

    const message = error instanceof Error ? error.message : String(error);

    if (/status 429/.test(message)) {
      return "The translation server is rate-limiting requests. Please wait a moment and try again.";
    }

    if (/status 5\d\d/.test(message)) {
      return "The translation server is temporarily unavailable. Please try again later.";
    }

    if (/status 4\d\d/.test(message)) {
      return "This translation is not available from the server right now.";
    }

    if (/network request failed|failed to fetch|unable to connect|internet|connection/i.test(message)) {
      return "Could not reach the translation server. Please check your connection and try again.";
    }

    if (/Invalid .*response|Invalid data format|No ayahs/.test(message)) {
      return "The translation server returned unexpected data. Please try another translation or try again later.";
    }

    if (/SQLITE|database|on_demand_translations/i.test(message)) {
      return "The translation downloaded, but could not be saved on this device. Please free some storage and try again.";
    }

    return "Something went wrong while downloading this translation. Please try again.";
  }

  private async fetchJson<T>(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async readCachedEditions(): Promise<TranslationEdition[] | null> {
    const now = Date.now();
    if (this.editionsCache && now < this.editionsCacheExpiresAt) {
      return this.editionsCache;
    }

    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    const cachedRaw = await AsyncStorage.getItem(EDITIONS_CACHE_KEY).catch(() => null);
    if (!cachedRaw) return null;

    try {
      const cached = JSON.parse(cachedRaw) as EditionsCachePayload;
      if (Array.isArray(cached?.editions) && now - (cached.savedAt ?? 0) < EDITIONS_CACHE_TTL_MS) {
        this.editionsCache = cached.editions;
        this.editionsCacheExpiresAt = cached.savedAt + EDITIONS_CACHE_TTL_MS;
        return cached.editions;
      }
    } catch {
      // Ignore cache parse issues and fetch fresh data when network is allowed.
    }

    return null;
  }

  async fetchAvailableEditions(options: FetchAvailableEditionsOptions = {}): Promise<TranslationEdition[]> {
    try {
      const { allowNetwork = true } = options;
      const now = Date.now();

      const cachedEditions = await this.readCachedEditions();
      if (cachedEditions) {
        return cachedEditions;
      }

      if (!allowNetwork) {
        return [];
      }

      const json = await this.fetchJson<{ data?: TranslationEdition[] }>(
        `${ALQURAN_BASE}/edition?format=text&type=translation`,
        CATALOG_TIMEOUT_MS
      );
      const editions = Array.isArray(json.data) ? json.data : [];

      this.editionsCache = editions;
      this.editionsCacheExpiresAt = now + EDITIONS_CACHE_TTL_MS;
      const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
      AsyncStorage.setItem(
        EDITIONS_CACHE_KEY,
        JSON.stringify({ savedAt: now, editions })
      ).catch(() => {});

      return editions;
    } catch (error) {
      console.error("Failed to fetch editions:", error);
      return [];
    }
  }

  async downloadEdition(
    editionIdentifier: string,
    onProgress?: DownloadProgressCallback
  ): Promise<TranslationDownloadResult> {
    try {
      onProgress?.(0.02);
      const chunkSize = 500;
      let processedAyahs = 0;
      let pendingChunk: { surahId: number; ayahNumber: number; langCode: string; text: string }[] = [];

      const savePendingChunk = async () => {
        if (pendingChunk.length === 0) return;
        await dbService.saveOnDemandTranslationsBatch(pendingChunk);
        processedAyahs += pendingChunk.length;
        pendingChunk = [];
      };

      const collectSurah = async (surah: TranslationSurahPayload, fallbackSurahId?: number) => {
        const surahId = surah.number ?? fallbackSurahId;
        if (!surahId || !Array.isArray(surah.ayahs)) {
          throw new Error(`Invalid data format for surah ${fallbackSurahId ?? "unknown"}`);
        }

        for (const ayah of surah.ayahs) {
          if (typeof ayah.numberInSurah !== "number") continue;

          pendingChunk.push({
            surahId,
            ayahNumber: ayah.numberInSurah,
            langCode: editionIdentifier,
            text: ayah.text ?? "",
          });

          if (pendingChunk.length >= chunkSize) {
            await savePendingChunk();
          }
        }
      };

      try {
        const json = await this.fetchJson<{
          data?: {
            surahs?: TranslationSurahPayload[];
          };
        }>(`${ALQURAN_BASE}/quran/${editionIdentifier}`, WHOLE_EDITION_TIMEOUT_MS);
        const surahs = json.data?.surahs;

        if (!Array.isArray(surahs) || surahs.length === 0) {
          throw new Error("Invalid full-edition response");
        }

        for (let index = 0; index < surahs.length; index += 1) {
          await collectSurah(surahs[index], index + 1);
          onProgress?.(Math.min(0.98, 0.02 + (0.96 * ((index + 1) / TOTAL_SURAHS))));
        }

        await savePendingChunk();
      } catch (fullEditionError) {
        console.warn(`Full edition download failed for ${editionIdentifier}; falling back to surah downloads:`, fullEditionError);

        processedAyahs = 0;
        pendingChunk = [];

        for (let surahId = 1; surahId <= TOTAL_SURAHS; surahId += 1) {
          const json = await this.fetchJson<{
            data?: TranslationSurahPayload;
          }>(`${ALQURAN_BASE}/surah/${surahId}/${editionIdentifier}`);
          const surah = json.data;

          await collectSurah(surah ?? {}, surahId);

          onProgress?.(Math.min(0.98, 0.02 + (0.96 * (surahId / TOTAL_SURAHS))));

          if (surahId < TOTAL_SURAHS) {
            await this.delay(SURAH_DOWNLOAD_DELAY_MS);
          }
        }

        await savePendingChunk();
      }

      if (processedAyahs === 0) {
        throw new Error("No ayahs were downloaded");
      }
      
      onProgress?.(1.0);
      return { success: true };
    } catch (error) {
      console.error(`Failed to download edition ${editionIdentifier}:`, error);
      return { success: false, errorMessage: this.getErrorMessage(error) };
    }
  }

  async removeEdition(editionIdentifier: string): Promise<void> {
    await dbService.deleteOnDemandTranslation(editionIdentifier);
  }
}

export const translationDownloadService = new TranslationDownloadService();
