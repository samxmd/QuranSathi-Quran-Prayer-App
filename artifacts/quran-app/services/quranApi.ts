import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Ayah } from "@/data/ayahs";
import { AYAH_DATA } from "@/data/ayahs";

const BASE_URL = "https://api.alquran.cloud/v1";
const CACHE_PREFIX = "@quran_surah_v1_";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface ApiAyah {
  number: number;
  numberInSurah: number;
  text: string;
}

interface ApiEdition {
  number: number;
  name: string;
  ayahs: ApiAyah[];
}

interface ApiResponse {
  code: number;
  data: ApiEdition[];
}

interface CachedSurah {
  ayahs: Ayah[];
  cachedAt: number;
}

function mergeAyahs(
  arabicAyahs: ApiAyah[],
  englishAyahs: ApiAyah[],
  surahId: number
): Ayah[] {
  const nepaliMap = new Map<number, string>();
  const localAyahs = AYAH_DATA[surahId] ?? [];
  for (const a of localAyahs) {
    nepaliMap.set(a.ayahNumber, a.nepali);
  }

  return arabicAyahs.map((arabicAyah, idx) => {
    const englishAyah = englishAyahs[idx];
    const ayahNum = arabicAyah.numberInSurah;
    return {
      id: `${surahId}:${ayahNum}`,
      surahId,
      ayahNumber: ayahNum,
      arabic: arabicAyah.text,
      english: englishAyah?.text ?? "",
      nepali: nepaliMap.get(ayahNum) ?? "",
    };
  });
}

export async function fetchSurahAyahs(surahId: number): Promise<Ayah[]> {
  const cacheKey = `${CACHE_PREFIX}${surahId}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: CachedSurah = JSON.parse(cached);
      const age = Date.now() - parsed.cachedAt;
      if (age < CACHE_TTL_MS) {
        return parsed.ayahs;
      }
    }
  } catch {
  }

  const url = `${BASE_URL}/surah/${surahId}/editions/quran-uthmani,en.sahih`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  const json: ApiResponse = await response.json();
  if (json.code !== 200 || !Array.isArray(json.data) || json.data.length < 2) {
    throw new Error("Unexpected API response structure");
  }

  const arabicEdition = json.data[0];
  const englishEdition = json.data[1];
  const ayahs = mergeAyahs(arabicEdition.ayahs, englishEdition.ayahs, surahId);

  const toCache: CachedSurah = { ayahs, cachedAt: Date.now() };
  await AsyncStorage.setItem(cacheKey, JSON.stringify(toCache)).catch(() => {});

  return ayahs;
}

export async function clearSurahCache(surahId?: number): Promise<void> {
  if (surahId !== undefined) {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${surahId}`);
  } else {
    const keys = await AsyncStorage.getAllKeys();
    const surahKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(surahKeys);
  }
}
