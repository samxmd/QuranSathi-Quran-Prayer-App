import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useQuran } from "@/context/QuranContext";
import { useTranslation } from "react-i18next";
import { useAudio, type RepeatMode, type AudioStatus } from "@/hooks/useAudio";
import { SURAHS } from "@/data/surahs";
import { RECITERS, type Reciter } from "@/services/audioService";
import { PageHeader } from "@/components/PageHeader";

type PlayStatus = AudioStatus | "none";
const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

function formatMs(ms: number): string {
  if (!ms || Number.isNaN(ms)) return "00:00";
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const Waveform = React.memo(({ active, color }: { active: boolean; color: string }) => {
  const anims = useRef(Array.from({ length: 4 }, () => new Animated.Value(0.2))).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    loopRef.current?.stop();
    if (!active) {
      anims.forEach((a) =>
        Animated.timing(a, { toValue: 0.2, duration: 180, useNativeDriver: false }).start()
      );
      return;
    }
    const loop = Animated.loop(
      Animated.stagger(
        80,
        anims.map((a) =>
          Animated.sequence([
            Animated.timing(a, { toValue: 1, duration: 320, useNativeDriver: false }),
            Animated.timing(a, { toValue: 0.15, duration: 320, useNativeDriver: false }),
          ])
        )
      )
    );
    loopRef.current = loop;
    loop.start();
    return () => {
      loop.stop();
    };
  }, [active, anims]);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            backgroundColor: color,
            height: a.interpolate({ inputRange: [0, 1], outputRange: [3, 16] }),
          }}
        />
      ))}
    </View>
  );
});

