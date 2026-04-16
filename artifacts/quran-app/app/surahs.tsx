import { router, Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { SurahCard } from "@/components/SurahCard";
import { SURAHS } from "@/data/surahs";
import { useTheme } from "@/hooks/useTheme";

type FilterType = "all" | "meccan" | "medinan";

export default function SurahsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    return SURAHS.filter((s) => {
      const matchesSearch =
        !search ||
        s.nameEnglish.toLowerCase().includes(search.toLowerCase()) ||
        s.nameArabic.includes(search) ||
        s.nameNepali.includes(search) ||
        s.meaning.toLowerCase().includes(search.toLowerCase()) ||
        String(s.id).includes(search);
      const matchesFilter =
        filter === "all" ||
        (filter === "meccan" && s.revelationType === "Meccan") ||
        (filter === "medinan" && s.revelationType === "Medinan");
      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: "All Surahs",
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
          headerShadowVisible: false,
        }}
      />

      <View style={[styles.searchBar, { backgroundColor: theme.muted, borderColor: theme.border }]}>
        <Feather name="search" size={16} color={theme.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: theme.foreground }]}
          placeholder="Search surahs..."
          placeholderTextColor={theme.mutedForeground}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={theme.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filters}>
        {(["all", "meccan", "medinan"] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter === f ? theme.primary : theme.muted,
                borderColor: filter === f ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? theme.primaryForeground : theme.mutedForeground },
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <SurahCard
            surah={item}
            onPress={() =>
              router.push({ pathname: "/reader/[id]", params: { id: item.id } })
            }
          />
        )}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomInset + 20 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
