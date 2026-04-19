import { Stack } from "expo-router";
import React from "react";
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

import { useQuran } from "@/context/QuranContext";
import { useTheme } from "@/hooks/useTheme";
import { RECITERS } from "@/services/audioService";
import { UI_TEXT } from "@/services/i18n";
import { TRANSLATION_SOURCES, type TranslationLanguage } from "@/services/translationSources";

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
  } = useQuran();
  const t = UI_TEXT[uiLanguage];

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleDonate = () => {
    Alert.alert(
      "Support This App",
      "Your support helps keep the Quran app free and ad-free for everyone. JazakAllah Khair!",
      [
        { text: "Maybe Later", style: "cancel" },
        {
          text: "Donate via eSewa",
          onPress: () => Linking.openURL("https://esewa.com.np"),
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
          title: t.settings,
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
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{streak}</Text>
              <Text style={styles.statLbl}>{t.dayStreak}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{readSurahIds.length}</Text>
              <Text style={styles.statLbl}>{t.surahsRead}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{bookmarks.length}</Text>
              <Text style={styles.statLbl}>{t.bookmarks}</Text>
            </View>
          </View>
        </LinearGradient>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t.appearance}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                <Feather name="moon" size={16} color={theme.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{t.darkMode}</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: theme.cardBackground, true: theme.primary }}
              thumbColor={theme.primaryForeground}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t.appLanguage}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {(Object.keys(TRANSLATION_SOURCES) as TranslationLanguage[]).map((code, index, array) => {
            const source = TRANSLATION_SOURCES[code];
            return (
              <React.Fragment key={`ui-${code}`}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => setUiLanguage(code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                      <Feather name="type" size={16} color={theme.primary} />
                    </View>
                    <View>
                      <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{source.label}</Text>
                      <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                        {source.sourceLabel}
                      </Text>
                    </View>
                  </View>
                  {uiLanguage === code ? (
                    <Feather name="check-circle" size={20} color={theme.primary} />
                  ) : (
                    <View style={[styles.radioEmpty, { borderColor: theme.border }]} />
                  )}
                </TouchableOpacity>
                {index < array.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t.quranLanguages}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {(Object.keys(TRANSLATION_SOURCES) as TranslationLanguage[]).map((code, index, array) => {
            const source = TRANSLATION_SOURCES[code];
            return (
              <React.Fragment key={code}>
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                      <Feather name="globe" size={16} color={theme.primary} />
                    </View>
                    <View>
                      <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{source.label}</Text>
                      <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                        {source.sourceLabel}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={enabledLanguages.includes(code)}
                    onValueChange={() => toggleLanguage(code)}
                    trackColor={{ false: theme.cardBackground, true: theme.primary }}
                    thumbColor={theme.primaryForeground}
                  />
                </View>
                {index < array.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t.arabicFontSize}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.fontSizePreview}>
            <Text style={[styles.arabicPreview, { color: theme.primary, fontSize }]}>
              بِسْمِ اللَّهِ
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

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t.defaultReciter}</Text>
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
                      <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: theme.textSecondary }}>
                        {reciter.arabicName}
                      </Text>
                    </View>
                  </View>
                </View>
                {defaultReciter.id === reciter.id ? (
                  <Feather name="check-circle" size={20} color={theme.primary} />
                ) : (
                  <View style={[styles.radioEmpty, { borderColor: theme.border }]} />
                )}
              </TouchableOpacity>
              {index < RECITERS.length - 1 && (
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t.support}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.row} onPress={handleDonate} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#FFF5E6" }]}>
                <Text style={{ fontSize: 16 }}>S</Text>
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{t.supportDevelopment}</Text>
                <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                  {t.supportDevelopmentSub}
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL("https://play.google.com/store")}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                <Feather name="star" size={16} color={theme.accent} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{t.rateApp}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t.about}</Text>
        <View style={[styles.group, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                <Feather name="info" size={16} color={theme.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{t.version}</Text>
            </View>
            <Text style={[styles.rowValue, { color: theme.textSecondary }]}>3.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.cardBackground }]}>
                <Feather name="book" size={16} color={theme.primary} />
              </View>
              <View style={{ flex: 1, alignItems: "flex-start" }}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{t.translations}</Text>
                <Text style={[styles.rowSub, { color: theme.textSecondary, marginTop: 2, lineHeight: 18 }]}>
                  Arabic, English, Nepali, Bangla
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
          {t.disclaimer}
        </Text>
      </ScrollView>
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
    fontFamily: "Inter_600SemiBold",
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 20,
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
  arabicPreview: { fontFamily: "Inter_400Regular", lineHeight: 56 },
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
  radioEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
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
