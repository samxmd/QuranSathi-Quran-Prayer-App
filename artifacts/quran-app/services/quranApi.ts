import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Ayah } from "@/data/ayahs";
import { getOfflineSurahAyahs } from "@/data/offlineQuranLoader";
import { SURAHS } from "@/data/surahs";
import { trackError } from "@/services/telemetry";
import {
  DEFAULT_ENABLED_LANGUAGES,
  TRANSLATION_SOURCES,
  type TranslationLanguage,
} from "@/services/translationSources";

const memoryCache = new Map<number, Ayah[]>();
const inflightRequests = new Map<number, Promise<Ayah[]>>();
const CACHE_VERSION = 4;
const MAX_PERSISTED_SURAHS = 24;
const ALQURAN_BASE = "https://api.alquran.cloud/v1";
const QURAN_COM_BASE = "https://api.quran.com/api/v4";
const CONFIGURED_LANGUAGES = Object.keys(TRANSLATION_SOURCES).sort() as TranslationLanguage[];
const REMOTE_TRANSLATION_LANGUAGES = CONFIGURED_LANGUAGES.filter(
  (language) => language !== "en"
) as Exclude<TranslationLanguage, "en">[];

type CachedAyahOverlay = {
  id: string;
  arabic?: string;
  translations: Partial<Record<TranslationLanguage, string>>;
};

type CachedSurahPayload = {
  savedAt: number;
  overlay: CachedAyahOverlay[];
};

function getCacheKeyPrefix(): string {
  return `@quran_surah_v${CACHE_VERSION}_`;
}

function getCacheKey(surahId: number): string {
  return `${getCacheKeyPrefix()}${surahId}_${CONFIGURED_LANGUAGES.join("_")}`;
}

async function getBundledSurahAyahs(surahId: number): Promise<Ayah[]> {
  const surah = SURAHS.find((item) => item.id === surahId);
  const bundled = await getOfflineSurahAyahs(surahId);

  if (!surah) {
    throw new Error(`Unknown surah ${surahId}`);
  }

  if (bundled.length === 0) {
    return [];
  }

  return bundled;
}

