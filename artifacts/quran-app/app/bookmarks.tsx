import { router, Stack } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import { useQuran } from "@/context/QuranContext";
import { useTheme } from "@/hooks/useTheme";

export default function BookmarksScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { bookmarks, removeBookmark, duaBookmarks, removeDuaBookmark } = useQuran();

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const isEmpty = bookmarks.length === 0 && duaBookmarks.length === 0;

  const handleAyahRemove = async (ayahId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await removeBookmark(ayahId);
  };

  const handleDuaRemove = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await removeDuaBookmark(id);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: "Bookmarks",
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.textPrimary,
          headerShadowVisible: false,
        }}
      />

      {isEmpty ? (
        <View style={styles.empty}>
          <Feather name="bookmark" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No bookmarks yet</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Save ayahs from the reader or duas from the new Dua tab to keep them close.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push("/surahs")}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
              Browse Quran
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingTop: 12, paddingBottom: bottomInset + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {bookmarks.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Quran Ayahs</Text>
              {bookmarks.map((item) => (
                <TouchableOpacity
                  key={item.ayahId}
                  style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                  onPress={() =>
                    router.push({
                      pathname: "/reader/[id]",
                      params: { id: item.surahId, ayah: item.ayahNumber },
                    })
                  }
                  activeOpacity={0.82}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={[styles.cardTitle, { color: theme.primary }]}>{item.surahName}</Text>
                      <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
                        Ayah {item.ayahNumber}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleAyahRemove(item.ayahId)} style={styles.removeBtn}>
                      <Feather name="trash-2" size={18} color={theme.destructive} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.arabic, { color: theme.textPrimary }]} numberOfLines={2}>
                    {item.arabic}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {duaBookmarks.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Saved Duas</Text>
              {duaBookmarks.map((item) => (
                <View
                  key={item.id}
                  style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: theme.primary }]}>{item.title}</Text>
                      <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
                        {item.categoryName} • {item.source}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDuaRemove(item.id)} style={styles.removeBtn}>
                      <Feather name="trash-2" size={18} color={theme.destructive} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.arabic, { color: theme.textPrimary }]} numberOfLines={2}>
                    {item.arabic}
                  </Text>
                  <Text style={[styles.translation, { color: theme.textPrimary }]} numberOfLines={3}>
                    {item.english}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  cardMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  removeBtn: {
    padding: 4,
  },
  arabic: {
    fontSize: 20,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    lineHeight: 34,
    writingDirection: "rtl",
  },
  translation: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginTop: 12,
  },
});
