import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/hooks/useTheme";
import { PageHeader } from "@/components/PageHeader";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ──────────────────────────────────────────────
// Mood → Quranic quotes data
// ──────────────────────────────────────────────
type Mood = "happy" | "grateful" | "anxious" | "tired" | "sad";

const MOODS: { id: Mood; label: string; emoji: string; color: string }[] = [
  { id: "happy",    label: "Happy",    emoji: "😊", color: "#4CAF50" },
  { id: "grateful", label: "Grateful", emoji: "🙏", color: "#2196F3" },
  { id: "anxious",  label: "Anxious",  emoji: "😟", color: "#FF9800" },
  { id: "tired",    label: "Tired",    emoji: "😴", color: "#9C27B0" },
  { id: "sad",      label: "Sad",      emoji: "😢", color: "#F44336" },
];

const MOOD_QUOTES: Record<Mood, { arabic: string; english: string; reference: string; note: string }[]> = {
  happy: [
    {
      arabic: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
      english: "If you are grateful, I will surely increase you [in favor].",
      reference: "Quran 14:7",
      note: "Gratitude multiplies blessings. Celebrate this joy with شُكْر.",
    },
    {
      arabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",
      english: "Whoever fears Allah — He will make for him a way out.",
      reference: "Quran 65:2",
      note: "Your happiness is a blessing from Allah. Hold onto taqwa.",
    },
  ],
  grateful: [
    {
      arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
      english: "Remember Me; I will remember you. And be grateful to Me and do not deny Me.",
      reference: "Quran 2:152",
      note: "Gratitude connects your heart directly to Allah.",
    },
    {
      arabic: "وَإِن تَعُدُّوا نِعْمَتَ اللَّهِ لَا تُحْصُوهَا",
      english: "And if you should count the favors of Allah, you could not enumerate them.",
      reference: "Quran 14:34",
      note: "Every breath is a blessing beyond measure.",
    },
  ],
  anxious: [
    {
      arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
      english: "Allah is sufficient for us, and He is the best Disposer of affairs.",
      reference: "Quran 3:173",
      note: "When anxiety overwhelms, entrust your affairs to Allah.",
    },
    {
      arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
      english: "Verily, in the remembrance of Allah do hearts find rest.",
      reference: "Quran 13:28",
      note: "Return to dhikr — it is the ultimate remedy for a restless heart.",
    },
  ],
  tired: [
    {
      arabic: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ",
      english: "And your Lord is going to give you, and you will be satisfied.",
      reference: "Quran 93:5",
      note: "Rest is not defeat — even the Prophet ﷺ was comforted by Allah.",
    },
    {
      arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
      english: "Indeed, with hardship will be ease.",
      reference: "Quran 94:6",
      note: "Your tiredness is temporary. Ease is already on its way.",
    },
  ],
  sad: [
    {
      arabic: "وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ",
      english: "Do not despair of relief from Allah.",
      reference: "Quran 12:87",
      note: "No sadness lasts forever when you hold hope in Allah.",
    },
    {
      arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
      english: "Indeed, Allah is with the patient.",
      reference: "Quran 2:153",
      note: "Your tears are not unseen. Allah sees every sorrow.",
    },
  ],
};

const STORAGE_KEY = "spiritual_hub_entries";

interface JournalEntry {
  id: string;
  date: string;
  mood: Mood;
  gratitude: string;
  quote: { english: string; reference: string };
}

