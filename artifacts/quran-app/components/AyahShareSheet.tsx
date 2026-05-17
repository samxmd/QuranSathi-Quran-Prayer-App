import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Share as RNShare,
  Image,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import Svg, { Path, Defs, Pattern, Rect } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import { Ayah } from "@/data/ayahs";

function sanitizeFilePart(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export interface AyahShareSheetProps {
  visible: boolean;
  onClose: () => void;
  ayah: Ayah;
  surahName: string;
  surahId: number;
  uiLanguage: string;
  translations: Array<{ code: string; label: string; text: string }>;
  initialLangCode: string;
}

type ShareTheme = "emerald" | "midnight" | "royal" | "mushaf";
type ShareFormat = "post" | "story";

interface ThemeConfig {
  id: ShareTheme;
  name: string;
  colors: [string, string, ...string[]];
  textColor: string;
  secondaryTextColor: string;
  accentColor: string;
  patternOpacity: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const SHARE_THEMES: ThemeConfig[] = [
  {
    id: "emerald",
    name: "Sacred Emerald",
    colors: ["#0E4D3E", "#1A6A4C", "#0A3D2A"],
    textColor: "#FFFFFF",
    secondaryTextColor: "rgba(255,255,255,0.75)",
    accentColor: "#D4AC7A",
    patternOpacity: 0.05,
  },
  {
    id: "midnight",
    name: "Midnight Gold",
    colors: ["#0C0C0C", "#1A1A1A", "#0C0C0C"],
    textColor: "#FFFFFF",
    secondaryTextColor: "rgba(255,255,255,0.7)",
    accentColor: "#D4AC7A",
    patternOpacity: 0.04,
  },
  {
    id: "royal",
    name: "Royal Velvet",
    colors: ["#1A0B2E", "#2D144A", "#1A0B2E"],
    textColor: "#FFFFFF",
    secondaryTextColor: "rgba(255,255,255,0.7)",
    accentColor: "#D4AC7A",
    patternOpacity: 0.04,
  },
  {
    id: "mushaf",
    name: "Antique Mushaf",
    colors: ["#FDFBF7", "#F3EEE2", "#FDFBF7"],
    textColor: "#2C251D",
    secondaryTextColor: "#5C544B",
    accentColor: "#8B6914",
    patternOpacity: 0.03,
  },
];

const IslamicPattern = ({
  color,
  opacity,
  width,
  height,
}: {
  color: string;
  opacity: number;
  width: number;
  height: number;
}) => (
  <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
    <Defs>
      <Pattern
        id="islamic-grid"
        width="60"
        height="60"
        patternUnits="userSpaceOnUse"
        viewBox="0 0 60 60"
      >
        <Path
          d="M30 0 L34 18 L52 22 L36 30 L40 48 L30 36 L20 48 L24 30 L8 22 L26 18 Z"
          fill={color}
          fillOpacity={opacity}
          transform="translate(0, 0) scale(0.8)"
        />
        <Path
          d="M0 30 L18 34 L22 52 L30 36 L48 40 L36 30 L48 20 L30 24 L22 8 L18 26 Z"
          fill={color}
          fillOpacity={opacity}
          transform="translate(30, 30) scale(0.6)"
        />
      </Pattern>
    </Defs>
    <Rect width={width} height={height} fill="url(#islamic-grid)" />
  </Svg>
);

const MihrabArch = ({ color, width, height }: { color: string; width: number; height: number }) => {
  const peakY = height * 0.05;
  const archTopY = height * 0.25;
  const paddingX = 15;
  const centerX = width / 2;

  const d = `
    M ${paddingX} ${height}
    L ${paddingX} ${archTopY}
    Q ${paddingX} ${peakY * 2} ${centerX} ${peakY}
    Q ${width - paddingX} ${peakY * 2} ${width - paddingX} ${archTopY}
    L ${width - paddingX} ${height}
  `;

  return (
    <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
      <Path d={d} stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
      <Path d={d} stroke={color} strokeWidth="0.5" fill="none" opacity="0.4" transform="scale(0.98)" />
    </Svg>
  );
};

const QuranSathiBranding = ({
  logoSize,
  brandFontSize,
  sloganFontSize,
  gap,
}: {
  logoSize: number;
  brandFontSize: number;
  sloganFontSize: number;
  gap: number;
}) => (
  <View style={[styles.footerInner, { gap }]}>
    <Image
      source={require("../assets/images/icon.png")}
      style={[styles.officialLogo, { width: logoSize, height: logoSize, borderRadius: Math.round(logoSize * 0.22) }]}
      resizeMode="contain"
    />
    <View>
      <Text style={[styles.footerBrandName, { fontSize: brandFontSize }]}>QuranSathi</Text>
      <Text style={[styles.footerSlogan, { fontSize: sloganFontSize }]}>Share a Quran reminder</Text>
    </View>
  </View>
);

export function AyahShareSheet({
  visible,
  onClose,
  ayah,
  surahName,
  surahId,
  uiLanguage,
  translations,
  initialLangCode,
}: AyahShareSheetProps) {
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(SHARE_THEMES[0]);
  const [selectedLang, setSelectedLang] = useState(initialLangCode);
  const [selectedFormat, setSelectedFormat] = useState<ShareFormat>("post");

  useEffect(() => {
    setSelectedLang(initialLangCode);
  }, [initialLangCode]);

  const activeTranslationText =
    translations.find((t) => t.code === selectedLang)?.text ||
    translations[0]?.text ||
    "";
  const activeTranslationLabel =
    translations.find((t) => t.code === selectedLang)?.label ||
    translations[0]?.label ||
    "Translation";
  const referenceLabel = `${surahName} ${surahId}:${ayah.ayahNumber}`;
  const arabicLength = ayah.arabic.replace(/\s+/g, "").length;
  const translationLength = activeTranslationText.length;

  const shareTextFallback = useCallback(async () => {
    await RNShare.share({
      message: `${ayah.arabic}\n\n${activeTranslationText}\n\n${referenceLabel}\nShared via QuranSathi`,
    });
  }, [activeTranslationText, ayah.arabic, referenceLabel]);

  const handleShare = useCallback(async () => {
    if (isSharing) return;
    if (Platform.OS === "web") {
      await shareTextFallback();
      return;
    }

    try {
      setIsSharing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const captureUri = await viewShotRef.current?.capture?.();
      if (!captureUri) throw new Error("Capture failed");

      const safeSurahName = sanitizeFilePart(surahName) || `surah-${surahId}`;
      const shareUri = `${FileSystem.cacheDirectory}QuranSathi-${safeSurahName}-${surahId}-${ayah.ayahNumber}.png`;
      await FileSystem.copyAsync({ from: captureUri, to: shareUri });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(shareUri, {
          mimeType: "image/png",
          dialogTitle: `Ayah Share - ${surahName}`,
          UTI: "public.png",
        });
      } else {
        await shareTextFallback();
      }
    } catch (error) {
      console.error("Capture capture failed", error);
      await shareTextFallback();
    } finally {
      setIsSharing(false);
    }
  }, [ayah.ayahNumber, isSharing, shareTextFallback, surahId, surahName]);

  const horizontalSheetPadding = 40;
  const sheetTopReserve = 320;
  const previewMaxWidth = Math.min(screenWidth - horizontalSheetPadding, 520);
  const previewMaxHeight = Math.max(280, screenHeight - sheetTopReserve);
  const targetRatio = selectedFormat === "story" ? 1.78 : 1.35;
  const cardWidthFromHeight = previewMaxHeight / targetRatio;
  const cardWidth = Math.max(220, Math.min(previewMaxWidth, cardWidthFromHeight));
  const cardHeight = cardWidth * targetRatio;
  const previewScale = cardWidth / 336;
  const formatDescription =
    selectedFormat === "story" ? "Best for WhatsApp and Facebook stories" : "Best for posts and status updates";
  const isStory = selectedFormat === "story";
  const arabicScaleAdjustment = clamp(1 - Math.max(0, arabicLength - 72) * 0.0035, 0.84, 1.04);
  const translationScaleAdjustment = clamp(1 - Math.max(0, translationLength - 120) * 0.0028, 0.8, 1.02);
  const compactFooter = cardHeight < 540 || translationLength > 180;
  const contentPaddingTop = Math.round((isStory ? 28 : 18) * previewScale);
  const contentPaddingHorizontal = Math.round((isStory ? 40 : 30) * previewScale);
  const arabicFontSize = Math.max(18, Math.round((isStory ? 30 : 26) * previewScale * arabicScaleAdjustment));
  const arabicLineHeight = Math.max(arabicFontSize * 1.48, Math.round((isStory ? 52 : 44) * previewScale * arabicScaleAdjustment));
  const arabicMarginBottom = Math.round((isStory ? 26 : 18) * previewScale * clamp(arabicScaleAdjustment, 0.9, 1));
  const translationLabelMarginBottom = Math.round((isStory ? 8 : 6) * previewScale);
  const translationFontSize = Math.max(13, Math.round((isStory ? 19 : 17) * previewScale * translationScaleAdjustment));
  const translationLineHeight = Math.max(translationFontSize * 1.42, Math.round((isStory ? 28 : 25) * previewScale * translationScaleAdjustment));
  const translationFrameMarginBottom = Math.round((isStory ? 16 : 10) * previewScale);
  const translationReferenceMarginTop = Math.max(8, Math.round(12 * previewScale));
  const footerVerticalPadding = Math.round((compactFooter ? 10 : isStory ? 14 : 10) * previewScale);
  const translationLabelFontSize = Math.max(9, Math.round(11 * previewScale));
  const translationReferenceFontSize = Math.max(10, Math.round(12 * previewScale));
  const refTextFontSize = Math.max(10, Math.round(12 * previewScale));
  const footerBrandFontSize = Math.max(11, Math.round((compactFooter ? 13 : 14) * previewScale));
  const footerSloganFontSize = Math.max(8, Math.round((compactFooter ? 9 : 10) * previewScale));
  const logoSize = Math.max(30, Math.round(38 * previewScale));
  const footerGap = Math.max(8, Math.round(10 * previewScale));
  const brandingFooterHorizontalPadding = Math.max(14, Math.round(20 * previewScale));
  const goldFrameInset = Math.max(3, Math.round(4 * previewScale));
  const goldFrameRadius = Math.max(8, Math.round(8 * previewScale));
  const translationPanelRadius = Math.max(14, Math.round(18 * previewScale));
  const translationPanelPaddingHorizontal = Math.max(12, Math.round(18 * previewScale));
  const translationPanelPaddingVertical = Math.max(10, Math.round(14 * previewScale));
  const translationPanelBackground =
    currentTheme.id === "mushaf" ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.07)";
  const translationPanelBorder =
    currentTheme.id === "mushaf" ? "rgba(139,105,20,0.18)" : "rgba(212,172,122,0.18)";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

      <View style={[styles.sheet, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />

        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Share Ayah as Image</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Create a beautiful Quran card people will want to repost.
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1.0, result: "tmpfile" }}
            style={styles.captureContainer}
          >
            <LinearGradient
              colors={currentTheme.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.shareCard, { width: cardWidth, height: cardHeight }]}
            >
              <IslamicPattern
                color={currentTheme.id === "mushaf" ? "#000" : currentTheme.textColor}
                opacity={currentTheme.patternOpacity}
                width={cardWidth}
                height={cardHeight}
              />

              <MihrabArch color={currentTheme.accentColor} width={cardWidth} height={cardHeight} />

              <View style={styles.contentContainer}>
                <View
                  style={[
                    styles.ayahContent,
                    {
                      paddingTop: contentPaddingTop,
                      paddingHorizontal: contentPaddingHorizontal,
                    },
                  ]}
                >

                  <View
                    style={[
                      styles.translationFrame,
                      {
                        marginBottom: translationFrameMarginBottom,
                        backgroundColor: translationPanelBackground,
                        borderColor: translationPanelBorder,
                        borderRadius: translationPanelRadius,
                        paddingHorizontal: translationPanelPaddingHorizontal,
                        paddingVertical: translationPanelPaddingVertical,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.translationText,
                        {
                          color: currentTheme.textColor,
                          fontSize: translationFontSize,
                          lineHeight: translationLineHeight,
                        },
                        (selectedLang === "ne" || selectedLang === "bn") && styles.southAsianFont,
                      ]}
                    >
                      {activeTranslationText}
                    </Text>
                    <Text
                      style={[
                        styles.translationReferenceText,
                        {
                          color: currentTheme.accentColor,
                          fontSize: translationReferenceFontSize,
                          marginTop: translationReferenceMarginTop,
                        },
                      ]}
                    >
                      {referenceLabel}
                    </Text>
                  </View>


                </View>

                <View style={[styles.brandingFooter, {
                    backgroundColor: currentTheme.id === "mushaf" ? "rgba(243,238,226,0.95)" : "rgba(255,255,255,0.97)",
                    borderTopColor: currentTheme.id === "mushaf" ? "rgba(139,105,20,0.15)" : "rgba(0,0,0,0.06)",
                  }]}>
                  <View
                    style={[
                      styles.brandingFooterInner,
                      {
                        paddingVertical: footerVerticalPadding,
                        paddingHorizontal: brandingFooterHorizontalPadding,
                      },
                    ]}
                  >
                  <QuranSathiBranding
                    logoSize={logoSize}
                    brandFontSize={footerBrandFontSize}
                    sloganFontSize={footerSloganFontSize}
                    gap={footerGap}
                  />
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.goldFrame,
                  {
                    borderColor: currentTheme.accentColor,
                    pointerEvents: "none",
                    margin: goldFrameInset,
                    borderRadius: goldFrameRadius,
                  },
                ]}
              />
            </LinearGradient>
          </ViewShot>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>CHOOSE FORMAT</Text>
            <View style={styles.formatSelector}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedFormat("post");
                }}
                style={[
                  styles.formatBtn,
                  {
                    backgroundColor: selectedFormat === "post" ? theme.primary : theme.cardBackground,
                    borderColor: selectedFormat === "post" ? theme.primary : theme.border,
                  },
                ]}
              >
                <Feather
                  name="grid"
                  size={16}
                  color={selectedFormat === "post" ? theme.primaryForeground : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.formatBtnText,
                    { color: selectedFormat === "post" ? theme.primaryForeground : theme.textPrimary },
                  ]}
                >
                  Post
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedFormat("story");
                }}
                style={[
                  styles.formatBtn,
                  {
                    backgroundColor: selectedFormat === "story" ? theme.primary : theme.cardBackground,
                    borderColor: selectedFormat === "story" ? theme.primary : theme.border,
                  },
                ]}
              >
                <Feather
                  name="smartphone"
                  size={16}
                  color={selectedFormat === "story" ? theme.primaryForeground : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.formatBtnText,
                    { color: selectedFormat === "story" ? theme.primaryForeground : theme.textPrimary },
                  ]}
                >
                  Story
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.formatHint, { color: theme.textSecondary }]}>{formatDescription}</Text>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SELECT AESTHETIC</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectorContainer}
            >
              {SHARE_THEMES.map((t) => (
                <TouchableOpacity
                  key={t.name}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrentTheme(t);
                  }}
                  style={[
                    styles.themeBubble,
                    {
                      backgroundColor: t.colors[0],
                      borderColor: currentTheme.name === t.name ? "#D4AC7A" : "transparent",
                      borderWidth: 2,
                    },
                  ]}
                />
              ))}
            </ScrollView>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 24 }]}>CHOOSE LANGUAGE</Text>
            <View style={styles.langSelector}>
              {translations.map((t) => (
                <TouchableOpacity
                  key={t.code}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedLang(t.code);
                  }}
                  style={[
                    styles.langBtn,
                    {
                      backgroundColor: selectedLang === t.code ? "#D4AC7A" : "rgba(255,255,255,0.05)",
                      borderColor: selectedLang === t.code ? "#D4AC7A" : "rgba(255,255,255,0.1)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.langBtnText,
                      { color: selectedLang === t.code ? "#000" : "#D4AC7A" },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.actionsBox}>
            <TouchableOpacity
              onPress={handleShare}
              disabled={isSharing}
              style={[styles.shareBtn, { backgroundColor: theme.primary }]}
            >
              {isSharing ? (
                <ActivityIndicator color={theme.primaryForeground} />
              ) : (
                <>
                  <Feather name="image" size={20} color={theme.primaryForeground} />
                  <Text style={[styles.shareBtnText, { color: theme.primaryForeground }]}>
                    {Platform.OS === "web" ? "Share as Text" : "Share Image"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={shareTextFallback} style={[styles.outlineBtn, { borderColor: theme.border }]}>
              <Text style={[styles.outlineBtnText, { color: theme.textPrimary }]}>Share as Text</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={[styles.outlineBtn, { borderColor: theme.border }]}>
              <Text style={[styles.outlineBtnText, { color: theme.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "96%",
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 99,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    opacity: 0.8,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  captureContainer: {
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
  },
  shareCard: {
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  goldFrame: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    margin: 4,
    borderRadius: 8,
    opacity: 0.4,
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
  },
  ayahContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 28,
  },
  arabicText: {
    fontSize: 30,
    textAlign: "center",
    fontFamily: "ScheherazadeNew_400Regular",
    lineHeight: 52,
    marginBottom: 26,
  },
  translationFrame: {
    marginBottom: 16,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
  },
  translationLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  translationText: {
    fontSize: 19,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 28,
  },
  translationReferenceText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  refText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    opacity: 0.9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  brandingFooter: {
    width: "100%",
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  brandingFooterInner: {
    width: "100%",
  },
  footerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  footerBrandName: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#0E4D3E",
    letterSpacing: 0.2,
  },
  footerSlogan: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  officialLogo: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  selectorContainer: {
    gap: 14,
    paddingHorizontal: 2,
  },
  themeBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  langSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  langBtnText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  southAsianFont: {
    lineHeight: 32,
  },
  section: {
    marginTop: 28,
  },
  formatSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  formatBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  formatBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  formatHint: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 24,
    opacity: 0.85,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginBottom: 16,
    opacity: 0.6,
  },
  actionsBox: {
    marginTop: 32,
    gap: 14,
  },
  shareBtn: {
    height: 60,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  shareBtnText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  outlineBtn: {
    height: 54,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
