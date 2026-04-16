import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Surah } from "@/data/surahs";
import { useTheme } from "@/hooks/useTheme";

interface SurahCardProps {
  surah: Surah;
  onPress: () => void;
}

export function SurahCard({ surah, onPress }: SurahCardProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.numberContainer, { backgroundColor: theme.secondary }]}>
        <Text style={[styles.number, { color: theme.primary }]}>{surah.id}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={[styles.nameEnglish, { color: theme.foreground }]}>
            {surah.nameEnglish}
          </Text>
        </View>
        <Text style={[styles.nameNepali, { color: theme.mutedForeground }]}>
          {surah.nameNepali} • {surah.meaning}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
            {surah.totalAyahs} ayahs • {surah.revelationType}
          </Text>
        </View>
      </View>
      <Text style={[styles.arabic, { color: theme.primary }]}>{surah.nameArabic}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  numberContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  number: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameEnglish: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  nameNepali: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  meta: {
    flexDirection: "row",
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  arabic: {
    fontSize: 20,
    fontFamily: "Inter_400Regular",
    flexShrink: 0,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
});
