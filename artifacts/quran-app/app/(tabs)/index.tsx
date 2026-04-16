import { router } from "expo-router";
import React from "react";
import {
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
import { SURAHS } from "@/data/surahs";

const FEATURED_SURAHS = [1, 36, 55, 67, 97, 112, 113, 114];

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { lastRead, bookmarks } = useQuran();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const featuredSurahs = FEATURED_SURAHS.map((id) => SURAHS.find((s) => s.id === id)!).filter(Boolean);

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
        <Text style={[styles.bismillah, { color: theme.primary }]}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </Text>
        <Text style={[styles.bismillahNepali, { color: theme.mutedForeground }]}>
          अल्लाहको नाममा, अत्यन्त दयालु र कृपालु
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
                Last read
              </Text>
              <Text style={[styles.continueSurah, { color: theme.primaryForeground }]}>
                {lastRead.surahName}
              </Text>
              <Text style={[styles.continueAyah, { color: theme.primaryForeground, opacity: 0.8 }]}>
                Ayah {lastRead.ayahNumber}
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
          <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>Surahs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push("/bookmarks")}
          activeOpacity={0.8}
        >
          <Feather name="bookmark" size={22} color={theme.accent} />
          <Text style={[styles.statNumber, { color: theme.foreground }]}>{bookmarks.length}</Text>
          <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>Bookmarks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push("/settings")}
          activeOpacity={0.8}
        >
          <Feather name="settings" size={22} color={theme.mutedForeground} />
          <Text style={[styles.statNumber, { color: theme.foreground }]}>3</Text>
          <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>Languages</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Featured Surahs</Text>
          <TouchableOpacity onPress={() => router.push("/surahs")}>
            <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
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
                {surah.totalAyahs} ayahs
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.dailyAyah, { color: theme.primary }]}>
          فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ
        </Text>
        <Text style={[styles.dailyAyahNepali, { color: theme.foreground }]}>
          "त तपाईंको पालनकर्ताका कुन नियामतहरूलाई तपाईं दुवैले झुठ्याउनुहुन्छ?"
        </Text>
        <Text style={[styles.dailyAyahRef, { color: theme.mutedForeground }]}>
          — Ar-Rahman 55:13
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 0,
  },
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
  },
  bismillah: {
    fontSize: 28,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 1,
  },
  bismillahNepali: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  quickStats: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
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
  dailyAyah: {
    fontSize: 22,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 12,
  },
  dailyAyahNepali: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    fontStyle: "italic",
    marginBottom: 8,
  },
  dailyAyahRef: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
