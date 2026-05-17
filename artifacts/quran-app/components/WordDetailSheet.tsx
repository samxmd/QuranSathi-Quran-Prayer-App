import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import Feather from "@expo/vector-icons/Feather";
import { Word } from "@/data/ayahs";
import { useTheme } from "@/hooks/useTheme";

interface WordDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  word: Word | null;
}

export function WordDetailSheet({ visible, onClose, word }: WordDetailSheetProps) {
  const theme = useTheme();

  if (!word) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      
      <View style={[styles.sheet, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Word Detail</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.mainWordBox, { backgroundColor: theme.primary + "08", borderColor: theme.primary + "20" }]}>
            <Text style={[styles.arabic, { color: theme.primary }]}>{word.text}</Text>
            <Text style={[styles.transliteration, { color: theme.textSecondary }]}>
              {word.transliteration || "---"}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>MEANING</Text>
            <View style={[styles.meaningBox, { backgroundColor: theme.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }]}>
              <Text style={[styles.meaning, { color: theme.textPrimary }]}>{word.translation}</Text>
            </View>
          </View>

          <View style={[styles.tipBox, { backgroundColor: theme.accent + "15" }]}>
            <Feather name="info" size={14} color={theme.accent} />
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              Tap individual words to quickly see meanings. Long-press for this detailed view.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "60%",
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    gap: 20,
  },
  mainWordBox: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  arabic: {
    fontSize: 48,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 8,
  },
  transliteration: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
    textAlign: "center",
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  meaningBox: {
    padding: 16,
    borderRadius: 16,
  },
  meaning: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 26,
  },
  tipBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    gap: 10,
    alignItems: "center",
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
