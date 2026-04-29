import React, { useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";

// ─── Animated Press Card ─────────────────────────────────────────────────────
function ToolCard({
  title,
  subtitle,
  icon,
  library,
  color,
  bg,
  route,
  theme,
  wide = false,
}: {
  title: string;
  subtitle: string;
  icon: string;
  library: "MCI" | "FA5" | "Feather";
  color: string;
  bg: string;
  route: string;
  theme: any;
  wide?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(route as any);
  };

  const IconComponent =
    library === "MCI"
      ? MaterialCommunityIcons
      : library === "FA5"
      ? FontAwesome5
      : Feather;
  const iconSize = library === "FA5" ? 22 : 26;

  if (wide) {
    return (
      <TouchableOpacity activeOpacity={1} onPress={press} style={{ flex: 1 }}>
        <View
          style={[
            styles.wideCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <View style={[styles.wideIconWrap, { backgroundColor: bg }]}>
            <IconComponent name={icon as any} size={iconSize} color={color} />
          </View>
          <View style={styles.wideCardBody}>
            <Text style={[styles.wideCardTitle, { color: theme.textPrimary }]}>{title}</Text>
            <Text style={[styles.wideCardSub, { color: theme.textSecondary }]}>{subtitle}</Text>
          </View>
          <View style={[styles.chevronBox, { backgroundColor: theme.cardBackground }]}>
            <Feather name="chevron-right" size={14} color={theme.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={1} onPress={press} style={styles.tileOuter}>
      <View
        style={[
          styles.tileCard,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <View style={[styles.tileIconWrap, { backgroundColor: bg }]}>
          <IconComponent name={icon as any} size={iconSize} color={color} />
        </View>
        <Text style={[styles.tileTitle, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.tileSub, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Coming Soon Card ─────────────────────────────────────────────────────────
function ComingSoonCard({
  icon,
  label,
  theme,
}: {
  icon: string;
  label: string;
  theme: any;
}) {
  return (
    <View style={[styles.soonCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <MaterialCommunityIcons name={icon as any} size={22} color={theme.textSecondary} />
      <Text style={[styles.soonLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.soonBadge, { backgroundColor: theme.border }]}>
        <Text style={[styles.soonBadgeText, { color: theme.textSecondary }]}>Soon</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function UtilitiesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 20 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const { t } = useTranslation();

  const gradColors: [string, string] = theme.isDark
    ? [theme.gradientStart, theme.gradientEnd]
    : [theme.gradientStart, theme.gradientEnd];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title={t("tabUtilities")}
        arabicTitle="الأدوات الإسلامية"
        subtitle={t("exploreTools")}
      />

      {/* ── TOP TILE GRID (2×2) ─────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t("quickAccess")}</Text>
        </View>

        <View style={styles.tileGrid}>
          <ToolCard
            title={t("qibla")}
            subtitle="Find direction"
            icon="compass-outline"
            library="MCI"
            color={theme.primary}
            bg={theme.cardBackground}
            route="/qibla"
            theme={theme}
          />
          <ToolCard
            title={t("dhikr")}
            subtitle="Tasbih counter"
            icon="dots-horizontal-circle-outline"
            library="MCI"
            color={theme.accent}
            bg={theme.accent + "20"}
            route="/dhikr"
            theme={theme}
          />
          <ToolCard
            title={t("bookmarks")}
            subtitle="Saved ayahs"
            icon="bookmark-check-outline"
            library="MCI"
            color={theme.primary}
            bg={theme.cardBackground}
            route="/favorites"
            theme={theme}
          />
          <ToolCard
            title={t("settings")}
            subtitle="App preferences"
            icon="cog-outline"
            library="MCI"
            color={theme.textSecondary}
            bg={theme.cardBackground}
            route="/settings"
            theme={theme}
          />
        </View>
      </View>

      {/* ── FEATURED TOOLS (wide list) ───────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>More Tools</Text>
        </View>

        <View style={styles.wideList}>
          <ToolCard
            title={t("qiblaCompass")}
            subtitle="Live compass pointing toward the Kaaba in Makkah"
            icon="compass-outline"
            library="MCI"
            color={theme.primary}
            bg={theme.cardBackground}
            route="/qibla"
            theme={theme}
            wide
          />
          <ToolCard
            title={t("dhikr")}
            subtitle="Count tasbih with saved presets and progress"
            icon="dots-horizontal-circle-outline"
            library="MCI"
            color={theme.accent}
            bg={theme.accent + "20"}
            route="/dhikr"
            theme={theme}
            wide
          />
          <ToolCard
            title={t("dailyDhikr")}
            subtitle="Morning, evening and occasion-based supplications"
            icon="hands"
            library="FA5"
            color={theme.accent}
            bg={theme.accent + "20"}
            route="/duas"
            theme={theme}
            wide
          />
          <ToolCard
            title={t("readingPlan")}
            subtitle="Set goals (30, 60, 365 days) and track daily khatm progress"
            icon="book-open-outline"
            library="MCI"
            color={theme.primary}
            bg={theme.cardBackground}
            route="/planner"
            theme={theme}
            wide
          />
          <ToolCard
            title={t("bookmarks")}
            subtitle="All your bookmarked ayahs in one place"
            icon="bookmark-check-outline"
            library="MCI"
            color={theme.primary}
            bg={theme.cardBackground}
            route="/favorites"
            theme={theme}
            wide
          />
        </View>
      </View>

      {/* ── NEW TOOLS ──────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>New Tools</Text>
        </View>
        <View style={styles.wideList}>
          <ToolCard
            title="Hijri Calendar"
            subtitle="View Islamic months, events and holy dates with description"
            icon="calendar-month-outline"
            library="MCI"
            color="#C8860B"
            bg={theme.isDark ? "#4A3200" : "#FFF8E1"}
            route="/hijri"
            theme={theme}
            wide
          />
          <ToolCard
            title={t("tafsirHub")}
            subtitle="Browse Ibn Kathir commentary for every ayah in the Quran"
            icon="book-open-page-variant"
            library="MCI"
            color="#7B4FCC"
            bg={theme.isDark ? "#2A1A4A" : "#F0E8FF"}
            route="/tafsir"
            theme={theme}
            wide
          />
        </View>
      </View>

      {/* ── COMING SOON ──────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionDot, { backgroundColor: theme.border }]} />
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Coming Soon</Text>
        </View>
        <View style={styles.soonGrid}>
          <ComingSoonCard icon="map-marker-outline" label="Prayer Map" theme={theme} />
        </View>
      </View>

      {/* ── FOOTER NOTE ──────────────────────────────────────────────── */}
      <View style={[styles.footerNote, { backgroundColor: theme.cardBackground, borderColor: theme.primary + "30" }]}>
        <MaterialCommunityIcons name="star-crescent" size={16} color={theme.primary} />
        <Text style={[styles.footerText, { color: theme.textPrimary }]}>
          More Islamic tools are in development. Stay tuned for updates, in sha Allah.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },

  // Tile grid (2×2)
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tileOuter: { width: "47%" },
  tileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 10,
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.06)" },
      native: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    }),
  },
  tileIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tileTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  tileSub: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },

  // Wide list
  wideList: { gap: 10 },
  wideCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.05)" },
      native: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    }),
  },
  wideIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  wideCardBody: { flex: 1, gap: 3 },
  wideCardTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  wideCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  chevronBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // Coming soon
  soonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  soonCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    alignItems: "center",
    opacity: 0.7,
  },
  soonLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  soonBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  soonBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },

  // Footer
  footerNote: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
