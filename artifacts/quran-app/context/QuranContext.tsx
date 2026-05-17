import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import { DEFAULT_RECITER, RECITERS, type Reciter } from "@/services/audioService";
import { type UiLanguage } from "@/services/i18n";
import i18n from "@/services/i18n";
import { trackError, trackEvent } from "@/services/telemetry";
import { fetchDailyAyahData } from "@/services/dailyAyahService";
import { dbService } from "@/services/database";
import { clearSurahCache } from "@/services/quranApi";
import {
  DEFAULT_ENABLED_LANGUAGES,
  type TranslationLanguage,
} from "@/services/translationSources";

export interface Bookmark {
  surahId: number;
  ayahId: string;
  ayahNumber: number;
  surahName: string;
  arabic: string;
  timestamp: number;
}

export interface LastRead {
  surahId: number;
  ayahNumber: number;
  surahName: string;
  timestamp: number;
}

export interface DuaBookmark {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  arabic: string;
  english: string;
  source: string;
  timestamp: number;
}

export type QuranContextType = {
  bookmarks: Bookmark[];
  duaBookmarks: DuaBookmark[];
  lastRead: LastRead | null;
  fontSize: number;
  uiLanguage: UiLanguage;
  enabledLanguages: TranslationLanguage[];
  darkMode: boolean;
  readSurahIds: number[];
  streak: number;
  totalTimeToday: number;
  totalAyahsRead: number;
  totalHasanat: number;
  weeklyTimeHistory: Record<string, number>;
  isGlobalWbwEnabled: boolean;
  wbwOnboarded: boolean;
  isTransliterationEnabled: boolean;
  showTajweed: boolean;
  hasSetLanguage: boolean;
  defaultReciter: Reciter;
  isLoading: boolean;
  addBookmark: (bookmark: Bookmark) => Promise<void>;
  removeBookmark: (ayahId: string) => Promise<void>;
  isBookmarked: (ayahId: string) => boolean;
  addDuaBookmark: (bookmark: DuaBookmark) => Promise<void>;
  removeDuaBookmark: (id: string) => Promise<void>;
  isDuaBookmarked: (id: string) => boolean;
  setLastRead: (lastRead: LastRead) => Promise<void>;
  setFontSize: (size: number) => Promise<void>;
  setUiLanguage: (lang: UiLanguage) => Promise<void>;
  toggleLanguage: (lang: TranslationLanguage) => Promise<void>;
  setEnabledTranslationLanguages: (langs: TranslationLanguage[]) => Promise<void>;
  setDarkMode: (dark: boolean) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  markSurahRead: (surahId: number) => Promise<void>;
  unmarkSurahRead: (surahId: number) => Promise<void>;
  isSurahRead: (surahId: number) => boolean;
  updateDailyActivity: (ayahsRead: number) => Promise<void>;
  incrementTotalTime: (seconds: number) => Promise<void>;
  incrementHasanat: (ayahId: string) => Promise<void>;
  setGlobalWbwEnabled: (enabled: boolean) => Promise<void>;
  setWbwOnboarded: (onboarded: boolean) => Promise<void>;
  setIsTransliterationEnabled: (enabled: boolean) => Promise<void>;
  setShowTajweed: (show: boolean) => Promise<void>;
  toggleTajweed: () => Promise<void>;
  setDefaultReciter: (reciter: Reciter) => Promise<void>;
  downloadedLanguageCodes: string[];
  registerDownloadedLanguage: (langCode: string) => Promise<void>;
  removeDownloadedLanguage: (langCode: string) => Promise<void>;
};

