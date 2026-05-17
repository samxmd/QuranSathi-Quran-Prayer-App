import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import type { Surah } from "@/data/surahs";
import { useTheme } from "@/hooks/useTheme";

interface SurahCardProps {
  surah: Surah;
  onPress: () => void;
  isRead?: boolean;
  onToggleRead?: () => void;
}

export function SurahCard({ surah, onPress, isRead = false, onToggleRead }: SurahCardProps) {
  const theme = useTheme();

  const handlePress = () => {
    if (Platform.OS === "web") {
      if (typeof document !== "undefined") {
        (document.activeElement as HTMLElement)?.blur?.();
      }
      requestAnimationFrame(() => requestAnimationFrame(() => onPress()));
    } else {
      onPress();
    }
  };

  const handleLongPress = () => {
    if (!onToggleRead) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onToggleRead();
  };

  const handleBadgePress = () => {
    if (!onToggleRead) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onToggleRead();
  };

  const isMeccan = surah.revelationType === "Meccan";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
        isRead && { borderLeftColor: theme.primary, borderLeftWidth: 3 },
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.78}
    >
      {/* ── Number badge — tap to toggle read ── */}
      <TouchableOpacity
        style={styles.numOuter}
        onPress={handleBadgePress}
        activeOpacity={0.7}
        hitSlop={6}
      >
        <View style={[
          styles.numWrap,
          { backgroundColor: isRead ? theme.primary : theme.cardBackground },
        ]}>
          {isRead ? (
            <Feather name="check" size={16} color={theme.primaryForeground} />
          ) : (
            <Text style={[styles.num, { color: theme.primary }]}>{surah.id}</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* ── Info ── */}
      <View style={styles.info}>
        {/* Name row */}
        <View style={styles.nameRow}>
          <Text style={[styles.nameEnglish, { color: theme.textPrimary }]}>
            {surah.nameEnglish}
          </Text>
          {isRead && (
            <View style={[styles.readBadge, { backgroundColor: theme.primary + "18" }]}>
              <Text style={[styles.readBadgeText, { color: theme.primary }]}>Read</Text>
            </View>
          )}
        </View>

        {/* Meaning */}
        <Text style={[styles.meaning, { color: theme.textSecondary }]} numberOfLines={1}>
          {surah.meaning}
        </Text>

        {/* Meta chips */}
        <View style={styles.metaRow}>
          <View style={[
            styles.badge,
            { backgroundColor: isMeccan ? theme.accent + "20" : theme.cardBackground },
          ]}>
            <Text style={[styles.badgeText, { color: isMeccan ? theme.textSecondary : theme.primary }]}>
              {surah.revelationType}
            </Text>
          </View>
          <Text style={[styles.dot, { color: theme.border }]}>·</Text>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {surah.totalAyahs} ayahs
          </Text>
        </View>
      </View>

      {/* ── Right: Arabic + chevron ── */}
      <View style={styles.right}>
        <Text style={[styles.arabic, { color: isRead ? theme.primary : theme.textPrimary }]}>
          {surah.nameArabic}
        </Text>
        <Feather name="chevron-right" size={14} color={theme.textSecondary} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 13,
    paddingRight: 14,
    paddingLeft: 12,
    gap: 12,
    ...Platform.select({
      web: { boxShadow: "0px 1px 6px rgba(0,0,0,0.05)" } as any,
      native: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },

  // Number badge
  numOuter: { flexShrink: 0 },
  numWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  num: { fontSize: 14, fontFamily: "Inter_700Bold" },

  // Info
  info: { flex: 1, gap: 3, overflow: "hidden" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameEnglish: { fontSize: 15, fontFamily: "Inter_700Bold", flexShrink: 1 },
  readBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, flexShrink: 0 },
  readBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  meaning: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  dot: { fontSize: 14, lineHeight: 14, color: "rgba(150,150,150,0.4)" }, // Ensuring dot is somewhat visible
  metaText: { fontSize: 11, fontFamily: "Inter_400Regular", top: -0.5 },

  // Right
  right: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  arabic: { fontSize: 24, fontFamily: "ScheherazadeNew_400Regular" },
  chevron: { opacity: 0.4 },
});
