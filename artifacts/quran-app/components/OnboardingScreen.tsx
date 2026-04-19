import React, { useState, useEffect } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useQuran } from "@/context/QuranContext";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { requestNotificationPermissions } from "@/services/notificationService";
import type { TranslationLanguage } from "@/services/translationSources";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

const STEPS = [
  { id: "intro", title: "Read in your language" },
  { id: "languages", title: "Choose your translations" },
  { id: "prayer", title: "Never miss a prayer" },
];

export function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { setUiLanguage, enabledLanguages, toggleLanguage } = useQuran();
  const { prayers, loading: prayerLoading } = usePrayerTimes(true);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["ne", "bn", "ar"]);

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(currentStep + 1);
    } else {
      // Finalize: Set UI language to Nepali (default for this region) and exit
      // In practice, we might want to ask which one is UI, but for now, we just close
      await setUiLanguage("en"); // Default UI
    }
  };

  const handleLanguageToggle = (lang: TranslationLanguage) => {
    setSelectedLangs(prev => {
      const exists = prev.includes(lang);
      const next = exists ? prev.filter(l => l !== lang) : [...prev, lang];
      // Sync with context immediately so step 1 card updates
      toggleLanguage(lang);
      return next;
    });
  };

  const handleEnableNotifications = async () => {
    await requestNotificationPermissions();
    handleNext();
  };

  const renderStepIndicator = () => (
    <View style={[styles.indicatorContainer, { top: insets.top + 20 }]}>
      {STEPS.map((_, i) => (
        <View
          key={i}
          style={[
            styles.indicator,
            {
              backgroundColor: i === currentStep ? theme.primary : theme.border,
              width: i === currentStep ? 30 : 12,
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
          الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ
        </Text>
        <View style={styles.translationsScroll}>
          <View style={styles.transRow}>
            <Text style={[styles.transLabel, { color: theme.primary }]}>EN</Text>
            <Text style={[styles.transText, { color: theme.textPrimary }]}>This day I have perfected for you your religion...</Text>
          </View>
          <View style={styles.transRow}>
            <Text style={[styles.transLabel, { color: theme.textSecondary }]}>NE</Text>
            <Text style={[styles.transText, { color: theme.textPrimary }]}>आज मैले तिम्रो धर्म तिम्रा लागि पूर्ण गरिदिएँ...</Text>
          </View>
          <View style={styles.transRow}>
            <Text style={[styles.transLabel, { color: "#8B4513" }]}>BN</Text>
            <Text style={[styles.transText, { color: theme.textPrimary }]}>আজ আমি তোমাদের জন্য তোমাদের দ্বীনকে পূর্ণাঙ্গ করলাম...</Text>
          </View>
        </View>
        <View style={styles.miniChips}>
          {["Arabic", "English", "Nepali", "Bangla"].map(l => (
            <View key={l} style={[styles.miniChip, { backgroundColor: theme.border + "40" }]}>
              <Text style={[styles.miniChipText, { color: theme.textSecondary }]}>{l}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Read in your language</Text>
        <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
          Arabic, English, Nepali and Bangla — side by side, every ayah, completely free.
        </Text>
      </View>
      
      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border, borderWidth: 1 }]} onPress={handleNext}>
        <Text style={[styles.primaryBtnText, { color: theme.textPrimary }]}>Next →</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.grid}>
        {[
          { id: "ne" as const, name: "नेपाली", sub: "Nepali" },
          { id: "bn" as const, name: "বাংলা", sub: "Bangla" },
          { id: "en" as const, name: "English", sub: "English" },
          { id: "ar" as const, name: "العربية", sub: "Arabic", disabled: true },
        ].map((item: any) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.gridItem,
              { 
                backgroundColor: theme.cardBackground, 
                borderColor: (selectedLangs.includes(item.id) || item.disabled) ? theme.primary : theme.border 
              }
            ]}
            onPress={() => !item.disabled && handleLanguageToggle(item.id)}
            disabled={item.disabled}
          >
            <View style={styles.gridHeader}>
               <Text style={[styles.gridName, { color: theme.textPrimary }]}>{item.name}</Text>
               <View style={[styles.checkCircle, { backgroundColor: (selectedLangs.includes(item.id) || item.disabled) ? theme.primary : "transparent", borderColor: theme.border }]}>
                  {(selectedLangs.includes(item.id) || item.disabled) && <Feather name="check" size={14} color="#FFF" />}
               </View>
            </View>
            <Text style={[styles.gridSub, { color: theme.textSecondary }]}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Choose your translations</Text>
        <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
          Pick the languages you want to see alongside the Arabic. You can change this anytime in settings.
        </Text>
      </View>
      
      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border, borderWidth: 1 }]} onPress={handleNext}>
        <Text style={[styles.primaryBtnText, { color: theme.textPrimary }]}>Continue →</Text>
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
             {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((p, i) => (
                <View key={p} style={[styles.prayerRow, i < 4 && { borderBottomWidth: 1, borderBottomColor: theme.border + "40" }]}>
                   <Text style={[styles.prayerName, { color: theme.textPrimary }]}>{p}</Text>
                   <Text style={[styles.prayerTime, { color: theme.textSecondary }]}>{i === 0 ? "5:12 AM" : i === 1 ? "12:18 PM" : i === 2 ? "3:45 PM" : i === 3 ? "6:22 PM" : "7:48 PM"}</Text>
                   <View style={[styles.prayerStatusIndicator, { borderColor: theme.primary, backgroundColor: i <= 1 ? theme.primary : "transparent" }]}>
                      {i <= 1 && <Feather name="check" size={10} color="#FFF" />}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 100 },
  indicatorContainer: { 
    position: "absolute", left: 24, right: 24, 
    flexDirection: "row", alignItems: "center", gap: 8, zIndex: 10 
  },
  indicator: { height: 6, borderRadius: 3 },
  skipBtn: { marginLeft: "auto" },
  skipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  stepContent: { flex: 1, alignItems: "center", justifyContent: "space-between" },
  textContainer: { alignItems: "center", gap: 12, marginVertical: 30 },
  stepTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  stepSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24, opacity: 0.8 },
  
  // Step 0: Ayah Card
  ayahCard: { width: "100%", borderRadius: 24, borderWidth: 1, padding: 20, gap: 16 },
  ayahHeader: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.03)" },
  ayahRef: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  arabicText: { fontSize: 28, textAlign: "right", fontFamily: "Inter_400Regular", lineHeight: 48 },
  translationsScroll: { gap: 10 },
  transRow: { flexDirection: "row", gap: 10 },
  transLabel: { fontSize: 10, fontFamily: "Inter_700Bold", marginTop: 4 },
  transText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  miniChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  miniChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  miniChipText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  
  // Step 1: Lang Grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, width: "100%" },
  gridItem: { width: (width - 48 - 12) / 2, padding: 16, borderRadius: 20, borderWidth: 1, gap: 4 },
  gridHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gridName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  gridSub: { fontSize: 13, fontFamily: "Inter_400Regular" },

  // Step 2: Prayer Card
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

  // Shared Buttons
  primaryBtn: { width: "100%", height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  btnStack: { width: "100%", gap: 12 },
  secondaryBtn: { width: "100%", height: 48, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
