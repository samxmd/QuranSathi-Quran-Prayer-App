import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";

import { useQuran } from "@/context/QuranContext";
import type { Ayah, Word } from "@/data/ayahs";
import type { AudioStatus } from "@/hooks/useAudio";
import { useTheme } from "@/hooks/useTheme";
import { fetchTafsir } from "@/services/tafsirService";
import { fetchWordsForAyah } from "@/services/quranApi";
import { TRANSLATION_SOURCES, type TranslationLanguage } from "@/services/translationSources";
import { getEditionDisplayInfo } from "@/services/availableTranslations";
import { ArabicWord } from "./ArabicWord";
import { WordDetailSheet } from "./WordDetailSheet";
import { AyahShareSheet } from "./AyahShareSheet";
import { TajweedText } from "./TajweedText";
import { TranslationText } from "./TranslationText";

const toArabicNumber = (num: number) => {
  const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num.toString().split("").map((c) => arabicNumbers[parseInt(c)]).join("");
};

function AyahEndMark({
  ayahNumber,
  fontSize,
  color,
}: {
  ayahNumber: number;
  fontSize: number;
  color: string;
}) {
  return (
    <Text
      style={[
        styles.ayahEndMark,
        {
          color,
          fontSize: Math.max(16, fontSize * 0.8),
          lineHeight: fontSize * 2.5,
        },
      ]}
    >
      {" "}
      {"\u06DD"}{toArabicNumber(ayahNumber)}
    </Text>
  );
}

