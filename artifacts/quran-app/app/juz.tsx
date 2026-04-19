import { router, Stack } from "expo-router";
import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SURAHS } from "@/data/surahs";
import { useTheme } from "@/hooks/useTheme";

type JuzItem = {
  juz: number;
  startSurahId: number;
  startSurahName: string;
  endSurahName: string;
  surahCount: number;
};

const JUZ_STARTS = [1, 2, 2, 3, 4, 5, 6, 6, 7, 8, 9, 10, 11, 12, 14, 15, 17, 18, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 30, 30];

function buildJuzItems(): JuzItem[] {
  return JUZ_STARTS.map((startSurahId, index) => {
    const juz = index + 1;
    const nextStartSurahId = JUZ_STARTS[index + 1] ?? 115;
    const surahs = SURAHS.filter((surah) => surah.id >= startSurahId && surah.id < nextStartSurahId);
    const startSurah = SURAHS.find((surah) => surah.id === startSurahId) ?? SURAHS[0];
    const endSurah = surahs[surahs.length - 1] ?? startSurah;

    return {
      juz,
      startSurahId,
      startSurahName: startSurah.nameEnglish,
      endSurahName: endSurah.nameEnglish,
      surahCount: surahs.length,
    };
  });
}

export default function JuzScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const juzItems = useMemo(() => buildJuzItems(), []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: "Juz Index",
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.textPrimary,
          headerShadowVisible: false,
        }}
      />

      <FlashList
        data={juzItems}
        keyExtractor={(item) => String(item.juz)}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: bottomInset + 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            activeOpacity={0.82}
            onPress={() =>
              router.push({
                pathname: "/reader/[id]",
                params: { id: item.startSurahId },
              })
            }
          >
            <View style={[styles.badge, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>Juz {item.juz}</Text>
            </View>

            <View style={styles.content}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Starts at {item.startSurahName}
              </Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                Through {item.endSurahName}
              </Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {item.surahCount} surah{item.surahCount !== 1 ? "s" : ""} in this index range
              </Text>
            </View>

            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  badge: {
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  sub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  meta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
});
