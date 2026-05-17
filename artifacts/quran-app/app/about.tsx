import { Stack } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Share, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "@/hooks/useTheme";
import * as Application from "expo-application";
import * as StoreReview from "expo-store-review";
import { APP_CONFIG, APP_LIVE_ON_STORE } from "@/constants/appConfig";

export default function AboutScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleShare = async () => {
    try {
      await Share.share({
        message: APP_CONFIG.shareMessage,
      });
    } catch (error) {
      // ignore
    }
  };

  const handleRate = async () => {
    try {
      const available = await StoreReview.isAvailableAsync();
      if (available) {
        await StoreReview.requestReview();
      } else {
        await Linking.openURL(`market://details?id=${APP_CONFIG.packageId}`);
      }
    } catch {
      await Linking.openURL(APP_CONFIG.playStoreUrl);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: "About QuranSathi",
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. App Purpose */}
        <View style={styles.section}>
          <Text style={[styles.title, { color: theme.primary }]}>QuranSathi</Text>
          <Text style={[styles.paragraph, { color: theme.textPrimary }]}>
            QuranSathi is a complete Quran reading and learning companion designed to help Muslims connect with the Quran every day.
          </Text>
        </View>

        {/* 2. Your Mission */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: theme.accent + "20" }]}>
              <Feather name="heart" size={18} color={theme.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Our Mission</Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Built as a Sadaqah Jariyah, QuranSathi is created to make the Quran accessible to everyone — free of cost, without ads, and without barriers.
          </Text>
        </View>

        {/* 3. What Makes This App Special */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>What Makes This App Special</Text>
          <View style={styles.bulletList}>
            {[
              "Tajweed color-coded Quran",
              "Tafsir by Ibn Kathir",
              "6-language support (Nepali, Bangla, etc.)",
              "Works fully offline",
              "Prayer times & Qibla"
            ].map((feature, i) => (
              <View key={i} style={styles.bulletItem}>
                <Feather name="check-circle" size={16} color={theme.primary} style={styles.bulletIcon} />
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. Privacy & Trust */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="shield" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Privacy & Trust</Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            We respect your privacy. QuranSathi does not require login and does not collect or store personal data. Everything stays on your device.
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(APP_CONFIG.privacyUrl)} style={{ marginTop: 12 }}>
            <Text style={[styles.link, { color: theme.primary, marginTop: 0 }]}>Read our Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Content Credits */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="book-open" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Data & Translation Credits</Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary, marginBottom: 12 }]}>
            We use authenticated and trusted sources for all Quranic texts, audio, and translations:
          </Text>
          <View style={{ gap: 8 }}>
            {[
              { label: "Arabic Text", value: "Uthmani script via AlQuran Cloud" },
              { label: "Nepali", value: "Ahl Al-Hadith Central Society of Nepal" },
              { label: "Bangla", value: "Muhiuddin Khan" },
              { label: "English", value: "Sahih International" },
              { label: "Audio CDN", value: "everyayah.com" },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: theme.textPrimary, width: 85 }}>
                  {item.label}:
                </Text>
                <Text style={{ flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: theme.textSecondary }}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6. Developer Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Developer Info</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Built by <Text style={{ fontFamily: "Inter_700Bold", color: theme.textPrimary }}>Fossa Technology</Text>
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(APP_CONFIG.websiteUrl)}>
            <Text style={[styles.link, { color: theme.primary }]}>{APP_CONFIG.websiteUrl}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${APP_CONFIG.email}`)}>
            <Text style={[styles.link, { color: theme.primary, marginTop: 4 }]}>{APP_CONFIG.email}</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Closing Line */}
        <View style={styles.closingSection}>
          <Text style={[styles.closingText, { color: theme.textPrimary }]}>
            If this app benefits you, remember us in your duas.
          </Text>
          <Text style={[styles.closingText, { color: theme.textSecondary, marginTop: 8, fontSize: 13, fontFamily: "Inter_400Regular" }]}>
            May this app help you stay connected with the Quran every day.
          </Text>
        </View>

        {/* Pro Tip actions */}
        <View style={styles.actionsContainer}>
          {APP_LIVE_ON_STORE && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.primary }]}
              onPress={handleRate}
              activeOpacity={0.8}
            >
              <Feather name="star" size={18} color="#FFFFFF" />
              <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>Rate App</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Feather name="share-2" size={18} color={theme.textPrimary} />
            <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>Share App</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: theme.textSecondary }]}>
          Version {Application.nativeApplicationVersion || "1.0.0"}
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  bulletList: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bulletIcon: {
    marginTop: 2,
  },
  bulletText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flex: 1,
    lineHeight: 22,
  },
  link: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    textDecorationLine: "underline",
    marginTop: 8,
  },
  closingSection: {
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(150,150,150,0.3)",
    marginTop: 8,
    marginBottom: 24,
  },
  closingText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  versionText: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    opacity: 0.7,
  },
});