const isFabricEnabled = Boolean((globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager);

if (
  Platform.OS === "android" &&
  !isFabricEnabled &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AyahCardProps {
  ayah: Ayah;
  surahName: string;
  surahId: number;
  fontSize: number;
  enabledLanguages: TranslationLanguage[];
  audioStatus?: AudioStatus;
  isCurrentAudio?: boolean;
  onPlay?: (ayah: Ayah) => void;
  isWbwEnabled?: boolean;
}

function AyahCardComponent({
  ayah,
  surahName,
  surahId,
  fontSize,
  enabledLanguages,
  audioStatus = "idle",
  isCurrentAudio = false,
  onPlay,
  isWbwEnabled = false,
}: AyahCardProps) {
  const theme = useTheme();
  const { 
    isBookmarked, addBookmark, removeBookmark, 
    wbwOnboarded, setWbwOnboarded, 
    isTransliterationEnabled, uiLanguage,
    showTajweed 
  } = useQuran();
  const bookmarked = isBookmarked(ayah.id);

  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirText, setTafsirText] = useState("");
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  // Word-by-Word State
  const [currentAyahId, setCurrentAyahId] = useState(ayah.id);
  const [words, setWords] = useState<Word[] | undefined>(ayah.words);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [detailWord, setDetailWord] = useState<Word | null>(null);
  const [wbwOverride, setWbwOverride] = useState<boolean | null>(null);
  const [isWbwLoading, setIsWbwLoading] = useState(false);
  const [wbwLoadFailed, setWbwLoadFailed] = useState(false);

  if (ayah.id !== currentAyahId) {
    setCurrentAyahId(ayah.id);
    setWords(ayah.words);
    setSelectedWord(null);
    setDetailWord(null);
    setWbwOverride(null);
    setIsWbwLoading(false);
    setWbwLoadFailed(false);
    setShowTafsir(false);
    setTafsirText("");
    setTafsirLoading(false);
    setTafsirError(false);
    setShowShareSheet(false);
  }

  const activeWbw = wbwOverride ?? isWbwEnabled;
  const canShowTajweed = showTajweed && !!ayah.tajweed;

  useEffect(() => {
    if (activeWbw && !words) {
      setIsWbwLoading(true);
      setWbwLoadFailed(false);
      fetchWordsForAyah(ayah.id)
        .then(setWords)
        .catch(() => {
          setWbwLoadFailed(true);
        })
        .finally(() => {
          setIsWbwLoading(false);
        });
    }
  }, [activeWbw, words, ayah.id]);

  const activeTranslations = useMemo(
    () =>
      enabledLanguages
        .map((language) => {
          const source = TRANSLATION_SOURCES[language as keyof typeof TRANSLATION_SOURCES];
          const editionInfo = source ? null : getEditionDisplayInfo(language);
          const text = ayah.translations[language] ?? "";
          return {
            code: language,
            label: source?.label || editionInfo?.label || language.toUpperCase(),
            text,
          };
        })
        .filter((item) => item.text.trim().length > 0),
    [ayah.translations, enabledLanguages]
  );

  const shareMessage = useMemo(
    () =>
      [
        ayah.arabic,
        ...activeTranslations.map((item) => `${item.label}\n${item.text}`),
        `${surahName} ${ayah.ayahNumber}`,
        "Shared from QuranSathi",
      ].join("\n\n"),
    [activeTranslations, ayah.arabic, ayah.ayahNumber, surahName]
  );

  const handleBookmark = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (bookmarked) {
      await removeBookmark(ayah.id);
      return;
    }

    await addBookmark({
      surahId,
      ayahId: ayah.id,
      ayahNumber: ayah.ayahNumber,
      surahName,
      arabic: ayah.arabic,
      timestamp: Date.now(),
    });
  }, [addBookmark, ayah.arabic, ayah.ayahNumber, ayah.id, bookmarked, removeBookmark, surahId, surahName]);

  const handleTafsir = useCallback(async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (showTafsir) {
      setShowTafsir(false);
      return;
    }

    setShowTafsir(true);
    if (tafsirText) return;

    setTafsirLoading(true);
    setTafsirError(false);
    try {
      const text = await fetchTafsir(surahId, ayah.ayahNumber);
      setTafsirText(text);
    } catch {
      setTafsirError(true);
    } finally {
      setTafsirLoading(false);
    }
  }, [ayah.ayahNumber, showTafsir, surahId, tafsirText]);

  const shareTextFallback = useCallback(async () => {
    await Share.share({ message: shareMessage });
  }, [shareMessage]);

  const isPlaying = isCurrentAudio && audioStatus === "playing";
  const isLoading = isCurrentAudio && audioStatus === "loading";

  const handleWordPress = useCallback(async (word: Word) => {
    await Haptics.selectionAsync();
    setSelectedWord(word === selectedWord ? null : word);
    setWbwLoadFailed(false);
    if (!wbwOnboarded) {
      setWbwOnboarded(true);
    }
  }, [selectedWord, wbwOnboarded, setWbwOnboarded]);

  const handleWordLongPress = useCallback(async (word: Word) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDetailWord(word);
    setSelectedWord(null);
  }, []);

  const toggleWbw = useCallback(async () => {
    if (!activeWbw && !words) {
      try {
        setIsWbwLoading(true);
        setWbwLoadFailed(false);
        const fetched = await fetchWordsForAyah(ayah.id);
        setWords(fetched);
      } catch (err) {
        setWbwLoadFailed(true);
        console.warn("Failed to fetch words:", err);
      } finally {
        setIsWbwLoading(false);
      }
    }
    setWbwOverride(!activeWbw);
    setSelectedWord(null);
  }, [activeWbw, words, ayah.id]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isCurrentAudio && theme.isDark 
            ? theme.gradientEndDark 
            : theme.cardBackground,
          borderColor: isCurrentAudio ? theme.primary : theme.border,
          borderWidth: isCurrentAudio ? 1.5 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <LinearGradient
          colors={theme.isDark ? [theme.gradientStart, theme.gradientEnd] : [theme.gradientStart, theme.gradientEnd]}
          style={styles.verseNumberBadge}
        >
          <Text style={styles.verseNumberText}>{ayah.ayahNumber}</Text>
        </LinearGradient>

        <View style={styles.headerActions}>
          {onPlay && (
            <TouchableOpacity
              onPress={() => onPlay(ayah)}
              style={[
                styles.playBtn,
                {
                  backgroundColor: isPlaying ? theme.primary : theme.cardBackground,
                  borderColor: isPlaying ? theme.primary : theme.border,
                },
              ]}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={isPlaying ? theme.primaryForeground : theme.primary} />
              ) : (
                <Feather
                  name={isPlaying ? "pause" : "play"}
                  size={16}
                  color={isPlaying ? theme.primaryForeground : theme.primary}
                />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              void toggleWbw();
            }}
            style={[
              styles.modeToggleBtn,
              {
                backgroundColor: activeWbw ? theme.primary : theme.cardBackground,
                borderColor: activeWbw ? theme.primary : theme.border,
              },
            ]}
            activeOpacity={0.7}
          >
            {isWbwLoading ? (
              <ActivityIndicator size="small" color={activeWbw ? theme.primaryForeground : theme.primary} />
            ) : (
              <View style={styles.modeToggleInner}>
                <Text
                  style={[
                    styles.modeToggleText,
                    { color: activeWbw ? theme.primaryForeground : theme.textSecondary },
                  ]}
                >
                  {activeWbw ? "Ayah" : "Words"}
                </Text>
                {!activeWbw && canShowTajweed && (
                  <View style={styles.tajweedDot} />
                )}
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowShareSheet(true)}
            style={[styles.actionBtn, { backgroundColor: theme.cardBackground }]}
            activeOpacity={0.7}
          >
            <Feather name="share-2" size={15} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBookmark}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            {bookmarked ? (
              <LinearGradient
                colors={theme.isDark ? ["#D4AC7A", "#B8986A"] : ["#D4AC7A", "#A68652"]}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View style={[
                StyleSheet.absoluteFill, 
                { 
                  backgroundColor: theme.cardBackground, 
                  borderWidth: 1, 
                  borderColor: theme.border,
                  borderRadius: 12 
                }
              ]} />
            )}
            <MaterialCommunityIcons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={18}
              color={bookmarked ? "#FFFFFF" : theme.textSecondary}
              style={{ zIndex: 1 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.arabicContainer}>
        {!activeWbw ? (
          <TouchableOpacity activeOpacity={0.9} onPress={toggleWbw}>
            {(showTajweed && ayah.tajweed) ? (
              <TajweedText
                text={ayah.tajweed}
                fallbackColor={theme.textPrimary}
                fontSize={fontSize}
                isDark={theme.isDark}
                style={styles.arabic}
              />
            ) : (
              <Text
                style={[
                  styles.arabic,
                  {
                    color: theme.textPrimary,
                    fontSize,
                    lineHeight: fontSize * 2.5,
                  },
                ]}
              >
                {ayah.arabic}
              </Text>
            )}
            <Text
              style={[
                styles.arabic,
                styles.ayahEndMarkRow,
                {
                  color: theme.textPrimary,
                  fontSize,
                  lineHeight: fontSize * 2.5,
                },
              ]}
            >
              <AyahEndMark
                ayahNumber={ayah.ayahNumber}
                fontSize={fontSize}
                color={theme.textPrimary}
              />
            </Text>
          </TouchableOpacity>
        ) : isWbwLoading ? (
          <View style={styles.wbwStatusBox}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : words && words.length > 0 ? (
          <View style={styles.wordsWrapper}>
            {words.map((word, idx) => (
              <ArabicWord
                key={word.id || idx}
                word={word}
                fontSize={fontSize}
                color={theme.textPrimary}
                isSelected={selectedWord?.id === word.id}
                showTransliteration={isTransliterationEnabled}
                onPress={handleWordPress}
                onLongPress={handleWordLongPress}
              />
            ))}
          </View>
        ) : wbwLoadFailed ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={toggleWbw}
            style={[styles.wbwStatusBox, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}
          >
            <Text style={[styles.wbwStatusText, { color: theme.textSecondary }]}>Could not load words</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.wbwStatusBox} />
        )}

        {activeWbw && !selectedWord && !wbwOnboarded && !isWbwLoading && words && words.length > 0 && (
          <View style={[styles.wbwHintPill, { backgroundColor: theme.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}>
            <Text style={[styles.wbwHintText, { color: theme.textSecondary }]}>Tap a word</Text>
          </View>
        )}

        {selectedWord && (
          <View
            style={[
              styles.meaningPanel,
              {
                backgroundColor: theme.isDark ? "rgba(255,255,255,0.06)" : theme.primary + "08",
                borderColor: theme.primary + "22",
              },
            ]}
          >
            <Text style={[styles.meaningPrimary, { color: theme.textPrimary }]}>
              {selectedWord.translation}
            </Text>
            {!!selectedWord.transliteration && (
              <Text style={[styles.meaningSecondary, { color: theme.textSecondary }]}>
                {selectedWord.transliteration}
              </Text>
            )}
            <Text style={[styles.meaningMeta, { color: theme.textSecondary }]}>Long press for details</Text>
          </View>
        )}
      </View>

      <View style={[styles.separator, { backgroundColor: theme.accent, opacity: 0.25 }]} />

      {isTransliterationEnabled && ayah.transliteration && (
        <View style={styles.transliterationContainer}>
          <Text style={[styles.transliterationText, { color: theme.textSecondary }]}>
            {ayah.transliteration}
          </Text>
        </View>
      )}

      {activeTranslations.map((translation, index) => {
        const labelColor = translation.code === "en" ? theme.primary : theme.textSecondary;
        return (
          <View
            key={translation.code}
            style={[styles.translationContainer, index > 0 || (isTransliterationEnabled && ayah.transliteration) ? { marginTop: 10 } : null]}
          >
            <View style={styles.labelRow}>
              <View style={[styles.labelDot, { backgroundColor: labelColor }]} />
              <Text style={[styles.translationLabel, { color: labelColor }]}>{translation.label}</Text>
            </View>
            <TranslationText
              text={translation.text}
              languageCode={translation.code}
              baseFontSize={translation.code === "ne" || translation.code === "bn" ? 15 : 16}
              color={theme.textPrimary}
              style={translation.code === "ne" || translation.code === "bn" ? styles.southAsianText : undefined}
            />
          </View>
        );
      })}

      <TouchableOpacity
        onPress={handleTafsir}
          style={[
            styles.tafsirBtn,
            {
              backgroundColor: showTafsir ? theme.primary + "10" : theme.border + "15",
              borderColor: showTafsir ? theme.primary : theme.border,
            },
          ]}
        activeOpacity={0.75}
      >
        <Feather
          name={showTafsir ? "chevron-up" : "book-open"}
          size={15}
          color={showTafsir ? theme.primary : theme.textSecondary}
        />
        <Text
          style={[
            styles.tafsirBtnText,
            { color: showTafsir ? theme.primary : theme.textSecondary },
          ]}
        >
          {showTafsir ? "Hide Tafsir" : "Tafsir (Ibn Kathir)"}
        </Text>
      </TouchableOpacity>

      {showTafsir && (
        <View style={[styles.tafsirBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {tafsirLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : tafsirError ? (
            <Text style={[styles.tafsirError, { color: theme.destructive }]}>
              Could not load tafsir. Check your internet connection.
            </Text>
          ) : (
            <Text style={[styles.tafsirText, { color: theme.textPrimary }]}>{tafsirText}</Text>
          )}
        </View>
      )}

      <WordDetailSheet
        visible={!!detailWord}
        onClose={() => setDetailWord(null)}
        word={detailWord}
      />

      <AyahShareSheet
        visible={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        ayah={ayah}
        surahName={surahName}
        surahId={surahId}
        uiLanguage={uiLanguage}
        translations={activeTranslations}
        initialLangCode={
          activeTranslations.find((t) => t.code === "bn")?.code ||
          activeTranslations.find((t) => t.code === uiLanguage)?.code || 
          activeTranslations[0]?.code || 
          "en"
        }
      />
    </View>
  );
}

export const AyahCard = memo(AyahCardComponent);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  verseNumberBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  verseNumberText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  arabic: {
    fontFamily: "ScheherazadeNew_700Bold",
    textAlign: "right",
    paddingHorizontal: 8,
  },
  ayahEndMark: {
    fontFamily: "ScheherazadeNew_700Bold",
  },
  ayahEndMarkRow: {
    marginTop: -8,
    marginBottom: 16,
  },
  arabicContainer: {
    position: "relative",
    paddingTop: 58,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  modeToggleBtn: {
    minWidth: 88,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modeToggleInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  modeToggleText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  tajweedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2ECC71",
  },
  wbwStatusBox: {
    minHeight: 90,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  wbwStatusText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  wordsWrapper: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 8,
  },
  wbwHintPill: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginTop: 6,
  },
  wbwHintText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  meaningPanel: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  meaningPrimary: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 22,
  },
  meaningSecondary: {
    marginTop: 3,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  meaningMeta: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    opacity: 0.8,
  },
  separator: {
    height: 1,
    marginTop: 6,
    marginBottom: 20,
    borderRadius: 99,
  },
  translationContainer: {},
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  translationLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
  },
  translationText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 26,
  },
  southAsianText: {
    fontSize: 15,
    lineHeight: 26,
  },
  transliterationContainer: {
    marginBottom: 8,
  },
  transliterationText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 22,
    fontStyle: "italic",
  },
  tafsirBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  tafsirBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  tafsirBox: {
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  tafsirText: {
    fontSize: 14,
    fontFamily: "Merriweather_400Regular",
    lineHeight: 24,
  },
  tafsirError: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  shareActions: {
    gap: 10,
    marginTop: 14,
  },
});
