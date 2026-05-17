import React, { memo, useMemo } from "react";
import { StyleProp, Text, TextStyle } from "react-native";
import { parseTajweedText, getTajweedColor } from "../utils/parseTajweed";

type TajweedTextProps = {
  text: string;           // Raw text_uthmani_tajweed string
  fontSize: number;
  fallbackColor: string;  // Defaults from theme
  isDark: boolean;
  style?: StyleProp<TextStyle>;
};

function TajweedTextComponent({
  text,
  fontSize,
  fallbackColor,
  isDark,
  style,
}: TajweedTextProps) {
  const segments = useMemo(() => parseTajweedText(text), [text]);

  return (
    <Text
      style={[
        {
          fontSize,
          lineHeight: fontSize * 2.5, // Generous height for Arabic diacritics
          textAlign: 'right',
          fontFamily: 'ScheherazadeNew_700Bold', // Bolder Uthmanic font
        },
        style,
      ]}
    >
      {segments.map((seg, i) => (
        <Text
          key={`${i}-${seg.rule ?? 'plain'}`}
          style={{
            color: seg.rule
              ? getTajweedColor(seg.rule, isDark, fallbackColor)
              : fallbackColor,
          }}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  );
}

export const TajweedText = memo(TajweedTextComponent);
