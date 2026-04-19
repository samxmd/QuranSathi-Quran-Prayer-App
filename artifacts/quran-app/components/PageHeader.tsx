import React from "react";
import {
  Platform,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

interface PageHeaderProps {
  /** Main English title shown prominently */
  title: string;
  /** Optional Arabic title shown above the English title in smaller text */
  arabicTitle?: string;
  /** Optional description / subtitle text */
  subtitle?: string;
  /** Show a back chevron on the left (for stack-pushed pages) */
  showBack?: boolean;
  /** Slot for right-side action buttons (e.g. settings icon) */
  rightSlot?: React.ReactNode;
  /** Extra content rendered inside the gradient, below the ornament */
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  arabicTitle,
  subtitle,
  showBack = false,
  rightSlot,
  children,
}: PageHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web"
    ? 20
    : Platform.OS === "android"
      ? Math.max(insets.top, NativeStatusBar.currentHeight ?? 0)
      : insets.top;

  const gradColors: [string, string] = theme.isDark
    ? [theme.gradientStart, theme.gradientEnd]
    : [theme.gradientStart, theme.gradientEnd];

  return (
    <LinearGradient
      colors={gradColors}
      style={[styles.container, { paddingTop: topInset + 20 }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {/* Decorative rings — top-right corner */}
      <View style={[styles.ring, { width: 120, height: 120, top: -35, right: -35, borderColor: "rgba(255,255,255,0.05)" }]} />
      <View style={[styles.ring, { width: 75, height: 75, top: -15, right: -15, borderColor: "rgba(255,255,255,0.08)" }]} />
      <View style={[styles.ring, { width: 38, height: 38, top: 0, right: 0, borderColor: "rgba(255,255,255,0.12)" }]} />

      {/* Top action row */}
      {(showBack || rightSlot) && (
        <View style={styles.actionRow}>
          {showBack ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={18} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtnPlaceholder} />
          )}
          {rightSlot && <View style={styles.rightSlot}>{rightSlot}</View>}
        </View>
      )}

      {/* Title block */}
      <View style={styles.titleBlock}>
        {arabicTitle && (
          <Text style={styles.arabicTitle}>{arabicTitle}</Text>
        )}
        <Text style={[styles.title, { color: theme.accent }]}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      {/* Gold ornament */}
      <View style={styles.ornRow}>
        <View style={styles.ornLine} />
        <MaterialCommunityIcons name="star-crescent" size={12} color={theme.accent} />
        <View style={styles.ornLine} />
      </View>

      {/* Extra children (e.g. search bar, hijri chip, etc.) */}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
    marginBottom: 12,
    gap: 0,
    alignItems: "center",
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    width: "100%",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPlaceholder: {
    width: 36,
  },
  rightSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  titleBlock: {
    gap: 4,
    marginBottom: 14,
    alignItems: "center",
  },
  arabicTitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    lineHeight: 34,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.62)",
    lineHeight: 21,
    marginTop: 2,
    textAlign: "center",
  },
  ornRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "55%",
    marginBottom: 4,
  },
  ornLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(205,180,122,0.3)", // Matching #CDB47A with opacity
  },
});
