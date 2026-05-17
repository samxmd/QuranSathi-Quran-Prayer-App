import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { Ayah, Word } from "@/data/ayahs";
import { getOfflineSurahAyahs } from "@/data/offlineQuranLoader";
import { SURAHS } from "@/data/surahs";
import {
  DEFAULT_ENABLED_LANGUAGES,
  TRANSLATION_SOURCES,
  type TranslationLanguage,
} from "@/services/translationSources";
import { dbService } from "@/services/database";

const memoryCache = new Map<string, Ayah[]>();
const inflightRequests = new Map<string, Promise<Ayah[]>>();
const CACHE_VERSION = 7;
const MAX_PERSISTED_SURAHS = 24;
const REMOTE_REFRESH_TTL_MS = 1000 * 60 * 60 * 12;
const REMOTE_REQUEST_TIMEOUT_MS = 12000;
const ALQURAN_BASE = "https://api.alquran.cloud/v1";
const QURAN_COM_BASE = "https://api.quran.com/api/v4";
const CONFIGURED_LANGUAGES = Object.keys(TRANSLATION_SOURCES).sort() as TranslationLanguage[];
const REMOTE_TRANSLATION_LANGUAGES = CONFIGURED_LANGUAGES.filter(
  (language) => language !== "en"
) as Exclude<TranslationLanguage, "en">[];
const BUNDLED_TRANSLATION_LANGUAGES = new Set(["en", "ne", "bn", "hi"]);

type CachedAyahOverlay = {
  id: string;
  arabic?: string;
  tajweed?: string;
  transliteration?: string;
  translations: Partial<Record<TranslationLanguage, string>>;
};

// Known typo corrections for the nep-ahlalhadithcent API source.
const NEPALI_CORRECTIONS: Record<string, [string, string]> = {
  "1:1": ["शुर गर्दछु", "शुरू गर्दछु"],
  "16:105": ["गर्दछन जसलाई", "गर्दछन् जसलाई"],
};

function applyNepaliCorrections(surahId: number, verseNumber: number, text: string): string {
  if (!text) return text;
  let corrected = text;

  // Global cleanups for Legacy Preeti-to-Unicode conversion artifacts
  corrected = corrected.replace(/Þ/g, "़");
  corrected = corrected.replace(/आपूmलाई/g, "आफूलाई");
  corrected = corrected.replace(/आप्mना/g, "आफ्ना");
  corrected = corrected.replace(/भूmठ्लाए/g, "झुठ्लाए");
  corrected = corrected.replace(/फुपूm/g, "फुपू");
  corrected = corrected.replace(/पि़mरऔन/g, "फ़िरऔन");

  const key = `${surahId}:${verseNumber}`;
  const exactCorrection = NEPALI_CORRECTIONS[key];
  if (exactCorrection) {
    corrected = corrected.replace(exactCorrection[0], exactCorrection[1]);
  }
  return corrected;
}

type CachedSurahPayload = {
  savedAt: number;
  overlay: CachedAyahOverlay[];
};

function getCacheKeyPrefix(): string {
  return `@quran_surah_v${CACHE_VERSION}_`;
}

function getWordsCacheKey(ayahKey: string): string {
  return `@quran_words_v${CACHE_VERSION}_${ayahKey}`;
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
    .replace(/^[\d\u0966-\u096F]+[.)।\-\s]+/, "")
    .trim();
}

async function fetchWithTimeout(url: string, timeoutMs = REMOTE_REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchAlQuranCloud(surahId: number): Promise<{ arabic: string; english: string }[]> {
  const englishEdition = TRANSLATION_SOURCES.en.edition;
  const response = await fetchWithTimeout(`${ALQURAN_BASE}/surah/${surahId}/editions/quran-uthmani,${englishEdition}`);

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
    english: sanitizeTranslationText(englishAyahs[index]?.text ?? ""),
  }));
}

