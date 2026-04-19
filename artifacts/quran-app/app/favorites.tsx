import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useQuran, type Bookmark } from "@/context/QuranContext";
import { PageHeader } from "@/components/PageHeader";

export default function FavoritesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { bookmarks, removeBookmark, duaBookmarks, removeDuaBookmark } = useQuran();
  const [tab, setTab] = useState<"ayahs" | "duas">("ayahs");

  const gradColors: [string, string] = theme.isDark
    ? [theme.gradientStart, theme.gradientEnd]
    : [theme.gradientStart, theme.gradientEnd];

  const handleShareAyah = async (b: Bookmark) => {
    await Share.share({
      message: `${b.arabic}\n\n"${b.surahName} — Ayah ${b.ayahNumber}"\n\n📖 QuranSathi`,
    });
  };

  // Alert.alert is a no-op on web — use a cross-platform confirm helper
  const confirmAndRun = (message: string, onConfirm: () => void) => {
    if (Platform.OS === "web") {
      // eslint-disable-next-line no-restricted-globals
      if (window.confirm(message)) onConfirm();
    } else {
      Alert.alert("Remove Bookmark", message, [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: onConfirm },
      ]);
    }
  };

  const handleRemoveAyah = (ayahId: string) =>
    confirmAndRun("Remove this verse from your favorites?", () => removeBookmark(ayahId));

  const handleRemoveDua = (id: string) =>
    confirmAndRun("Remove this dua from your favorites?", () => removeDuaBookmark(id));


  const renderAyah = ({ item }: { item: Bookmark }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
      onPress={() => router.push(`/reader/${item.surahId}`)}
      activeOpacity={0.8}
    >
      {/* Gold left bar */}
      <View style={[styles.goldBar, { backgroundColor: theme.accent }]} />

      <View style={styles.cardContent}>
        {/* Surah + Ayah badge */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>
              {item.surahName} • {item.ayahNumber}
            </Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => handleShareAyah(item)} style={styles.iconBtn}>
              <Feather name="share-2" size={15} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRemoveAyah(item.ayahId)} style={styles.iconBtn}>
              <Feather name="trash-2" size={15} color={theme.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Arabic */}
        <Text style={[styles.arabic, { color: theme.textPrimary }]}>{item.arabic}</Text>

        {/* Separator */}
        <View style={[styles.sep, { backgroundColor: theme.border }]} />

        {/* Tap hint */}
        <Text style={[styles.tapHint, { color: theme.textSecondary }]}>
          Tap to open in reader →
        </Text>
      </View>
    </TouchableOpacity>
  );

  const empty = (
    <View style={styles.empty}>
      <Feather name="heart" size={48} color={theme.border} />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No favorites yet</Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        Tap the bookmark icon on any Ayah while reading to save it here.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader
        title="My Favorites"
        arabicTitle="مفضلاتي"
        subtitle={`${bookmarks.length} verse${bookmarks.length !== 1 ? "s" : ""} · ${duaBookmarks.length} duas saved`}
        showBack
      />

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "ayahs" && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab("ayahs")}
        >
          <Text style={[styles.tabText, { color: tab === "ayahs" ? theme.primary : theme.textSecondary }]}>
            Ayahs ({bookmarks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "duas" && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab("duas")}
        >
          <Text style={[styles.tabText, { color: tab === "duas" ? theme.primary : theme.textSecondary }]}>
            Duas ({duaBookmarks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "ayahs" ? (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.ayahId}
          renderItem={renderAyah}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 90,
            flexGrow: 1,
          }}
          ListEmptyComponent={empty}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={duaBookmarks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => router.push({ pathname: "/duas", params: { cat: item.categoryId } })}
              activeOpacity={0.8}
            >
              <View style={[styles.goldBar, { backgroundColor: theme.accent }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: theme.cardBackground }]}>
                    <Text style={[styles.badgeText, { color: theme.primary }]}>
                      {item.categoryName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveDua(item.id)}
                    style={styles.iconBtn}
                  >
                    <Feather name="trash-2" size={15} color={theme.destructive} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.duaTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.arabic, { color: theme.textPrimary, fontSize: 20 }]}>{item.arabic}</Text>
                
                {/* Separator */}
                <View style={[styles.sep, { backgroundColor: theme.border }]} />

                {/* Tap hint */}
                <Text style={[styles.tapHint, { color: theme.textSecondary }]}>
                  Tap to view in Duas →
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 90,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="book-open" size={48} color={theme.border} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No duas saved</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Bookmark your favorite duas from the Dua screen.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1, paddingVertical: 14, alignItems: "center",
  },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  goldBar: { width: 4 },
  cardContent: { flex: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardActions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 4 },
  arabic: {
    fontSize: 24, fontFamily: "Inter_400Regular",
    textAlign: "right", lineHeight: 40,
  },
  sep: { height: 1 },
  tapHint: { fontSize: 11, fontFamily: "Inter_400Regular" },
  empty: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 60, gap: 12,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: {
    fontSize: 14, fontFamily: "Inter_400Regular",
    textAlign: "center", maxWidth: 260, lineHeight: 22,
  },
  duaTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  duaEnglish: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
