import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams } from "expo-router";
import { DUA_CATEGORIES, type DuaCategory, type DuaItem } from "@/data/duas";
import { useQuran } from "@/context/QuranContext";
import { useTheme } from "@/hooks/useTheme";
import { PageHeader } from "@/components/PageHeader";
import { DuaShareModal } from "@/components/DuaShareModal";

async function copyToClipboard(text: string) {
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  // Fallback for native if clipboard is preferred
  return false;
}

async function shareText(text: string) {
  try {
    await Share.share({ message: text });
    return true;
  } catch {
    return false;
  }
}

function buildDuaText(category: DuaCategory, dua: DuaItem) {
  return `${dua.title}\n\n${dua.arabic}\n\n${dua.transliteration}\n\n${dua.english}\n\nSource: ${dua.source}\nCategory: ${category.title}`;
}

export default function DuasScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { duaBookmarks, addDuaBookmark, removeDuaBookmark, isDuaBookmarked } = useQuran();
  const { cat } = useLocalSearchParams<{ cat?: string }>();
  const [selectedCategoryId, setSelectedCategoryId] = useState(cat || DUA_CATEGORIES[0].id);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [selectedDuaForShare, setSelectedDuaForShare] = useState<DuaItem | null>(null);

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  // Update selected category if the deep-link parameter changes
  React.useEffect(() => {
    if (cat && DUA_CATEGORIES.some(c => c.id === cat)) {
      setSelectedCategoryId(cat);
    }
  }, [cat]);

  const selectedCategory = useMemo(
    () => DUA_CATEGORIES.find((category) => category.id === selectedCategoryId) ?? DUA_CATEGORIES[0],
    [selectedCategoryId]
  );

  const handleCopy = async (category: DuaCategory, dua: DuaItem) => {
    const text = buildDuaText(category, dua);
    const success = await copyToClipboard(text);
    
    if (success) {
      Alert.alert("Copied", "Dua text copied to clipboard.");
    } else {
      // If clipboard fails (e.g. on native without explicit clipboard library),
      // or if we just want to share instead
      await shareText(text);
    }
  };

  const handleShare = (dua: DuaItem) => {
    setSelectedDuaForShare(dua);
    setShowShareSheet(true);
  };

  const handleBookmark = async (category: DuaCategory, dua: DuaItem) => {
    const bookmarked = isDuaBookmarked(dua.id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (bookmarked) {
      await removeDuaBookmark(dua.id);
      return;
    }

    await addDuaBookmark({
      id: dua.id,
      categoryId: category.id,
      categoryName: category.title,
      title: dua.title,
      arabic: dua.arabic,
      english: dua.english,
      source: dua.source,
      timestamp: Date.now(),
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title="Daily Duas"
        arabicTitle="الأدعية اليومية"
        subtitle="Morning, evening, salah, sleep, and Quranic duas in one simple place."
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {DUA_CATEGORIES.map((category) => {
          const active = category.id === selectedCategoryId;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: active ? theme.primary : theme.cardBackground,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setSelectedCategoryId(category.id)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.categoryTitle,
                  { color: active ? theme.primaryForeground : theme.textPrimary },
                ]}
              >
                {category.title}
              </Text>
              <Text
                style={[
                  styles.categoryCount,
                  { color: active ? theme.primaryForeground : theme.textSecondary },
                ]}
              >
                {category.duas.length} duas
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.featureCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>{selectedCategory.title}</Text>
        <Text style={[styles.featureSubtitle, { color: theme.textSecondary }]}>
          {selectedCategory.subtitle}
        </Text>
      </View>

      <View style={styles.duaList}>
        {selectedCategory.duas.map((dua) => {
          const bookmarked = isDuaBookmarked(dua.id);

          return (
            <View
              key={dua.id}
              style={[styles.duaCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            >
              <View style={styles.duaHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.duaTitle, { color: theme.textPrimary }]}>{dua.title}</Text>
                  <Text style={[styles.duaSource, { color: theme.primary }]}>{dua.source}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.cardBackground }]}
                    onPress={() => handleCopy(selectedCategory, dua)}
                    activeOpacity={0.8}
                  >
                    <Feather name="copy" size={16} color={theme.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.cardBackground }]}
                    onPress={() => handleShare(dua)}
                    activeOpacity={0.8}
                  >
                    <Feather name="share-2" size={16} color={theme.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.cardBackground }]}
                    onPress={() => handleBookmark(selectedCategory, dua)}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name="bookmark"
                      size={16}
                      color={bookmarked ? theme.primary : theme.textPrimary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.arabic, { color: theme.textPrimary }]}>{dua.arabic}</Text>

              <View style={[styles.translationBlock, { borderTopColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Transliteration</Text>
                <Text style={[styles.translation, { color: theme.textPrimary }]}>{dua.transliteration}</Text>
              </View>

              <View style={[styles.translationBlock, { borderTopColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>English</Text>
                <Text style={[styles.translation, { color: theme.textPrimary }]}>{dua.english}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.bookmarkSummary, { backgroundColor: theme.cardBackground }]}>
        <Feather name="bookmark" size={18} color={theme.primary} />
        <Text style={[styles.bookmarkText, { color: theme.textSecondary }]}>
          {duaBookmarks.length} saved duas in bookmarks
        </Text>
      </View>

      <DuaShareModal
        visible={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        dua={selectedDuaForShare}
        category={selectedCategory}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categories: {
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  categoryChip: {
    width: 148,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  categoryTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  categoryCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  featureCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    gap: 6,
  },
  featureTitle: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
  },
  featureSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  duaList: {
    gap: 12,
    paddingHorizontal: 16,
  },
  duaCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  duaHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  duaTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  duaSource: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  arabic: {
    fontSize: 28,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    lineHeight: 46,
    marginBottom: 10,
    writingDirection: "rtl",
  },
  translationBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 12,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  translation: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
  bookmarkSummary: {
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bookmarkText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
