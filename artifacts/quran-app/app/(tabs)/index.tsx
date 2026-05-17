import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  InteractionManager,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar as NativeStatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";

import { SURAHS } from "@/data/surahs";
import { useQuran } from "@/context/QuranContext";
import { useReadingPlan } from "@/hooks/useReadingPlan";
import { TodayReadingCard } from "@/components/TodayReadingCard";
import { ReadingPlanCTA } from "@/components/ReadingPlanCTA";
import { useDailyAyah } from "@/hooks/useDailyAyah";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { type UiLanguage } from "@/services/i18n";
import { prefetchSurahAyahs } from "@/services/quranApi";
import { getIslamicEventLabel, toHijri } from "@/utils/hijriCalendar";
import { Skeleton } from "@/components/Skeleton";
import { TranslationText } from "@/components/TranslationText";
const FEATURED_SURAHS = [1, 36, 55, 67, 97, 112, 113, 114];

function getGreeting(t: any): { arabic: string; localized: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { arabic: "بِسْمِ اللَّهِ", localized: t("greetingMorning") };
  if (hour >= 12 && hour < 17) return { arabic: "الْحَمْدُ لِلَّهِ", localized: t("greetingAfternoon") };
  if (hour >= 17 && hour < 21) return { arabic: "سُبْحَانَ اللَّهِ", localized: t("greetingEvening") };
  return { arabic: "السَّلَامُ عَلَيْكُمْ", localized: t("greetingNight") };
}

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { 
    lastRead, readSurahIds, streak, totalTimeToday, 
    uiLanguage, enabledLanguages, isLoading: contextLoading,
    totalAyahsRead, totalHasanat
  } = useQuran();
  const { plan: activePlan } = useReadingPlan();
  const [startupTasksReady, setStartupTasksReady] = React.useState(false);
  const { ayah: dailyAyah, loading: dailyLoading } = useDailyAyah(startupTasksReady);
  const { nextPrayer, countdown, loading: prayerLoading } = usePrayerTimes(startupTasksReady);
  const { t } = useTranslation();

  const topInset = Platform.OS === "web"
    ? 20
    : Platform.OS === "android"
      ? Math.max(insets.top, NativeStatusBar.currentHeight ?? 0)
      : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const greeting = useMemo(() => getGreeting(t), [t]);
  const featuredSurahs = FEATURED_SURAHS.map((id) =>
    SURAHS.find((surah) => surah.id === id)!
  ).filter(Boolean);
  const readCount = readSurahIds.length;
  const progressPct = Math.round((readCount / 114) * 100);

  useEffect(() => {
    if (Platform.OS === "web") {
      setStartupTasksReady(true);
      return;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      setStartupTasksReady(true);
    });

    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (!startupTasksReady) return;

    const likelySurahs = [lastRead?.surahId, ...FEATURED_SURAHS.slice(0, 3)].filter(
      (value): value is number => typeof value === "number"
    );

    likelySurahs.forEach((surahId) => {
      prefetchSurahAyahs(surahId, enabledLanguages);
    });
  }, [lastRead?.surahId, startupTasksReady]);

  const hijri = useMemo(() => toHijri(), []);
  const islamicEvent = useMemo(() => getIslamicEventLabel(hijri, uiLanguage), [hijri, uiLanguage]);

  const gradColors = theme.isDark ? [theme.gradientStart, theme.gradientEnd] as [string, string] : [theme.gradientStart, theme.gradientEnd] as [string, string];

  const formatTotalTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    const s = seconds % 60;
    if (hrs > 0) return `${hrs}h ${m}m`;
    if (mins > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const renderProgressTracker = () => {
    const size = 140; // Increased size
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progressPct / 100) * circumference;

    return (
      <View style={styles.heroSectionContent}>
        {/* Progress Hero */}
        <View style={styles.heroCircleContainer}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.primary}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View style={styles.heroCircleCenter}>
            <Text style={[styles.heroPctText, { color: theme.textPrimary }]}>{progressPct}%</Text>
            <Text style={[styles.heroPctLabel, { color: theme.textSecondary }]}>{t("completed")}</Text>
          </View>
        </View>

        {/* Stats Group */}
        <View style={styles.heroStatsGroup}>
          <View style={styles.heroStatRow}>
            <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]}>{t("surahsRead")}: </Text>
            <Text style={[styles.heroStatValue, { color: theme.textPrimary }]}>{readCount}</Text>
          </View>
          <View style={styles.heroStatRow}>
            <Text style={[styles.heroStatValue, { color: theme.textPrimary }]}>{114 - readCount} </Text>
            <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]}>{t("surahsLeft")}</Text>
          </View>
          {streak > 0 && (
            <View style={styles.heroStatRow}>
              <Text style={styles.heroStatEmoji}>🔥 </Text>
              <Text style={[styles.heroStatValue, { color: theme.textPrimary }]}>{streak} </Text>
              <Text style={[styles.heroStatLabel, { color: theme.textSecondary }]}>{t("dayStreak")}</Text>
            </View>
          )}
        </View>

        {/* Minimal Progress Bar */}
        <View style={styles.minimalProgressContainer}>
          <Text style={[styles.minimalProgressLabel, { color: theme.textSecondary }]}>{t("quranProgress")}</Text>
          <View style={[styles.minimalProgressBarTrack, { backgroundColor: theme.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
            <View style={[styles.minimalProgressBarFill, { backgroundColor: theme.primary, width: `${progressPct}%` }]} />
          </View>
          <Text style={[styles.minimalProgressPct, { color: theme.primary }]}>{progressPct}%</Text>
        </View>

        {/* Motivational Line */}
        <Text style={[styles.motivationalLine, { color: theme.textSecondary }]}>
          {t("motivationalText")}
        </Text>
      </View>
    );
  };

  const renderImpactStats = () => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
      return num.toString();
    };

    return (
      <View style={styles.homeImpactGrid}>
        <View style={styles.homeImpactItem}>
          <View style={[styles.impactIconCircleSmall, { backgroundColor: "#FF6B6B10" }]}>
            <Feather name="book-open" size={12} color="#FF6B6B" />
          </View>
          <View style={styles.impactTextContainer}>
            <Text style={[styles.impactValueLarge, { color: theme.textPrimary }]}>{totalAyahsRead}</Text>
            <Text style={[styles.impactLabelSmall, { color: theme.textSecondary }]}>{t("statsVerses")}</Text>
          </View>
        </View>
        <View style={styles.impactDivider} />
        <View style={styles.homeImpactItem}>
          <View style={[styles.impactIconCircleSmall, { backgroundColor: "#FFD93D10" }]}>
            <Feather name="heart" size={12} color="#FFD93D" />
          </View>
          <View style={styles.impactTextContainer}>
            <Text style={[styles.impactValueLarge, { color: theme.textPrimary }]}>{formatNumber(totalHasanat)}</Text>
            <Text style={[styles.impactLabelSmall, { color: theme.textSecondary }]}>{t("statsHasanat")}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={gradColors} style={[styles.headerSection, { paddingTop: topInset + 20 }]}>
        <View style={styles.headerDecorCircle1} />
        <View style={styles.headerDecorCircle2} />
        <View style={styles.headerDecorCircle3} />

        <TouchableOpacity style={styles.settingsIconBtn} onPress={() => router.push("/settings")}>
          <View style={styles.settingsCircle}>
            <Feather name="settings" size={20} color="rgba(255,255,255,0.7)" />
          </View>
        </TouchableOpacity>

        <Text style={[styles.greetingArabic, { color: theme.accent }]}>{contextLoading ? "" : greeting.arabic}</Text>
        <Text style={[styles.greetingNepali, { color: theme.accent }]}>{contextLoading ? "" : greeting.localized}</Text>

        <View style={styles.thinLine} />

        <View style={styles.bismillahBox}>
          <Text style={[styles.bismillahArabic, { color: theme.accent }]}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
        </View>

        <View style={styles.hijriChip}>
          <Text style={styles.hijriDateText}>{hijri.formatted}</Text>
        </View>

        {streak > 0 && (
          <View style={styles.streakChip}>
            <Text style={styles.streakText}>🔥 {streak} {t("dayStreak").toLowerCase()}</Text>
          </View>
        )}

        <View style={styles.goldOrnament}>
          <View style={styles.ornLine} />
          <Text style={styles.ornStar}>✦</Text>
          <View style={styles.ornLine} />
        </View>

        {islamicEvent ? (
          <View style={styles.eventChip}>
            <Text style={styles.eventText}>{islamicEvent}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.heroSearchBar}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push("/search");
          }}
          activeOpacity={0.85}
        >
          <Feather name="search" size={16} color="rgba(255,255,255,0.6)" />
          <Text style={styles.heroSearchText}>{t("searchSurahs")}</Text>
        </TouchableOpacity>
      </LinearGradient>

      {prayerLoading || !startupTasksReady ? (
        <View style={styles.skeletonContainer}>
          <Skeleton height={94} radius={18} />
        </View>
      ) : nextPrayer && (
        <TouchableOpacity
          style={[styles.prayerWidget, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push("/(tabs)/prayer");
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.prayerIconBox, { backgroundColor: "#F5E6A3" }]}>
            <Feather name="bell" size={22} color="#C9A84C" />
          </View>

          <View style={styles.prayerInfo}>
            <Text style={[styles.prayerLabel, { color: theme.textSecondary }]}>
              {t("nextPrayer")}
            </Text>
            <Text style={[styles.prayerName, { color: theme.textPrimary }]}>{nextPrayer.name}</Text>
          </View>

          <View style={styles.prayerTimeCol}>
            <Text style={[styles.prayerTimer, { color: theme.primary }]}>
              {nextPrayer.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Text style={[styles.prayerAt, { color: theme.textSecondary }]}>
              in {countdown}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── DAILY AYAH (Higher Hierarchy) ────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRowContainerLine}>
          <View style={[styles.verticalBar, { backgroundColor: theme.primary }]} />
          <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>{t("dailyAyah")}</Text>
        </View>
        <View style={[styles.dailyCard, { backgroundColor: theme.cardBackground, borderColor: theme.accent }]}>
          <View style={[styles.dailyCardCurve, { borderColor: theme.accent }]} />

          <View style={[styles.verseBadge, { backgroundColor: theme.accent + "20" }]}>
            <MaterialCommunityIcons name="star-crescent" size={13} color={theme.accent} />
            <Text style={[styles.verseBadgeText, { color: theme.textSecondary }]}>QURANSATHI — AYAH OF THE DAY</Text>
          </View>

          {dailyLoading || !startupTasksReady ? (
            <View style={{ gap: 12 }}>
              <Skeleton height={28} style={{ marginVertical: 10 }} />
              <Skeleton height={20} width="80%" />
              <Skeleton height={20} width="95%" />
              <Skeleton height={20} width="40%" style={{ marginTop: 10 }} />
            </View>
          ) : dailyAyah ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                const [surahId, ayahNum] = dailyAyah.reference.split(":");
                router.push({
                  pathname: "/reader/[id]",
                  params: { id: Number(surahId), ayah: Number(ayahNum) }
                });
              }}
            >
              <Text style={[styles.dailyArabic, { color: theme.textPrimary }]}>{dailyAyah.arabic}</Text>
              <TranslationText
                text={`"${dailyAyah[uiLanguage === "bn" ? "bangla" : uiLanguage === "ne" ? "nepali" : "english"]}"`}
                languageCode={uiLanguage}
                baseFontSize={15}
                color={theme.textSecondary}
                style={styles.dailyTranslation}
              />
              <View style={[styles.dailyRefContainer, { borderTopColor: theme.border }]}>
                <Text style={[styles.dailyRef, { color: theme.primary }]}>
                  {dailyAyah.surahName} {dailyAyah.reference}
                </Text>
                <Feather name="arrow-right" size={14} color={theme.primary} />
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.dailyTranslation, { color: theme.textSecondary }]}>{t("couldNotLoadAyah")}</Text>
          )}
        </View>
      </View>

      {/* ── MY PROGRESS SECTION ───────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRowContainerLine}>
          <View style={[styles.verticalBar, { backgroundColor: theme.primary }]} />
          <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>{t("lastRead")}</Text>
        </View>

        {contextLoading ? (
          <Skeleton height={126} radius={24} style={{ marginTop: 16 }} />
        ) : lastRead ? (
          <TouchableOpacity
            style={[styles.continueReadCard, { backgroundColor: theme.primary, marginTop: 16 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push({
                pathname: "/reader/[id]",
                params: { id: lastRead.surahId, ayah: lastRead.ayahNumber },
              });
            }}
            activeOpacity={0.9}
          >
            <View style={styles.continueCardLeft}>
              <Text style={styles.continueCardLabel}>{t("lastRead")}</Text>
              <Text style={styles.continueCardSurah}>{lastRead.surahName}</Text>
              <Text style={styles.continueCardAyah}>{t("ayah")} {lastRead.ayahNumber}</Text>
            </View>
            <View style={styles.continueIconCircle}>
              <Feather name="book-open" size={26} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.continueReadCard, { backgroundColor: theme.primary, marginTop: 16 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push({ pathname: "/reader/[id]", params: { id: 1 } });
            }}
            activeOpacity={0.9}
          >
            <View style={styles.continueCardLeft}>
              <Text style={styles.continueCardLabel}>{t("welcome")}</Text>
              <Text style={styles.continueCardSurah}>{t("startJourney")}</Text>
              <Text style={styles.continueCardAyah}>{t("beginWithAlFatihah")}</Text>
            </View>
            <View style={styles.continueIconCircle}>
              <Feather name="book" size={26} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRowContainerLine}>
          <View style={[styles.verticalBar, { backgroundColor: theme.primary }]} />
          <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
            {t("myProgress", "My Progress")}
          </Text>
        </View>

        {contextLoading ? (
          <View style={{ marginTop: 16 }}>
            <Skeleton height={126} radius={24} style={{ marginBottom: 16 }} />
            <Skeleton height={200} radius={24} />
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/stats")}
            style={[styles.unifiedProgressCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          >
            {renderImpactStats()}
            <View style={[styles.unifiedDivider, { backgroundColor: theme.border }]} />
            {renderProgressTracker()}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRowContainerLine}>
          <View style={[styles.verticalBar, { backgroundColor: theme.primary }]} />
          <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>{t("readingPlan")}</Text>
        </View>
        {activePlan ? <TodayReadingCard /> : <ReadingPlanCTA />}
      </View>



      <View style={styles.section}>
        <View style={styles.sectionTitleRowContainerLine}>
          <View style={[styles.verticalBar, { backgroundColor: theme.primary }]} />
          <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>{t("spiritualHub")}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/spiritual-hub")}
          style={{ borderRadius: 20, overflow: "hidden", marginTop: 16 }}
        >
          <LinearGradient
            colors={["#4CAF5022", "#2196F314"]}
            style={{
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#4CAF5044",
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            }}
          >
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "#4CAF5018", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 28 }}>🌿</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: theme.textPrimary, marginBottom: 4 }}>
                {t("spiritualHub")}
              </Text>
              <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: theme.textSecondary, lineHeight: 18 }}>
                {t("spiritualHubDesc")}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRowContainerLine}>
          <View style={[styles.verticalBar, { backgroundColor: theme.primary }]} />
          <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>{t("quickAccess")}</Text>
        </View>
        <View style={styles.quickAccessGrid}>
          {[
            { icon: "book-open-variant", label: t("surahs"), route: "/(tabs)/surahs", color: theme.primary, bg: theme.cardBackground },
            { icon: "compass-outline", label: t("qibla"), route: "/qibla", color: theme.accent, bg: theme.accent + "20" },
            { icon: "bookmark-check-outline", label: t("bookmarks"), route: "/favorites", color: theme.primary, bg: theme.cardBackground },
            { icon: "dots-horizontal-circle-outline", label: t("dhikr"), route: "/dhikr", color: "#6A1B9A", bg: theme.isDark ? "#3B1466" : "#F3E5F5" },
            { icon: "book-open-page-variant", label: t("tafsir"), route: "/tafsir", color: "#7B4FCC", bg: theme.isDark ? "#2A1A4A" : "#F0E8FF" },
            { icon: "view-grid-outline", label: t("tools"), route: "/(tabs)/utilities", color: theme.accent, bg: theme.accent + "20" },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.smallActionBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                router.push(item.route as any);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.smallActionIcon, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={[styles.smallActionLabel, { color: theme.textPrimary }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>



      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRowContainerLine}>
            <View style={[styles.verticalBar, { backgroundColor: theme.primary }]} />
            <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>{t("featuredSurahs")}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/surahs")}>
            <Text style={[styles.seeAll, { color: theme.primary }]}>{t("seeAll")}</Text>
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
              style={[styles.featuredCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() =>
                router.push({ pathname: "/reader/[id]", params: { id: surah.id } })
              }
              activeOpacity={0.82}
            >
              <View style={[styles.featuredAccentBar, { backgroundColor: theme.primary }]} />

              <View style={styles.featuredTopRow}>
                <View style={[styles.featuredNumberBadge, { backgroundColor: theme.cardBackground, borderColor: theme.primary + "30" }]}>
                  <Text style={[styles.featuredNumberText, { color: theme.primary }]}>{surah.id}</Text>
                </View>
                <Text style={[styles.featuredArabic, { color: theme.primary }]} numberOfLines={1}>
                  {surah.nameArabic}
                </Text>
              </View>

              <Text style={[styles.featuredEnglish, { color: theme.textPrimary }]} numberOfLines={1}>
                {surah.nameEnglish}
              </Text>

              {surah.meaning ? (
                <Text style={[styles.featuredMeaning, { color: theme.textSecondary }]} numberOfLines={1}>
                  {surah.meaning}
                </Text>
              ) : null}

              <View style={[styles.featuredDivider, { backgroundColor: theme.border }]} />

              <View style={styles.featuredMetaRow}>
                <View style={[styles.featuredTypePill, { backgroundColor: surah.revelationType === "Meccan" ? theme.accent + "20" : theme.cardBackground }]}>
                  <Text style={[styles.featuredTypeText, { color: surah.revelationType === "Meccan" ? theme.textSecondary : theme.primary }]}>
                    {surah.revelationType}
                  </Text>
                </View>
                <Text style={[styles.featuredAyahCount, { color: theme.textSecondary }]}>
                  {surah.totalAyahs} ayahs
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skeletonContainer: { marginHorizontal: 16, marginTop: 20, marginBottom: 20 },
  content: { paddingHorizontal: 0 },
  headerSection: {
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 6,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    position: "relative",
  },
  headerDecorCircle1: { position: "absolute", top: -10, right: -10, width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  headerDecorCircle2: { position: "absolute", top: -25, right: -25, width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  headerDecorCircle3: { position: "absolute", top: -45, right: -45, width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  settingsIconBtn: { position: "absolute", right: 24, top: 40, zIndex: 10 },
  settingsCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  greetingArabic: { fontSize: 42, fontFamily: "ScheherazadeNew_400Regular", color: "#FFFFFF", marginTop: 24, textAlign: "center", width: "100%" },
  greetingNepali: { fontSize: 16, fontFamily: "Inter_500Medium", color: "#FFFFFF", marginBottom: 12, textAlign: "center", width: "100%" },
  thinLine: { width: "12%", height: 1, backgroundColor: "rgba(255,255,255,0.4)", marginVertical: 6, alignSelf: "center" },
  bismillahBox: { marginTop: 4, marginBottom: 12, width: "100%", alignItems: "center" },
  bismillahArabic: { fontSize: 26, fontFamily: "ScheherazadeNew_400Regular", color: "rgba(255,255,255,0.85)", textAlign: "center" },
  hijriChip: { backgroundColor: "rgba(205,180,194,0.15)", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(205,180,122,0.4)", marginBottom: 8, alignSelf: "center" },
  hijriDateText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFEEA6" },
  streakChip: { backgroundColor: "rgba(255,150,0,0.2)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(255,150,0,0.5)", marginBottom: 10, alignSelf: "center" },
  streakText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(255,200,100,0.95)" },
  goldOrnament: { flexDirection: "row", alignItems: "center", gap: 10, width: "70%", marginVertical: 14, alignSelf: "center" },
  ornLine: { flex: 1, height: 1, backgroundColor: "rgba(205,180,122,0.3)" },
  ornStar: { color: "rgba(205,180,122,0.8)", fontSize: 14 },
  eventChip: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    marginBottom: 10,
  },
  eventText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.84)" },
  heroSearchBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: "100%",
    marginTop: 10,
  },
  heroSearchText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.55)",
    flex: 1,
  },
  prayerWidget: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    ...Platform.select({
      web: { boxShadow: "0px 2px 10px rgba(0,0,0,0.05)" } as any,
      native: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    }),
  },
  prayerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  prayerInfo: { flex: 1, gap: 2 },
  prayerLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  prayerName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  prayerAt: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  prayerTimeCol: { alignItems: "flex-end", gap: 2 },
  prayerTimer: { fontSize: 20, fontFamily: "Inter_700Bold" },
  quickAccessGrid: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 16,
  },
  smallActionBtn: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  smallActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  smallActionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 16,
    ...Platform.select({
      web: { boxShadow: "0px 2px 10px rgba(0,0,0,0.05)" } as any,
      native: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    }),
  },
  progressRingWrap: {
    width: 88, height: 88,
    alignItems: "center", justifyContent: "center",
    position: "relative", flexShrink: 0, marginTop: 2,
  },
  progressRingCenter: { position: "absolute", alignItems: "center", gap: 0 },
  progressPct: { fontSize: 20, fontFamily: "Inter_700Bold" },
  progressPctLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  progressStats: { flex: 1, gap: 8, paddingTop: 2 },
  progressStatRow: { flexDirection: "row", alignItems: "center", minHeight: 22 },
  progressStatIconBox: { width: 16, alignItems: "center", justifyContent: "center", marginRight: 8 },
  progressStatDot: { width: 8, height: 8, borderRadius: 4 },
  progressStatEmoji: { fontSize: 14 },
  progressStatNum: { fontSize: 16, fontFamily: "Inter_700Bold", width: 36 },
  progressStatLabel: { fontSize: 12, fontFamily: "Inter_400Regular", flexShrink: 1 },
  milestoneContainer: { height: 16, justifyContent: "center", position: "relative", marginTop: 4 },
  milestoneLine: { height: 4, borderRadius: 2, overflow: "hidden", width: "100%" },
  milestoneFill: { position: "absolute", left: 0, top: 0, height: 4, borderRadius: 2 },
  milestoneMark: { position: "absolute", width: 8, height: 8, borderRadius: 4, marginLeft: -4 },
  milestoneLabels: { height: 14, position: "relative", marginTop: 2 },
  milestoneLabelWrapper: { position: "absolute", width: 40, marginLeft: -20, alignItems: "center" },
  milestoneLabelText: { fontSize: 9, fontFamily: "Inter_500Medium" },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleRowContainer: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  sectionTitleRowContainerLine: { flexDirection: "row", alignItems: "center", gap: 10 },
  verticalBar: { width: 4, height: 20, borderRadius: 2 },
  sectionTitleText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  continueReadCard: { borderRadius: 24, padding: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  continueCardLeft: { flex: 1, gap: 4 },
  continueCardLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)" },
  continueCardSurah: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  continueCardAyah: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  continueIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  featuredScroll: { gap: 10, paddingRight: 20, paddingLeft: 2, paddingVertical: 4 },
  featuredCard: {
    width: 156,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 14,
    gap: 0,
    ...Platform.select({
      web: { boxShadow: "0px 3px 12px rgba(0,0,0,0.07)" } as any,
      native: { shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
    }),
  },
  featuredAccentBar: { height: 4, width: "100%", borderRadius: 0 },
  featuredTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    marginBottom: 8,
  },
  featuredNumberBadge: {
    width: 28, height: 28, borderRadius: 8,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  featuredNumberText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  featuredArabic: { fontSize: 22, fontFamily: "ScheherazadeNew_400Regular", flex: 1, textAlign: "right" },
  featuredEnglish: { fontSize: 15, fontFamily: "Inter_700Bold", paddingHorizontal: 14, marginBottom: 2 },
  featuredMeaning: { fontSize: 11, fontFamily: "Inter_400Regular", paddingHorizontal: 14, fontStyle: "italic" },
  featuredDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14, marginVertical: 10 },
  featuredMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  featuredTypePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  featuredTypeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  featuredAyahCount: { fontSize: 11, fontFamily: "Inter_500Medium" },
  dailyCard: { borderRadius: 24, padding: 24, borderWidth: 1, position: "relative", overflow: "hidden", marginTop: 16 },
  dailyCardCurve: { position: "absolute", top: -15, right: -15, width: 60, height: 60, borderRadius: 30, borderWidth: 1 },
  verseBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginBottom: 20 },
  verseBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  dailyArabic: { fontSize: 32, fontFamily: "ScheherazadeNew_400Regular", textAlign: "center", lineHeight: 58, marginVertical: 16 },
  dailyTranslation: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "left", fontStyle: "italic", lineHeight: 24, marginBottom: 16 },
  dailyRefContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTopWidth: 1 },
  dailyRef: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  unifiedProgressCard: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    ...Platform.select({
      web: { boxShadow: "0px 4px 16px rgba(0,0,0,0.06)" } as any,
      native: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
    }),
  },
  unifiedDivider: {
    height: 1,
    width: "100%",
    marginVertical: 20,
    opacity: 0.5,
  },
  homeImpactGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  homeImpactItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  impactIconCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  impactTextContainer: {
    gap: 1,
  },
  impactValueLarge: {
    fontSize: 22,
    fontFamily: "Inter_800ExtraBold",
  },
  impactLabelSmall: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  impactDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  heroSectionContent: {
    alignItems: "center",
    gap: 24,
  },
  heroCircleContainer: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heroCircleCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPctText: {
    fontSize: 32,
    fontFamily: "Inter_800ExtraBold",
  },
  heroPctLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginTop: -2,
    opacity: 0.8,
  },
  heroStatsGroup: {
    width: "100%",
    gap: 8,
    alignItems: "center",
  },
  heroStatRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroStatLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  heroStatValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  heroStatEmoji: {
    fontSize: 16,
  },
  minimalProgressContainer: {
    width: "100%",
    gap: 8,
    marginTop: 8,
  },
  minimalProgressLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  minimalProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
  },
  minimalProgressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  minimalProgressPct: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    alignSelf: "flex-end",
  },
  motivationalLine: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
    textAlign: "center",
    opacity: 0.8,
    marginTop: 4,
  },
});
