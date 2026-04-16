import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuran } from "@/context/QuranContext";
import { useTheme } from "@/hooks/useTheme";
import { useDailyAyah } from "@/hooks/useDailyAyah";
import { SURAHS } from "@/data/surahs";

const FEATURED_SURAHS = [1, 36, 55, 67, 97, 112, 113, 114];

function getGreeting(): { arabic: string; nepali: string } {
  const hour = new Date().getHours();
  if (hour < 5)  return { arabic: "السَّلَامُ عَلَيْكُمْ", nepali: "शुभ रात्री" };
  if (hour < 12) return { arabic: "السَّلَامُ عَلَيْكُمْ", nepali: "शुभ प्रभात" };
  if (hour < 17) return { arabic: "السَّلَامُ عَلَيْكُمْ", nepali: "शुभ दिउँसो" };
  if (hour < 20) return { arabic: "السَّلَامُ عَلَيْكُمْ", nepali: "शुभ साँझ" };
  return { arabic: "السَّلَامُ عَلَيْكُمْ", nepali: "शुभ रात्री" };
}

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { lastRead, bookmarks, readSurahIds } = useQuran();
  const { ayah: dailyAyah, loading: dailyLoading } = useDailyAyah();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const greeting = useMemo(() => getGreeting(), []);
  const featuredSurahs = FEATURED_SURAHS.map((id) => SURAHS.find((s) => s.id === id)!).filter(Boolean);
  const readCount = readSurahIds.length;
  const progressPct = Math.round((readCount / 114) * 100);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 20, paddingBottom: bottomInset + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroSection}>
        <Text style={[styles.greetingArabic, { color: theme.primary }]}>
          {greeting.arabic}
        </Text>
        <Text style={[styles.greetingNepali, { color: theme.mutedForeground }]}>
          {greeting.nepali}
        </Text>
      </View>

      {lastRead && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Continue Reading</Text>
          <TouchableOpacity
            style={[styles.continueCard, { backgroundColor: theme.primary }]}
            onPress={() =>
              router.push({
                pathname: "/reader/[id]",
                params: { id: lastRead.surahId, ayah: lastRead.ayahNumber },
              })
            }
            activeOpacity={0.85}
          >
            <View>
              <Text style={[styles.continueLabel, { color: theme.primaryForeground, opacity: 0.75 }]}>
                अन्तिम पठन
              </Text>
              <Text style={[styles.continueSurah, { color: theme.primaryForeground }]}>
                {lastRead.surahName}
              </Text>
              <Text style={[styles.continueAyah, { color: theme.primaryForeground, opacity: 0.8 }]}>
                आयत {lastRead.ayahNumber}
              </Text>
            </View>
            <Feather name="book-open" size={32} color={theme.primaryForeground} style={{ opacity: 0.6 }} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.quickStats}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push("/surahs")}
          activeOpacity={0.8}
        >
          <Feather name="list" size={22} color={theme.primary} />
          <Text style={[styles.statNumber, { color: theme.foreground }]}>114</Text>
          <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>सूराहरू</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push("/bookmarks")}
          activeOpacity={0.8}
        >
          <Feather name="bookmark" size={22} color={theme.accent} />
          <Text style={[styles.statNumber, { color: theme.foreground }]}>{bookmarks.length}</Text>
          <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>बुकमार्क</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push("/surahs")}
          activeOpacity={0.8}
        >
          <Feather name="check-circle" size={22} color={theme.primary} />
          <Text style={[styles.statNumber, { color: theme.foreground }]}>{readCount}</Text>
          <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>पठिएको</Text>
        </TouchableOpacity>
      </View>

      {readCount > 0 && (
        <View style={[styles.progressSection, { paddingHorizontal: 16, marginBottom: 24 }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: theme.foreground }]}>
              पठन प्रगति
            </Text>
            <Text style={[styles.progressPct, { color: theme.primary }]}>
              {readCount}/114 ({progressPct}%)
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.muted }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: theme.primary, width: `${progressPct}%` as any },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Featured Surahs</Text>
          <TouchableOpacity onPress={() => router.push("/surahs")}>
            <Text style={[styles.seeAll, { color: theme.primary }]}>सबै हेर्नुहोस्</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredScroll}
        >
          {featuredSurahs.map((surah) => (
            <TouchableOpacity
              key={surah.id}
              style={[styles.featuredCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() =>
                router.push({ pathname: "/reader/[id]", params: { id: surah.id } })
              }
              activeOpacity={0.8}
            >
              <Text style={[styles.featuredArabic, { color: theme.primary }]}>
                {surah.nameArabic}
              </Text>
              <Text style={[styles.featuredEnglish, { color: theme.foreground }]}>
                {surah.nameEnglish}
              </Text>
              <Text style={[styles.featuredNepali, { color: theme.mutedForeground }]}>
                {surah.nameNepali}
              </Text>
              <Text style={[styles.featuredMeta, { color: theme.mutedForeground }]}>
                {surah.totalAyahs} आयतहरू
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.dailySection, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.dailyHeader}>
          <Feather name="sun" size={14} color={theme.primary} />
          <Text style={[styles.dailyLabel, { color: theme.primary }]}>  आजको आयत</Text>
        </View>
        {dailyLoading ? (
          <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
        ) : dailyAyah ? (
          <>
            <Text style={[styles.dailyArabic, { color: theme.foreground }]}>
              {dailyAyah.arabic}
            </Text>
            {dailyAyah.nepali ? (
              <Text style={[styles.dailyNepali, { color: theme.mutedForeground }]}>
                "{dailyAyah.nepali}"
              </Text>
            ) : null}
            <TouchableOpacity
              onPress={() => {
                const [sid] = dailyAyah.reference.split(":");
                router.push({ pathname: "/reader/[id]", params: { id: Number(sid) } });
              }}
            >
              <Text style={[styles.dailyRef, { color: theme.primary }]}>
                — {dailyAyah.surahName} {dailyAyah.reference}  →
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={[styles.dailyNepali, { color: theme.mutedForeground }]}>
            आयत लोड हुन सकेन
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 0 },
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 6,
  },
  greetingArabic: {
    fontSize: 26,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 1,
  },
  greetingNepali: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  quickStats: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  progressSection: {},
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  progressPct: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  continueCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  continueLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  continueSurah: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  continueAyah: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  featuredScroll: {
    gap: 12,
    paddingRight: 16,
  },
  featuredCard: {
    width: 140,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  featuredArabic: {
    fontSize: 22,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    marginBottom: 6,
  },
  featuredEnglish: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  featuredNepali: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  featuredMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  dailySection: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
  },
  dailyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dailyLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  dailyArabic: {
    fontSize: 22,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    lineHeight: 42,
    marginBottom: 14,
  },
  dailyNepali: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    fontStyle: "italic",
    marginBottom: 12,
  },
  dailyRef: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
