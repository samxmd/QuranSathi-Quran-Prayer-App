import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { PageHeader } from "@/components/PageHeader";

// ─── Dhikr presets ───────────────────────────────────────────────────────────
const PRESETS = [
  {
    id: "subhanallah",
    arabic: "سُبْحَانَ اللَّهِ",
    label: "Subhanallah",
    meaning: "Glory be to Allah",
    target: 33,
    color: "#2E7D32",
    bg: "#E8F5E9",
    darkBg: "#1B4332",
  },
  {
    id: "alhamdulillah",
    arabic: "الْحَمْدُ لِلَّهِ",
    label: "Alhamdulillah",
    meaning: "Praise be to Allah",
    target: 33,
    color: "#1565C0",
    bg: "#E3F2FD",
    darkBg: "#1A3A5C",
  },
  {
    id: "allahuakbar",
    arabic: "اللَّهُ أَكْبَرُ",
    label: "Allahu Akbar",
    meaning: "Allah is the Greatest",
    target: 34,
    color: "#6A1B9A",
    bg: "#F3E5F5",
    darkBg: "#3B1466",
  },
  {
    id: "lailaha",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ",
    label: "La ilaha illallah",
    meaning: "There is no god but Allah",
    target: 100,
    color: "#C8860B",
    bg: "#FFF8E1",
    darkBg: "#4A3200",
  },
  {
    id: "salawat",
    arabic: "صَلِّ عَلَى مُحَمَّدٍ",
    label: "Salawat",
    meaning: "Blessings upon the Prophet ﷺ",
    target: 100,
    color: "#00695C",
    bg: "#E0F2F1",
    darkBg: "#004D40",
  },
  {
    id: "istighfar",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    label: "Astaghfirullah",
    meaning: "I seek Allah's forgiveness",
    target: 100,
    color: "#B71C1C",
    bg: "#FFEBEE",
    darkBg: "#4A0A0A",
  },
  {
    id: "custom",
    arabic: "ذِكْر",
    label: "Custom",
    meaning: "Set your own target",
    target: 33,
    color: "#37474F",
    bg: "#ECEFF1",
    darkBg: "#1C2B33",
  },
];

