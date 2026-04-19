import React, { memo, useCallback, useMemo, useRef, useState } from "react";
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
import * as Sharing from "expo-sharing";
import ViewShot from "react-native-view-shot";

import { useQuran } from "@/context/QuranContext";
import type { Ayah } from "@/data/ayahs";
import type { AudioStatus } from "@/hooks/useAudio";
import { useTheme } from "@/hooks/useTheme";
import { fetchTafsir } from "@/services/tafsirService";
import { TRANSLATION_SOURCES, type TranslationLanguage } from "@/services/translationSources";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
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
}: AyahCardProps) {
  const theme = useTheme();
  const { isBookmarked, addBookmark, removeBookmark } = useQuran();
  const bookmarked = isBookmarked(ayah.id);
  const shareCardRef = useRef<ViewShot | null>(null);

  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirText, setTafsirText] = useState("");
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const activeTranslations = useMemo(
    () =>
      enabledLanguages
        .map((language) => ({
          code: language,
          label: TRANSLATION_SOURCES[language].label,
          text: ayah.translations[language] ?? "",
        }))
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

  const handleShareImage = useCallback(
    async (target?: "whatsapp" | "instagram") => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (Platform.OS === "web") {
        await shareTextFallback();
        return;
      }

      try {
        setShareLoading(true);

        const sharingAvailable = await Sharing.isAvailableAsync();
        const captureUri = await shareCardRef.current?.capture?.();

        if (!sharingAvailable || !captureUri) {
          await shareTextFallback();
          return;
        }

        const dialogTitle =
          target === "whatsapp"
            ? "Share ayah image to WhatsApp"
            : target === "instagram"
              ? "Share ayah image to Instagram"
              : "Share ayah image";

        await Sharing.shareAsync(captureUri, {
          mimeType: "image/png",
          UTI: "public.png",
          dialogTitle,
        });
      } catch {
        await shareTextFallback();
      } finally {
        setShareLoading(false);
      }
    },
    [shareTextFallback]
  );

  const isPlaying = isCurrentAudio && audioStatus === "playing";
  const isLoading = isCurrentAudio && audioStatus === "loading";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isCurrentAudio
            ? theme.isDark
              ? theme.gradientEnd
              : theme.cardBackground + "18"
            : theme.cardBackground,
          borderColor: isCurrentAudio ? theme.primary : theme.border,
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

        <View style={styles.actions}>
          {onPlay && (
            <TouchableOpacity
              onPress={() => onPlay(ayah)}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isCurrentAudio
                    ? isPlaying
                      ? theme.primary
                      : theme.cardBackground
                    : theme.cardBackground,
                },
              ]}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.primaryForeground} />
              ) : (
                <Feather
                  name={isPlaying ? "pause" : "play"}
                  size={15}
                  color={isCurrentAudio ? theme.primaryForeground : theme.textSecondary}
                />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setShowShareSheet(true)}
            style={[styles.actionBtn, { backgroundColor: theme.cardBackground }]}
            activeOpacity={0.7}
          >
            <Feather name="share-2" size={15} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBookmark}
            style={[
              styles.actionBtn,
              { backgroundColor: bookmarked ? theme.accent : theme.cardBackground },
            ]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={18}
              color={bookmarked ? theme.primaryForeground : theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text
        style={[
          styles.arabic,
          {
            color: theme.textPrimary,
            fontSize,
            lineHeight: fontSize * 2,
          },
        ]}
      >
        {ayah.arabic}
      </Text>

      <View style={[styles.separator, { backgroundColor: theme.accent, opacity: 0.25 }]} />

      {activeTranslations.map((translation, index) => {
        const labelColor = translation.code === "en" ? theme.primary : theme.textSecondary;
        return (
          <View
            key={translation.code}
            style={[styles.translationContainer, index > 0 ? { marginTop: 10 } : null]}
          >
            <View style={styles.labelRow}>
              <View style={[styles.labelDot, { backgroundColor: labelColor }]} />
              <Text style={[styles.translationLabel, { color: labelColor }]}>{translation.label}</Text>
            </View>
            <Text
              style={[
                styles.translationText,
                translation.code === "ne" || translation.code === "bn" ? styles.southAsianText : null,
                { color: theme.textPrimary },
              ]}
            >
              {translation.text}
            </Text>
          </View>
        );
      })}

      <TouchableOpacity
        onPress={handleTafsir}
        style={[
          styles.tafsirBtn,
          {
            backgroundColor: showTafsir ? theme.cardBackground : theme.cardBackground,
            borderColor: showTafsir ? theme.primary : "transparent",
          },
        ]}
        activeOpacity={0.75}
      >
        <Feather
          name={showTafsir ? "chevron-up" : "book-open"}
          size={13}
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

      <Modal
        visible={showShareSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareSheet(false)}
      >
        <TouchableOpacity
          style={styles.shareOverlay}
          activeOpacity={1}
          onPress={() => {
            if (!shareLoading) setShowShareSheet(false);
          }}
        />

        <View style={[styles.shareSheet, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={[styles.shareHandle, { backgroundColor: theme.border }]} />

          <View style={styles.shareHeader}>
            <View style={styles.shareHeaderText}>
              <Text style={[styles.shareTitle, { color: theme.textPrimary }]}>Share Ayah as Image</Text>
              <Text style={[styles.shareSub, { color: theme.textSecondary }]}>
                Designed for WhatsApp chats, statuses, Instagram stories, and reels covers.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowShareSheet(false)}
              style={[styles.closeBtn, { backgroundColor: theme.cardBackground }]}
              disabled={shareLoading}
            >
              <Feather name="x" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.shareContent} showsVerticalScrollIndicator={false}>
            <ViewShot
              ref={shareCardRef}
              options={{ format: "png", quality: 1, result: "tmpfile" }}
              style={styles.captureWrap}
            >
              <LinearGradient
                colors={theme.isDark ? [theme.gradientStartDark, theme.gradientStart, theme.gradientEndDark] : [theme.gradientStart, theme.gradientEnd, theme.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shareCard}
              >
                <View style={styles.shareGlowLarge} />
                <View style={styles.shareGlowSmall} />

                <View style={styles.shareChipRow}>
                  <View style={styles.shareChip}>
                    <Text style={styles.shareChipText}>QuranSathi</Text>
                  </View>
                  <Text style={styles.shareReference}>
                    {surahName} {ayah.ayahNumber}
                  </Text>
                </View>

                <Text style={styles.shareArabic}>{ayah.arabic}</Text>

                <View style={styles.shareDividerRow}>
                  <View style={styles.shareDivider} />
                  <Text style={styles.shareDividerMark}>+</Text>
                  <View style={styles.shareDivider} />
                </View>

                {activeTranslations.map((translation, index) => (
                  <Text
                    key={translation.code}
                    style={[
                      styles.shareTranslation,
                      index === 0 ? styles.shareTranslationPrimary : styles.shareTranslationSecondary,
                    ]}
                  >
                    {translation.text}
                  </Text>
                ))}

                <View style={styles.shareFooter}>
                  <Text style={styles.shareFooterTitle}>QuranSathi — Your Quran Companion</Text>
                  <Text style={styles.shareFooterSub}>Read. Reflect. Share khair with our free app.</Text>
                </View>
              </LinearGradient>
            </ViewShot>

            <View style={styles.shareActions}>
              <TouchableOpacity
                onPress={() => handleShareImage("whatsapp")}
                style={[styles.sharePrimaryBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
                disabled={shareLoading}
              >
                <Feather name="message-circle" size={16} color={theme.primaryForeground} />
                <Text style={[styles.sharePrimaryBtnText, { color: theme.primaryForeground }]}>
                  {shareLoading ? "Preparing..." : "Share to WhatsApp"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleShareImage("instagram")}
                style={[styles.shareSecondaryBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                activeOpacity={0.85}
                disabled={shareLoading}
              >
                <Feather name="instagram" size={16} color={theme.primary} />
                <Text style={[styles.shareSecondaryBtnText, { color: theme.textPrimary }]}>
                  Share to Instagram
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleShareImage()}
                style={[styles.shareSecondaryBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                activeOpacity={0.85}
                disabled={shareLoading}
              >
                <Feather name="image" size={16} color={theme.textSecondary} />
                <Text style={[styles.shareSecondaryBtnText, { color: theme.textPrimary }]}>
                  Share Image
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={shareTextFallback}
                style={[styles.shareSecondaryBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                activeOpacity={0.85}
                disabled={shareLoading}
              >
                <Feather name="type" size={16} color={theme.textSecondary} />
                <Text style={[styles.shareSecondaryBtnText, { color: theme.textPrimary }]}>
                  Share Text
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    ...(process.env.EXPO_OS === "web"
      ? ({ boxShadow: "0px 3px 10px rgba(0,0,0,0.07)" } as any)
      : ({
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.07,
          shadowRadius: 10,
          elevation: 3,
        } as any)),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
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
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  arabic: {
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 16,
  },
  separator: {
    height: 1,
    marginBottom: 14,
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
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
  translationText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
  southAsianText: {
    fontSize: 15,
    lineHeight: 26,
  },
  tafsirBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  tafsirBtnText: {
    fontSize: 12,
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
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  tafsirError: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  shareOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.44)",
  },
  shareSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    maxHeight: "84%",
  },
  shareHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 16,
  },
  shareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  shareHeaderText: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  shareSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: 4,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  shareContent: {
    paddingBottom: 24,
  },
  captureWrap: {
    borderRadius: 28,
    overflow: "hidden",
  },
  shareCard: {
    minHeight: 470,
    padding: 24,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  shareGlowLarge: {
    position: "absolute",
    top: -36,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  shareGlowSmall: {
    position: "absolute",
    bottom: 40,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  shareChipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  shareChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  shareChipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  shareReference: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  shareArabic: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 54,
    textAlign: "right",
    writingDirection: "rtl",
    fontFamily: "Inter_400Regular",
    marginTop: 28,
  },
  shareDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 18,
  },
  shareDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  shareDividerMark: {
    color: "#F5E9C6",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  shareTranslation: {
    color: "#FFFFFF",
    lineHeight: 28,
  },
  shareTranslationPrimary: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  shareTranslationSecondary: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginTop: 16,
  },
  shareFooter: {
    marginTop: 26,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
  },
  shareFooterTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  shareFooterSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  shareActions: {
    gap: 10,
    marginTop: 14,
  },
  sharePrimaryBtn: {
    minHeight: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sharePrimaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  shareSecondaryBtn: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareSecondaryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
