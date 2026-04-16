import { router, Stack } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuran } from "@/context/QuranContext";
import { useTheme } from "@/hooks/useTheme";
import * as Haptics from "expo-haptics";

export default function BookmarksScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { bookmarks, removeBookmark } = useQuran();

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleRemove = async (ayahId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await removeBookmark(ayahId);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: "Bookmarks",
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
          headerShadowVisible: false,
        }}
      />

      {bookmarks.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="bookmark" size={48} color={theme.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: theme.foreground }]}>No bookmarks yet</Text>
          <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
            Tap the bookmark icon on any ayah to save it here for quick access.
          </Text>
          <TouchableOpacity
            style={[styles.browseBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push("/surahs")}
            activeOpacity={0.85}
          >
            <Text style={[styles.browseBtnText, { color: theme.primaryForeground }]}>
              Browse Surahs
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.ayahId}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: bottomInset + 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() =>
                router.push({
                  pathname: "/reader/[id]",
                  params: { id: item.surahId, ayah: item.ayahNumber },
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.surahName, { color: theme.primary }]}>{item.surahName}</Text>
                  <Text style={[styles.ayahRef, { color: theme.mutedForeground }]}>
                    Ayah {item.ayahNumber}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemove(item.ayahId)}
                  style={styles.removeBtn}
                >
                  <Feather name="trash-2" size={18} color={theme.destructive} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.arabic, { color: theme.arabicText }]} numberOfLines={2}>
                {item.arabic}
              </Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!bookmarks.length}
        />
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
    paddingHorizontal: 40,
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
  browseBtn: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
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
    marginBottom: 10,
  },
  surahName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  ayahRef: {
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
  },
});
