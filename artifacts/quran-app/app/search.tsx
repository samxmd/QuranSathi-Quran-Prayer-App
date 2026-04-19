import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router, Stack } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { SURAHS } from "@/data/surahs";
import { dbService } from "@/services/database";
import type { Ayah } from "@/data/ayahs";

type AyahResult = Ayah & { surahName: string };

type SearchResult = {
  type: "surah";
  id: number;
  nameArabic: string;
  nameEnglish: string;
  nameNepali: string;
  meaning: string;
  revelationType: string;
  totalAyahs: number;
} | {
  type: "ayah";
  id: string; // "1:1"
  surahId: number;
  ayahNumber: number;
  arabic: string;
  surahName: string;
  translations: Record<string, string>;
};

function highlight(text: string, query: string): { parts: string[]; bold: boolean[] } {
  if (!query) return { parts: [text], bold: [false] };
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return { parts: [text], bold: [false] };
  return {
    parts: [text.slice(0, idx), text.slice(idx, idx + q.length), text.slice(idx + q.length)],
    bold: [false, true, false],
  };
}

function HighlightText({
  text,
  query,
  style,
  boldColor,
}: {
  text: string;
  query: string;
  style: any;
  boldColor: string;
}) {
  const { parts, bold } = highlight(text, query);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        bold[i] ? (
          <Text key={i} style={{ color: boldColor, fontFamily: "Inter_700Bold" }}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

export default function SearchScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [ayahResults, setAyahResults] = useState<AyahResult[]>([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);

  // Sync surah search
  const surahResults = useMemo<SearchResult[]>(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    return SURAHS.filter(
      (s) =>
        s.nameEnglish.toLowerCase().includes(q) ||
        s.nameNepali.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q) ||
        s.nameArabic.includes(query) ||
        String(s.id) === q
    ).map(s => ({ ...s, type: "surah" as const }));
  }, [query]);

  // Async ayah search with debounce
  React.useEffect(() => {
    if (!query.trim() || query.length < 3) {
      setAyahResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingAyahs(true);
      try {
        const results = await dbService.searchAyahs(query);
        setAyahResults(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoadingAyahs(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Combined results
  const combinedResults = useMemo(() => {
    const list: SearchResult[] = [...surahResults];
    ayahResults.forEach(a => list.push({ ...a, type: "ayah" as const }));
    return list;
  }, [surahResults, ayahResults]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setAyahResults([]);
  }, []);

  const renderItem = ({ item }: { item: SearchResult }) => {
    if (item.type === "surah") {
      return (
        <TouchableOpacity
          style={[styles.resultCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          onPress={() => router.push(`/reader/${item.id}`)}
          activeOpacity={0.8}
        >
          <View style={[styles.numBadge, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.numText, { color: theme.primary }]}>{item.id}</Text>
          </View>

          <View style={styles.resultContent}>
            <Text style={[styles.resultArabic, { color: theme.primary, fontSize: 16 }]}>{item.nameArabic}</Text>
            <HighlightText
              text={item.nameEnglish}
              query={query}
              style={[styles.resultEnglish, { color: theme.textPrimary }]}
              boldColor={theme.primary}
            />
            <HighlightText
              text={item.meaning}
              query={query}
              style={[styles.resultMeaning, { color: theme.textSecondary }]}
              boldColor={theme.primary}
            />
          </View>

          <View style={styles.resultMeta}>
            <Text style={[styles.resultAyahs, { color: theme.textSecondary }]}>
              {item.totalAyahs} āyāt
            </Text>
            <Feather name="chevron-right" size={16} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>
      );
    }

    // Render Ayah Result
    return (
      <TouchableOpacity
        style={[styles.ayahCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
        onPress={() => router.push(`/reader/${item.surahId}?ayah=${item.ayahNumber}`)}
        activeOpacity={0.8}
      >
        <View style={styles.ayahHeader}>
          <View style={[styles.ayahSurahBadge, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.ayahSurahText, { color: theme.primary }]}>{item.surahName}</Text>
          </View>
          <Text style={[styles.ayahRefText, { color: theme.textSecondary }]}>
            {item.surahId}:{item.ayahNumber}
          </Text>
        </View>

        <Text style={[styles.ayahArabic, { color: theme.textPrimary }]} numberOfLines={1}>
          {item.arabic}
        </Text>

        <HighlightText
          text={item.translations.en || item.translations.ne || item.translations.bn}
          query={query}
          style={[styles.ayahTranslation, { color: theme.textSecondary }]}
          boldColor={theme.primary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: "Search",
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.textPrimary,
          headerShadowVisible: false,
        }}
      />

      {/* Search bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: theme.cardBackground,
            borderColor: focused ? theme.primary : theme.border,
            marginTop: 12,
          },
        ]}
      >
        {isLoadingAyahs ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <Feather name="search" size={18} color={focused ? theme.primary : theme.textSecondary} />
        )}
        <TextInput
          style={[styles.input, { color: theme.textPrimary }]}
          placeholder="Search by surah, name, or verse..."
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Feather name="x-circle" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results count */}
      {query.length >= 2 && (
        <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
          {combinedResults.length} result{combinedResults.length !== 1 ? "s" : ""} found
        </Text>
      )}

      <FlatList
        data={combinedResults}
        keyExtractor={(item) => item.type === "surah" ? `s-${item.id}` : `a-${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 40,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          query.length < 2 ? (
            <View style={styles.emptyState}>
              <Feather name="search" size={48} color={theme.border} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                Search the Quran
              </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Type a surah name, meaning, or number to find what you're looking for.
              </Text>
              {/* Popular shortcuts */}
              <View style={styles.shortcuts}>
                {["Al-Fatiha", "Yaseen", "Al-Kahf", "Al-Mulk", "Al-Ikhlas"].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.shortcutChip, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                    onPress={() => setQuery(s)}
                  >
                    <Text style={[styles.shortcutText, { color: theme.primary }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="frown" size={48} color={theme.border} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No results found</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Try searching by a different name, meaning, or surah number.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    outlineStyle: "none",
  } as any,
  resultCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  numBadge: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  numText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  resultContent: { flex: 1, gap: 2 },
  resultArabic: { fontSize: 18, fontFamily: "Inter_400Regular", textAlign: "right" },
  resultEnglish: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  resultNepali: { fontSize: 13, fontFamily: "Inter_400Regular" },
  resultMeaning: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  resultMeta: { alignItems: "flex-end", gap: 6 },
  resultAyahs: { fontSize: 11, fontFamily: "Inter_400Regular" },
  revBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  revText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  ayahCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  ayahHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ayahSurahBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ayahSurahText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  ayahRefText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  ayahArabic: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  ayahTranslation: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
  },
  shortcuts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 8,
  },
  shortcutChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  shortcutText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
