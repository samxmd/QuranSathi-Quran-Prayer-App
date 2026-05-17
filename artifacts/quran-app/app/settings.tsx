import { Stack, useRouter } from "expo-router";
import React from "react";
import * as StoreReview from "expo-store-review";
import { APP_CONFIG, APP_LIVE_ON_STORE } from "@/constants/appConfig";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useQuran } from "@/context/QuranContext";
import { useTheme } from "@/hooks/useTheme";
import { RECITERS } from "@/services/audioService";
import { TRANSLATION_SOURCES, type TranslationLanguage } from "@/services/translationSources";
import { useTranslation } from "react-i18next";
import { clearSurahCache } from "@/services/quranApi";
import { TranslationDownloadModal } from "@/components/TranslationDownloadModal";
import { getEditionDisplayInfo } from "@/services/availableTranslations";

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    fontSize,
    setFontSize,
    uiLanguage,
    setUiLanguage,
    enabledLanguages,
    toggleLanguage,
    darkMode,
    toggleDarkMode,
    defaultReciter,
    setDefaultReciter,
    streak,
    readSurahIds,
    bookmarks,
    showTajweed,
    toggleTajweed,
    downloadedLanguageCodes,
    removeDownloadedLanguage,
  } = useQuran();
  const { t } = useTranslation();
  const router = useRouter();
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleDonate = () => {
    router.push("/donate" as any);
  };

  const handleRate = async () => {
    try {
      const available = await StoreReview.isAvailableAsync();
      if (available) {
        await StoreReview.requestReview();
      } else {
        await Linking.openURL(`market://details?id=${APP_CONFIG.packageId}`);
      }
    } catch {
      await Linking.openURL(APP_CONFIG.playStoreUrl);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      t("clearCache"),
      "This will remove all locally stored translations. You will need an internet connection to re-download them.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearSurahCache();
            Alert.alert("Success", "App cache has been cleared.");
          },
        },
      ]
    );
  };

  const gradColors: [string, string] = theme.isDark
    ? [theme.gradientStart, theme.gradientEnd]
    : [theme.gradientStart, theme.gradientEnd];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: t("settings"),
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.textPrimary,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={gradColors} style={styles.statsBanner}>
          <View style={styles.headerDecorCircle1} />
          <View style={styles.headerDecorCircle2} />
          <View style={styles.headerDecorCircle3} />

          <View style={[styles.goldOrnament, { marginBottom: 16 }]}>
            <View style={styles.ornLine} />
            <Text style={styles.ornStar}>✦</Text>
            <View style={styles.ornLine} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{streak}</Text>
              <Text style={styles.statLbl}>{t("dayStreak").toUpperCase()}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{readSurahIds.length}</Text>
              <Text style={styles.statLbl}>{t("surahsRead").toUpperCase()}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{bookmarks.length}</Text>
              <Text style={styles.statLbl}>{t("bookmarks").toUpperCase()}</Text>
            </View>
          </View>

          <View style={[styles.goldOrnament, { marginTop: 16 }]}>
            <View style={styles.ornLine} />
            <Text style={styles.ornStar}>✦</Text>
            <View style={styles.ornLine} />
          </View>
        </LinearGradient>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("appearance")}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                <Feather name="moon" size={16} color={theme.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{t("darkMode")}</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: theme.cardBackground, true: theme.primary }}
              thumbColor={theme.primaryForeground}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                <Feather name="layers" size={16} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{t("tajweed")}</Text>
                <Text style={[styles.rowSub, { color: theme.textSecondary }]}>{t("tajweedSub")}</Text>
              </View>
            </View>
            <Switch
              value={showTajweed}
              onValueChange={toggleTajweed}
              trackColor={{ false: theme.cardBackground, true: theme.primary }}
              thumbColor={theme.primaryForeground}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 10 }]}>{t("interfaceLanguage")}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {[
            { id: "en" as const, name: "English" },
            { id: "ne" as const, name: "नेपाली" },
            { id: "bn" as const, name: "বাংলা" },
          ].map((item, index, array) => {
            const isSelected = uiLanguage === item.id;
            return (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setUiLanguage(item.id);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                      <Feather name="type" size={16} color={theme.primary} />
                    </View>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{item.name}</Text>
                  </View>
                  <View style={[
                    styles.radioCircle, 
                    { borderColor: isSelected ? theme.primary : theme.border }
                  ]}>
                    {isSelected && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                  </View>
                </TouchableOpacity>
                {index < array.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 24 }]}>{t("quranTranslations")}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {(Object.keys(TRANSLATION_SOURCES) as Array<keyof typeof TRANSLATION_SOURCES>).map((code, index, array) => {
            const source = TRANSLATION_SOURCES[code];
            return (
              <React.Fragment key={code}>
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                      <Feather name="globe" size={16} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                        {source.label}
                      </Text>
                      <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>
                        {source.sourceLabel}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={enabledLanguages.includes(code)}
                    onValueChange={() => toggleLanguage(code)}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={Platform.OS === 'ios' ? undefined : "#FFFFFF"}
                  />
                </View>
                {(index < array.length - 1 || downloadedLanguageCodes.length > 0) && (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              </React.Fragment>
            );
          })}

          {downloadedLanguageCodes.map((code) => {
            const editionInfo = getEditionDisplayInfo(code);
            
            return (
              <React.Fragment key={code}>
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                      <Feather name="download-cloud" size={16} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                        {editionInfo.label}
                      </Text>
                      <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>
                        {editionInfo.sublabel}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rowRight}>
                    <TouchableOpacity 
                      onPress={() => removeDownloadedLanguage(code)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="trash-2" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <Switch
                      value={enabledLanguages.includes(code)}
                      onValueChange={() => toggleLanguage(code)}
                      trackColor={{ false: theme.border, true: theme.primary }}
                      thumbColor={Platform.OS === 'ios' ? undefined : "#FFFFFF"}
                    />
                  </View>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              </React.Fragment>
            );
          })}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity 
            style={styles.row} 
            onPress={() => setShowDownloadModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.primary + "10" }]}>
                <Feather name="plus-circle" size={16} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: theme.primary, fontFamily: "Inter_700Bold" }]}>
                  Download More...
                </Text>
                <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                   Select from 100+ translations
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("arabicFontSize")}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={[styles.fontSizePreview, { backgroundColor: theme.isDark ? "rgba(0,0,0,0.1)" : "#fdfbf7" }]}>
            <Text style={[styles.arabicPreview, { color: theme.primary, fontSize }]}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
          </View>
          <View style={styles.fontButtons}>
            {[20, 24, 28, 32, 36].map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.fontBtn,
                  {
                    backgroundColor: fontSize === size ? theme.primary : theme.cardBackground,
                    borderColor: fontSize === size ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setFontSize(size)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.fontBtnText,
                    { color: fontSize === size ? theme.primaryForeground : theme.textSecondary },
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("defaultReciter")}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {RECITERS.map((reciter, index) => (
            <React.Fragment key={reciter.id}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => setDefaultReciter(reciter)}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                    <Feather name="mic" size={16} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, alignItems: "flex-start" }}>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{reciter.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, flexWrap: "wrap", columnGap: 6 }}>
                      <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: theme.textSecondary, textTransform: "uppercase" }}>
                        {reciter.style}
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.textSecondary }}>•</Text>
                      <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: theme.textSecondary }} numberOfLines={1}>
                        {reciter.arabicName}
                      </Text>
                    </View>
                  </View>
                </View>
                {defaultReciter.id === reciter.id ? (
                  <Feather name="check-circle" size={20} color={theme.primary} />
                ) : (
                  <View style={[styles.radioCircle, { borderColor: theme.border }]} />
                )}
              </TouchableOpacity>
              {index < RECITERS.length - 1 && (
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("support")}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.row, { paddingVertical: 18 }]}
            onPress={handleDonate}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.accent + "20" }]}>
                <Feather name="heart" size={18} color={theme.accent} />
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: theme.textPrimary, fontFamily: "Inter_700Bold" }]}>
                  {t("supportDevelopment")}
                </Text>
                <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                  {t("supportDevelopmentSub")}
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {APP_LIVE_ON_STORE && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <TouchableOpacity
                style={styles.row}
                onPress={handleRate}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                    <Feather name="star" size={16} color={theme.accent} />
                  </View>
                  <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{t("rateApp")}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("about")}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.row}
            onPress={() => router.push("/about" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                <Feather name="info" size={16} color={theme.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>About QuranSathi</Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("advanced")}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.row} onPress={handleClearCache} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                <Feather name="trash-2" size={16} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{t("clearCache")}</Text>
                <Text style={[styles.rowSub, { color: theme.textSecondary }]}>{t("clearCacheSub")}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
          {t("disclaimer")}
        </Text>
      </ScrollView>

      <TranslationDownloadModal 
        visible={showDownloadModal} 
        onClose={() => setShowDownloadModal(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsBanner: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: { alignItems: "center", gap: 4 },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  statLbl: { fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular" },
  statDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.2)" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 24,
    letterSpacing: 0.5,
  },
  group: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  rowValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  fontSizePreview: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd8cc",
  },
  arabicPreview: {
    fontFamily: "ScheherazadeNew_400Regular",
    lineHeight: 60,
    textAlign: "center",
  },
  headerDecorCircle1: { position: "absolute", top: -10, right: -10, width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  headerDecorCircle2: { position: "absolute", top: -25, right: -25, width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  headerDecorCircle3: { position: "absolute", top: -45, right: -45, width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  goldOrnament: { flexDirection: "row", alignItems: "center", gap: 10, width: "60%", alignSelf: "center" },
  ornLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  ornStar: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  fontButtons: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
    justifyContent: "center",
  },
  fontBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  fontBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rowRight: {
    flexDirection: "row", 
    alignItems: "center", 
    gap: 16,
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 20,
    lineHeight: 20,
    marginBottom: 8,
  },
});