async function fetchOnDemandSurahTranslation(
  surahId: number,
  editionIdentifier: string
): Promise<Record<number, string>> {
  const response = await fetchWithTimeout(`${ALQURAN_BASE}/surah/${surahId}/${editionIdentifier}`);

  if (!response.ok) {
    throw new Error(`AlQuran Cloud translation request failed for ${editionIdentifier} surah ${surahId}`);
  }

  const json = await response.json();
  const ayahs = json?.data?.ayahs;
  if (!Array.isArray(ayahs)) {
    throw new Error(`Unexpected translation response for ${editionIdentifier} surah ${surahId}`);
  }

  const rows = ayahs
    .filter((ayah: any) => typeof ayah?.numberInSurah === "number")
    .map((ayah: any) => ({
      surahId,
      ayahNumber: ayah.numberInSurah,
      langCode: editionIdentifier,
      text: sanitizeTranslationText(ayah?.text ?? ""),
    }));

  if (rows.length > 0) {
    await dbService.saveOnDemandTranslationsBatch(rows);
  }

  return rows.reduce((acc, row) => {
    acc[row.ayahNumber] = row.text;
    return acc;
  }, {} as Record<number, string>);
}

function getOnDemandLanguages(enabledLanguageCodes: string[]): string[] {
  return enabledLanguageCodes.filter(
    lang => !BUNDLED_TRANSLATION_LANGUAGES.has(lang)
  );
}

async function mergeOnDemandTranslations(
  surahId: number,
  ayahs: Ayah[],
  enabledLanguageCodes: string[],
  options: { repairMissing?: boolean } = {}
): Promise<Ayah[]> {
  const onDemandLanguages = getOnDemandLanguages(enabledLanguageCodes);
  if (onDemandLanguages.length === 0 || ayahs.length === 0) {
    return ayahs;
  }

  const { repairMissing = true } = options;
  const onDemandResults = await Promise.all(
    onDemandLanguages.map(async (lang) => {
      try {
        const storedTranslations = Platform.OS === "web"
          ? {}
          : await dbService.getOnDemandTranslations(surahId, lang);

        if (Object.keys(storedTranslations).length > 0) {
          return [lang, storedTranslations] as const;
        }

        if (repairMissing) {
          return [lang, await fetchOnDemandSurahTranslation(surahId, lang)] as const;
        }
      } catch (err) {
        console.warn(`⚠️ mergeOnDemandTranslations: Failed to load ${lang}:`, err);
      }

      return [lang, {}] as const;
    })
  );

  const translationsByLanguage = new Map(onDemandResults);
  return ayahs.map((ayah) => {
    const nextTranslations = { ...ayah.translations };

    onDemandLanguages.forEach((lang) => {
      const translations = translationsByLanguage.get(lang);
      if (translations && Object.keys(translations).length > 0) {
        nextTranslations[lang] = translations[ayah.ayahNumber] || "";
      }
    });

    return {
      ...ayah,
      translations: nextTranslations,
    };
  });
}