export default function SpiritualHubScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);

  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [gratitude, setGratitude] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedToday, setSavedToday] = useState(false);
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const [isJournalFocused, setIsJournalFocused] = useState(false);

  // Load past entries on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try { setPastEntries(JSON.parse(stored)); } catch (e) {}
      }
    }).catch(() => {});
  }, []);

  const currentMood = MOODS.find((m) => m.id === selectedMood);
  const quotes = selectedMood ? MOOD_QUOTES[selectedMood] : null;
  const currentQuote = quotes ? quotes[quoteIndex % quotes.length] : null;

  const handleMoodSelect = useCallback((mood: Mood) => {
    setSelectedMood(mood);
    setQuoteIndex(0);
  }, []);

  const handleNextQuote = useCallback(() => {
    if (!quotes) return;
    setQuoteIndex((i) => (i + 1) % quotes.length);
  }, [quotes]);

  const handleSave = async () => {
    if (!selectedMood || !currentQuote) {
      Alert.alert("Select a mood first", "Please choose how you're feeling today.");
      return;
    }

    setSaving(true);
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const entries: JournalEntry[] = stored ? JSON.parse(stored) : [];

      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        mood: selectedMood,
        gratitude: gratitude.trim(),
        quote: { english: currentQuote.english, reference: currentQuote.reference },
      };

      entries.unshift(newEntry);
      // Keep last 90 entries
      if (entries.length > 90) entries.splice(90);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      setPastEntries(entries); // refresh list
      setSavedToday(true);
      setGratitude("");
      Alert.alert("Saved ✨", "Your reflection has been saved. May Allah accept it.");
    } catch (e) {
      Alert.alert("Error", "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = (id: string) => {
    const runDelete = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const entries: JournalEntry[] = JSON.parse(stored);
        const filtered = entries.filter(e => e.id !== id);
        
        // Smooth layout transition
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        setPastEntries(filtered);
      } catch (e) {
        Alert.alert("Error", "Could not delete entry.");
      }
    };

    if (Platform.OS === "web") {
      // eslint-disable-next-line no-restricted-globals
      if (window.confirm("Remove this reflection from your history?")) {
        runDelete();
      }
    } else {
      Alert.alert("Delete Reflection", "Are you sure you want to remove this from your history?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: runDelete },
      ]);
    }
  };

  const accentColor = currentMood?.color ?? theme.primary;
  const scrollJournalIntoView = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      {/* Header */}
      <PageHeader
        title="Spiritual Hub"
        arabicTitle="القلب"
        subtitle="How are you feeling?"
        showBack
        onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        customColors={currentMood ? [currentMood.color, currentMood.color] : undefined}
        customAccent={currentMood ? "#FFF" : undefined}
      />

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (isJournalFocused ? 220 : 40) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mood Selector */}
        <View style={[styles.moodCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.moodQuestion, { color: theme.textPrimary }]}>
            Select your mood today
          </Text>
          <View style={styles.moodRow}>
            {MOODS.map((mood) => {
              const isSelected = selectedMood === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  style={styles.moodItem}
                  onPress={() => handleMoodSelect(mood.id)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.moodCircle,
                      {
                        borderColor: isSelected ? mood.color : theme.border,
                        backgroundColor: isSelected ? mood.color + "18" : "transparent",
                        transform: [{ scale: isSelected ? 1.12 : 1 }],
                      },
                    ]}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  </View>
                  <Text
                    style={[
                      styles.moodLabel,
                      {
                        color: isSelected ? mood.color : theme.textSecondary,
                        fontFamily: isSelected ? "Inter_700Bold" : "Inter_400Regular",
                      },
                    ]}
                  >
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quranic Quote */}
        {currentQuote && currentMood && (
          <View
            style={[
              styles.quoteCard,
              { borderColor: accentColor + "55", backgroundColor: accentColor + "0A" },
            ]}
          >
            <View style={styles.quoteTopRow}>
              <View style={[styles.quotePill, { backgroundColor: accentColor + "20" }]}>
                <Text style={[styles.quotePillText, { color: accentColor }]}>
                  {currentMood.emoji} {currentMood.label}
                </Text>
              </View>
              {quotes && quotes.length > 1 && (
                <TouchableOpacity onPress={handleNextQuote} style={styles.nextQuoteBtn}>
                  <Feather name="refresh-cw" size={14} color={accentColor} />
                  <Text style={[styles.nextQuoteText, { color: accentColor }]}>Another</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.quoteArabic, { color: theme.textPrimary }]}>
              {currentQuote.arabic}
            </Text>
            <Text style={[styles.quoteEnglish, { color: theme.textPrimary }]}>
              "{currentQuote.english}"
            </Text>
            <Text style={[styles.quoteRef, { color: accentColor }]}>
              — {currentQuote.reference}
            </Text>
            <View style={[styles.quoteDivider, { backgroundColor: accentColor + "30" }]} />
            <Text style={[styles.quoteNote, { color: theme.textSecondary }]}>
              💡 {currentQuote.note}
            </Text>
          </View>
        )}

        {/* Gratitude Journal */}
        <View style={[styles.journalCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.journalHeader}>
            <Feather name="book-open" size={16} color={theme.primary} />
            <Text style={[styles.journalTitle, { color: theme.textPrimary }]}>
              Gratitude Journal
            </Text>
          </View>
          <TextInput
            style={[
              styles.journalInput,
              {
                color: theme.textPrimary,
                backgroundColor: isJournalFocused ? theme.cardBackground : theme.background,
                borderColor: isJournalFocused ? accentColor : theme.border,
              },
            ]}
            placeholder="What are you grateful for today?"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={gratitude}
            onChangeText={setGratitude}
            onFocus={() => {
              setIsJournalFocused(true);
              scrollJournalIntoView();
            }}
            onBlur={() => setIsJournalFocused(false)}
            selectionColor={accentColor}
            cursorColor={accentColor}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !selectedMood}
          activeOpacity={0.85}
          style={[
            styles.saveBtn,
            {
              backgroundColor: selectedMood ? accentColor : theme.border,
              opacity: saving ? 0.6 : 1,
            },
          ]}
        >
          <Feather name="save" size={18} color="#FFF" />
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "SAVE REFLECTION"}</Text>
        </TouchableOpacity>

        {savedToday && (
          <Text style={[styles.savedHint, { color: theme.textSecondary }]}>
            ✨ Reflection saved
          </Text>
        )}

        {/* Past Reflections */}
        {pastEntries.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: theme.textPrimary }}>
                Past Reflections
              </Text>
            </View>
            {pastEntries.slice(0, 10).map((entry) => {
              const moodData = MOODS.find((m) => m.id === entry.mood);
              const date = new Date(entry.date);
              const label = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.entryCard,
                    { backgroundColor: theme.cardBackground, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.entryHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 18 }}>{moodData?.emoji ?? "🌿"}</Text>
                      <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: moodData?.color ?? theme.primary }}>
                        {moodData?.label}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: theme.textSecondary }}>
                        {label}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => handleDeleteEntry(entry.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather name="trash-2" size={14} color={theme.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: "Merriweather_400Regular",
                      fontStyle: "italic",
                      color: theme.textSecondary,
                      lineHeight: 20,
                      marginBottom: entry.gratitude ? 8 : 0,
                    }}
                  >
                    "{entry.quote.english}" — {entry.quote.reference}
                  </Text>
                  {entry.gratitude ? (
                    <View style={[styles.entryGratitude, { backgroundColor: theme.background, borderColor: theme.border }]}>
                      <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: theme.textSecondary, marginBottom: 4 }}>GRATEFUL FOR</Text>
                      <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: theme.textPrimary, lineHeight: 19 }}>
                        {entry.gratitude}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  moodCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  moodQuestion: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moodItem: {
    alignItems: "center",
    flex: 1,
  },
  moodCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  quoteCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
  },
  quoteTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  quotePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  quotePillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  nextQuoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nextQuoteText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  quoteArabic: {
    fontSize: 22,
    fontFamily: "ScheherazadeNew_700Bold",
    textAlign: "right",
    lineHeight: 44,
    marginBottom: 12,
  },
  quoteEnglish: {
    fontSize: 15,
    fontFamily: "Merriweather_400Regular",
    lineHeight: 26,
    fontStyle: "italic",
    marginBottom: 8,
  },
  quoteRef: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  quoteDivider: {
    height: 1,
    borderRadius: 99,
    marginBottom: 12,
  },
  quoteNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  journalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  journalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  journalTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  journalInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontFamily: "Merriweather_400Regular",
    lineHeight: 22,
    minHeight: 110,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 54,
    borderRadius: 18,
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  savedHint: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
  },
  entryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  entryGratitude: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
  },
});
