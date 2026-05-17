import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { useQuran } from "@/context/QuranContext";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { ensureDailyAyahNotificationScheduled, requestNotificationPermissions } from "@/services/notificationService";
import { translationDownloadService } from "@/services/translationDownloadService";
import type { TranslationLanguage } from "@/services/translationSources";
import { TranslationDownloadModal } from "./TranslationDownloadModal";

const isFabricEnabled = Boolean((globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager);

if (
  Platform.OS === "android" &&
  !isFabricEnabled &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

const STEPS = [
  { id: "intro", title: "Read in 100+ Languages" },
  { id: "languages", title: "Choose your translations" },
  { id: "prayer", title: "Never miss a prayer" },
];

const LANGUAGE_OPTIONS = [
  { id: "hi", name: "Hindi", sub: "हिन्दी" },
  { id: "ne", name: "Nepali", sub: "नेपाली" },
  { id: "bn", name: "Bangla", sub: "বাংলা" },
  { id: "en", name: "English", sub: "English" },
  { id: "id.indonesian", name: "Indonesian", sub: "Bahasa Indonesia" },
  { id: "fr.hamidullah", name: "French", sub: "Français" },
  { id: "es.cortes", name: "Spanish", sub: "Español" },
  { id: "ru.kuliev", name: "Russian", sub: "Русский" },
];

export function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { setUiLanguage, setEnabledTranslationLanguages, registerDownloadedLanguage } = useQuran();
  usePrayerTimes(true);

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["en"]);
  const [showMoreLangs, setShowMoreLangs] = useState(false);

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(currentStep + 1);
      return;
    }

    await setUiLanguage("en");
    await setEnabledTranslationLanguages(selectedLangs as TranslationLanguage[]);

    const remoteLangs = selectedLangs.filter((lang) => !["en", "ne", "bn", "hi", "ar"].includes(lang));
    for (const lang of remoteLangs) {
      translationDownloadService
        .downloadEdition(lang)
        .then((result) => {
          if (result.success) {
            registerDownloadedLanguage(lang).then(() => {
              setEnabledTranslationLanguages([...selectedLangs, lang] as TranslationLanguage[]);
            });
          } else {
            console.warn(`Failed to download onboarding translation ${lang}:`, result.errorMessage);
          }
        })
        .catch(console.error);
    }
  };

  const handleLanguageToggle = (lang: string) => {
    if (lang === "en") return;

    setSelectedLangs((prev) => {
      const exists = prev.includes(lang);
      const next = exists ? prev.filter((item) => item !== lang) : [...prev, lang];
      return next.includes("en") ? next : ["en", ...next];
    });
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermissions();
    if (granted) {
      await ensureDailyAyahNotificationScheduled();
    }
    await handleNext();
  };

  const renderStepIndicator = () => (
    <View style={[styles.indicatorContainer, { top: insets.top + 20 }]}>
      {STEPS.map((_, index) => (
        <View
          key={index}
          style={[
            styles.indicator,
            {
              backgroundColor: index === currentStep ? theme.primary : theme.border,
              width: index === currentStep ? 30 : 12,
            },
          ]}
        />
      ))}
      <TouchableOpacity style={styles.skipBtn} onPress={() => setUiLanguage("en")}>
        <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <View style={[styles.ayahCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.ayahHeader}>
          <Text style={[styles.ayahRef, { color: theme.primary }]}>Al-Ma'idah 5:3</Text>
        </View>
        <Text style={[styles.arabicText, { color: theme.textPrimary }]}>
          {"\u0671\u0644\u0652\u064a\u064e\u0648\u0652\u0645\u064e\u0020\u0623\u064e\u0643\u0652\u0645\u064e\u0644\u0652\u062a\u064f\u0020\u0644\u064e\u0643\u064f\u0645\u0652\u0020\u062f\u0650\u064a\u0646\u064e\u0643\u064f\u0645\u0652"}
        </Text>
        <View style={styles.translationsScroll}>
          <View style={styles.transRow}>
            <Text style={[styles.transLabel, { color: theme.primary }]}>EN</Text>
            <Text style={[styles.transText, { color: theme.textPrimary }]}>
              This day I have perfected for you your religion...
            </Text>
          </View>
          <View style={styles.transRow}>
            <Text style={[styles.transLabel, { color: theme.textSecondary }]}>NE</Text>
            <Text style={[styles.transText, { color: theme.textPrimary }]}>
              {"\u0906\u091c\u0020\u0939\u093e\u092e\u0940\u0932\u0947\u0020\u0924\u093f\u092e\u094d\u0930\u094b\u0020\u0928\u093f\u092e\u094d\u0924\u093f\u0020\u0924\u093f\u092e\u094d\u0930\u094b\u0020\u0927\u0930\u094d\u092e\u0932\u093e\u0908\u0020\u092a\u0942\u0930\u094d\u0923\u0020\u0917\u0930\u093f\u0938\u0915\u0947\u0915\u093e\u0020\u091b\u094c\u0902\u002e\u002e\u002e"}
            </Text>
          </View>
          <View style={styles.transRow}>
            <Text style={[styles.transLabel, { color: "#8B4513" }]}>BN</Text>
            <Text style={[styles.transText, { color: theme.textPrimary }]}>
              {"\u0986\u099c\u0020\u0986\u09ae\u09bf\u0020\u09a4\u09cb\u09ae\u09be\u09a6\u09c7\u09b0\u0020\u099c\u09a8\u09cd\u09af\u0020\u09a4\u09cb\u09ae\u09be\u09a6\u09c7\u09b0\u0020\u09a6\u09cd\u09ac\u09c0\u09a8\u0995\u09c7\u0020\u09aa\u09c2\u09b0\u09cd\u09a3\u09be\u0999\u09cd\u0997\u0020\u0995\u09b0\u09c7\u0020\u09a6\u09bf\u09b2\u09be\u09ae\u002e\u002e\u002e"}
            </Text>
          </View>
        </View>
        <View style={styles.miniChips}>
          {["Arabic", "English", "Indonesian", "Turkish", "100+ More"].map((label) => (
            <View key={label} style={[styles.miniChip, { backgroundColor: theme.border + "40" }]}>
              <Text style={[styles.miniChipText, { color: theme.textSecondary }]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Read in 100+ Languages</Text>
        <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
          Access over 100 global translations. Read Arabic alongside multiple languages simultaneously,
          completely free and offline.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border, borderWidth: 1 }]}
        onPress={handleNext}
      >
        <Text style={[styles.primaryBtnText, { color: theme.textPrimary }]}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.grid}>
        {LANGUAGE_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.gridItem,
              {
                backgroundColor: theme.cardBackground,
                borderColor: selectedLangs.includes(item.id) ? theme.primary : theme.border,
              },
            ]}
            onPress={() => handleLanguageToggle(item.id)}
          >
            <View style={styles.gridHeader}>
              <Text style={[styles.gridName, { color: theme.textPrimary }]}>{item.name}</Text>
              <View
                style={[
                  styles.checkCircle,
                  {
                    backgroundColor: selectedLangs.includes(item.id) ? theme.primary : "transparent",
                    borderColor: theme.border,
                  },
                ]}
              >
                {selectedLangs.includes(item.id) && <Feather name="check" size={14} color="#FFF" />}
              </View>
            </View>
            <Text style={[styles.gridSub, { color: theme.textSecondary }]}>{item.sub}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[
            styles.gridItem,
            { backgroundColor: theme.cardBackground, borderColor: theme.border, borderStyle: "dashed" },
          ]}
          onPress={() => setShowMoreLangs(true)}
        >
          <View style={styles.gridHeader}>
            <Text style={[styles.gridName, { color: theme.textPrimary }]}>More...</Text>
            <Feather name="plus-circle" size={18} color={theme.primary} />
          </View>
          <Text style={[styles.gridSub, { color: theme.textSecondary }]}>Add others</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Choose your translations</Text>
        <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
          Pick the translations you want to see alongside the Arabic. You can change this anytime in settings.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border, borderWidth: 1 }]}
        onPress={handleNext}
      >
        <Text style={[styles.primaryBtnText, { color: theme.textPrimary }]}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={[styles.prayerCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={[styles.prayerHeader, { backgroundColor: theme.primary }]}>
          <View>
            <Text style={styles.nextPrayerLabel}>Next prayer</Text>
            <Text style={styles.nextPrayerName}>Asr</Text>
          </View>
          <Text style={styles.nextPrayerTime}>3:45 PM</Text>
        </View>
        <View style={styles.prayerList}>
          {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((prayer, index) => (
            <View
              key={prayer}
              style={[
                styles.prayerRow,
                index < 4 && { borderBottomWidth: 1, borderBottomColor: theme.border + "40" },
              ]}
            >
              <Text style={[styles.prayerName, { color: theme.textPrimary }]}>{prayer}</Text>
              <Text style={[styles.prayerTime, { color: theme.textSecondary }]}>
                {index === 0
                  ? "5:12 AM"
                  : index === 1
                    ? "12:18 PM"
                    : index === 2
                      ? "3:45 PM"
                      : index === 3
                        ? "6:22 PM"
                        : "7:48 PM"}
              </Text>
              <View
                style={[
                  styles.prayerStatusIndicator,
                  { borderColor: theme.primary, backgroundColor: index <= 1 ? theme.primary : "transparent" },
                ]}
              >
                {index <= 1 && <Feather name="check" size={10} color="#FFF" />}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Never miss a prayer</Text>
        <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
          Get accurate prayer times for your location with optional notifications for each salah.
        </Text>
      </View>

      <View style={styles.btnStack}>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.accent }]} onPress={handleEnableNotifications}>
          <Text style={[styles.primaryBtnText, { color: "#FFF" }]}>Enable notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleNext}>
          <Text style={[styles.secondaryBtnText, { color: theme.primary }]}>Not now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {renderStepIndicator()}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {currentStep === 0 && renderStep0()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
      </ScrollView>
      <TranslationDownloadModal visible={showMoreLangs} onClose={() => setShowMoreLangs(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 100 },
  indicatorContainer: {
    position: "absolute",
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
  },
  indicator: { height: 6, borderRadius: 3 },
  skipBtn: { marginLeft: "auto" },
  skipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  stepContent: { flex: 1, alignItems: "center", justifyContent: "space-between" },
  textContainer: { alignItems: "center", gap: 12, marginVertical: 30 },
  stepTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  stepSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24, opacity: 0.8 },
  ayahCard: { width: "100%", borderRadius: 24, borderWidth: 1, padding: 20, gap: 16 },
  ayahHeader: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  ayahRef: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  arabicText: { fontSize: 28, textAlign: "right", fontFamily: "Inter_400Regular", lineHeight: 48 },
  translationsScroll: { gap: 10 },
  transRow: { flexDirection: "row", gap: 10 },
  transLabel: { fontSize: 10, fontFamily: "Inter_700Bold", marginTop: 4 },
  transText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  miniChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  miniChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  miniChipText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, width: "100%" },
  gridItem: { width: (width - 48 - 12) / 2, padding: 16, borderRadius: 20, borderWidth: 1, gap: 4 },
  gridHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gridName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  gridSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  prayerCard: { width: "100%", borderRadius: 24, borderWidth: 1, overflow: "hidden" },
  prayerHeader: { padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nextPrayerLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular" },
  nextPrayerName: { color: "#FFF", fontSize: 24, fontFamily: "Inter_700Bold" },
  nextPrayerTime: { color: "#FFF", fontSize: 24, fontFamily: "Inter_700Bold" },
  prayerList: { padding: 10 },
  prayerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 10 },
  prayerName: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  prayerTime: { fontSize: 14, fontFamily: "Inter_400Regular", marginRight: 16 },
  prayerStatusIndicator: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  primaryBtn: { width: "100%", height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  btnStack: { width: "100%", gap: 12 },
  secondaryBtn: { width: "100%", height: 48, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
