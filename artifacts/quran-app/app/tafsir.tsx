import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { fetchTafsir } from "@/services/tafsirService";
import { SURAHS } from "@/data/surahs";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Phase = "surah" | "ayah" | "reading";

// ─── Components ────────────────────────────────────────────────────────────────
function SectionLabel({ text, theme }: { text: string; theme: any }) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionDot, { backgroundColor: theme.accent }]} />
      <Text style={[styles.sectionLabelText, { color: theme.textSecondary }]}>{text}</Text>
    </View>
  );
}

function SurahRow({
  surah,
  isSelected,
  onPress,
  theme,
}: {
  surah: (typeof SURAHS)[0];
  isSelected: boolean;
  onPress: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.surahRow,
        {
          backgroundColor: isSelected ? theme.cardBackground : theme.cardBackground,
          borderColor: isSelected ? theme.primary : theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <LinearGradient
        colors={
          isSelected
            ? [theme.primary, theme.primary + "CC"]
            : theme.isDark
            ? [theme.gradientStart, theme.gradientEnd]
            : [theme.gradientStart, theme.gradientEnd]
        }
        style={styles.surahNumBadge}
      >
        <Text style={styles.surahNumText}>{surah.id}</Text>
      </LinearGradient>
      <View style={styles.surahRowBody}>
        <Text style={[styles.surahEn, { color: theme.textPrimary }]}>{surah.nameEnglish}</Text>
        <Text style={[styles.surahMeta, { color: theme.textSecondary }]}>
          {surah.totalAyahs} ayahs · {surah.revelationType}
        </Text>
      </View>
      <Text style={[styles.surahAr, { color: isSelected ? theme.primary : theme.textSecondary }]}>
        {surah.nameArabic}
      </Text>
      {isSelected && (
        <Feather name="check-circle" size={16} color={theme.primary} style={{ marginLeft: 6 }} />
      )}
    </TouchableOpacity>
  );
}

function AyahGrid({
  count,
  selected,
  onSelect,
  theme,
}: {
  count: number;
  selected: number | null;
  onSelect: (n: number) => void;
  theme: any;
}) {
  return (
    <View style={styles.ayahGrid}>
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
        const active = n === selected;
        return (
          <TouchableOpacity
            key={n}
            style={[
              styles.ayahChip,
              {
                backgroundColor: active ? theme.primary : theme.cardBackground,
                borderColor: active ? theme.primary : theme.border,
              },
            ]}
            onPress={() => onSelect(n)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.ayahChipText,
                { color: active ? "#fff" : theme.textPrimary },
              ]}
            >
              {n}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function TafsirHubScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [phase, setPhase] = useState<Phase>("surah");
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [tafsirText, setTafsirText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fadeTransition = useCallback((fn: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      fn();
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const selectedSurah = selectedSurahId != null ? SURAHS.find((s) => s.id === selectedSurahId) : null;
  const totalAyahs = selectedSurah?.totalAyahs ?? 0;

  const handleSelectSurah = useCallback(
    (id: number) => {
      fadeTransition(() => {
        setSelectedSurahId(id);
        setSelectedAyah(null);
        setTafsirText("");
        setError(false);
        setPhase("ayah");
      });
    },
    [fadeTransition]
  );

  const handleRead = useCallback(async (ayahNumber?: number) => {
    if (!selectedSurahId) return;
    const ayahToRead = ayahNumber ?? selectedAyah;
    if (!ayahToRead) return;

    fadeTransition(() => {
      setSelectedAyah(ayahToRead);
      setPhase("reading");
      setTafsirText("");
      setLoading(true);
      setError(false);
    });

    try {
      const text = await fetchTafsir(selectedSurahId, ayahToRead);
      setTafsirText(text);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedSurahId, selectedAyah, fadeTransition]);

  const handleSelectAyah = useCallback(
    (n: number) => {
      handleRead(n);
    },
    [handleRead]
  );

  const handleBack = useCallback(() => {
    fadeTransition(() => {
      if (phase === "reading") {
        setPhase("ayah");
        setTafsirText("");
      } else {
        setPhase("surah");
        setSelectedAyah(null);
        setTafsirText("");
      }
    });
  }, [phase, fadeTransition]);

  // ── Render header breadcrumb ──────────────────────────────────────────────
  const renderBreadcrumb = () => (
    <View style={styles.breadcrumb}>
      <TouchableOpacity
        onPress={() =>
          fadeTransition(() => {
            setPhase("surah");
            setSelectedAyah(null);
            setTafsirText("");
          })
        }
        style={[styles.crumb, phase === "surah" && { opacity: 1 }]}
      >
        <Text style={[styles.crumbText, { color: phase === "surah" ? "#F7F5EA" : "rgba(247,245,234,0.82)" }]}>
          Surah
        </Text>
      </TouchableOpacity>
      <Feather name="chevron-right" size={14} color="rgba(247,245,234,0.72)" />
      <Text
        style={[
          styles.crumbText,
          {
            color:
              phase === "ayah"
                ? "#F7F5EA"
                : phase === "reading"
                  ? "rgba(247,245,234,0.82)"
                  : "rgba(247,245,234,0.62)",
          },
        ]}
      >
        {selectedSurah ? selectedSurah.nameEnglish : "Ayah"}
      </Text>
      {phase === "reading" && (
        <>
          <Feather name="chevron-right" size={14} color="rgba(247,245,234,0.72)" />
          <Text style={[styles.crumbText, { color: "#F7F5EA" }]}>Ayah {selectedAyah}</Text>
        </>
      )}
    </View>
  );

  // ── Phase: Surah picker ─────────────────────────────────────────────────
  const renderSurahPicker = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: bottomInset + 100 }}
    >
      <SectionLabel text="SELECT A SURAH" theme={theme} />
      <View style={styles.surahList}>
        {SURAHS.map((s) => (
          <SurahRow
            key={s.id}
            surah={s}
            isSelected={selectedSurahId === s.id}
            onPress={() => handleSelectSurah(s.id)}
            theme={theme}
          />
        ))}
      </View>
    </ScrollView>
  );

  // ── Phase: Ayah picker ─────────────────────────────────────────────────
  const renderAyahPicker = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: bottomInset + 100 }}
    >
      {selectedSurah && (
        <View style={[styles.surahBanner, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.bannerArabic, { color: theme.primary }]}>{selectedSurah.nameArabic}</Text>
          <Text style={[styles.bannerEn, { color: theme.textPrimary }]}>{selectedSurah.nameEnglish}</Text>
          <Text style={[styles.bannerSub, { color: theme.textSecondary }]}>
            {selectedSurah.totalAyahs} Ayahs · {selectedSurah.revelationType}
          </Text>
        </View>
      )}

      <SectionLabel text="SELECT AN AYAH" theme={theme} />
      <AyahGrid
        count={totalAyahs}
        selected={selectedAyah}
        onSelect={handleSelectAyah}
        theme={theme}
      />

    </ScrollView>
  );

  // ── Phase: Reading ─────────────────────────────────────────────────────
  const renderReading = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: bottomInset + 100 }}
    >
      {/* Reference pill */}
      <View style={[styles.refRow, { backgroundColor: theme.cardBackground }]}>
        <LinearGradient
          colors={theme.isDark ? [theme.gradientStart, theme.gradientEnd] : [theme.gradientStart, theme.gradientEnd]}
          style={styles.refBadge}
        >
          <Text style={styles.refBadgeText}>
            {selectedSurah?.nameEnglish} {selectedAyah}
          </Text>
        </LinearGradient>
        <Text style={[styles.refArabic, { color: theme.primary }]}>{selectedSurah?.nameArabic}</Text>
      </View>

      {/* Source chip */}
      <View style={[styles.sourceChip, { borderColor: theme.border }]}>
        <Feather name="book" size={12} color={theme.textSecondary} />
        <Text style={[styles.sourceChipText, { color: theme.textSecondary }]}>
          Tafsir Ibn Kathir (English) · quran.com
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading tafsir...</Text>
        </View>
      ) : error ? (
        <View style={[styles.errorBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Feather name="wifi-off" size={28} color={theme.destructive} />
          <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>Could not load tafsir</Text>
          <Text style={[styles.errorSub, { color: theme.textSecondary }]}>
            Check your internet connection and try again.
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={() => {
              void handleRead();
            }}
          >
            <Text style={[styles.retryBtnText, { color: "#fff" }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.tafsirBody, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.tafsirText, { color: theme.textPrimary }]}>{tafsirText}</Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: "Tafsir Hub",
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.textPrimary,
          headerShadowVisible: false,
          headerLeft:
            phase !== "surah"
              ? () => (
                  <TouchableOpacity onPress={handleBack} style={{ paddingHorizontal: 8 }}>
                    <Feather name="arrow-left" size={22} color={theme.textPrimary} />
                  </TouchableOpacity>
                )
              : undefined,
        }}
      />

      {/* Banner */}
      <LinearGradient
        colors={theme.isDark ? [theme.gradientStart, theme.gradientEnd] : [theme.gradientStart, theme.gradientEnd]}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>Tafsir Hub</Text>
        <Text style={styles.bannerSubtitle}>Ibn Kathir — English commentary</Text>
        {renderBreadcrumb()}
      </LinearGradient>

      {/* Content */}
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        {phase === "surah" && renderSurahPicker()}
        {phase === "ayah" && renderAyahPicker()}
        {phase === "reading" && renderReading()}
      </Animated.View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Banner
  banner: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "web" ? 20 : 16,
    paddingBottom: 18,
    gap: 2,
  },
  bannerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  bannerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(247,245,234,0.88)",
    marginBottom: 10,
  },

  // Breadcrumb
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  crumb: { opacity: 1 },
  crumbText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  // Section label
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionLabelText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  // Surah list
  surahList: { gap: 8 },
  surahRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    ...Platform.select({
      web: { boxShadow: "0px 1px 4px rgba(0,0,0,0.05)" },
      native: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    }),
  },
  surahNumBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  surahNumText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  surahRowBody: { flex: 1 },
  surahEn: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  surahMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  surahAr: { fontSize: 16, fontFamily: "Inter_400Regular" },

  // Surah banner (ayah phase)
  surahBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    alignItems: "center",
    gap: 4,
    marginBottom: 20,
  },
  bannerArabic: { fontSize: 28, fontFamily: "Inter_400Regular" },
  bannerEn: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 2 },
  bannerSub: { fontSize: 12, fontFamily: "Inter_400Regular" },

  // Ayah grid
  ayahGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  ayahChip: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" },
      native: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
    }),
  },
  ayahChipText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  // Read button
  readBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 10,
    ...Platform.select({
      web: { boxShadow: "0px 4px 14px rgba(26,106,76,0.35)" },
      native: { shadowColor: "#1A6A4C", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 },
    }),
  },
  readBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  // Reading phase
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  refBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  refBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  refArabic: {
    fontSize: 22,
    fontFamily: "Inter_400Regular",
    flex: 1,
    textAlign: "right",
  },
  sourceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  sourceChipText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginTop: 6,
  },
  errorSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  tafsirBody: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    ...Platform.select({
      web: { boxShadow: "0px 2px 10px rgba(0,0,0,0.06)" },
      native: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    }),
  },
  tafsirText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 27,
  },
});