const STORAGE_KEYS = {
  BOOKMARKS: "quran_bookmarks",
  DUA_BOOKMARKS: "quran_dua_bookmarks",
  LAST_READ: "quran_last_read",
  FONT_SIZE: "quran_font_size",
  UI_LANGUAGE: "quran_ui_language",
  ENABLED_LANGUAGES: "quran_enabled_languages",
  DARK_MODE: "quran_dark_mode",
  READ_SURAHS: "quran_read_surahs",
  STREAK: "quran_streak",
  STREAK_DATE: "quran_streak_date",
  DEFAULT_RECITER: "quran_default_reciter",
  GLOBAL_WBW: "quran_global_wbw",
  WBW_ONBOARDED: "quran_wbw_onboarded",
  TRANSLITERATION_ENABLED: "quran_transliteration_enabled",
  SHOW_TAJWEED: "quran_show_tajweed",
  DOWNLOADED_LANGUAGES: "quran_downloaded_languages",
  TOTAL_TIME: "quran_total_time_today",
  TOTAL_TIME_DATE: "quran_total_time_date",
  WEEKLY_TIME_HISTORY: "quran_weekly_time_history",
  TOTAL_AYAHS: "quran_total_ayahs_read",
  TOTAL_HASANAT: "quran_total_hasanat",
};

const QuranContext = createContext<QuranContextType | undefined>(undefined);