const SurahRow = React.memo(function SurahRow({
  surah,
  isActive,
  status,
  onPress,
  theme,
}: {
  surah: (typeof SURAHS)[0];
  isActive: boolean;
  status: PlayStatus;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.surahRow,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
        isActive && { borderColor: theme.primary + "55", backgroundColor: theme.primary + "08" },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.numBadge, { backgroundColor: isActive ? theme.primary : theme.cardBackground }]}>
        <Text style={[styles.numText, { color: isActive ? theme.primaryForeground : theme.primary }]}>
          {surah.id}
        </Text>
      </View>
      <View style={styles.surahInfo}>
        <Text style={[styles.surahNameEn, { color: theme.textPrimary }]} numberOfLines={1}>
          {surah.nameEnglish}
        </Text>
        <Text style={[styles.surahMeta, { color: theme.textSecondary }]} numberOfLines={1}>
          {surah.revelationType} · {surah.totalAyahs} ayahs
        </Text>
      </View>
      <View style={styles.surahRight}>
        <Text style={[styles.surahArabic, { color: isActive ? theme.primary : theme.textPrimary }]}>
          {surah.nameArabic}
        </Text>
        <View style={styles.stateSlot}>
          {status === "loading" ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : status === "playing" ? (
            <Waveform active color={theme.primary} />
          ) : status === "paused" ? (
            <Feather name="pause" size={13} color={theme.primary} />
          ) : (
            <Feather name="play" size={13} color={theme.textSecondary} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}, (p, n) => p.isActive === n.isActive && p.status === n.status && p.theme === n.theme);

export default function AudioScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const TAB_BAR_H = Platform.OS === "web" ? 84 : 56 + insets.bottom;
  const PLAYER_H = 210;
  const { addBookmark, removeBookmark, isBookmarked, defaultReciter, setDefaultReciter } = useQuran();

  const audio = useAudio(defaultReciter);
  const [showReciters, setShowReciters] = useState(false);
  const [selectingReciterId, setSelectingReciterId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  const {
    status,
    currentSurahId,
    currentAyahNumber: currentAyah,
    reciter,
    playbackRate: speed,
    repeatMode,
    playSurah,
    pauseResume,
    stopAudio,
    setReciter,
    setPlaybackRate,
    setRepeatMode,
  } = audio;

  const handleSurahPress = useCallback(async (surahId: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (currentSurahId === surahId && status !== "idle") {
      await pauseResume();
      return;
    }
    await playSurah(surahId, 1);
  }, [currentSurahId, status, playSurah, pauseResume]);

  const handleSpeedChange = useCallback(() => {
    const idx = SPEEDS.indexOf(speed as 0.75 | 1 | 1.25 | 1.5 | 2);
    const nextSpeed = SPEEDS[(idx + 1) % SPEEDS.length];
    setPlaybackRate(nextSpeed);
  }, [speed, setPlaybackRate]);

  const handleRepeat = useCallback(() => {
    const next: RepeatMode = repeatMode === "none" ? "one" : repeatMode === "one" ? "all" : "none";
    setRepeatMode(next);
  }, [repeatMode, setRepeatMode]);

  const filteredSurahs = search.length === 0
    ? SURAHS
    : SURAHS.filter((s) => {
        const q = search.toLowerCase();
        return s.nameEnglish.toLowerCase().includes(q) || s.nameArabic.includes(q) || String(s.id).includes(q);
      });

  const currentSurah = SURAHS.find((s) => s.id === currentSurahId) ?? null;
  const currentAyahId = currentSurahId ? `${currentSurahId}:${currentAyah}` : null;
  const currentAyahBookmarked = currentAyahId ? isBookmarked(currentAyahId) : false;

  const handleBookmark = useCallback(async () => {
    if (!currentSurahId || !currentAyahId || !currentSurah || !currentAyah) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (currentAyahBookmarked) {
      await removeBookmark(currentAyahId);
    } else {
      await addBookmark({
        surahId: currentSurahId,
        ayahId: currentAyahId,
        ayahNumber: currentAyah,
        surahName: currentSurah.nameEnglish,
        arabic: `${currentSurah.nameArabic} - Ayah ${currentAyah}`,
        timestamp: Date.now(),
      });
    }
  }, [currentSurahId, currentAyahId, currentAyah, currentSurah, currentAyahBookmarked, addBookmark, removeBookmark]);

  const handleReciterSelect = useCallback(async (nextReciter: Reciter) => {
    if (nextReciter.id === reciter.id) {
      setShowReciters(false);
      return;
    }

    setSelectingReciterId(nextReciter.id);
    try {
      await setDefaultReciter(nextReciter);
      setReciter(nextReciter);
      setShowReciters(false);
    } finally {
      setSelectingReciterId(null);
    }
  }, [reciter.id, setDefaultReciter, setReciter]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: TAB_BAR_H + (currentSurahId !== null ? PLAYER_H + 32 : 24),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <PageHeader
          title={t("quranAudio")}
          arabicTitle="الْقُرْآن الصَّوْتِي"
          subtitle={t("listenToQuran")}
        >
          <TouchableOpacity style={styles.reciterChip} onPress={() => setShowReciters(true)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="microphone-variant" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.reciterChipText} numberOfLines={1}>{reciter.name}</Text>
            <Feather name="chevron-down" size={13} color="rgba(255,255,255,0.65)" />
          </TouchableOpacity>
        </PageHeader>

        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Feather name="search" size={16} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder={t("searchSurahs")}
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={15} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.list}>
          {filteredSurahs.map((surah) => {
            const isActive = surah.id === currentSurahId;
            return (
              <SurahRow
                key={surah.id}
                surah={surah}
                isActive={isActive}
                status={isActive ? status : "none"}
                onPress={() => handleSurahPress(surah.id)}
                theme={theme}
              />
            );
          })}
        </View>
      </ScrollView>

      <ReciterPickerSheet
        visible={showReciters}
        reciter={reciter}
        defaultReciter={defaultReciter}
        selectingReciterId={selectingReciterId}
        onClose={() => {
          if (!selectingReciterId) setShowReciters(false);
        }}
        onSelect={handleReciterSelect}
        theme={theme}
        t={t}
      />

      {currentSurahId !== null && currentSurah !== null && (
        <PlayerCard
          audio={audio}
          surah={currentSurah}
          ayahNum={currentAyah || 1}
          status={status}
          reciter={reciter}
          speed={speed}
          repeatMode={repeatMode}
          isBookmarked={currentAyahBookmarked}
          theme={theme}
          tabBarH={TAB_BAR_H}
          onPlayPause={pauseResume}
          onStop={stopAudio}
          onPrev={() => {
            if (currentSurahId && currentAyah && currentAyah > 1) {
              audio.playAyah({ id: `${currentSurahId}:${currentAyah - 1}`, ayahNumber: currentAyah - 1 }, currentSurahId);
            }
          }}
          onNext={() => {
            if (currentSurahId && currentAyah && currentAyah < currentSurah.totalAyahs) {
              audio.playAyah({ id: `${currentSurahId}:${currentAyah + 1}`, ayahNumber: currentAyah + 1 }, currentSurahId);
            }
          }}
          onSpeed={handleSpeedChange}
          onRepeat={handleRepeat}
          onBookmark={handleBookmark}
        />
      )}
    </View>
  );
}

