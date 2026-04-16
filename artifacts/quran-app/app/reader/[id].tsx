import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { AyahCard } from "@/components/AyahCard";
import { getAyahsForSurah, type Ayah } from "@/data/ayahs";
import { SURAHS } from "@/data/surahs";
import { useQuran } from "@/context/QuranContext";
import { useTheme } from "@/hooks/useTheme";

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string; ayah?: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { setLastRead, fontSize, showEnglish, showNepali } = useQuran();

  const surahId = Number(id);
  const surah = SURAHS.find((s) => s.id === surahId);
  const ayahs = surah ? getAyahsForSurah(surahId) : [];
  const hasData = ayahs.length > 0;

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (surah) {
      setLastRead({
        surahId: surah.id,
        ayahNumber: 1,
        surahName: surah.nameEnglish,
        timestamp: Date.now(),
      });
    }
  }, [surah]);

  if (!surah) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.foreground }]}>Surah not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: surah.nameEnglish,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
          headerShadowVisible: false,
          headerBackTitle: "Back",
        }}
      />

      <View style={[styles.surahHeader, { backgroundColor: theme.primary }]}>
        <Text style={[styles.surahNumberText, { color: theme.primaryForeground, opacity: 0.7 }]}>
          Surah {surah.id}
        </Text>
        <Text style={[styles.surahArabic, { color: theme.primaryForeground }]}>
          {surah.nameArabic}
        </Text>
        <Text style={[styles.surahEnglish, { color: theme.primaryForeground }]}>
          {surah.nameEnglish} — {surah.nameNepali}
        </Text>
        <Text style={[styles.surahMeaning, { color: theme.primaryForeground, opacity: 0.75 }]}>
          {surah.meaning} • {surah.totalAyahs} Ayahs • {surah.revelationType}
        </Text>
        {surahId !== 9 && (
          <View style={[styles.basmala, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Text style={[styles.basmalaText, { color: theme.primaryForeground }]}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
          </View>
        )}
      </View>

      {hasData ? (
        <FlatList
          data={ayahs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AyahCard
              ayah={item}
              surahName={surah.nameEnglish}
              fontSize={fontSize}
              showEnglish={showEnglish}
              showNepali={showNepali}
            />
          )}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomInset + 60 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={ayahs.length > 0}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Feather name="book" size={48} color={theme.mutedForeground} />
          <Text style={[styles.noDataTitle, { color: theme.foreground }]}>
            Full Quran data coming soon
          </Text>
          <Text style={[styles.noDataText, { color: theme.mutedForeground }]}>
            Complete Arabic text with verified Nepali and English translations for all 6,236 ayahs will be integrated in the next update.
          </Text>
          <Text style={[styles.noDataSurah, { color: theme.primary }]}>
            {surah.totalAyahs} ayahs in this surah
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  surahHeader: {
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  surahNumberText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  surahArabic: {
    fontSize: 36,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  surahEnglish: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  surahMeaning: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  basmala: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  basmalaText: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  noDataContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  noDataTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginTop: 8,
  },
  noDataText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  noDataSurah: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
});