export const QuranProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [duaBookmarks, setDuaBookmarks] = useState<DuaBookmark[]>([]);
  const [lastRead, setLastReadState] = useState<LastRead | null>(null);
  const [fontSize, setFontSizeState] = useState(24);
  const [uiLanguage, setUiLanguageState] = useState<UiLanguage>("en");
  const [enabledLanguages, setEnabledLanguages] = useState<TranslationLanguage[]>(DEFAULT_ENABLED_LANGUAGES);
  const [darkMode, setDarkModeInternal] = useState(false);
  const [readSurahIds, setReadSurahIds] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [isGlobalWbwEnabled, setIsGlobalWbwEnabledInternal] = useState(true);
  const [wbwOnboarded, setWbwOnboardedInternal] = useState(false);
  const [isTransliterationEnabled, setIsTransliterationEnabledInternal] = useState(true);
  const [showTajweed, setShowTajweedInternal] = useState(true);
  const [hasSetLanguage, setHasSetLanguage] = useState(false);
  const [defaultReciter, setDefaultReciterState] = useState<Reciter>(DEFAULT_RECITER);
  const [downloadedLanguageCodes, setDownloadedLanguageCodes] = useState<string[]>([]);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [totalAyahsRead, setTotalAyahsRead] = useState(0);
  const [totalHasanat, setTotalHasanat] = useState(0);
  const [weeklyTimeHistory, setWeeklyTimeHistory] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // App Usage Tracking
  const appStateRef = React.useRef(AppState.currentState);
  const lastSyncRef = React.useRef(Date.now());

  useEffect(() => {
    const initTracking = () => {
      
      const subscription = AppState.addEventListener("change", (nextState) => {
        if (nextState === "active") {
          lastSyncRef.current = Date.now();
        } else {
          // App moving to background - sync time
          const current = Date.now();
          const diff = Math.floor((current - lastSyncRef.current) / 1000);
          if (diff > 0) {
            incrementTotalTime(diff);
          }
        }
      });

      // Periodically sync every 30s while active
      const interval = setInterval(() => {
        if (AppState.currentState === "active") {
          const current = Date.now();
          const diff = Math.floor((current - lastSyncRef.current) / 1000);
          if (diff >= 10) {
            incrementTotalTime(diff);
            lastSyncRef.current = current;
          }
        }
      }, 30000);

      return () => {
        subscription.remove();
        clearInterval(interval);
      };
    };

    const cleanup = initTracking();
    return () => {
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    loadData().then(() => {
      migrateProgressToSqlite().finally(() => {
        // Keep the loading screen visible long enough for users to see the custom branding and shimmer
        const elapsed = Date.now() - startTime;
        const minLoadingTime = 2000; // 2 seconds minimum
        const remainingTime = Math.max(0, minLoadingTime - elapsed);
        
        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      });
    });
  }, []);

  async function loadData() {
    try {
      const results = await AsyncStorage.multiGet([
        STORAGE_KEYS.BOOKMARKS,
        STORAGE_KEYS.DUA_BOOKMARKS,
        STORAGE_KEYS.LAST_READ,
        STORAGE_KEYS.FONT_SIZE,
        STORAGE_KEYS.UI_LANGUAGE,
        STORAGE_KEYS.ENABLED_LANGUAGES,
        STORAGE_KEYS.DARK_MODE,
        STORAGE_KEYS.READ_SURAHS,
        STORAGE_KEYS.STREAK,
        STORAGE_KEYS.STREAK_DATE,
        STORAGE_KEYS.DEFAULT_RECITER,
        STORAGE_KEYS.GLOBAL_WBW,
        STORAGE_KEYS.WBW_ONBOARDED,
        STORAGE_KEYS.TRANSLITERATION_ENABLED,
        STORAGE_KEYS.SHOW_TAJWEED,
        STORAGE_KEYS.DOWNLOADED_LANGUAGES,
        STORAGE_KEYS.TOTAL_TIME,
        STORAGE_KEYS.TOTAL_TIME_DATE,
        STORAGE_KEYS.WEEKLY_TIME_HISTORY,
        STORAGE_KEYS.TOTAL_AYAHS,
        STORAGE_KEYS.TOTAL_HASANAT,
      ]);

      const data: Record<string, string | null> = {};
      results.forEach(([key, value]) => {
        data[key] = value;
      });

      if (data[STORAGE_KEYS.BOOKMARKS]) setBookmarks(JSON.parse(data[STORAGE_KEYS.BOOKMARKS]!));
      if (data[STORAGE_KEYS.DUA_BOOKMARKS]) setDuaBookmarks(JSON.parse(data[STORAGE_KEYS.DUA_BOOKMARKS]!));
      if (data[STORAGE_KEYS.LAST_READ]) setLastReadState(JSON.parse(data[STORAGE_KEYS.LAST_READ]!));
      if (data[STORAGE_KEYS.FONT_SIZE]) setFontSizeState(Number(data[STORAGE_KEYS.FONT_SIZE]));
      
      const uiLang = data[STORAGE_KEYS.UI_LANGUAGE];
      if (uiLang) {
        if (uiLang === "hi" || uiLang === "ur") {
          setUiLanguageState("en");
          i18n.changeLanguage("en").catch(() => {});
          AsyncStorage.setItem(STORAGE_KEYS.UI_LANGUAGE, "en").catch(() => {});
        } else {
          setUiLanguageState(uiLang as UiLanguage);
          i18n.changeLanguage(uiLang).catch(() => {});
        }
        setHasSetLanguage(true);
      }

      const enabledLangs = data[STORAGE_KEYS.ENABLED_LANGUAGES];
      if (enabledLangs) {
        const parsed = JSON.parse(enabledLangs) as TranslationLanguage[];
        setEnabledLanguages(parsed.includes("en") ? parsed : ["en", ...parsed]);
      }

      if (data[STORAGE_KEYS.DARK_MODE] !== null) setDarkModeInternal(data[STORAGE_KEYS.DARK_MODE] === "true");
      if (data[STORAGE_KEYS.READ_SURAHS]) setReadSurahIds(JSON.parse(data[STORAGE_KEYS.READ_SURAHS]!));
      
      const reciterId = data[STORAGE_KEYS.DEFAULT_RECITER];
      if (reciterId) {
        const saved = RECITERS.find((r) => r.id === reciterId);
        if (saved) setDefaultReciterState(saved);
      }

      if (data[STORAGE_KEYS.STREAK]) setStreak(Number(data[STORAGE_KEYS.STREAK]));
      if (data[STORAGE_KEYS.GLOBAL_WBW]) setIsGlobalWbwEnabledInternal(data[STORAGE_KEYS.GLOBAL_WBW] === "true");
      if (data[STORAGE_KEYS.WBW_ONBOARDED]) setWbwOnboardedInternal(data[STORAGE_KEYS.WBW_ONBOARDED] === "true");
      if (data[STORAGE_KEYS.TRANSLITERATION_ENABLED]) setIsTransliterationEnabledInternal(data[STORAGE_KEYS.TRANSLITERATION_ENABLED] === "true");
      if (data[STORAGE_KEYS.SHOW_TAJWEED]) setShowTajweedInternal(data[STORAGE_KEYS.SHOW_TAJWEED] === "true");
      
      if (data[STORAGE_KEYS.DOWNLOADED_LANGUAGES]) {
        setDownloadedLanguageCodes(JSON.parse(data[STORAGE_KEYS.DOWNLOADED_LANGUAGES]!));
      }

      const today = getTodayKey();
      const yesterday = getYesterdayKey();
      const savedStreak = Number(data[STORAGE_KEYS.STREAK] ?? 0);
      const lastDate = data[STORAGE_KEYS.STREAK_DATE] ?? "";

      if (lastDate === today) {
        setStreak(savedStreak);
      } else if (lastDate === yesterday) {
        const newStreak = savedStreak + 1;
        setStreak(newStreak);
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.STREAK, String(newStreak)],
          [STORAGE_KEYS.STREAK_DATE, today],
        ]);
      } else if (lastDate !== "") {
        setStreak(0);
      }

      // Load Time Spent
      const timeDate = data[STORAGE_KEYS.TOTAL_TIME_DATE];
      const savedTime = Number(data[STORAGE_KEYS.TOTAL_TIME] ?? 0);
      if (timeDate === today) {
        setTotalTimeToday(savedTime);
      } else {
        setTotalTimeToday(0);
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.TOTAL_TIME, "0"],
          [STORAGE_KEYS.TOTAL_TIME_DATE, today],
        ]);
      }

      // Load Weekly History
      const weeklyStr = data[STORAGE_KEYS.WEEKLY_TIME_HISTORY];
      if (weeklyStr) {
        try { setWeeklyTimeHistory(JSON.parse(weeklyStr)); } catch (e) {}
      }
      
      if (data[STORAGE_KEYS.TOTAL_AYAHS]) setTotalAyahsRead(Number(data[STORAGE_KEYS.TOTAL_AYAHS]));
      if (data[STORAGE_KEYS.TOTAL_HASANAT]) setTotalHasanat(Number(data[STORAGE_KEYS.TOTAL_HASANAT]));

    } catch (error) {
      console.error("❌ Failed to load initial data:", error);
    }
  }

  async function migrateProgressToSqlite() {
    try {
      const dbCompleted = await dbService.getCompletedSurahIds();
      if (dbCompleted.length === 0 && readSurahIds.length > 0) {
        console.log("🚚 Migrating reading progress to SQLite...");
        for (const id of readSurahIds) {
          await dbService.markSurahComplete(id);
        }
        console.log("✅ Migration complete");
      }
    } catch (e) {
      console.warn("⚠️ Migration failed:", e);
    }
  }

  const getTodayKey = () => new Date().toISOString().split("T")[0];
  const getYesterdayKey = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  const addBookmark = async (bookmark: Bookmark) => {
    const newBookmarks = [...bookmarks, bookmark];
    setBookmarks(newBookmarks);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(newBookmarks));
  };

  const removeBookmark = async (ayahId: string) => {
    const newBookmarks = bookmarks.filter((b) => b.ayahId !== ayahId);
    setBookmarks(newBookmarks);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(newBookmarks));
  };

  const isBookmarked = (ayahId: string) => bookmarks.some((b) => b.ayahId === ayahId);

  const addDuaBookmark = async (bookmark: DuaBookmark) => {
    const newBookmarks = [...duaBookmarks, bookmark];
    setDuaBookmarks(newBookmarks);
    await AsyncStorage.setItem(STORAGE_KEYS.DUA_BOOKMARKS, JSON.stringify(newBookmarks));
  };

  const removeDuaBookmark = async (id: string) => {
    const newBookmarks = duaBookmarks.filter((b) => b.id !== id);
    setDuaBookmarks(newBookmarks);
    await AsyncStorage.setItem(STORAGE_KEYS.DUA_BOOKMARKS, JSON.stringify(newBookmarks));
  };

  const isDuaBookmarked = (id: string) => duaBookmarks.some((b) => b.id === id);

  const setLastRead = async (val: LastRead) => {
    setLastReadState(val);
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_READ, JSON.stringify(val));
    updateDailyActivity(1);
  };

  // Track which ayahs have already earned Hasanat this session to prevent duplicates
  const countedAyahsRef = React.useRef<Set<string>>(new Set());

  const incrementHasanat = async (ayahId: string) => {
    if (countedAyahsRef.current.has(ayahId)) return; // Already counted this session
    countedAyahsRef.current.add(ayahId);

    const newAyahs = totalAyahsRead + 1;
    const newHasanat = totalHasanat + 700; // Average 70 chars * 10 rewards
    setTotalAyahsRead(newAyahs);
    setTotalHasanat(newHasanat);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TOTAL_AYAHS, String(newAyahs)],
      [STORAGE_KEYS.TOTAL_HASANAT, String(newHasanat)]
    ]);
  };

  const setFontSize = async (size: number) => {
    setFontSizeState(size);
    await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, String(size));
  };

  const setUiLanguage = async (lang: UiLanguage) => {
    setUiLanguageState(lang);
    setHasSetLanguage(true);
    i18n.changeLanguage(lang).catch(() => {});
    await AsyncStorage.setItem(STORAGE_KEYS.UI_LANGUAGE, lang);
  };

  const toggleLanguage = async (lang: TranslationLanguage) => {
    const next = enabledLanguages.includes(lang)
      ? enabledLanguages.filter((l) => l !== lang)
      : [...enabledLanguages, lang];
    if (!next.includes("en")) next.unshift("en");
    setEnabledLanguages(next);
    await AsyncStorage.setItem(STORAGE_KEYS.ENABLED_LANGUAGES, JSON.stringify(next));
    await clearSurahCache();
  };

  const setEnabledTranslationLanguages = async (langs: TranslationLanguage[]) => {
    const next = Array.from(new Set(["en", ...langs.filter(Boolean)])) as TranslationLanguage[];
    setEnabledLanguages(next);
    await AsyncStorage.setItem(STORAGE_KEYS.ENABLED_LANGUAGES, JSON.stringify(next));
    await clearSurahCache();
  };

  const setDarkMode = async (dark: boolean) => {
    setDarkModeInternal(dark);
    await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, String(dark));
  };

  const toggleDarkMode = async () => {
    const next = !darkMode;
    setDarkModeInternal(next);
    await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, String(next));
  };

  const markSurahRead = async (surahId: number) => {
    if (!readSurahIds.includes(surahId)) {
      const next = [...readSurahIds, surahId];
      setReadSurahIds(next);
      await AsyncStorage.setItem(STORAGE_KEYS.READ_SURAHS, JSON.stringify(next));
      await dbService.markSurahComplete(surahId);
    }
  };

  const unmarkSurahRead = async (surahId: number) => {
    if (readSurahIds.includes(surahId)) {
      const next = readSurahIds.filter(id => id !== surahId);
      setReadSurahIds(next);
      await AsyncStorage.setItem(STORAGE_KEYS.READ_SURAHS, JSON.stringify(next));
      // Optionally we could add a dbService.unmarkSurahComplete if needed
    }
  };

  const isSurahRead = (surahId: number) => readSurahIds.includes(surahId);

  const updateDailyActivity = async (ayahsRead: number) => {
    const today = getTodayKey();
    const lastDate = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATE);
    if (lastDate !== today) {
      const currentStreak = Number((await AsyncStorage.getItem(STORAGE_KEYS.STREAK)) || 0);
      const newStreak = currentStreak + 1;
      setStreak(newStreak);
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.STREAK, String(newStreak)],
        [STORAGE_KEYS.STREAK_DATE, today],
      ]);
    }
  };

  const incrementTotalTime = async (seconds: number) => {
    const today = getTodayKey();
    const lastDate = await AsyncStorage.getItem(STORAGE_KEYS.TOTAL_TIME_DATE);
    
    setTotalTimeToday((prev) => {
      const next = lastDate === today ? prev + seconds : seconds;
      
      setWeeklyTimeHistory((prevHistory) => {
        const newHistory = { ...prevHistory };
        newHistory[today] = (newHistory[today] || 0) + seconds;
        
        AsyncStorage.multiSet([
          [STORAGE_KEYS.TOTAL_TIME, String(next)],
          [STORAGE_KEYS.TOTAL_TIME_DATE, today],
          [STORAGE_KEYS.WEEKLY_TIME_HISTORY, JSON.stringify(newHistory)],
        ]).catch(() => {});
        
        return newHistory;
      });

      return next;
    });
  };

  const setGlobalWbwEnabled = async (enabled: boolean) => {
    setIsGlobalWbwEnabledInternal(enabled);
    await AsyncStorage.setItem(STORAGE_KEYS.GLOBAL_WBW, String(enabled));
  };

  const setWbwOnboarded = async (onboarded: boolean) => {
    setWbwOnboardedInternal(onboarded);
    await AsyncStorage.setItem(STORAGE_KEYS.WBW_ONBOARDED, String(onboarded));
  };

  const setIsTransliterationEnabled = async (enabled: boolean) => {
    setIsTransliterationEnabledInternal(enabled);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSLITERATION_ENABLED, String(enabled));
  };

  const setShowTajweed = async (show: boolean) => {
    setShowTajweedInternal(show);
    await AsyncStorage.setItem(STORAGE_KEYS.SHOW_TAJWEED, String(show));
  };

  const toggleTajweed = async () => {
    const next = !showTajweed;
    setShowTajweedInternal(next);
    await AsyncStorage.setItem(STORAGE_KEYS.SHOW_TAJWEED, String(next));
  };

  const setDefaultReciter = async (reciter: Reciter) => {
    setDefaultReciterState(reciter);
    await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_RECITER, reciter.id);
  };
  
  const registerDownloadedLanguage = async (langCode: string) => {
    if (!downloadedLanguageCodes.includes(langCode)) {
      const next = [...downloadedLanguageCodes, langCode];
      setDownloadedLanguageCodes(next);
      await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_LANGUAGES, JSON.stringify(next));
      await clearSurahCache();
    }
  };

  const removeDownloadedLanguage = async (langCode: string) => {
    const next = downloadedLanguageCodes.filter((c) => c !== langCode);
    setDownloadedLanguageCodes(next);
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_LANGUAGES, JSON.stringify(next));
    
    // Also remove from enabled if it was enabled
    if (enabledLanguages.includes(langCode)) {
      const nextEnabled = enabledLanguages.filter((l) => l !== langCode);
      setEnabledLanguages(nextEnabled);
      await AsyncStorage.setItem(STORAGE_KEYS.ENABLED_LANGUAGES, JSON.stringify(nextEnabled));
    }
    await clearSurahCache();
  };

  return (
    <QuranContext.Provider
      value={{
        bookmarks,
        duaBookmarks,
        lastRead,
        fontSize,
        uiLanguage,
        enabledLanguages,
        darkMode,
        readSurahIds,
        streak,
        totalTimeToday,
        totalAyahsRead,
        totalHasanat,
        isGlobalWbwEnabled,
        wbwOnboarded,
        isTransliterationEnabled,
        showTajweed,
        hasSetLanguage,
        defaultReciter,
        isLoading,
        addBookmark,
        removeBookmark,
        isBookmarked,
        addDuaBookmark,
        removeDuaBookmark,
        isDuaBookmarked,
        setLastRead,
        setFontSize,
        setUiLanguage,
        toggleLanguage,
        setEnabledTranslationLanguages,
        setDarkMode,
        toggleDarkMode,
        markSurahRead,
        unmarkSurahRead,
        isSurahRead,
        updateDailyActivity,
        incrementTotalTime,
        incrementHasanat,
        setGlobalWbwEnabled,
        setWbwOnboarded,
        setIsTransliterationEnabled,
        setShowTajweed,
        toggleTajweed,
        setDefaultReciter,
        downloadedLanguageCodes,
        registerDownloadedLanguage,
        removeDownloadedLanguage,
        weeklyTimeHistory,
      }}
    >
      {children}
    </QuranContext.Provider>
  );
};

export const useQuran = () => {
  const context = useContext(QuranContext);
  if (context === undefined) {
    throw new Error("useQuran must be used within a QuranProvider");
  }
  return context;
};
