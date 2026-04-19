import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { InteractionManager } from "react-native";
import { DEFAULT_RECITER, RECITERS, type Reciter } from "@/services/audioService";
import { type UiLanguage } from "@/services/i18n";
import { trackError, trackEvent } from "@/services/telemetry";
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

interface QuranContextType {
  bookmarks: Bookmark[];
  addBookmark: (bookmark: Bookmark) => Promise<void>;
  removeBookmark: (ayahId: string) => Promise<void>;
  isBookmarked: (ayahId: string) => boolean;
  duaBookmarks: DuaBookmark[];
  addDuaBookmark: (bookmark: DuaBookmark) => Promise<void>;
  removeDuaBookmark: (id: string) => Promise<void>;
  isDuaBookmarked: (id: string) => boolean;
  lastRead: LastRead | null;
  setLastRead: (lastRead: LastRead) => Promise<void>;
  fontSize: number;
  setFontSize: (size: number) => Promise<void>;
  uiLanguage: UiLanguage;
  setUiLanguage: (language: UiLanguage) => Promise<void>;
  enabledLanguages: TranslationLanguage[];
  toggleLanguage: (code: TranslationLanguage) => Promise<void>;
  darkMode: boolean;
  toggleDarkMode: () => Promise<void>;
  readSurahIds: number[];
  markSurahRead: (surahId: number) => void;
  unmarkSurahRead: (surahId: number) => void;
  // Phase 3
  streak: number;
  defaultReciter: Reciter;
  setDefaultReciter: (r: Reciter) => Promise<void>;
  isLoading: boolean;
  hasSetLanguage: boolean;
}

const QuranContext = createContext<QuranContextType | null>(null);

