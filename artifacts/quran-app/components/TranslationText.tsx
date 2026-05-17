import React from "react";
import { Text, TextStyle } from "react-native";

interface TranslationTextProps {
  text: string;
  languageCode: string;
  baseFontSize: number;
  color: string;
  style?: TextStyle;
}

/**
 * Renders translation text with support for de-emphasizing editorial notes in parentheses.
 * Based on user requirements:
 * 1. Only de-emphasize for non-English (ne, bn).
 * 2. Only match parentheticals of 8+ characters to avoid (saw), (pbuh), etc.
 * 3. Use 0.65 opacity for readability on parchment backgrounds.
 */
export function TranslationText({
  text,
  languageCode,
  baseFontSize,
  color,
  style,
}: TranslationTextProps) {
  // Only process Nepali and Bangla for editorial de-emphasis
  const isExcluded = languageCode === "en";

  if (isExcluded) {
    return (
      <Text style={[{ fontSize: baseFontSize, color, lineHeight: baseFontSize * 1.6, fontFamily: 'Merriweather_400Regular' }, style]}>
        {text}
      </Text>
    );
  }

  // Match parentheticals of 8+ chars (editorial notes, not abbreviations)
  const PARENTHETICAL_REGEX = /(\([^)]{8,}\))/g;
  const parts = text.split(PARENTHETICAL_REGEX);

  return (
    <Text style={[{ fontSize: baseFontSize, color, lineHeight: baseFontSize * 1.6, fontFamily: 'Merriweather_400Regular' }, style]}>
      {parts.map((part, i) => {
        const isEditorial = PARENTHETICAL_REGEX.test(part);
        PARENTHETICAL_REGEX.lastIndex = 0; // Reset stateful regex

        return (
          <Text
            key={i}
            style={
              isEditorial
                ? {
                    fontSize: baseFontSize * 0.9,
                    opacity: 0.65,
                  }
                : undefined
            }
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}
