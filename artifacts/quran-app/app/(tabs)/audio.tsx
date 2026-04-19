import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
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
import { SURAHS } from "@/data/surahs";
import { RECITERS, type Reciter } from "@/services/audioService";
import { PageHeader } from "@/components/PageHeader";

// ─── URL ──────────────────────────────────────────────────────────────────────
function ayahUrl(surahId: number, ayahNum: number, reciter: Reciter): string {
  const s = String(surahId).padStart(3, "0");
  const a = String(ayahNum).padStart(3, "0");
  return `https://everyayah.com/data/${reciter.folder}/${s}${a}.mp3`;
}

type PlayStatus = "idle" | "loading" | "playing" | "paused";
type RepeatMode = "none" | "one" | "all";
const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ─── Waveform ─────────────────────────────────────────────────────────────────
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
      Animated.stagger(80,
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
    return () => { loop.stop(); };
  }, [active]);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      {anims.map((a, i) => (
        <Animated.View key={i} style={{
          width: 3, borderRadius: 2, backgroundColor: color,
          height: a.interpolate({ inputRange: [0, 1], outputRange: [3, 16] }),
        }} />
      ))}
    </View>
  );
});

// ─── Surah Row ────────────────────────────────────────────────────────────────
const SurahRow = React.memo(function SurahRow({ surah, isActive, status, onPress, theme }: {
  surah: (typeof SURAHS)[0];
  isActive: boolean;
  status: PlayStatus | "none";
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AudioScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const TAB_BAR_H = Platform.OS === "web" ? 84 : 56 + insets.bottom;
  const PLAYER_H = 210;

  const [reciter, setReciterState] = useState<Reciter>(RECITERS[0]);
  const [showReciters, setShowReciters] = useState(false);
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<PlayStatus>("idle");
  const [currentSurahId, setCurrentSurahId] = useState<number | null>(null);
  const [currentAyah, setCurrentAyah] = useState<number>(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
  const [speed, setSpeed] = useState<Speed>(1);

  const playerRef = useRef<any>(null);
  const reciterRef = useRef(reciter);
  reciterRef.current = reciter;
  const currentSurahIdRef = useRef<number | null>(null);
  currentSurahIdRef.current = currentSurahId;
  const currentAyahRef = useRef(1);
  currentAyahRef.current = currentAyah;
  const repeatModeRef = useRef<RepeatMode>("none");
  repeatModeRef.current = repeatMode;
  const speedRef = useRef<Speed>(1);
  speedRef.current = speed;

  const onAutoNextRef = useRef<(sid: number, aid: number) => void>(() => {});

  useEffect(() => {
    setAudioModeAsync({
      shouldPlayInBackground: true,
      playsInSilentMode: true,
      interruptionMode: "duckOthers",
    }).catch(() => {});
    
    return () => { 
      if (playerRef.current) {
        playerRef.current.release();
        playerRef.current = null;
      }
    };
  }, []);

  const unloadSound = useCallback(async () => {
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.release();
      playerRef.current = null;
    }
  }, []);

  const playAyah = useCallback(async (surahId: number, ayahNum: number) => {
    await unloadSound();
    setCurrentSurahId(surahId);
    setCurrentAyah(ayahNum);
    setStatus("loading");

    const url = ayahUrl(surahId, ayahNum, reciterRef.current);

    try {
      const player = createAudioPlayer(url);
      player.playbackRate = speedRef.current;
      
      player.addListener("playbackStatusUpdate", (ps) => {
        if (ps.playbackState === "readyToPlay") {
          setStatus((prev) => prev === "loading" ? "playing" : prev);
        } else if (ps.playbackState === "finished") {
          const sid = currentSurahIdRef.current ?? surahId;
          const aid = currentAyahRef.current;
          const mode = repeatModeRef.current;

          if (mode === "one") {
            setTimeout(() => onAutoNextRef.current(sid, aid), 300);
            return;
          }

          const thisSurah = SURAHS.find((s) => s.id === sid);
          if (!thisSurah) return;

          if (aid < thisSurah.totalAyahs) {
            setTimeout(() => onAutoNextRef.current(sid, aid + 1), 400);
          } else if (sid < 114) {
            setTimeout(() => onAutoNextRef.current(sid + 1, 1), 600);
          } else if (mode === "all") {
            setTimeout(() => onAutoNextRef.current(1, 1), 600);
          } else {
            setStatus("idle");
            setCurrentSurahId(null);
          }
        }
      });

      playerRef.current = player;
      player.play();
      setStatus("playing");
    } catch {
      setStatus("idle");
      setCurrentSurahId(null);
    }
  }, [unloadSound]);

  useEffect(() => { onAutoNextRef.current = playAyah; }, [playAyah]);

  const handleSurahPress = useCallback(async (surahId: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (currentSurahIdRef.current === surahId && playerRef.current) {
      if (playerRef.current.playing) { 
        playerRef.current.pause(); 
        setStatus("paused"); 
      } else { 
        playerRef.current.play(); 
        setStatus("playing"); 
      }
      return;
    }
    playAyah(surahId, 1);
  }, [playAyah]);

  const handleStop = useCallback(async () => {
    await unloadSound();
    setStatus("idle");
    setCurrentSurahId(null);
  }, [unloadSound]);

  const handlePlayPause = useCallback(async () => {
    if (!playerRef.current) return;
    if (playerRef.current.playing) { 
      playerRef.current.pause(); 
      setStatus("paused"); 
    } else { 
      playerRef.current.play(); 
      setStatus("playing"); 
    }
  }, []);

  const handlePrev = useCallback(() => {
    const sid = currentSurahIdRef.current; const aid = currentAyahRef.current;
    if (!sid) return;
    if (aid > 1) playAyah(sid, aid - 1);
    else if (sid > 1) playAyah(sid - 1, 1);
  }, [playAyah]);

  const handleNext = useCallback(() => {
    const sid = currentSurahIdRef.current; const aid = currentAyahRef.current;
    if (!sid) return;
    const thisSurah = SURAHS.find((s) => s.id === sid);
    if (!thisSurah) return;
    if (aid < thisSurah.totalAyahs) playAyah(sid, aid + 1);
    else if (sid < 114) playAyah(sid + 1, 1);
  }, [playAyah]);

  const handleSpeedChange = useCallback(async () => {
    const idx = SPEEDS.indexOf(speedRef.current);
    const nextSpeed = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(nextSpeed);
    speedRef.current = nextSpeed;
    if (playerRef.current) {
      playerRef.current.playbackRate = nextSpeed;
    }
  }, []);

  const handleRepeat = useCallback(() => {
    setRepeatMode((m) => {
      const next: RepeatMode = m === "none" ? "one" : m === "one" ? "all" : "none";
      repeatModeRef.current = next;
      return next;
    });
  }, []);

  const { addBookmark, removeBookmark, isBookmarked } = useQuran();

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
    if (!currentSurahId || !currentAyahId || !currentSurah) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (currentAyahBookmarked) {
      await removeBookmark(currentAyahId);
    } else {
      await addBookmark({
        surahId: currentSurahId,
        ayahId: currentAyahId,
        ayahNumber: currentAyah,
        surahName: currentSurah.nameEnglish,
        arabic: `${currentSurah.nameArabic} — Ayah ${currentAyah}`,
        timestamp: Date.now(),
      });
    }
  }, [currentSurahId, currentAyahId, currentAyah, currentSurah, currentAyahBookmarked, addBookmark, removeBookmark]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: TAB_BAR_H + (currentSurahId !== null ? PLAYER_H + 8 : 20),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <PageHeader
          title="Audio Quran"
          arabicTitle="الْقُرْآن الصَّوْتِي"
          subtitle="Listen verse by verse with world-class reciters"
        >
          <TouchableOpacity style={styles.reciterChip} onPress={() => setShowReciters((v) => !v)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="microphone-variant" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.reciterChipText}>{reciter.name}</Text>
            <Feather name={showReciters ? "chevron-up" : "chevron-down"} size={13} color="rgba(255,255,255,0.65)" />
          </TouchableOpacity>
        </PageHeader>

        {showReciters && (
          <View style={[styles.reciterPanel, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            {RECITERS.map((r) => {
              const active = r.id === reciter.id;
              return (
                <TouchableOpacity key={r.id}
                  style={[styles.reciterOption, { borderBottomColor: theme.border }, active && { backgroundColor: theme.primary + "12" }]}
                  onPress={async () => { await handleStop(); setReciterState(r); reciterRef.current = r; setShowReciters(false); }}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={[styles.reciterName, { color: active ? theme.primary : theme.textPrimary }]}>{r.name}</Text>
                    <Text style={[styles.reciterSub, { color: theme.textSecondary }]}>{r.arabicName} · {r.style}</Text>
                  </View>
                  {active && <Feather name="check-circle" size={17} color={theme.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Feather name="search" size={16} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search surahs…"
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

      {currentSurahId !== null && currentSurah !== null && (
        <PlayerCard
          surah={currentSurah}
          ayahNum={currentAyah}
          status={status}
          reciter={reciter}
          speed={speed}
          repeatMode={repeatMode}
          isBookmarked={currentAyahBookmarked}
          playerRef={playerRef}
          theme={theme}
          tabBarH={TAB_BAR_H}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onPrev={handlePrev}
          onNext={handleNext}
          onSpeed={handleSpeedChange}
          onRepeat={handleRepeat}
          onBookmark={handleBookmark}
        />
      )}
    </View>
  );
}

// ─── PlayerCard — owns all timing state, never causes parent re-renders ───────
function PlayerCard({
  surah, ayahNum, status, reciter, speed, repeatMode, isBookmarked, playerRef, theme, tabBarH,
  onPlayPause, onStop, onPrev, onNext, onSpeed, onRepeat, onBookmark,
}: {
  surah: (typeof SURAHS)[0];
  ayahNum: number;
  status: PlayStatus;
  reciter: Reciter;
  speed: Speed;
  repeatMode: RepeatMode;
  isBookmarked: boolean;
  playerRef: React.MutableRefObject<any>;
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
  const [posMs, setPosMs] = useState(0);
  const [durMs, setDurMs] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const trackWidthRef = useRef(0);
  const isSeeking = useRef(false);

  useEffect(() => {
    setPosMs(0);
    setDurMs(0);
    progressAnim.setValue(0);
  }, [ayahNum, surah.id]);

  useEffect(() => {
    const iv = setInterval(() => {
      if (isSeeking.current || !playerRef.current) return;
      const pos = playerRef.current.currentTime ?? 0;
      const dur = playerRef.current.duration ?? 0;
      
      setPosMs(pos);
      if (dur > 0) { 
        setDurMs(dur); 
        progressAnim.setValue(pos / dur); 
      }
    }, 250);
    return () => clearInterval(iv);
  }, []);

  const handleTrackPress = useCallback(async (x: number) => {
    if (!playerRef.current || trackWidthRef.current === 0 || durMs === 0) return;
    const ratio = Math.max(0, Math.min(1, x / trackWidthRef.current));
    isSeeking.current = true;
    progressAnim.setValue(ratio);
    setPosMs(Math.floor(ratio * durMs));
    await playerRef.current.seekTo(Math.floor(ratio * durMs));
    isSeeking.current = false;
  }, [durMs]);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  const primary = theme.primary;
  const gold = theme.accent;
  const cardBg = theme.cardBackground;
  const borderColor = theme.border;
  const fg = theme.textPrimary;
  const muted = theme.textSecondary;
  const secondary = theme.cardBackground;

  const repeatIconName = repeatMode === "none" ? "repeat" : repeatMode === "one" ? "repeat-1" : "repeat";
  const repeatColor = repeatMode === "none" ? muted : primary;
  const speedLabel = speed === 1 ? "1×" : `${speed}×`;
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={[
      styles.cardWrapper,
      {
        bottom: tabBarH,
        backgroundColor: cardBg,
        borderTopColor: borderColor,
        shadowColor: theme.isDark ? "#000" : "#1C3A1C",
      },
    ]}>
      <View style={[styles.cardAccentLine, { backgroundColor: primary }]} />

      <View style={styles.cardTopRow}>
        <View style={[styles.avatar, { backgroundColor: primary + "18", borderColor: primary + "40" }]}>
          <MaterialCommunityIcons name="microphone-variant" size={22} color={primary} />
        </View>

        <View style={styles.cardTitleBlock}>
          <Text style={[styles.cardSurahName, { color: fg }]} numberOfLines={1}>
            {surah.nameEnglish}
          </Text>
          <Text style={[styles.cardMeta, { color: muted }]} numberOfLines={1}>
            {reciter.name.split(" ")[0]} · Ayah {ayahNum} / {surah.totalAyahs}
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
            name={isBookmarked ? "bookmark" : "bookmark"}
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
        <Text style={[styles.timeLabel, { color: muted }]}>{formatMs(posMs)}</Text>

        <TouchableOpacity
          activeOpacity={1}
          style={styles.trackTouchArea}
          onLayout={(e: LayoutChangeEvent) => { trackWidthRef.current = e.nativeEvent.layout.width; }}
          onPress={(e) => handleTrackPress(e.nativeEvent.locationX)}
        >
          <View style={[styles.trackBg, { backgroundColor: theme.isDark ? "rgba(255,255,255,0.1)" : theme.cardBackground }]}>
            <Animated.View style={[styles.trackFill, { width: progressWidth, backgroundColor: gold }]} />
          </View>
          <Animated.View style={[
            styles.thumb,
            {
              backgroundColor: gold,
              borderColor: theme.isDark ? "rgba(255,255,255,0.2)" : "#fff",
              shadowColor: gold,
            },
          ]} />
        </TouchableOpacity>

        <Text style={[styles.timeLabel, { color: muted, textAlign: "right" }]}>
          {durMs > 0 ? formatMs(durMs) : "--:--"}
        </Text>
      </View>

      <View style={styles.controlRow}>
        <TouchableOpacity style={styles.sideCtrl} onPress={onRepeat} activeOpacity={0.7}>
          <MaterialCommunityIcons name={repeatIconName as any} size={22} color={repeatColor} />
          {repeatMode !== "none" && (
            <View style={[styles.activeDot, { backgroundColor: primary }]} />
          )}
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
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    alignSelf: "center", marginTop: 4,
  },
  reciterChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.92)" },
  reciterPanel: {
    marginHorizontal: 16, marginBottom: 14,
    borderRadius: 18, borderWidth: 1, overflow: "hidden",
  },
  reciterOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reciterName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  reciterSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  list: { paddingHorizontal: 16, gap: 8 },
  surahRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
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
    position: "absolute", left: 0, right: 0,
    paddingHorizontal: 18, paddingBottom: 14,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderTopWidth: 1, gap: 12,
    ...Platform.select({
      web: { boxShadow: "0px -6px 30px rgba(0,0,0,0.18)" } as any,
      native: { shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 16 },
    }),
  },
  cardAccentLine: { height: 3, borderRadius: 2, width: 40, alignSelf: "center", marginTop: 8, marginBottom: -4 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardTitleBlock: { flex: 1, gap: 2, overflow: "hidden" },
  cardSurahName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  cardMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  speedBtn: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0,
  },
  speedText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  closeIcon: { padding: 2, flexShrink: 0 },
  seekRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeLabel: { fontSize: 11, fontFamily: "Inter_500Medium", minWidth: 38 },
  trackTouchArea: { flex: 1, height: 28, justifyContent: "center" },
  trackBg: { height: 5, borderRadius: 3, overflow: "visible" },
  trackFill: { height: 5, borderRadius: 3 },
  thumb: {
    position: "absolute",
    right: 0,
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, marginTop: -4.5,
    top: 0,
    ...Platform.select({
      web: { boxShadow: "0px 1px 4px rgba(0,0,0,0.3)" } as any,
      native: { shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
    }),
  },
  controlRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  sideCtrl: { width: 44, height: 44, alignItems: "center", justifyContent: "center", position: "relative" },
  activeDot: {
    position: "absolute", bottom: 6, width: 5, height: 5, borderRadius: 2.5,
  },
  playBigBtn: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: "center", justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0px 4px 16px rgba(21,98,47,0.45)" } as any,
      native: { shadowOpacity: 0.45, shadowRadius: 10, elevation: 8 },
    }),
  },
  arabicBadge: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    alignItems: "center", justifyContent: "center", flexShrink: 1, maxWidth: 80,
  },
  arabicBadgeText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
