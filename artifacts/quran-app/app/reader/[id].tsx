import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { AyahCard } from "@/components/AyahCard";
import type { Ayah } from "@/data/ayahs";
import { SURAHS } from "@/data/surahs";
import { useQuran } from "@/context/QuranContext";
import { useTheme } from "@/hooks/useTheme";
import { fetchSurahAyahs } from "@/services/quranApi";

type LoadState = "loading" | "success" | "error" | "offline";

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { setLastRead, fontSize, showEnglish, showNepali } = useQuran();

  const surahId = Number(id);
  const surah = SURAHS.find((s) => s.id === surahId);

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCached, setIsCached] = useState(false);

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const loadAyahs = async (surahIdToLoad: number) => {
    setLoadState("loading");
    setErrorMessage("");
    try {
      const data = await fetchSurahAyahs(surahIdToLoad);
      setAyahs(data);
      setLoadState("success");
    } catch (err: any) {
      const isNetworkError =
        err?.message?.includes("Network") ||
        err?.message?.includes("fetch") ||
        err?.message?.includes("Failed");
      setLoadState(isNetworkError ? "offline" : "error");
      setErrorMessage(err?.message ?? "Unknown error");
    }
  };

  useEffect(() => {
    if (!surah) return;
    loadAyahs(surah.id);
    setLastRead({
      surahId: surah.id,
      ayahNumber: 1,
      surahName: surah.nameEnglish,
      timestamp: Date.now(),
    });
  }, [surah?.id]);

  if (!surah) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.foreground }]}>Surah not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: surah.nameEnglish,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
          headerShadowVisible: false,
          headerBackTitle: "Back",
        }}
      />

      <View style={[styles.surahHeader, { backgroundColor: theme.primary }]}>
        <Text style={[styles.surahNumberText, { color: theme.primaryForeground, opacity: 0.7 }]}>
          Surah {surah.id}
        </Text>
        <Text style={[styles.surahArabic, { color: theme.primaryForeground }]}>
          {surah.nameArabic}
        </Text>
        <Text style={[styles.surahEnglish, { color: theme.primaryForeground }]}>
          {surah.nameEnglish} — {surah.nameNepali}
        </Text>
        <Text style={[styles.surahMeaning, { color: theme.primaryForeground, opacity: 0.75 }]}>
          {surah.meaning} • {surah.totalAyahs} Ayahs • {surah.revelationType}
        </Text>
        {surahId !== 9 && (
          <View style={[styles.basmala, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Text style={[styles.basmalaText, { color: theme.primaryForeground }]}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
          </View>
        )}
      </View>

      {loadState === "loading" && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>
            Loading {surah.nameEnglish}...
          </Text>
        </View>
      )}

      {(loadState === "error" || loadState === "offline") && (
        <View style={styles.center}>
          <Feather
            name={loadState === "offline" ? "wifi-off" : "alert-circle"}
            size={44}
            color={theme.mutedForeground}
          />
          <Text style={[styles.errorTitle, { color: theme.foreground }]}>
            {loadState === "offline" ? "No internet connection" : "Failed to load"}
          </Text>
          <Text style={[styles.errorSub, { color: theme.mutedForeground }]}>
            {loadState === "offline"
              ? "Connect to the internet to read this surah. Data is cached after first load."
              : errorMessage}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={() => loadAyahs(surah.id)}
            activeOpacity={0.85}
          >
            <Feather name="refresh-cw" size={16} color={theme.primaryForeground} />
            <Text style={[styles.retryText, { color: theme.primaryForeground }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {loadState === "success" && (
        <FlatList
          data={ayahs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AyahCard
              ayah={item}
              surahName={surah.nameEnglish}
              fontSize={fontSize}
              showEnglish={showEnglish}
              showNepali={showNepali}
            />
          )}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomInset + 60 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={ayahs.length > 0}
          ListFooterComponent={
            <View style={styles.footer}>
              <View style={[styles.footerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.footerText, { color: theme.mutedForeground }]}>
                End of {surah.nameEnglish}
              </Text>
              <Text style={[styles.footerArabic, { color: theme.primary }]}>
                {surah.nameArabic}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginTop: 4,
  },
  errorSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  surahHeader: {
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  surahNumberText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  surahArabic: {
    fontSize: 36,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  surahEnglish: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  surahMeaning: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  basmala: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  basmalaText: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  footerLine: {
    width: 60,
    height: 1,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  footerArabic: {
    fontSize: 22,
    fontFamily: "Inter_400Regular",
  },
});
