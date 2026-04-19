import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SurahCard } from "@/components/SurahCard";
import { SURAHS } from "@/data/surahs";
import { useTheme } from "@/hooks/useTheme";
import { useQuran } from "@/context/QuranContext";
import { PageHeader } from "@/components/PageHeader";

type FilterType = "all" | "meccan" | "medinan" | "read" | "unread";

const FILTERS: { key: FilterType; label: string; icon: string }[] = [
  { key: "all",     label: "All",      icon: "list"          },
  { key: "meccan",  label: "Meccan",   icon: "sun"           },
  { key: "medinan", label: "Medinan",  icon: "moon"          },
  { key: "read",    label: "Read",     icon: "check-circle"  },
  { key: "unread",  label: "Unread",   icon: "circle"        },
];

export default function SurahsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { readSurahIds, markSurahRead, unmarkSurahRead } = useQuran();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const searchRef = useRef<TextInput>(null);

  const readCount = readSurahIds.length;
  const progressPct = Math.round((readCount / 114) * 100);

  const filtered = useMemo(() => {
    return SURAHS.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        s.nameEnglish.toLowerCase().includes(q) ||
        s.nameArabic.includes(search) ||
        s.nameNepali.includes(search) ||
        s.meaning.toLowerCase().includes(q) ||
        String(s.id).includes(search);
      const isRead = readSurahIds.includes(s.id);
      const matchesFilter =
        filter === "all" ||
        (filter === "meccan" && s.revelationType === "Meccan") ||
        (filter === "medinan" && s.revelationType === "Medinan") ||
        (filter === "read" && isRead) ||
        (filter === "unread" && !isRead);
      return matchesSearch && matchesFilter;
    });
  }, [search, filter, readSurahIds]);

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ── Header ── */}
      <PageHeader
        title="Surahs"
        arabicTitle="سور القرآن"
        subtitle={`${readCount} of 114 surahs read · ${progressPct}%`}
      >
        {/* Gold progress bar inside header */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` as const }]} />
        </View>
      </PageHeader>

      {/* ── Search ── */}
      <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Feather name="search" size={17} color={theme.textSecondary} />
        <TextInput
          ref={searchRef}
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder="Search by name, number, meaning…"
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {search.length > 0 ? (
          <TouchableOpacity
            onPress={() => { setSearch(""); searchRef.current?.focus(); }}
            hitSlop={10}
            style={[styles.clearBtn, { backgroundColor: theme.cardBackground }]}
          >
            <Feather name="x" size={12} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Quick actions + Filters ── */}
      <View style={[styles.controlsRow]}>
        {/* Browse by Juz shortcut */}
        <TouchableOpacity
          style={[styles.juzBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          onPress={() => router.push("/juz" as any)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="view-grid-outline" size={16} color={theme.primary} />
          <Text style={[styles.juzBtnText, { color: theme.primary }]}>By Juz</Text>
        </TouchableOpacity>

        {/* Filter chips scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {FILTERS.map((item) => {
            const isActive = filter === item.key;
            const count =
              item.key === "read" ? readCount
              : item.key === "unread" ? 114 - readCount
              : item.key === "meccan" ? SURAHS.filter((s) => s.revelationType === "Meccan").length
              : item.key === "medinan" ? SURAHS.filter((s) => s.revelationType === "Medinan").length
              : 114;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? theme.primary : theme.cardBackground,
                    borderColor: isActive ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setFilter(item.key)}
                activeOpacity={0.8}
              >
                <Feather
                  name={item.icon as any}
                  size={12}
                  color={isActive ? theme.primaryForeground : theme.textSecondary}
                />
                <Text style={[styles.chipText, { color: isActive ? theme.primaryForeground : theme.textPrimary }]}>
                  {item.label}
                </Text>
                <View style={[styles.chipCount, { backgroundColor: isActive ? "rgba(255,255,255,0.2)" : theme.cardBackground }]}>
                  <Text style={[styles.chipCountText, { color: isActive ? theme.primaryForeground : theme.textSecondary }]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Results summary ── */}
      <View style={styles.resultsRow}>
        <Text style={[styles.resultsText, { color: theme.textSecondary }]}>
          {search ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${search}"` : `Showing ${filtered.length} surahs`}
        </Text>
        {(search || filter !== "all") && (
          <TouchableOpacity
            onPress={() => { setSearch(""); setFilter("all"); }}
            style={[styles.clearAllBtn, { borderColor: theme.border }]}
          >
            <Feather name="x" size={11} color={theme.textSecondary} />
            <Text style={[styles.clearAllText, { color: theme.textSecondary }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Surah list ── */}
      <View style={{ flex: 1 }}>
        <FlashList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <SurahCard
              surah={item}
              isRead={readSurahIds.includes(item.id)}
              onPress={() => router.push({ pathname: "/reader/[id]", params: { id: item.id } })}
              onToggleRead={() =>
                readSurahIds.includes(item.id)
                  ? unmarkSurahRead(item.id)
                  : markSurahRead(item.id)
              }
            />
          )}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: bottomInset + 100 }}
          showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.cardBackground }]}>
              <Feather name="search" size={32} color={theme.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No surahs found</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Try a different name, number, or{"\n"}clear the active filter
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              onPress={() => { setSearch(""); setFilter("all"); }}
            >
              <Text style={[styles.emptyBtnText, { color: theme.primaryForeground }]}>Show all surahs</Text>
            </TouchableOpacity>
          </View>
        }
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Progress bar
  progressTrack: {
    height: 6, borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden", marginTop: 10,
    width: "80%",
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: "rgba(201,168,76,0.9)" },

  // Search
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 6, marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    borderRadius: 16, borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.06)" } as any,
      native: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    }),
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  clearBtn: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },

  // Controls row
  controlsRow: {
    flexDirection: "row", alignItems: "center",
    paddingLeft: 16, marginBottom: 4, gap: 10,
  },
  juzBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, flexShrink: 0,
  },
  juzBtnText: { fontSize: 12, fontFamily: "Inter_700Bold" },

  // Chips
  filtersScroll: { gap: 8, paddingRight: 16 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 12, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  chipCount: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  chipCountText: { fontSize: 10, fontFamily: "Inter_700Bold" },

  // Results row
  resultsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, marginBottom: 4,
  },
  resultsText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  clearAllBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  clearAllText: { fontSize: 11, fontFamily: "Inter_500Medium" },

  // Empty state
  empty: { alignItems: "center", paddingTop: 60, gap: 14 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    marginTop: 4, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