async function fetchRemoteTranslations(
  surahId: number
): Promise<{ 
  translations: Map<string, Record<Exclude<TranslationLanguage, "en">, string>>,
  transliterations: Map<string, string>,
  tajweedTexts: Map<string, string>
}> {
  // 1. Fetch from Quran.com for languages that use it
  const quranComLangs = REMOTE_TRANSLATION_LANGUAGES.filter(
    (l) => (TRANSLATION_SOURCES[l as keyof typeof TRANSLATION_SOURCES] as any).api === "quran.com"
  );
  
  const ids = quranComLangs.map((l) => (TRANSLATION_SOURCES[l as keyof typeof TRANSLATION_SOURCES] as any).id).join(",");
  const quranComUrl = `${QURAN_COM_BASE}/verses/by_chapter/${surahId}?translations=${ids}&fields=verse_key,transliteration,text_uthmani_tajweed&per_page=300`;
  const quranComResponse = await fetchWithTimeout(quranComUrl);
  
  if (!quranComResponse.ok) {
    throw new Error(`Quran.com verses request failed for surah ${surahId}`);
  }
  
  const json = await quranComResponse.json();
  const verses = Array.isArray(json?.verses) ? json.verses : [];

  // 2. Fetch from FawazAhmed for languages that use it
  const fawazLangs = REMOTE_TRANSLATION_LANGUAGES.filter(
    (l) => (TRANSLATION_SOURCES[l as keyof typeof TRANSLATION_SOURCES] as any).api === "fawazahmed0"
  );
  
  const fawazData = new Map<string, any[]>();
  for (const lang of fawazLangs) {
    const edition = (TRANSLATION_SOURCES[lang as keyof typeof TRANSLATION_SOURCES] as any).edition;
    const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/${edition}/${surahId}.min.json`;
    const res = await fetchWithTimeout(url).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      fawazData.set(lang, data.chapter || []);
    }
  }

  // Build the combined map
  const translationsMap = new Map<string, Record<Exclude<TranslationLanguage, "en">, string>>();
  const transliterationsMap = new Map<string, string>();
  const tajweedTextsMap = new Map<string, string>();

  for (let i = 0; i < verses.length; i++) {
    const verse = verses[i];
    const verseKey: string = verse.verse_key ?? `${surahId}:${i + 1}`;
    
    if (verse.transliteration) {
      transliterationsMap.set(verseKey, verse.transliteration);
    }
    if (typeof verse.text_uthmani_tajweed === "string" && verse.text_uthmani_tajweed.trim().length > 0) {
      tajweedTextsMap.set(verseKey, verse.text_uthmani_tajweed);
    }

    const translationsByResourceId = new Map<number, string>();
    for (const t of (verse.translations ?? [])) {
      translationsByResourceId.set(t.resource_id, sanitizeTranslationText(t.text));
    }

    const entry = REMOTE_TRANSLATION_LANGUAGES.reduce(
      (acc, language) => {
        const source = TRANSLATION_SOURCES[language as keyof typeof TRANSLATION_SOURCES] as any;
        let text = "";
        
        if (source.api === "quran.com") {
          text = translationsByResourceId.get(source.id) ?? "";
        } else if (source.api === "fawazahmed0") {
          const langData = fawazData.get(language);
          if (langData && langData[i]) {
            text = sanitizeTranslationText(langData[i].text);
          }
        }
        
        // Apply Nepali typo patches if the language is Nepali
        if (language === "ne") {
           const ayahNumMatch = verseKey.split(":")[1];
           if (ayahNumMatch) {
             text = applyNepaliCorrections(surahId, Number(ayahNumMatch), text);
           }
        }
        
        acc[language] = text;
        return acc;
      },
      {} as Record<Exclude<TranslationLanguage, "en">, string>
    );

    translationsMap.set(verseKey, entry);
  }

  return { translations: translationsMap, transliterations: transliterationsMap, tajweedTexts: tajweedTextsMap };
}

async function fetchRemoteSurahAyahs(surahId: number): Promise<Ayah[]> {
  const [alquranData, { translations: allTranslations, transliterations: allTransliterations, tajweedTexts }] = await Promise.all([
    fetchAlQuranCloud(surahId),
    fetchRemoteTranslations(surahId),
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
      tajweed: tajweedTexts.get(verseKey),
      transliteration: allTransliterations.get(verseKey),
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

function ensureTranslationKeys(ayahs: Ayah[], enabledLanguageCodes: string[] = []): Ayah[] {
  const requiredKeys = Array.from(new Set([...CONFIGURED_LANGUAGES, ...enabledLanguageCodes]));
  return ayahs.map((ayah) => {
    const translations = { ...ayah.translations };
    requiredKeys.forEach((key) => {
      if (!(key in translations)) {
        translations[key] = "";
      } else {
        translations[key] = sanitizeTranslationText(translations[key]);
      }
    });
    return {
      ...ayah,
      translations,
    };
  });
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
    const tajweed = ayah.tajweed !== fallback?.tajweed ? ayah.tajweed : undefined;
    const transliteration = ayah.transliteration !== fallback?.transliteration ? ayah.transliteration : undefined;

    if (!arabic && !tajweed && !transliteration && Object.keys(translations).length === 0) {
      return [];
    }

    return [
      {
        id: ayah.id,
        arabic,
        tajweed,
        transliteration,
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
        tajweed: patch.tajweed,
        transliteration: patch.transliteration,
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

    const mergedTranslations = { ...ayah.translations };
    Object.keys(patch.translations).forEach((lang) => {
      const key = lang as TranslationLanguage;
      mergedTranslations[key] = patch.translations[key] || mergedTranslations[key] || "";
    });

    return {
      ...ayah,
      arabic: patch.arabic ?? ayah.arabic,
      tajweed: patch.tajweed ?? ayah.tajweed,
      transliteration: patch.transliteration ?? ayah.transliteration,
      translations: mergedTranslations,
    };
  });
}

async function loadFromStorage(
  surahId: number,
  bundledAyahs: Ayah[]
): Promise<{ ayahs: Ayah[]; savedAt: number } | null> {
  const cached = await AsyncStorage.getItem(getCacheKey(surahId)).catch(() => null);
  if (!cached) return null;

  try {
    const parsed = JSON.parse(cached) as CachedSurahPayload;
    const overlay = Array.isArray(parsed?.overlay) ? parsed.overlay : [];
    return {
      ayahs: ensureTranslationKeys(applyRemoteOverlay(bundledAyahs, overlay)),
      savedAt: parsed?.savedAt ?? 0,
    };
  } catch {
    return null;
  }
}

function shouldRefreshInBackground(params: {
  baseAyahs: Ayah[];
  cachedSavedAt?: number;
  finalAyahs: Ayah[];
  enabledLanguageCodes: string[];
}): boolean {
  const { baseAyahs, cachedSavedAt = 0, finalAyahs, enabledLanguageCodes } = params;

  if (baseAyahs.length === 0 || finalAyahs.length === 0) {
    return false;
  }

  const now = Date.now();
  const firstAyah = finalAyahs[0];
  const hasTajweed = finalAyahs.some((ayah) => Boolean(ayah.tajweed));
  const hasTransliteration = finalAyahs.some((ayah) => Boolean(ayah.transliteration));
  const missingEnabledTranslation = enabledLanguageCodes.some((lang) => !firstAyah?.translations[lang]);
  const isStale = !cachedSavedAt || now - cachedSavedAt > REMOTE_REFRESH_TTL_MS;

  if (missingEnabledTranslation) return true;
  if (!hasTajweed || !hasTransliteration) return isStale;

  return isStale;
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
  const cacheKey = `${surahId}_${[...CONFIGURED_LANGUAGES].sort().join("_")}`;
  
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey)!;
  }

  const promise = (async () => {
    let bundledAyahs: Ayah[] = [];
    try {
      bundledAyahs = await getBundledSurahAyahs(surahId);
    } catch (err) {
      console.warn(`⚠️ refreshSurahAyahsInternal: Bundled data load failed for surah ${surahId}:`, err);
    }

    let remoteAyahs: Ayah[];
    try {
      remoteAyahs = await fetchRemoteSurahAyahs(surahId);
    } catch (err) {
      console.warn(`⚠️ refreshSurahAyahsInternal: Remote refresh failed for surah ${surahId}:`, err);
      return ensureTranslationKeys(bundledAyahs);
    }

    const merged = ensureTranslationKeys(mergeWithFallback(remoteAyahs, bundledAyahs));

    memoryCache.set(cacheKey, merged);
    await saveToStorage(surahId, remoteAyahs, bundledAyahs);
    return merged;
  })().finally(() => {
    inflightRequests.delete(cacheKey);
  });

  inflightRequests.set(cacheKey, promise);
  return promise;
}

export async function refreshSurahAyahs(surahId: number): Promise<Ayah[]> {
  inflightRequests.delete(surahId.toString());
  return refreshSurahAyahsInternal(surahId);
}

export async function fetchSurahAyahs(
  surahId: number, 
  enabledLanguageCodes: string[] = [],
  forceRefresh: boolean = false
): Promise<Ayah[]> {
  const cacheKey = `${surahId}_${[...enabledLanguageCodes].sort().join("_")}`;

  // 0. Handle Web Fallback (SQLite not available)
  if (Platform.OS === "web") {
    try {
      const remoteAyahs = await fetchRemoteSurahAyahs(surahId);
      const mergedAyahs = await mergeOnDemandTranslations(surahId, remoteAyahs, enabledLanguageCodes);
      return ensureTranslationKeys(mergedAyahs, enabledLanguageCodes);
    } catch (err) {
      console.error("❌ fetchSurahAyahs (Web): Cloud fallback failed:", err);
      return [];
    }
  }
  
  // 1. Try memory cache first (unless forcing)
  if (!forceRefresh && memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    // Safety check: if any enabled language is missing from the first ayah, it's stale
    const firstAyah = cached[0];
    const hasAllData = enabledLanguageCodes.every(lang => firstAyah?.translations[lang]);
    if (hasAllData) return cached;
  }

  // 2. Load bundled data
  let baseAyahs: Ayah[] = [];
  try {
    baseAyahs = await getBundledSurahAyahs(surahId);
  } catch (err) {
    console.warn(`⚠️ fetchSurahAyahs: Bundled data load failed:`, err);
  }

  // 3. Merge downloaded/on-demand translations
  const mergedAyahs = await mergeOnDemandTranslations(surahId, baseAyahs, enabledLanguageCodes);

  // 4. Try storage cache and ensure keys
  const cachedEntry = forceRefresh ? null : await loadFromStorage(surahId, mergedAyahs);
  const finalAyahs = ensureTranslationKeys(cachedEntry?.ayahs || mergedAyahs, enabledLanguageCodes);

  memoryCache.set(cacheKey, finalAyahs);

  // 5. Background refresh
  if (shouldRefreshInBackground({
    baseAyahs,
    cachedSavedAt: cachedEntry?.savedAt,
    finalAyahs,
    enabledLanguageCodes,
  })) {
    refreshSurahAyahsInternal(surahId).catch(() => {});
  }

  return finalAyahs;
}

export function prefetchSurahAyahs(surahId: number, enabledLanguageCodes: string[] = []): void {
  const cacheKey = `${surahId}_${[...enabledLanguageCodes].sort().join("_")}`;
  if (memoryCache.has(cacheKey)) {
    return;
  }

  // For prefetching, we only want to load from STORAGE/SQLITE into MEMORY.
  // We do NOT want to hit the network during prefetch to save battery and bandwidth.
  const task = (async () => {
    let bundledAyahs: Ayah[] = [];
    try {
      bundledAyahs = await getBundledSurahAyahs(surahId);
    } catch {}

    // Merge cached downloaded translations only; prefetch avoids network repair.
    const mergedAyahs = await mergeOnDemandTranslations(surahId, bundledAyahs, enabledLanguageCodes, {
      repairMissing: false,
    });

    const cachedEntry = await loadFromStorage(surahId, mergedAyahs);
    const finalAyahs = ensureTranslationKeys(cachedEntry?.ayahs || mergedAyahs, enabledLanguageCodes);
    
    if (finalAyahs.length > 0) {
      memoryCache.set(cacheKey, finalAyahs);
    }
  })();
}

export async function clearSurahCache(surahId?: number): Promise<void> {
  if (surahId !== undefined) {
    const prefix = `${surahId}_`;
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) memoryCache.delete(key);
    }
    for (const key of inflightRequests.keys()) {
      if (key.startsWith(prefix)) inflightRequests.delete(key);
    }
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

export async function fetchWordsForAyah(ayahKey: string): Promise<Word[]> {
  // 1. Try storage cache first
  const cacheKey = getWordsCacheKey(ayahKey);
  const cached = await AsyncStorage.getItem(cacheKey).catch(() => null);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore parse error, fetch fresh
    }
  }

  // 2. Fetch from Quran.com
  // Using by_key endpoint: /verses/by_key/1:1
  const url = `${QURAN_COM_BASE}/verses/by_key/${ayahKey}?words=true&word_fields=text_uthmani,translation,transliteration`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch words for ${ayahKey}`);
  }

  const json = await response.json();
  const verse = json?.verse;
  if (!verse || !Array.isArray(verse.words)) {
    return [];
  }

  const words: Word[] = verse.words.map((w: any) => ({
    id: w.id,
    position: w.position,
    text: w.text_uthmani || "",
    translation: sanitizeTranslationText(w.translation?.text || ""),
    transliteration: w.transliteration?.text || undefined,
  }));

  // 3. Cache it
  await AsyncStorage.setItem(cacheKey, JSON.stringify(words)).catch(() => {});

  return words;
}

export function getDefaultEnabledLanguages(): TranslationLanguage[] {
  return [...DEFAULT_ENABLED_LANGUAGES];
}
