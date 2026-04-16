import { Stack } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuran } from "@/context/QuranContext";
import { useTheme } from "@/hooks/useTheme";

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    fontSize,
    setFontSize,
    showNepali,
    setShowNepali,
    showEnglish,
    setShowEnglish,
    darkMode,
    toggleDarkMode,
  } = useQuran();

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: "Settings",
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={{ paddingTop: 20, paddingBottom: bottomInset + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: theme.mutedForeground }]}>APPEARANCE</Text>
        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather name="moon" size={18} color={theme.primary} />
              <Text style={[styles.rowLabel, { color: theme.foreground }]}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: theme.muted, true: theme.primary }}
              thumbColor={theme.primaryForeground}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.mutedForeground }]}>TRANSLATIONS</Text>
        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather name="globe" size={18} color={theme.primary} />
              <View>
                <Text style={[styles.rowLabel, { color: theme.foreground }]}>Nepali Translation</Text>
                <Text style={[styles.rowSub, { color: theme.mutedForeground }]}>नेपाली अनुवाद</Text>
              </View>
            </View>
            <Switch
              value={showNepali}
              onValueChange={setShowNepali}
              trackColor={{ false: theme.muted, true: theme.primary }}
              thumbColor={theme.primaryForeground}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather name="globe" size={18} color={theme.primary} />
              <View>
                <Text style={[styles.rowLabel, { color: theme.foreground }]}>English Translation</Text>
                <Text style={[styles.rowSub, { color: theme.mutedForeground }]}>Sahih International</Text>
              </View>
            </View>
            <Switch
              value={showEnglish}
              onValueChange={setShowEnglish}
              trackColor={{ false: theme.muted, true: theme.primary }}
              thumbColor={theme.primaryForeground}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.mutedForeground }]}>ARABIC FONT SIZE</Text>
        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.fontSizePreview}>
            <Text style={[styles.arabicPreview, { color: theme.primary, fontSize: fontSize }]}>
              بِسْمِ اللَّهِ
            </Text>
          </View>
          <View style={styles.fontButtons}>
            {[20, 24, 28, 32, 36].map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.fontBtn,
                  {
                    backgroundColor: fontSize === size ? theme.primary : theme.muted,
                    borderColor: fontSize === size ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setFontSize(size)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.fontBtnText,
                    { color: fontSize === size ? theme.primaryForeground : theme.mutedForeground },
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.mutedForeground }]}>ABOUT</Text>
        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather name="info" size={18} color={theme.primary} />
              <Text style={[styles.rowLabel, { color: theme.foreground }]}>Version</Text>
            </View>
            <Text style={[styles.rowValue, { color: theme.mutedForeground }]}>1.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather name="book" size={18} color={theme.primary} />
              <Text style={[styles.rowLabel, { color: theme.foreground }]}>Translations</Text>
            </View>
            <Text style={[styles.rowValue, { color: theme.mutedForeground }]}>Arabic, English, Nepali</Text>
          </View>
        </View>

        <Text style={[styles.disclaimer, { color: theme.mutedForeground }]}>
          Please verify translations with qualified Islamic scholars. The app aims for accuracy but users should consult authentic sources for religious guidance.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 20,
  },
  group: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  rowSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  fontSizePreview: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd8cc",
  },
  arabicPreview: {
    fontFamily: "Inter_400Regular",
    lineHeight: 56,
  },
  fontButtons: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
    justifyContent: "center",
  },
  fontBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  fontBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 20,
    lineHeight: 20,
  },
});
