import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";
import { useQuran } from "@/context/QuranContext";
import { PageHeader } from "@/components/PageHeader";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");
const DAILY_GOAL_SECONDS = 15 * 60; // 15 minutes

function formatMinutes(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m} min`;
}

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getLast7Days(): { key: string; label: string }[] {
  const days: { key: string; label: string }[] = [];
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const label = labels[d.getDay()];
    days.push({ key, label });
  }
  return days;
}

function getNextMilestone(streak: number): number {
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
  return milestones.find((m) => m > streak) ?? streak + 10;
}

// SVG Circular progress ring
function CircularProgress({
  progress,
  size = 90,
  strokeWidth = 8,
  color,
  bgColor,
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - Math.min(1, progress) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: "absolute" }}>{children}</View>
    </View>
  );
}

export default function StatsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { streak, totalTimeToday, weeklyTimeHistory, readSurahIds, totalAyahsRead, totalHasanat } = useQuran();

  const today = getTodayKey();
  const last7 = getLast7Days();
  const nextMilestone = getNextMilestone(streak);
  const milestoneProgress = streak / nextMilestone;
  const dailyProgress = totalTimeToday / DAILY_GOAL_SECONDS;
  const readCount = readSurahIds.length;

  const maxBarSeconds = useMemo(() => {
    const vals = last7.map((d) => weeklyTimeHistory[d.key] || 0);
    return Math.max(...vals, 60); // min 1 min to avoid flat chart
  }, [weeklyTimeHistory, last7]);

  const accentColor = theme.primary;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <PageHeader
        title={t("myJourney")}
        arabicTitle="الإحصائيات"
        subtitle={t("readingConsistency")}
        showBack
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section title */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t("tabQuran")}</Text>

        {/* Daily Reading Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.readingCardInner}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.readLabel, { color: theme.textSecondary }]}>{t("readToday")}</Text>
              <View style={styles.readTimeRow}>
                <Text style={[styles.readTimeMain, { color: theme.textPrimary }]}>
                  {formatMinutes(totalTimeToday)}
                </Text>
                <Text style={[styles.readTimeGoal, { color: theme.textSecondary }]}>
                  {" "}/ {formatMinutes(DAILY_GOAL_SECONDS)}
                </Text>
              </View>
              <View style={{ height: 16 }} />
              <Text style={[styles.readLabel, { color: theme.textSecondary }]}>{t("currentStreak")}</Text>
              <Text style={[styles.streakValue, { color: theme.textPrimary }]}>
                {streak > 0 ? t("streakDay", { count: streak }) : t("startJourney")}
              </Text>
            </View>

            {/* Circular Progress */}
            <CircularProgress
              progress={dailyProgress}
              size={88}
              strokeWidth={9}
              color={accentColor}
              bgColor={accentColor + "30"}
            >
              <Feather
                name="zap"
                size={26}
                color={dailyProgress > 0 ? accentColor : theme.border}
              />
            </CircularProgress>
          </View>
        </View>

        {/* Hasanat and Verses Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.gridCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
             <View style={[styles.iconCircle, { backgroundColor: "#FF4D6722" }]}>
                <Feather name="heart" size={20} color="#FF4D67" />
             </View>
             <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>{t("statsHasanat")}</Text>
             <Text style={[styles.gridValue, { color: theme.textPrimary }]}>
               {totalHasanat >= 1000 ? `${(totalHasanat/1000).toFixed(1)}K` : totalHasanat}
             </Text>
          </View>
          <View style={[styles.gridCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
             <View style={[styles.iconCircle, { backgroundColor: "#4D96FF22" }]}>
                <Feather name="file-text" size={20} color="#4D96FF" />
             </View>
             <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>{t("statsVerses")}</Text>
             <Text style={[styles.gridValue, { color: theme.textPrimary }]}>
               {totalAyahsRead < 10 && totalAyahsRead > 0 ? `0${totalAyahsRead}` : totalAyahsRead}
             </Text>
          </View>
        </View>

        {/* Surahs Progress */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.surahRow}>
            <View>
              <Text style={[styles.readLabel, { color: theme.textSecondary }]}>{t("surahsCompleted")}</Text>
              <Text style={[styles.streakValue, { color: theme.textPrimary }]}>{readCount} / 114</Text>
            </View>
            <Text style={[styles.surahPct, { color: accentColor }]}>
              {Math.round((readCount / 114) * 100)}%
            </Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: accentColor + "22" }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: accentColor, width: `${(readCount / 114) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* This Week Bar Chart */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t("thisWeek")}</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.chartContainer}>
            {last7.map((day, i) => {
              const secs = weeklyTimeHistory[day.key] || 0;
              // Scale relative to daily goal but allow it to grow if exceeded, maxing out at 100px for visual stability
              const barHeight = Math.max(4, Math.min(100, (secs / Math.max(DAILY_GOAL_SECONDS, maxBarSeconds)) * 100));
              const isToday = day.key === today;
              const hasData = secs > 0;
              return (
                <View key={day.key} style={styles.barWrapper}>
                  <Text style={[styles.barTime, { color: theme.textSecondary }]}>
                    {hasData ? `${Math.floor(secs / 60)}m` : "0m"}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: hasData ? accentColor : accentColor + "22",
                          borderRadius: barHeight > 20 ? 12 : 4,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barLabel,
                      {
                        color: isToday ? accentColor : theme.textSecondary,
                        fontFamily: isToday ? "Inter_700Bold" : "Inter_400Regular",
                      },
                    ]}
                  >
                    {day.label.slice(0, 2)}
                  </Text>
                  {isToday && (
                    <View style={[styles.todayDot, { backgroundColor: accentColor }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Streak Milestone */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t("streakMilestone")}</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.milestoneRow}>
            <View>
              <Text style={[styles.milestoneNum, { color: theme.textPrimary }]}>{streak}d</Text>
              <Text style={[styles.milestoneLabel, { color: theme.textSecondary }]}>{t("currentStreak")}</Text>
            </View>
            <View style={{ flex: 1, marginHorizontal: 16 }}>
              <View style={[styles.mProgressBg, { backgroundColor: accentColor + "22" }]}>
                <View
                  style={[
                    styles.mProgressFill,
                    { backgroundColor: accentColor, width: `${Math.min(100, milestoneProgress * 100)}%` },
                  ]}
                />
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.milestoneNum, { color: theme.textPrimary }]}>{nextMilestone}d</Text>
              <Text style={[styles.milestoneLabel, { color: theme.textSecondary }]}>{t("nextMilestone")}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  readingCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  readLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  readTimeRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  readTimeMain: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  readTimeGoal: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  streakValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  surahRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  surahPct: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  progressBg: {
    height: 8,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 200,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
  },
  barTime: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginBottom: 8, // Increased gap from 4 to 8
  },
  barTrack: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  bar: {
    width: "45%",
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    marginTop: 6,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    marginTop: 3,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  milestoneNum: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  milestoneLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  mProgressBg: {
    height: 10,
    borderRadius: 99,
    overflow: "hidden",
  },
  mProgressFill: {
    height: "100%",
    borderRadius: 99,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
});
