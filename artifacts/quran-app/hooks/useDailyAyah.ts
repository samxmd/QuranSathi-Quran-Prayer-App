import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchDailyAyahData, DailyAyah } from "@/services/dailyAyahService";

export type { DailyAyah };

let dailyAyahMemoryCache: DailyAyah | null = null;
let dailyAyahInflight: Promise<DailyAyah> | null = null;

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

  const request = (async () => {
    const result = await fetchDailyAyahData();
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
