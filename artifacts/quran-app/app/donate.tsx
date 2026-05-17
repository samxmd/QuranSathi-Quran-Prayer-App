import { Stack } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// @ts-ignore - The module is installed but the TS server needs a restart to see it
import * as Clipboard from "expo-clipboard";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "@/hooks/useTheme";

export default function DonateScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const bankDetails = [
    { label: "Account Name", value: "FOSSA TECHNOLOGY" },
    { label: "Account Number", value: "1170100000666201" },
    { label: "Bank Name", value: "CITIZENS BANK INTERNATIONAL LTD." },
    { label: "Bank Branch", value: "CHAPIYA BRANCH" },
    { label: "SWIFT/BIC Code", value: "CTZNNPKA" },
  ];

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS !== "web") {
      Alert.alert("Copied", `${label} has been copied to your clipboard.`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: "Support QuranSathi",
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: theme.accent + "20" }]}>
            <Feather name="heart" size={32} color={theme.accent} />
          </View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Sadaqah Jariyah</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            QuranSathi is completely free and ad-free. Your support helps us maintain the servers, add new features, and keep this project running as a continuous charity for everyone. JazakAllah Khair!
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Scan to Donate</Text>
        <View style={[styles.qrContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {/* Make sure the image provided by the user is placed at this path */}
          <Image 
            source={require("@/assets/images/donate-qr.jpg")} 
            style={styles.qrImage}
            resizeMode="contain"
          />
          <Text style={[styles.qrHelperText, { color: theme.textSecondary }]}>
            Scan with your banking app or digital wallet
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 24 }]}>Bank Transfer</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {bankDetails.map((item, index) => (
            <React.Fragment key={index}>
              <View style={styles.detailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                  <Text style={[styles.detailValue, { color: theme.textPrimary }]} selectable>
                    {item.value}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.copyBtn, { backgroundColor: theme.primary + "15" }]}
                  onPress={() => handleCopy(item.value, item.label)}
                  activeOpacity={0.7}
                >
                  <Feather name="copy" size={16} color={theme.primary} />
                </TouchableOpacity>
              </View>
              {index < bankDetails.length - 1 && (
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            May Allah reward you abundantly for your generous support.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 10,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  qrContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  qrHelperText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 16,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 22,
  },
});