export default function DhikrScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [selectedId, setSelectedId] = useState("subhanallah");
  const [count, setCount] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  const selected = PRESETS.find((p) => p.id === selectedId) ?? PRESETS[0];
  const progress = Math.min(count / selected.target, 1);
  const circumference = 2 * Math.PI * 100; // radius = 100

  const handleTap = useCallback(() => {
    if (showOverlay) return; // Stop taps when target reached

    const next = count + 1;
    setCount(next);

    // Spring animation on button
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: 60, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();

    // Haptics
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Completed a session
    if (next >= selected.target) {
      setShowOverlay(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Vibration.vibrate([0, 100, 50, 150]);
      }
    }
  }, [count, selected.target, scale, showOverlay]);

  const handleContinue = () => {
    setCount(0);
    setSessions((s) => s + 1);
    setShowOverlay(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleResetAll = () => {
    setCount(0);
    setSessions(0);
    setShowOverlay(false);
  };

  const handleResetCurrent = () => {
    setCount(0);
  };

  const accentColor = selected.color;
  const accentBg = theme.isDark ? selected.darkBg : selected.bg;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title="Dhikr Counter"
        arabicTitle="عداد الذكر"
        subtitle="Count your remembrance of Allah with ease"
        showBack
      />

      {/* ── CIRCULAR COUNTER ─────────────────────────────────────────── */}
      <View style={styles.counterSection}>
        {/* SVG-like progress ring using borders */}
        <View style={styles.ringOuter}>
          <View style={[styles.ringBg, { borderColor: theme.border }]} />
          {/* Simulated filled arc via rotated half-circle */}
          <View
            style={[
              styles.ringFill,
              {
                borderColor: accentColor,
                transform: [{ rotate: `${progress * 360}deg` }],
              },
            ]}
          />
          {/* Inner circle (tap button) */}
          <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
              style={[styles.tapCircle, { backgroundColor: accentBg, borderColor: accentColor }]}
              onPress={handleTap}
              activeOpacity={0.85}
            >
              <Text style={[styles.tapArabic, { color: accentColor }]}>{selected.arabic}</Text>
              <Text style={[styles.tapCount, { color: accentColor }]}>{count}</Text>
              <Text style={[styles.tapTarget, { color: accentColor + "99" }]}>
                / {selected.target}
              </Text>
              <Text style={[styles.tapHint, { color: accentColor + "77" }]}>
                {showOverlay ? "DONE" : "TAP"}
              </Text>

              {showOverlay && (
                <Animated.View 
                  style={[
                    styles.overlayBlur, 
                    { backgroundColor: theme.isDark ? "rgba(0,0,0,0.88)" : "rgba(255,255,255,0.92)" }
                  ]}
                >
                  <Animated.View style={{ transform: [{ scale: scale }] }}>
                    <MaterialCommunityIcons name="check-decagram" size={60} color={accentColor} />
                  </Animated.View>
                  <Text style={[styles.overlayTitle, { color: theme.textPrimary }]}>Target Reached!</Text>
                  
                  <View style={styles.overlayBtns}>
                    <TouchableOpacity
                      style={[styles.ovrContinueBtn, { backgroundColor: accentColor }]}
                      onPress={handleContinue}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.ovrContinueText}>Continue</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.ovrResetBtn, { borderTopColor: theme.border }]}
                      onPress={handleResetAll}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.ovrResetText, { color: accentColor }]}>Reset All</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.statNum, { color: theme.textPrimary }]}>{count}</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Current</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.statNum, { color: accentColor }]}>{sessions}</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Sessions</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.statNum, { color: theme.textPrimary }]}>
              {sessions * selected.target + count}
            </Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Total</Text>
          </View>
        </View>

        {/* Reset button */}
        <TouchableOpacity
          style={[styles.resetBtn, { borderColor: theme.border }]}
          onPress={handleResetAll}
        >
          <Feather name="refresh-cw" size={14} color={theme.textSecondary} />
          <Text style={[styles.resetText, { color: theme.textSecondary }]}>Reset All</Text>
        </TouchableOpacity>
      </View>

      {/* ── DHIKR PICKER ─────────────────────────────────────────────── */}
      <View style={[styles.section, styles.pickerSection]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Choose Dhikr</Text>
        <View style={styles.presetGrid}>
          {PRESETS.map((p) => {
            const active = p.id === selectedId;
            const bg = theme.isDark ? p.darkBg : p.bg;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.presetCard,
                  {
                    backgroundColor: active ? p.color : theme.cardBackground,
                    borderColor: active ? p.color : theme.border,
                  },
                ]}
                onPress={() => {
                  setSelectedId(p.id);
                  setCount(0);
                  setSessions(0);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.presetArabic,
                    { color: active ? "#fff" : p.color },
                  ]}
                  numberOfLines={1}
                >
                  {p.arabic}
                </Text>
                <Text
                  style={[
                    styles.presetLabel,
                    { color: active ? "rgba(255,255,255,0.9)" : theme.textPrimary },
                  ]}
                >
                  {p.label}
                </Text>
                <View
                  style={[
                    styles.presetTargetBadge,
                    { backgroundColor: active ? "rgba(255,255,255,0.2)" : theme.cardBackground },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetTargetText,
                      { color: active ? "#fff" : theme.primary },
                    ]}
                  >
                    ×{p.target}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── MEANING CARD ─────────────────────────────────────────────── */}
      <View style={[styles.meaningCard, { backgroundColor: accentBg, borderColor: accentColor + "33" }]}>
        <MaterialCommunityIcons name="star-crescent" size={16} color={accentColor} />
        <View style={styles.meaningBody}>
          <Text style={[styles.meaningArabic, { color: accentColor }]}>{selected.arabic}</Text>
          <Text style={[styles.meaningEnglish, { color: accentColor + "CC" }]}>{selected.meaning}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  counterSection: { alignItems: "center", paddingHorizontal: 24, marginBottom: 28 },

  ringOuter: {
    width: 260,
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
  },
  ringBg: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 8,
  },
  ringFill: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 8,
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
  },
  tapCircle: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    ...Platform.select({
      web: { boxShadow: "0px 4px 24px rgba(0,0,0,0.12)" },
      native: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
    }),
  },
  tapArabic: { fontSize: 22, fontFamily: "Inter_400Regular" },
  tapCount: { fontSize: 56, fontFamily: "Inter_700Bold", lineHeight: 64 },
  tapTarget: { fontSize: 14, fontFamily: "Inter_500Medium" },
  tapHint: { fontSize: 10, fontFamily: "Inter_600SemiBold", marginTop: 4, letterSpacing: 1 },

  overlayBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 105,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 10,
  },
  overlayTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 8, marginBottom: 16 },
  overlayBtns: { width: "100%", gap: 0 },
  ovrContinueBtn: { 
    paddingVertical: 12, borderRadius: 14, alignItems: "center",
    marginBottom: 8,
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.15)" },
      native: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
    }),
  },
  ovrContinueText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  ovrResetBtn: { paddingVertical: 10, alignItems: "center", borderTopWidth: 0 },
  ovrResetText: { fontSize: 13, fontFamily: "Inter_600SemiBold", textDecorationLine: "underline" },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statBox: {
    flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 4,
  },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular" },

  resetBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1,
  },
  resetText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  pickerSection: {},
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },

  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  presetCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  presetArabic: { fontSize: 18, fontFamily: "Inter_400Regular" },
  presetLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  presetTargetBadge: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  presetTargetText: { fontSize: 11, fontFamily: "Inter_700Bold" },

  meaningCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  meaningBody: { flex: 1, gap: 3 },
  meaningArabic: { fontSize: 18, fontFamily: "Inter_400Regular" },
  meaningEnglish: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