function ReciterPickerSheet({
  visible,
  reciter,
  defaultReciter,
  selectingReciterId,
  onClose,
  onSelect,
  theme,
  t,
}: {
  visible: boolean;
  reciter: Reciter;
  defaultReciter: Reciter;
  selectingReciterId: string | null;
  onClose: () => void;
  onSelect: (reciter: Reciter) => void;
  theme: ReturnType<typeof useTheme>;
  t: any;
}) {
  const switching = selectingReciterId !== null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheetCard, { backgroundColor: theme.background }]}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleWrap}>
              <Text style={[styles.sheetEyebrow, { color: theme.primary }]}>{t("reciter")}</Text>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>{t("chooseListeningVoice")}</Text>
              <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
                {t("switchingNote")}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.sheetCloseBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={onClose}
              activeOpacity={0.75}
              disabled={switching}
            >
              <Feather name="x" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.currentReciterCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.currentReciterLabel, { color: theme.textSecondary }]}>{t("currentSelection")}</Text>
            <Text style={[styles.currentReciterName, { color: theme.textPrimary }]}>{reciter.name}</Text>
            <Text style={[styles.currentReciterSub, { color: theme.textSecondary }]}>
              {reciter.arabicName} · {reciter.style}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetList}>
            {RECITERS.map((item, index) => {
              const active = item.id === reciter.id;
              const isDefault = item.id === defaultReciter.id;
              const isLoading = item.id === selectingReciterId;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.reciterOptionCard,
                    { backgroundColor: theme.cardBackground, borderColor: theme.border },
                    active && { borderColor: theme.primary, backgroundColor: theme.primary + "0E" },
                  ]}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.85}
                  disabled={switching}
                >
                  <View style={styles.reciterOptionMain}>
                    <View style={[styles.reciterAvatar, { backgroundColor: active ? theme.primary + "18" : theme.background }]}>
                      <MaterialCommunityIcons
                        name={active ? "microphone-variant" : "account-voice"}
                        size={18}
                        color={active ? theme.primary : theme.textSecondary}
                      />
                    </View>
                    <View style={styles.reciterCopy}>
                      <View style={styles.reciterNameRow}>
                        <Text style={[styles.reciterName, { color: active ? theme.primary : theme.textPrimary }]}>{item.name}</Text>
                        {isDefault && (
                          <View style={[styles.reciterBadge, { backgroundColor: theme.accent + "20" }]}>
                            <Text style={[styles.reciterBadgeText, { color: theme.accent }]}>{t("default")}</Text>
                          </View>
                        )}
                        {active && (
                          <View style={[styles.reciterBadge, { backgroundColor: theme.primary + "18" }]}>
                            <Text style={[styles.reciterBadgeText, { color: theme.primary }]}>{t("currentLabel")}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.reciterSub, { color: theme.textSecondary }]}>{item.arabicName}</Text>
                      <Text style={[styles.reciterMeta, { color: theme.textSecondary }]}>
                        {item.style}{index === 0 ? ` · ${t("greatDefault")}` : active ? ` · ${t("activeNow")}` : ""}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.reciterOptionStatus}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : active ? (
                      <Feather name="check-circle" size={18} color={theme.primary} />
                    ) : (
                      <Feather name="chevron-right" size={18} color={theme.textSecondary} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PlayerCard({
  audio,
  surah,
  ayahNum,
  status,
  reciter,
  speed,
  repeatMode,
  isBookmarked,
  theme,
  tabBarH,
  onPlayPause,
  onStop,
  onPrev,
  onNext,
  onSpeed,
  onRepeat,
  onBookmark,
}: {
  audio: any;
  surah: (typeof SURAHS)[0];
  ayahNum: number;
  status: PlayStatus;
  reciter: Reciter;
  speed: number;
  repeatMode: string;
  isBookmarked: boolean;
  theme: ReturnType<typeof useTheme>;
  tabBarH: number;
  onPlayPause: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSpeed: () => void;
  onRepeat: () => void;
  onBookmark: () => void;
}) {
  const { t } = useTranslation();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const trackWidthRef = useRef(0);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: audio.progress,
      useNativeDriver: false,
      duration: 150,
    }).start();
  }, [audio.progress, progressAnim]);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  const primary = theme.primary;
  const gold = theme.accent;
  const borderColor = theme.border;
  const fg = theme.textPrimary;
  const muted = theme.textSecondary;
  const secondary = theme.cardBackground;

  const repeatIconName = repeatMode === "none" ? "repeat" : repeatMode === "one" ? "repeat-once" : "repeat";
  const repeatColor = repeatMode === "none" ? muted : primary;
  const speedLabel = speed === 1 ? "1x" : `${speed}x`;

  return (
    <View
      style={[
        styles.cardWrapper,
        {
          bottom: tabBarH + 24,
          backgroundColor: "#FFFFFF",
          borderColor,
          shadowColor: "#000",
        },
      ]}
    >
      <View style={styles.cardTopRow}>
        <View style={[styles.avatar, { backgroundColor: primary + "18", borderColor: primary + "40" }]}>
          <MaterialCommunityIcons name="microphone-variant" size={22} color={primary} />
        </View>

        <View style={styles.cardTitleBlock}>
          <Text style={[styles.cardSurahName, { color: fg }]} numberOfLines={1}>
            {surah.nameEnglish}
          </Text>
          <Text style={[styles.cardMeta, { color: muted }]} numberOfLines={1}>
            {reciter.name.split(" ")[0]} · {t("ayah")} {ayahNum} / {surah.totalAyahs}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.speedBtn, { backgroundColor: primary + "18", borderColor: primary + "40" }]}
          onPress={onSpeed}
          activeOpacity={0.75}
        >
          <Text style={[styles.speedText, { color: primary }]}>{speedLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBookmark} hitSlop={8} style={styles.closeIcon} activeOpacity={0.7}>
          <Feather
            name="bookmark"
            size={20}
            color={isBookmarked ? gold : muted}
            style={{ opacity: isBookmarked ? 1 : 0.6 }}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={onStop} hitSlop={8} style={styles.closeIcon}>
          <Feather name="x-circle" size={20} color={muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.seekRow}>
        <Text style={[styles.timeLabel, { color: muted }]}>{formatMs(audio.currentTime)}</Text>

        <TouchableOpacity
          activeOpacity={1}
          style={styles.trackTouchArea}
          onLayout={(e: LayoutChangeEvent) => {
            trackWidthRef.current = e.nativeEvent.layout.width;
          }}
          onPress={(e) => {
            if (trackWidthRef.current > 0 && audio.duration > 0) {
              const ratio = e.nativeEvent.locationX / trackWidthRef.current;
              audio.seekTo(ratio * audio.duration);
            }
          }}
        >
          <View style={[styles.trackBg, { backgroundColor: theme.isDark ? "rgba(255,255,255,0.1)" : theme.cardBackground }]}>
            <Animated.View
              style={[
                styles.trackFill,
                {
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                  backgroundColor: theme.accent,
                },
              ]}
            />
          </View>
        </TouchableOpacity>

        <Text style={[styles.timeLabel, { color: muted, textAlign: "right" }]}>
          {audio.duration > 0 ? formatMs(audio.duration) : "--:--"}
        </Text>
      </View>

      <View style={styles.controlRow}>
        <TouchableOpacity style={styles.sideCtrl} onPress={onRepeat} activeOpacity={0.7}>
          <MaterialCommunityIcons name={repeatIconName as any} size={22} color={repeatColor} />
          {repeatMode !== "none" && <View style={[styles.activeDot, { backgroundColor: primary }]} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideCtrl} onPress={onPrev} activeOpacity={0.75}>
          <Feather name="skip-back" size={24} color={fg} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playBigBtn, { backgroundColor: primary }]}
          onPress={onPlayPause}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.primaryForeground} size="small" />
          ) : (
            <Feather
              name={isPlaying ? "pause" : "play"}
              size={26}
              color={theme.primaryForeground}
              style={!isPlaying ? { marginLeft: 3 } : undefined}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideCtrl} onPress={onNext} activeOpacity={0.75}>
          <Feather name="skip-forward" size={24} color={fg} />
        </TouchableOpacity>

        <View style={[styles.arabicBadge, { backgroundColor: secondary }]}>
          <Text style={[styles.arabicBadgeText, { color: primary }]} numberOfLines={1}>
            {surah.nameArabic}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  reciterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: "center",
    marginTop: 4,
  },
  reciterChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.92)",
    maxWidth: 180,
  },
  sheetRoot: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(11,18,13,0.42)" },
  sheetCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 22,
    gap: 16,
    minHeight: 420,
    maxHeight: "82%",
  },
  sheetHandle: { width: 46, height: 5, borderRadius: 999, alignSelf: "center" },
  sheetHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  sheetTitleWrap: { flex: 1, gap: 4 },
  sheetEyebrow: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.6 },
  sheetTitle: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 28 },
  sheetSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  currentReciterCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 3,
  },
  currentReciterLabel: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  currentReciterName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  currentReciterSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sheetList: { gap: 10, paddingBottom: 6 },
  reciterOptionCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  reciterOptionMain: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  reciterAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  reciterCopy: { flex: 1, gap: 2 },
  reciterNameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  reciterName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  reciterSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  reciterMeta: { fontSize: 12, fontFamily: "Inter_500Medium" },
  reciterBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  reciterBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  reciterOptionStatus: { width: 22, alignItems: "center", justifyContent: "center" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  list: { paddingHorizontal: 16, gap: 8 },
  surahRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  numBadge: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  numText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  surahInfo: { flex: 1, gap: 2, overflow: "hidden" },
  surahNameEn: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  surahMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  surahRight: { alignItems: "flex-end", gap: 4, flexShrink: 0, minWidth: 64 },
  surahArabic: { fontSize: 16, fontFamily: "Inter_400Regular" },
  stateSlot: { height: 20, alignItems: "center", justifyContent: "center" },
  cardWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    ...Platform.select({
      web: { boxShadow: "0px 6px 30px rgba(0,0,0,0.12)" } as any,
      native: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 12 },
    }),
  },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingTop: 4 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardTitleBlock: { flex: 1, gap: 2, overflow: "hidden" },
  cardSurahName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  cardMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  speedBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  speedText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  closeIcon: { padding: 2, flexShrink: 0 },
  seekRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeLabel: { fontSize: 11, fontFamily: "Inter_500Medium", minWidth: 38 },
  trackTouchArea: { flex: 1, height: 28, justifyContent: "center" },
  trackBg: { height: 5, borderRadius: 3, overflow: "visible" },
  trackFill: { height: 5, borderRadius: 3 },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  sideCtrl: { width: 44, height: 44, alignItems: "center", justifyContent: "center", position: "relative" },
  activeDot: { position: "absolute", bottom: 6, width: 5, height: 5, borderRadius: 2.5 },
  playBigBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0px 4px 16px rgba(21,98,47,0.45)" } as any,
      native: { shadowOpacity: 0.45, shadowRadius: 10, elevation: 8 },
    }),
  },
  arabicBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
    maxWidth: 80,
  },
  arabicBadgeText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
