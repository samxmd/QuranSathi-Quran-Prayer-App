import * as Haptics from "expo-haptics";
import React from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { Ayah } from "@/data/ayahs";
import { useTheme } from "@/hooks/useTheme";
import { useQuran } from "@/context/QuranContext";

interface AyahCardProps {
  ayah: Ayah;
  surahName: string;
  fontSize: number;
  showEnglish: boolean;
  showNepali: boolean;
}

export function AyahCard({ ayah, surahName, fontSize, showEnglish, showNepali }: AyahCardProps) {
  const theme = useTheme();
  const { isBookmarked, addBookmark, removeBookmark } = useQuran();
  const bookmarked = isBookmarked(ayah.id);

  const handleBookmark = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (bookmarked) {
      await removeBookmark(ayah.id);
    } else {
      await addBookmark({
        surahId: ayah.surahId,
        ayahId: ayah.id,
        ayahNumber: ayah.ayahNumber,
        surahName,
        arabic: ayah.arabic,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={[styles.verseNumber, { backgroundColor: theme.primary }]}>
          <Text style={[styles.verseNumberText, { color: theme.primaryForeground }]}>
            {ayah.ayahNumber}
          </Text>
        </View>
        <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkBtn} activeOpacity={0.7}>
          <Feather
            name={bookmarked ? "bookmark" : "bookmark"}
            size={20}
            color={bookmarked ? theme.accent : theme.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      <Text
        style={[
          styles.arabic,
          {
            color: theme.arabicText,
            fontSize: fontSize,
            lineHeight: fontSize * 1.8,
          },
        ]}
      >
        {ayah.arabic}
      </Text>

      {showEnglish && (
        <View style={[styles.translationContainer, { borderTopColor: theme.border }]}>
          <Text style={[styles.translationLabel, { color: theme.accent }]}>English</Text>
          <Text style={[styles.translationText, { color: theme.foreground }]}>
            {ayah.english}
          </Text>
        </View>
      )}

      {showNepali && (
        <View style={[styles.translationContainer, { borderTopColor: theme.border }]}>
          <Text style={[styles.translationLabel, { color: theme.accent }]}>नेपाली</Text>
          <Text style={[styles.translationText, styles.nepaliText, { color: theme.foreground }]}>
            {ayah.nepali}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  verseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  verseNumberText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  bookmarkBtn: {
    padding: 4,
  },
  arabic: {
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 4,
  },
  translationContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  translationLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  translationText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
  nepaliText: {
    fontSize: 15,
    lineHeight: 26,
  },
});
