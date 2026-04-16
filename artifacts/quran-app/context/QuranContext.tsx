import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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

interface QuranContextType {
  bookmarks: Bookmark[];
  addBookmark: (bookmark: Bookmark) => Promise<void>;
  removeBookmark: (ayahId: string) => Promise<void>;
  isBookmarked: (ayahId: string) => boolean;
  lastRead: LastRead | null;
  setLastRead: (lastRead: LastRead) => Promise<void>;
  fontSize: number;
  setFontSize: (size: number) => Promise<void>;
  showNepali: boolean;
  setShowNepali: (show: boolean) => Promise<void>;
  showEnglish: boolean;
  setShowEnglish: (show: boolean) => Promise<void>;
  darkMode: boolean;
  toggleDarkMode: () => Promise<void>;
  readSurahIds: number[];
  markSurahRead: (surahId: number) => void;
}

const QuranContext = createContext<QuranContextType | null>(null);

const STORAGE_KEYS = {
  BOOKMARKS: "@quran_bookmarks",
  LAST_READ: "@quran_last_read",
  FONT_SIZE: "@quran_font_size",
  SHOW_NEPALI: "@quran_show_nepali",
  SHOW_ENGLISH: "@quran_show_english",
  DARK_MODE: "@quran_dark_mode",
  READ_SURAHS: "@quran_read_surahs",
};

export function QuranProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [lastRead, setLastReadState] = useState<LastRead | null>(null);
  const [fontSize, setFontSizeState] = useState<number>(26);
  const [showNepali, setShowNepaliState] = useState<boolean>(true);
  const [showEnglish, setShowEnglishState] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [readSurahIds, setReadSurahIds] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookmarksStr, lastReadStr, fontSizeStr, showNepaliStr, showEnglishStr, darkModeStr, readSurahsStr] =
        await AsyncStorage.multiGet([
          STORAGE_KEYS.BOOKMARKS,
          STORAGE_KEYS.LAST_READ,
          STORAGE_KEYS.FONT_SIZE,
          STORAGE_KEYS.SHOW_NEPALI,
          STORAGE_KEYS.SHOW_ENGLISH,
          STORAGE_KEYS.DARK_MODE,
          STORAGE_KEYS.READ_SURAHS,
        ]);

      if (bookmarksStr[1]) setBookmarks(JSON.parse(bookmarksStr[1]));
      if (lastReadStr[1]) setLastReadState(JSON.parse(lastReadStr[1]));
      if (fontSizeStr[1]) setFontSizeState(Number(fontSizeStr[1]));
      if (showNepaliStr[1] !== null) setShowNepaliState(showNepaliStr[1] === "true");
      if (showEnglishStr[1] !== null) setShowEnglishState(showEnglishStr[1] === "true");
      if (darkModeStr[1] !== null) setDarkMode(darkModeStr[1] === "true");
      if (readSurahsStr[1]) setReadSurahIds(JSON.parse(readSurahsStr[1]));
    } catch (e) {}
  };

  const addBookmark = useCallback(async (bookmark: Bookmark) => {
    setBookmarks((prev) => {
      const updated = [bookmark, ...prev.filter((b) => b.ayahId !== bookmark.ayahId)];
      AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
      return updated;
    });
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

  const setLastRead = useCallback(async (lr: LastRead) => {
    setLastReadState(lr);
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_READ, JSON.stringify(lr));
  }, []);

  const setFontSize = useCallback(async (size: number) => {
    setFontSizeState(size);
    await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, String(size));
  }, []);

  const setShowNepali = useCallback(async (show: boolean) => {
    setShowNepaliState(show);
    await AsyncStorage.setItem(STORAGE_KEYS.SHOW_NEPALI, String(show));
  }, []);

  const setShowEnglish = useCallback(async (show: boolean) => {
    setShowEnglishState(show);
    await AsyncStorage.setItem(STORAGE_KEYS.SHOW_ENGLISH, String(show));
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
      return updated;
    });
  }, []);

  return (
    <QuranContext.Provider
      value={{
        bookmarks,
        addBookmark,
        removeBookmark,
        isBookmarked,
        lastRead,
        setLastRead,
        fontSize,
        setFontSize,
        showNepali,
        setShowNepali,
        showEnglish,
        setShowEnglish,
        darkMode,
        toggleDarkMode,
        readSurahIds,
        markSurahRead,
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
