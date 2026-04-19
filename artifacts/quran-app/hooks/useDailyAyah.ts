import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getOfflineAyah } from "@/data/offlineQuranLoader";

export interface DailyAyah {
  arabic: string;
  nepali: string;
  english: string;
  bangla: string;
  reference: string;
  surahName: string;
}

const POOL: Array<{ key: string; surahName: string; ref: string }> = [
  { key: "2:255", surahName: "Al-Baqarah", ref: "2:255" },
  { key: "2:286", surahName: "Al-Baqarah", ref: "2:286" },
  { key: "3:173", surahName: "Al-Imran", ref: "3:173" },
  { key: "3:185", surahName: "Al-Imran", ref: "3:185" },
  { key: "9:51", surahName: "At-Tawbah", ref: "9:51" },
  { key: "13:28", surahName: "Ar-Ra'd", ref: "13:28" },
  { key: "14:7", surahName: "Ibrahim", ref: "14:7" },
  { key: "16:97", surahName: "An-Nahl", ref: "16:97" },
  { key: "18:10", surahName: "Al-Kahf", ref: "18:10" },
  { key: "20:114", surahName: "Ta-Ha", ref: "20:114" },
  { key: "23:1", surahName: "Al-Mu'minun", ref: "23:1" },
  { key: "24:35", surahName: "An-Nur", ref: "24:35" },
  { key: "25:63", surahName: "Al-Furqan", ref: "25:63" },
  { key: "29:45", surahName: "Al-'Ankabut", ref: "29:45" },
  { key: "30:21", surahName: "Ar-Rum", ref: "30:21" },
  { key: "33:41", surahName: "Al-Ahzab", ref: "33:41" },
  { key: "39:53", surahName: "Az-Zumar", ref: "39:53" },
  { key: "40:60", surahName: "Ghafir", ref: "40:60" },
  { key: "49:13", surahName: "Al-Hujurat", ref: "49:13" },
  { key: "55:13", surahName: "Ar-Rahman", ref: "55:13" },
  { key: "57:4", surahName: "Al-Hadid", ref: "57:4" },
  { key: "62:10", surahName: "Al-Jumu'ah", ref: "62:10" },
  { key: "65:3", surahName: "At-Talaq", ref: "65:3" },
  { key: "67:2", surahName: "Al-Mulk", ref: "67:2" },
  { key: "67:12", surahName: "Al-Mulk", ref: "67:12" },
  { key: "73:20", surahName: "Al-Muzzammil", ref: "73:20" },
  { key: "84:6", surahName: "Al-Inshiqaq", ref: "84:6" },
  { key: "94:5", surahName: "Al-Inshirah", ref: "94:5" },
  { key: "112:1", surahName: "Al-Ikhlas", ref: "112:1" },
  { key: "114:1", surahName: "An-Nas", ref: "114:1" },
];

let dailyAyahMemoryCache: DailyAyah | null = null;
let dailyAyahInflight: Promise<DailyAyah> | null = null;

function getDayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return dayOfYear % POOL.length;
}

function todayKey(): string {
  const d = new Date();
  return `@quran_daily_ayah_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

async function fetchDailyAyah(): Promise<DailyAyah> {
  if (dailyAyahMemoryCache) {
    return dailyAyahMemoryCache;
  }

  if (dailyAyahInflight) {
    return dailyAyahInflight;
  }

  const cacheKey = todayKey();
  const cached = await AsyncStorage.getItem(cacheKey).catch(() => null);
  if (cached) {
    const parsed = JSON.parse(cached) as DailyAyah;
    dailyAyahMemoryCache = parsed;
    return parsed;
  }

  const entry = POOL[getDayIndex()];
  const [surahIdText, ayahNumberText] = entry.key.split(":");
  const surahId = Number(surahIdText);
  const ayahNumber = Number(ayahNumberText);

  const request = (async () => {
    const ayah = await getOfflineAyah(surahId, ayahNumber);

    if (!ayah) {
      throw new Error(`Daily ayah ${entry.key} is missing from bundled data`);
    }

    const result: DailyAyah = {
      arabic: ayah.arabic,
      english: ayah.translations.en ?? "",
      nepali: ayah.translations.ne ?? "",
      bangla: ayah.translations.bn ?? "",
      reference: entry.ref,
      surahName: entry.surahName,
    };

    dailyAyahMemoryCache = result;
    AsyncStorage.setItem(cacheKey, JSON.stringify(result)).catch(() => {});
    return result;
  })();

  dailyAyahInflight = request;

  try {
    return await request;
  } finally {
    dailyAyahInflight = null;
  }
}

export function useDailyAyah(enabled: boolean = true) {
  const [ayah, setAyah] = useState<DailyAyah | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    fetchDailyAyah()
      .then(setAyah)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [enabled]);

  return { ayah, loading, error };
}
