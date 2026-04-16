import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Ayah } from "@/data/ayahs";

const ALQURAN_BASE = "https://api.alquran.cloud/v1";
const QURANCOM_BASE = "https://api.quran.com/api/v4";
const NEPALI_TRANSLATION_ID = 108;
const CACHE_PREFIX = "@quran_surah_v2_";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface AlQuranAyah {
  number: number;
  numberInSurah: number;
  text: string;
}

interface AlQuranEdition {
  number: number;
  name: string;
  ayahs: AlQuranAyah[];
}

interface AlQuranResponse {
  code: number;
  data: AlQuranEdition[];
}

interface QuranComTranslation {
  resource_id: number;
  text: string;
}

interface QuranComResponse {
  translations: QuranComTranslation[];
}

interface CachedSurah {
  ayahs: Ayah[];
  cachedAt: number;
}

function stripNepaliPrefix(text: string): string {
  return text
    .replace(/^[०-९]+\)\s*/, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

async function fetchArabicAndEnglish(surahId: number): Promise<{ arabic: AlQuranAyah[]; english: AlQuranAyah[] }> {
  const url = `${ALQURAN_BASE}/surah/${surahId}/editions/quran-uthmani,en.sahih`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AlQuran API error ${res.status}`);
  const json: AlQuranResponse = await res.json();
  if (json.code !== 200 || json.data.length < 2) throw new Error("Unexpected AlQuran API response");
  return { arabic: json.data[0].ayahs, english: json.data[1].ayahs };
}

async function fetchNepaliTranslation(surahId: number): Promise<string[]> {
  const url = `${QURANCOM_BASE}/quran/translations/${NEPALI_TRANSLATION_ID}?chapter_number=${surahId}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json: QuranComResponse = await res.json();
  return (json.translations ?? []).map((t) => stripNepaliPrefix(t.text));
}

function buildAyahs(
  surahId: number,
  arabic: AlQuranAyah[],
  english: AlQuranAyah[],
  nepali: string[]
): Ayah[] {
  return arabic.map((arabicAyah, idx) => ({
    id: `${surahId}:${arabicAyah.numberInSurah}`,
    surahId,
    ayahNumber: arabicAyah.numberInSurah,
    arabic: arabicAyah.text,
    english: english[idx]?.text ?? "",
    nepali: nepali[idx] ?? "",
  }));
}

export async function fetchSurahAyahs(surahId: number): Promise<Ayah[]> {
  const cacheKey = `${CACHE_PREFIX}${surahId}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: CachedSurah = JSON.parse(cached);
      if (Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
        return parsed.ayahs;
      }
    }
  } catch {}

  const [{ arabic, english }, nepali] = await Promise.all([
    fetchArabicAndEnglish(surahId),
    fetchNepaliTranslation(surahId),
  ]);

  const ayahs = buildAyahs(surahId, arabic, english, nepali);

  const toCache: CachedSurah = { ayahs, cachedAt: Date.now() };
  AsyncStorage.setItem(cacheKey, JSON.stringify(toCache)).catch(() => {});

  return ayahs;
}

export async function clearSurahCache(surahId?: number): Promise<void> {
  if (surahId !== undefined) {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${surahId}`);
  } else {
    const keys = await AsyncStorage.getAllKeys();
    const surahKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (surahKeys.length) await AsyncStorage.multiRemove(surahKeys);
  }
}