const STORAGE_KEYS = {
  BOOKMARKS: "@quran_bookmarks",
  DUA_BOOKMARKS: "@dua_bookmarks",
  LAST_READ: "@quran_last_read",
  FONT_SIZE: "@quran_font_size",
  UI_LANGUAGE: "@quran_ui_language",
  ENABLED_LANGUAGES: "@quran_enabled_languages",
  SHOW_NEPALI: "@quran_show_nepali",
  SHOW_ENGLISH: "@quran_show_english",
  DARK_MODE: "@quran_dark_mode",
  READ_SURAHS: "@quran_read_surahs",
  STREAK: "@quran_streak",
  STREAK_DATE: "@quran_streak_date",
  DEFAULT_RECITER: "@quran_default_reciter",
};

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function QuranProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [duaBookmarks, setDuaBookmarks] = useState<DuaBookmark[]>([]);
  const [lastRead, setLastReadState] = useState<LastRead | null>(null);
  const [fontSize, setFontSizeState] = useState<number>(26);
  const [uiLanguage, setUiLanguageState] = useState<UiLanguage>("en");
  const [enabledLanguages, setEnabledLanguages] = useState<TranslationLanguage[]>(DEFAULT_ENABLED_LANGUAGES);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [readSurahIds, setReadSurahIds] = useState<number[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [defaultReciter, setDefaultReciterState] = useState<Reciter>(DEFAULT_RECITER);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasSetLanguage, setHasSetLanguage] = useState<boolean>(true);

  useEffect(() => {
    // We want a minimum loading time of 3s to show the beautiful entrance animation
    const minimumLoadingTime = new Promise((resolve) => setTimeout(resolve, 3000));
    
    // Safety timeout: Never let the app hang on loading for more than 8s
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 8000);

    Promise.all([loadData(), minimumLoadingTime])
      .then(() => {
        clearTimeout(safetyTimeout);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load global data:", err);
        clearTimeout(safetyTimeout);
        setIsLoading(false);
      });
  }, []);

  async function loadData() {
    try {
      const [
        bookmarksStr, duaBookmarksStr, lastReadStr, fontSizeStr,
        uiLanguageStr, enabledLanguagesStr, showNepaliStr, showEnglishStr, darkModeStr, readSurahsStr,
        streakStr, streakDateStr, reciterStr,
      ] = await AsyncStorage.multiGet([
        STORAGE_KEYS.BOOKMARKS,
        STORAGE_KEYS.DUA_BOOKMARKS,
        STORAGE_KEYS.LAST_READ,
        STORAGE_KEYS.FONT_SIZE,
        STORAGE_KEYS.UI_LANGUAGE,
        STORAGE_KEYS.ENABLED_LANGUAGES,
        STORAGE_KEYS.SHOW_NEPALI,
        STORAGE_KEYS.SHOW_ENGLISH,
        STORAGE_KEYS.DARK_MODE,
        STORAGE_KEYS.READ_SURAHS,
        STORAGE_KEYS.STREAK,
        STORAGE_KEYS.STREAK_DATE,
        STORAGE_KEYS.DEFAULT_RECITER,
      ]);

      if (bookmarksStr[1]) setBookmarks(JSON.parse(bookmarksStr[1]));
      if (duaBookmarksStr[1]) setDuaBookmarks(JSON.parse(duaBookmarksStr[1]));
      if (lastReadStr[1]) setLastReadState(JSON.parse(lastReadStr[1]));
      if (fontSizeStr[1]) setFontSizeState(Number(fontSizeStr[1]));
      if (uiLanguageStr[1]) {
        setUiLanguageState(uiLanguageStr[1] as UiLanguage);
        setHasSetLanguage(true);
      } else {
        setHasSetLanguage(false);
      }
      if (enabledLanguagesStr[1]) {
        const parsed = JSON.parse(enabledLanguagesStr[1]) as TranslationLanguage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEnabledLanguages(parsed);
        }
      } else {
        const migrated: TranslationLanguage[] = [];
        if (showEnglishStr[1] !== "false") migrated.push("en");
        if (showNepaliStr[1] !== "false") migrated.push("ne");
        migrated.push("bn");
        setEnabledLanguages(Array.from(new Set(migrated)));
      }
      if (darkModeStr[1] !== null) setDarkMode(darkModeStr[1] === "true");
      if (readSurahsStr[1]) setReadSurahIds(JSON.parse(readSurahsStr[1]));

      // Reciter
      if (reciterStr[1]) {
        const saved = RECITERS.find((r) => r.id === reciterStr[1]);
        if (saved) setDefaultReciterState(saved);
      }

      // Streak logic
      const today = getTodayKey();
      const yesterday = getYesterdayKey();
      const savedStreak = Number(streakStr[1] ?? 0);
      const lastDate = streakDateStr[1] ?? "";

      if (lastDate === today) {
        setStreak(savedStreak); // already counted today
      } else if (lastDate === yesterday) {
        const newStreak = savedStreak + 1;
        setStreak(newStreak);
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.STREAK, String(newStreak)],
          [STORAGE_KEYS.STREAK_DATE, today],
        ]);
      } else {
        // Streak broken or first time
        setStreak(1);
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.STREAK, "1"],
          [STORAGE_KEYS.STREAK_DATE, today],
        ]);
      }
    } catch (e) {
      trackError("storage.load_failed", e).catch(() => {});
    }
  };

  const addBookmark = useCallback(async (bookmark: Bookmark) => {
    setBookmarks((prev) => {
      const updated = [bookmark, ...prev.filter((b) => b.ayahId !== bookmark.ayahId)];
      AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
      return updated;
    });
    trackEvent("bookmark.added", {
      surahId: bookmark.surahId,
      ayahId: bookmark.ayahId,
      ayahNumber: bookmark.ayahNumber,
    }).catch(() => {});
  }, []);

  const removeBookmark = useCallback(async (ayahId: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.ayahId !== ayahId);
      AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isBookmarked = useCallback(
    (ayahId: string) => bookmarks.some((b) => b.ayahId === ayahId),
    [bookmarks]
  );

  const addDuaBookmark = useCallback(async (bookmark: DuaBookmark) => {
    setDuaBookmarks((prev) => {
      const updated = [bookmark, ...prev.filter((item) => item.id !== bookmark.id)];
      AsyncStorage.setItem(STORAGE_KEYS.DUA_BOOKMARKS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeDuaBookmark = useCallback(async (id: string) => {
    setDuaBookmarks((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.DUA_BOOKMARKS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isDuaBookmarked = useCallback(
    (id: string) => duaBookmarks.some((item) => item.id === id),
    [duaBookmarks]
  );

  const setLastRead = useCallback(async (lr: LastRead) => {
    setLastReadState(lr);
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_READ, JSON.stringify(lr));
  }, []);

  const setFontSize = useCallback(async (size: number) => {
    setFontSizeState(size);
    await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, String(size));
  }, []);

  const setUiLanguage = useCallback(async (language: UiLanguage) => {
    setUiLanguageState(language);
    setHasSetLanguage(true);
    await AsyncStorage.setItem(STORAGE_KEYS.UI_LANGUAGE, language);
  }, []);

  const toggleLanguage = useCallback(async (code: TranslationLanguage) => {
    setEnabledLanguages((prev) => {
      const hasCode = prev.includes(code);
      const next = hasCode
        ? prev.filter((item) => item !== code)
        : [...prev, code];
      const safeNext = next.length > 0 ? next : prev;
      AsyncStorage.setItem(STORAGE_KEYS.ENABLED_LANGUAGES, JSON.stringify(safeNext)).catch(() => {});
      return safeNext;
    });
  }, []);

  const toggleDarkMode = useCallback(async () => {
    setDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, String(next));
      return next;
    });
  }, []);

  const markSurahRead = useCallback((surahId: number) => {
    setReadSurahIds((prev) => {
      if (prev.includes(surahId)) return prev;
      const updated = [...prev, surahId];
      AsyncStorage.setItem(STORAGE_KEYS.READ_SURAHS, JSON.stringify(updated)).catch(() => {});
      trackEvent("surah.marked_read", { surahId }).catch(() => {});
      return updated;
    });
  }, []);

  const unmarkSurahRead = useCallback((surahId: number) => {
    setReadSurahIds((prev) => {
      if (!prev.includes(surahId)) return prev;
      const updated = prev.filter((id) => id !== surahId);
      AsyncStorage.setItem(STORAGE_KEYS.READ_SURAHS, JSON.stringify(updated)).catch(() => {});
      trackEvent("surah.marked_unread", { surahId }).catch(() => {});
      return updated;
    });
  }, []);

  const setDefaultReciter = useCallback(async (r: Reciter) => {
    setDefaultReciterState(r);
    await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_RECITER, r.id);
  }, []);

  return (
    <QuranContext.Provider
      value={{
        bookmarks,
        addBookmark,
        removeBookmark,
        isBookmarked,
        duaBookmarks,
        addDuaBookmark,
        removeDuaBookmark,
        isDuaBookmarked,
        lastRead,
        setLastRead,
        fontSize,
        setFontSize,
        uiLanguage,
        setUiLanguage,
        enabledLanguages,
        toggleLanguage,
        darkMode,
        toggleDarkMode,
        readSurahIds,
        markSurahRead,
        unmarkSurahRead,
        streak,
        defaultReciter,
        setDefaultReciter,
        isLoading,
        hasSetLanguage,
      }}
    >
      {children}
    </QuranContext.Provider>
  );
}

export function useQuran() {
  const ctx = useContext(QuranContext);
  if (!ctx) throw new Error("useQuran must be used inside QuranProvider");
  return ctx;
}