function sanitizeTranslationText(text: string | undefined): string {
  return (text ?? "")
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function fetchAlQuranCloud(surahId: number): Promise<{ arabic: string; english: string }[]> {
  const englishEdition = TRANSLATION_SOURCES.en.edition;
  const response = await fetch(`${ALQURAN_BASE}/surah/${surahId}/editions/quran-uthmani,${englishEdition}`);

  if (!response.ok) {
    throw new Error(`AlQuran Cloud request failed for surah ${surahId}`);
  }

  const json = await response.json();
  const editions = json?.data;
  if (!Array.isArray(editions) || editions.length < 2) {
    throw new Error(`Unexpected AlQuran Cloud response for surah ${surahId}`);
  }

  const arabicAyahs = editions[0]?.ayahs ?? [];
  const englishAyahs = editions[1]?.ayahs ?? [];

  if (arabicAyahs.length !== englishAyahs.length) {
    throw new Error(`Mismatched AlQuran Cloud editions for surah ${surahId}`);
  }

  return arabicAyahs.map((ayah: any, index: number) => ({
    arabic: ayah?.text ?? "",
    english: englishAyahs[index]?.text ?? "",
  }));
}

async function fetchQuranComTranslations(
  surahId: number
): Promise<Map<string, Record<Exclude<TranslationLanguage, "en">, string>>> {
  const ids = REMOTE_TRANSLATION_LANGUAGES.map(
    (language) => (TRANSLATION_SOURCES[language] as { api: string; id: number }).id
  ).join(",");

  const url = `${QURAN_COM_BASE}/verses/by_chapter/${surahId}?translations=${ids}&fields=verse_key&per_page=300`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Quran.com verses request failed for surah ${surahId}`);
  }

  const json = await response.json();
  const verses = Array.isArray(json?.verses) ? json.verses : [];

  // Build a map: verse_key -> { ne: string, bn: string, ... }
  const result = new Map<string, Record<Exclude<TranslationLanguage, "en">, string>>();

  for (const verse of verses) {
    const verseKey: string = verse.verse_key ?? "";
    if (!verseKey) continue;

    const translationsByResourceId = new Map<number, string>();
    for (const t of (verse.translations ?? [])) {
      translationsByResourceId.set(t.resource_id, sanitizeTranslationText(t.text));
    }

    const entry = REMOTE_TRANSLATION_LANGUAGES.reduce(
      (acc, language) => {
        const source = TRANSLATION_SOURCES[language] as { api: string; id: number };
        acc[language] = translationsByResourceId.get(source.id) ?? "";
        return acc;
      },
      {} as Record<Exclude<TranslationLanguage, "en">, string>
    );

    result.set(verseKey, entry);
  }

  return result;
}

async function fetchRemoteSurahAyahs(surahId: number): Promise<Ayah[]> {
  const [alquranData, allTranslations] = await Promise.all([
    fetchAlQuranCloud(surahId),
    fetchQuranComTranslations(surahId),
  ]);

  return alquranData.map((item, index) => {
    const ayahNumber = index + 1;
    const verseKey = `${surahId}:${ayahNumber}`;
    const verseTranslations = allTranslations.get(verseKey);

    const translations = CONFIGURED_LANGUAGES.reduce(
      (acc, language) => {
        if (language === "en") {
          acc.en = item.english;
        } else {
          acc[language] = verseTranslations?.[language as Exclude<TranslationLanguage, "en">] ?? "";
        }
        return acc;
      },
      {} as Record<string, string>
    );

    return {
      id: verseKey,
      surahId,
      ayahNumber,
      arabic: item.arabic,
      translations,
    };
  });
}

function mergeWithFallback(remoteAyahs: Ayah[], fallbackAyahs: Ayah[]): Ayah[] {
  const fallbackById = new Map(fallbackAyahs.map((ayah) => [ayah.id, ayah]));

  return remoteAyahs.map((ayah) => {
    const fallback = fallbackById.get(ayah.id);
    return {
      ...ayah,
      translations: {
        ...fallback?.translations,
        ...ayah.translations,
      },
    };
  });
}

function ensureTranslationKeys(ayahs: Ayah[]): Ayah[] {
  return ayahs.map((ayah) => ({
    ...ayah,
    translations: CONFIGURED_LANGUAGES.reduce(
      (acc, language) => {
        acc[language] = ayah.translations[language] ?? "";
        return acc;
      },
      {} as Record<string, string>
    ),
  }));
}

function createRemoteOverlay(remoteAyahs: Ayah[], fallbackAyahs: Ayah[]): CachedAyahOverlay[] {
  const fallbackById = new Map(fallbackAyahs.map((ayah) => [ayah.id, ayah]));

  return remoteAyahs.flatMap((ayah) => {
    const fallback = fallbackById.get(ayah.id);
    const translations = CONFIGURED_LANGUAGES.reduce(
      (acc, language) => {
        const remoteText = ayah.translations[language] ?? "";
        const fallbackText = fallback?.translations[language] ?? "";

        if (remoteText && remoteText !== fallbackText) {
          acc[language] = remoteText;
        }

        return acc;
      },
      {} as Partial<Record<TranslationLanguage, string>>
    );

    const arabic = ayah.arabic !== fallback?.arabic ? ayah.arabic : undefined;

    if (!arabic && Object.keys(translations).length === 0) {
      return [];
    }

    return [
      {
        id: ayah.id,
        arabic,
        translations,
      },
    ];
  });
}

function applyRemoteOverlay(ayahs: Ayah[], overlay: CachedAyahOverlay[]): Ayah[] {
  if (ayahs.length === 0) {
    // If we have no bundled base (e.g. on Web where SQLite is skipped),
    // we must reconstruct the entire array from the complete overlay.
    return overlay.map((patch) => {
      const [surahIdStr, ayahNumStr] = patch.id.split(":");
      return {
        id: patch.id,
        surahId: Number(surahIdStr),
        ayahNumber: Number(ayahNumStr),
        arabic: patch.arabic ?? "",
        translations: CONFIGURED_LANGUAGES.reduce(
          (acc, language) => {
            acc[language] = patch.translations[language] ?? "";
            return acc;
          },
          {} as Record<string, string>
        ),
      };
    });
  }

  const overlayById = new Map(overlay.map((item) => [item.id, item]));

  return ayahs.map((ayah) => {
    const patch = overlayById.get(ayah.id);
    if (!patch) {
      return ayah;
    }

    return {
      ...ayah,
      arabic: patch.arabic ?? ayah.arabic,
      translations: CONFIGURED_LANGUAGES.reduce(
        (acc, language) => {
          acc[language] = patch.translations[language] ?? ayah.translations[language] ?? "";
          return acc;
        },
        {} as Record<string, string>
      ),
    };
  });
}

async function loadFromStorage(surahId: number, bundledAyahs: Ayah[]): Promise<Ayah[] | null> {
  const cached = await AsyncStorage.getItem(getCacheKey(surahId)).catch(() => null);
  if (!cached) return null;

  try {
    const parsed = JSON.parse(cached) as CachedSurahPayload;
    const overlay = Array.isArray(parsed?.overlay) ? parsed.overlay : [];
    return ensureTranslationKeys(applyRemoteOverlay(bundledAyahs, overlay));
  } catch {
    return null;
  }
}

async function pruneStoredSurahs(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys().catch(() => []);
  const cacheKeys = keys.filter((key) => key.startsWith(getCacheKeyPrefix()));

  if (cacheKeys.length <= MAX_PERSISTED_SURAHS) {
    return;
  }

  const cachedEntries = await AsyncStorage.multiGet(cacheKeys).catch(() => []);
  const keysToRemove = cachedEntries
    .map(([key, value]) => {
      try {
        const parsed = JSON.parse(value ?? "") as CachedSurahPayload;
        return { key, savedAt: parsed?.savedAt ?? 0 };
      } catch {
        return { key, savedAt: 0 };
      }
    })
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(MAX_PERSISTED_SURAHS)
    .map((item) => item.key);

  if (keysToRemove.length > 0) {
    await AsyncStorage.multiRemove(keysToRemove).catch(() => {});
  }
}

async function saveToStorage(
  surahId: number,
  remoteAyahs: Ayah[],
  bundledAyahs: Ayah[]
): Promise<void> {
  const payload: CachedSurahPayload = {
    savedAt: Date.now(),
    overlay: createRemoteOverlay(remoteAyahs, bundledAyahs),
  };

  await AsyncStorage.setItem(getCacheKey(surahId), JSON.stringify(payload)).catch(() => {});
  await pruneStoredSurahs();
}

async function refreshSurahAyahsInternal(surahId: number): Promise<Ayah[]> {
  let bundledAyahs: Ayah[] = [];
  try {
    bundledAyahs = await getBundledSurahAyahs(surahId);
  } catch (err) {
    console.warn(`⚠️ refreshSurahAyahsInternal: Bundled data load failed for surah ${surahId}:`, err);
  }

  const remoteAyahs = await fetchRemoteSurahAyahs(surahId);
  const merged = ensureTranslationKeys(mergeWithFallback(remoteAyahs, bundledAyahs));

  memoryCache.set(surahId, merged);
  await saveToStorage(surahId, remoteAyahs, bundledAyahs);
  return merged;
}

export async function fetchSurahAyahs(surahId: number): Promise<Ayah[]> {
  // 1. Try memory cache first (fastest)
  if (memoryCache.has(surahId)) {
    return memoryCache.get(surahId)!;
  }

  // 2. Load bundled data from SQLite (always needed for the base)
  let bundledAyahs: Ayah[] = [];
  try {
    bundledAyahs = ensureTranslationKeys(await getBundledSurahAyahs(surahId));
  } catch (err) {
    console.warn(`⚠️ fetchSurahAyahs: Bundled data load failed for surah ${surahId}:`, err);
  }

  // 3. Try storage cache (the "overlay" patches)
  const cached = await loadFromStorage(surahId, bundledAyahs);
  if (cached) {
    memoryCache.set(surahId, cached);
    return cached;
  }

  // 4. If we have bundled data but no cached overlay, return bundled immediately
  // and trigger a remote fetch in the background to update the cache.
  if (bundledAyahs.length > 0) {
    memoryCache.set(surahId, bundledAyahs);
    
    // Background refresh: don't await, don't block
    refreshSurahAyahsInternal(surahId).catch((err) => {
      console.log(`Background refresh failed for surah ${surahId} (offline contents used)`);
    });

    return bundledAyahs;
  }

  // 5. If NO bundled data (e.g. build issue) and NO cache, we MUST wait for network
  if (inflightRequests.has(surahId)) {
    return inflightRequests.get(surahId)!;
  }

  const request = refreshSurahAyahsInternal(surahId)
    .catch((error) => {
      trackError("quran_api.fetch_surah_failed", error, {
        surahId,
        mode: "fetch",
      }).catch(() => {});

      // Fallback to whatever bundled data we could get (even if empty)
      memoryCache.set(surahId, bundledAyahs);
      return bundledAyahs;
    })
    .finally(() => {
      inflightRequests.delete(surahId);
    });

  inflightRequests.set(surahId, request);
  return request;
}

export async function refreshSurahAyahs(surahId: number): Promise<Ayah[]> {
  inflightRequests.delete(surahId);
  return refreshSurahAyahsInternal(surahId);
}

export function prefetchSurahAyahs(surahId: number): void {
  if (memoryCache.has(surahId) || inflightRequests.has(surahId)) {
    return;
  }

  // For prefetching, we only want to load from STORAGE/SQLITE into MEMORY.
  // We do NOT want to hit the network during prefetch to save battery and bandwidth.
  const task = (async () => {
    let bundledAyahs: Ayah[] = [];
    try {
      bundledAyahs = ensureTranslationKeys(await getBundledSurahAyahs(surahId));
    } catch {}

    const cached = await loadFromStorage(surahId, bundledAyahs);
    if (cached) {
      memoryCache.set(surahId, cached);
    } else if (bundledAyahs.length > 0) {
      memoryCache.set(surahId, bundledAyahs);
    }
  })();

  // We don't track this in inflightRequests because it's non-critical
  // and doesn't return a value.
}

export async function clearSurahCache(surahId?: number): Promise<void> {
  if (surahId !== undefined) {
    memoryCache.delete(surahId);
    inflightRequests.delete(surahId);
    await AsyncStorage.removeItem(getCacheKey(surahId)).catch(() => {});
    return;
  }

  memoryCache.clear();
  inflightRequests.clear();

  const keys = await AsyncStorage.getAllKeys().catch(() => []);
  const cacheKeys = keys.filter((key) => key.startsWith(getCacheKeyPrefix()));
  if (cacheKeys.length > 0) {
    await AsyncStorage.multiRemove(cacheKeys).catch(() => {});
  }
}

export function getDefaultEnabledLanguages(): TranslationLanguage[] {
  return [...DEFAULT_ENABLED_LANGUAGES];
}
