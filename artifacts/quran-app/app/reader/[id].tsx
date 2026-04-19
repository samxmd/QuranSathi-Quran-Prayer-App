import { Stack, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FlashList } from "@shopify/flash-list";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AyahCard } from "@/components/AyahCard";
import type { Ayah } from "@/data/ayahs";
import { SURAHS } from "@/data/surahs";
import { useQuran } from "@/context/QuranContext";
import { useTheme } from "@/hooks/useTheme";
import { fetchSurahAyahs, prefetchSurahAyahs, refreshSurahAyahs } from "@/services/quranApi";
import { useAudio } from "@/hooks/useAudio";
import { RECITERS } from "@/services/audioService";
import { trackEvent } from "@/services/telemetry";

type LoadState = "loading" | "success" | "error";

const BASMALA_TEXT =
  "\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064e\u0647\u0650 " +
  "\u0627\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 " +
  "\u0627\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650";
const ORNAMENT_SYMBOL = "\u2726";
const META_SEPARATOR = " \u2022 ";

export default function ReaderScreen() {
  // Freeze initial params so the screen doesn't crash to "Surah not found" when URL clears during back navigation
  const initialParams = useRef(useLocalSearchParams<{ id: string; ayah?: string }>());
  const { id, ayah } = initialParams.current;

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { setLastRead, fontSize, enabledLanguages, markSurahRead, defaultReciter } = useQuran();
  const audio = useAudio(defaultReciter);
  const listRef = useRef<any>(null);
  const pendingScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedKeyRef = useRef<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      audio.freezeAudio();
    });
    return unsubscribe;
  }, [navigation, audio.freezeAudio]);

  const surahId = Number(id);
  const surah = SURAHS.find((s) => s.id === surahId);
  const targetAyahNumber = ayah ? Number(ayah) : undefined;

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [audioErrorMessage, setAudioErrorMessage] = useState("");
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const targetAyahIndex = useMemo(() => {
    if (!targetAyahNumber) return -1;
    return ayahs.findIndex((item) => item.ayahNumber === targetAyahNumber);
  }, [ayahs, targetAyahNumber]);

  const loadAyahs = useCallback(
    async (surahIdToLoad: number, options?: { forceRefresh?: boolean }) => {
      const forceRefresh = options?.forceRefresh ?? false;

      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setLoadState("loading");
      }

      setErrorMessage("");

      try {
        const data = forceRefresh
          ? await refreshSurahAyahs(surahIdToLoad)
          : await fetchSurahAyahs(surahIdToLoad);

        setAyahs(data);
        setLoadState("success");
        setTimeout(() => {
          markSurahRead(surahIdToLoad);
        }, 300);
      } catch (err: any) {
        if (forceRefresh) {
          Alert.alert(
            "Refresh failed",
            "We couldn't fetch the latest text right now. Offline content is still available."
          );
        } else {
          setLoadState("error");
          setErrorMessage(err?.message ?? "Unknown error");
        }
      } finally {
        if (forceRefresh) {
          setIsRefreshing(false);
        }
      }
    },
    [markSurahRead]
  );

  useEffect(() => {
    if (!surah) return;
    const openedKey = `${surah.id}:${targetAyahNumber ?? ""}`;
    if (openedKeyRef.current === openedKey) return;
    openedKeyRef.current = openedKey;

    loadAyahs(surah.id);
    
    setTimeout(() => {
      trackEvent("surah.opened", {
        surahId: surah.id,
        surahName: surah.nameEnglish,
        sourceAyah: targetAyahNumber ?? null,
      }).catch(() => {});
      setLastRead({
        surahId: surah.id,
        ayahNumber: 1,
        surahName: surah.nameEnglish,
        timestamp: Date.now(),
      });
    }, 100);

    return () => {
      audio.stopAudio();
    };
  }, [surah?.id, targetAyahNumber]);

  useEffect(() => {
    if (loadState !== "success" || !surah) return;
    if (surah.id > 1) prefetchSurahAyahs(surah.id - 1);
    if (surah.id < SURAHS.length) prefetchSurahAyahs(surah.id + 1);
  }, [loadState, surah?.id]);

  useEffect(() => {
    if (loadState !== "success" || targetAyahIndex < 0 || !listRef.current) return;

    pendingScrollTimeout.current = setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: Math.max(0, targetAyahIndex * 320),
        animated: false,
      });

      pendingScrollTimeout.current = setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: targetAyahIndex,
          animated: true,
          viewPosition: 0,
          viewOffset: 12,
        });
      }, 50);
    }, 100);

    return () => {
      if (pendingScrollTimeout.current) {
        clearTimeout(pendingScrollTimeout.current);
        pendingScrollTimeout.current = null;
      }
    };
  }, [loadState, targetAyahIndex]);

  const handleRefresh = useCallback(() => {
    if (!surah || isRefreshing) return;
    loadAyahs(surah.id, { forceRefresh: true });
  }, [isRefreshing, loadAyahs, surah]);

  const handlePlay = useCallback(
    async (ayahItem: Ayah) => {
      audio.clearError();
      setAudioErrorMessage("");

      if (audio.currentAyahId === ayahItem.id && audio.status === "playing") {
        await audio.pauseResume();
        return;
      }

      if (audio.currentAyahId === ayahItem.id && audio.status === "paused") {
        await audio.pauseResume();
        return;
      }

      if (!surah) return;

      const playAyahAtIndex = async (index: number): Promise<void> => {
        const nextAyah = ayahs[index];
        if (!nextAyah) return;

        await audio.playAyah(nextAyah, surah.id, {
          onComplete: () => {
            playAyahAtIndex(index + 1).catch(() => {});
          },
          onError: (error) => {
            setAudioErrorMessage(error.message);
          },
        });
      };

      const startIndex = ayahs.findIndex((item) => item.id === ayahItem.id);
      if (startIndex >= 0) {
        await playAyahAtIndex(startIndex);
      }
    },
    [audio, ayahs, surah]
  );

  if (!surah) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.textPrimary }]}>Surah not found</Text>
      </View>
    );
  }

  const gradientColors: [string, string, string] = theme.isDark
    ? [theme.gradientStartDark, theme.gradientStart, theme.gradientEndDark]
    : [theme.gradientStart, theme.gradientEnd, theme.gradientEnd];

  const currentAyah = ayahs.find((a) => a.id === audio.currentAyahId);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: surah.nameEnglish,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.textPrimary,
          headerShadowVisible: false,
          headerBackTitle: "Back",
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleRefresh}
                style={styles.reciterHeaderBtn}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Feather name="refresh-cw" size={18} color={theme.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowReciterPicker(true)}
                style={styles.reciterHeaderBtn}
              >
                <Feather name="mic" size={18} color={theme.primary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Header section is now inside FlashList's ListHeaderComponent below */}


      <>
        {audioErrorMessage ? (
          <View
            style={[
              styles.audioErrorBanner,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.audioErrorTextWrap}>
              <Text style={[styles.audioErrorTitle, { color: theme.textPrimary }]}>
                Audio unavailable
              </Text>
              <Text style={[styles.audioErrorText, { color: theme.textSecondary }]}>
                {audioErrorMessage}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                audio.clearError();
                setAudioErrorMessage("");
              }}
            >
              <Feather name="x" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : null}

        <FlashList
          ref={listRef}
          data={ayahs}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <LinearGradient colors={gradientColors} style={styles.surahHeader}>
              <View style={[styles.headerPattern, { pointerEvents: "none" }]}>
                <View style={styles.hpCircle1} />
                <View style={styles.hpCircle2} />
              </View>

              <Text style={styles.surahNumberChip}>Surah {surah.id}</Text>
              <Text style={styles.surahArabic}>{surah.nameArabic}</Text>
              <Text style={styles.surahEnglish}>{surah.nameEnglish}</Text>
              <Text style={styles.surahNepali}>{surah.nameNepali}</Text>
              <Text style={styles.surahMeta}>
                {surah.meaning}
                {META_SEPARATOR}
                {surah.totalAyahs} Ayat
                {META_SEPARATOR}
                {surah.revelationType}
              </Text>

              {surahId !== 9 && (
                <View style={styles.basmala}>
                  <Text style={styles.basmalaText}>{BASMALA_TEXT}</Text>
                </View>
              )}

              <View style={styles.headerOrnament}>
                <View style={styles.ornamentLine} />
                <Text style={styles.ornamentStar}>{ORNAMENT_SYMBOL}</Text>
                <View style={styles.ornamentLine} />
              </View>
            </LinearGradient>
          }
          renderItem={({ item }) => (
            <AyahCard
              ayah={item}
              surahName={surah.nameEnglish}
              surahId={surahId}
              fontSize={fontSize}
              enabledLanguages={enabledLanguages}
              audioStatus={audio.status}
              isCurrentAudio={audio.currentAyahId === item.id}
              onPlay={handlePlay}
            />
          )}
          contentContainerStyle={{
            paddingBottom: bottomInset + (audio.status !== "idle" ? 120 : 60),
          }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={ayahs.length > 0 || loadState !== "success"}
          ListEmptyComponent={
            loadState === "loading" ? (
              <View style={[styles.center, { paddingVertical: 40 }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Loading {surah.nameEnglish}...
                </Text>
              </View>
            ) : loadState === "error" ? (
              <View style={[styles.center, { paddingVertical: 40 }]}>
                <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>Failed to load</Text>
                <Text style={[styles.errorSub, { color: theme.textSecondary }]}>{errorMessage}</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadState === "success" && ayahs.length > 0 ? (
              <View style={styles.footer}>
                <View style={styles.footerOrnament}>
                  <View style={[styles.footerLine, { backgroundColor: theme.border }]} />
                  <Text style={[styles.footerStar, { color: theme.accent }]}>
                    {ORNAMENT_SYMBOL}
                  </Text>
                  <View style={[styles.footerLine, { backgroundColor: theme.border }]} />
                </View>
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                  End of {surah.nameEnglish}
                </Text>
                <Text style={[styles.footerArabic, { color: theme.primary }]}>
                  {surah.nameArabic}
                </Text>
              </View>
            ) : null
          }
        />
      </>


      {audio.status !== "idle" && currentAyah && (
        <View
          style={[
            styles.miniPlayer,
            {
              backgroundColor: theme.cardBackground,
              borderTopColor: theme.border,
              paddingBottom: bottomInset + 8,
            },
          ]}
        >
          <View style={[styles.progressTrack, { backgroundColor: theme.cardBackground }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${audio.progress * 100}%`, backgroundColor: theme.primary },
              ]}
            />
          </View>

          <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
              <Text style={[styles.playerSurah, { color: theme.textSecondary }]}>
                {surah.nameEnglish}
              </Text>
              <Text style={[styles.playerAyah, { color: theme.textPrimary }]}>
                Ayah {currentAyah.ayahNumber}
              </Text>
            </View>

            <View style={styles.playerControls}>
              <TouchableOpacity onPress={() => setShowReciterPicker(true)}>
                <Text style={[styles.reciterName, { color: theme.textSecondary }]}>
                  {audio.reciter.name.split(" ")[0]}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={audio.pauseResume}
                style={[styles.playerBtn, { backgroundColor: theme.primary }]}
              >
                {audio.status === "loading" ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Feather
                    name={audio.status === "playing" ? "pause" : "play"}
                    size={18}
                    color="#FFF"
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setAudioErrorMessage("");
                  audio.stopAudio();
                }}
              >
                <Feather name="x" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Modal
        visible={showReciterPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReciterPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReciterPicker(false)}
        />
        <View
          style={[
            styles.modalSheet,
            { backgroundColor: theme.cardBackground, paddingBottom: bottomInset + 20 },
          ]}
        >
          <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Choose Reciter</Text>

          {RECITERS.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[
                styles.reciterRow,
                {
                  backgroundColor: audio.reciter.id === r.id ? theme.cardBackground : "transparent",
                  borderColor: theme.border,
                },
              ]}
              onPress={() => {
                setAudioErrorMessage("");
                audio.setReciter(r);
                setShowReciterPicker(false);
              }}
            >
              <View>
                <Text style={[styles.reciterRowName, { color: theme.textPrimary }]}>{r.name}</Text>
                <Text style={[styles.reciterRowArabic, { color: theme.textSecondary }]}>
                  {r.arabicName}
                </Text>
                <Text style={[styles.reciterRowStyle, { color: theme.textSecondary }]}>
                  {r.style}
                </Text>
              </View>
              {audio.reciter.id === r.id && (
                <Feather name="check-circle" size={20} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  loadingText: { fontSize: 15, fontFamily: "Inter_400Regular", marginTop: 8 },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  errorTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center", marginTop: 4 },
  errorSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  headerActions: { flexDirection: "row", alignItems: "center" },
  reciterHeaderBtn: { marginRight: 8, padding: 4 },
  surahHeader: {
    padding: 28,
    paddingBottom: 24,
    marginBottom: 16,
    alignItems: "center",
    gap: 6,
    overflow: "hidden",
    position: "relative",
  },
  headerPattern: { position: "absolute", top: 0, right: 0, width: 180, height: 180 },
  hpCircle1: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    top: -35,
    right: -35,
  },
  hpCircle2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    top: -65,
    right: -65,
  },
  surahNumberChip: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.65)",
    textTransform: "uppercase",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  surahArabic: {
    fontSize: 44,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    marginTop: 8,
    ...Platform.select({
      web: { textShadow: "0px 1px 4px rgba(0,0,0,0.25)" },
      native: {
        textShadowColor: "rgba(0,0,0,0.25)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
  },
  surahEnglish: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  surahNepali: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  surahMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginTop: 2,
  },
  basmala: {
    marginTop: 14,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.4)",
  },
  basmalaText: {
    fontSize: 20,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerOrnament: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    width: "70%",
  },
  ornamentLine: { flex: 1, height: 1, backgroundColor: "rgba(201,168,76,0.45)" },
  ornamentStar: { color: "rgba(201,168,76,0.8)", fontSize: 13 },
  footer: { alignItems: "center", paddingVertical: 36, gap: 10 },
  footerOrnament: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "50%",
    marginBottom: 4,
  },
  footerLine: { flex: 1, height: 1 },
  footerStar: { fontSize: 12 },
  footerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  footerArabic: { fontSize: 26, fontFamily: "Inter_400Regular" },
  audioErrorBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  audioErrorTextWrap: { flex: 1 },
  audioErrorTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  audioErrorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 3,
  },
  miniPlayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 0,
  },
  progressTrack: { height: 3 },
  progressFill: { height: 3 },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  playerInfo: { flex: 1 },
  playerSurah: { fontSize: 11, fontFamily: "Inter_400Regular" },
  playerAyah: { fontSize: 15, fontFamily: "Inter_700Bold", marginTop: 2 },
  playerControls: { flexDirection: "row", alignItems: "center", gap: 14 },
  reciterName: { fontSize: 11, fontFamily: "Inter_400Regular" },
  playerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 4,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 12,
  },
  reciterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  reciterRowName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  reciterRowArabic: { fontSize: 16, fontFamily: "Inter_400Regular", marginTop: 2 },
  reciterRowStyle: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  nonInteractive: {
    pointerEvents: "none",
  },
});
