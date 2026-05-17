import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Word } from "@/data/ayahs";

interface ArabicWordProps {
  word: Word;
  fontSize: number;
  color: string;
  isSelected?: boolean;
  onPress: (word: Word) => void;
  onLongPress: (word: Word) => void;
}

export function ArabicWord({
  word,
  fontSize,
  color,
  isSelected,
  showTransliteration,
  onPress,
  onLongPress,
}: ArabicWordProps & { showTransliteration?: boolean }) {
  // Quran.com API sometimes returns char_type_name="end" for verse markers.
  // We should handle that if needed, but for now we assume Word type is filtered or mapped.
  
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => onPress(word)}
      onLongPress={() => onLongPress(word)}
      style={[
        styles.container,
        isSelected && styles.selectedContainer
      ]}
    >
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={[
            styles.text,
            {
              fontSize: fontSize,
              lineHeight: fontSize * 2.5,
              color: color,
            },
          ]}
        >
          {/^[\u0660-\u06690-9]+$/.test(word.text) ? '\u06DD' : word.text}
        </Text>
        {/^[\u0660-\u06690-9]+$/.test(word.text) && (
          <Text style={{ position: 'absolute', fontSize: fontSize * 0.4, color: color, fontFamily: 'Inter_600SemiBold' }}>
            {word.text}
          </Text>
        )}
      </View>
      {showTransliteration && word.transliteration && (
        <Text style={[styles.transliteration, { fontSize: Math.max(10, fontSize * 0.45) }]}>
          {word.transliteration}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 6,
    marginVertical: 4,
    alignItems: "center",
    borderRadius: 10,
  },
  selectedContainer: {
    backgroundColor: "rgba(184, 152, 106, 0.14)",
  },
  text: {
    fontFamily: "ScheherazadeNew_700Bold",
    textAlign: "center",
  },
  transliteration: {
    fontFamily: "Inter_400Regular",
    color: "#888",
    marginTop: 6,
    textAlign: "center",
  },
});
