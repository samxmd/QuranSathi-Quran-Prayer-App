import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { getAyahAudioUrls, type Reciter, DEFAULT_RECITER } from "@/services/audioService";
import { SURAHS } from "@/data/surahs";

export type AudioStatus = "idle" | "loading" | "playing" | "paused" | "error";
export type RepeatMode = "none" | "one" | "all";

export interface AudioErrorState {
  kind: "network" | "playback" | "unknown";
  message: string;
  urlsTried: string[];
}

export interface AyahMinimal {
  id: string;
  ayahNumber: number;
}

interface PlayAyahOptions {
  onComplete?: () => void;
  onError?: (error: AudioErrorState) => void;
}

interface PlayAyahInternalOptions {
  autoPlay?: boolean;
  startPositionMs?: number;
  retainedDurationMs?: number;
}

interface AudioContextType {
  status: AudioStatus;
  currentAyahId: string | null;
  currentSurahId: number | null;
  currentAyahNumber: number | null;
  reciter: Reciter;
  progress: number;
  currentTime: number;
  duration: number;
  playbackRate: number;
  repeatMode: RepeatMode;
  error: AudioErrorState | null;
  playAyah: (ayah: AyahMinimal, surahId: number, options?: PlayAyahOptions) => Promise<void>;
  playSurah: (surahId: number, startAyah?: number) => Promise<void>;
  pauseResume: () => Promise<void>;
  stopAudio: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
  setReciter: (r: Reciter) => void;
  setPlaybackRate: (rate: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  clearError: () => void;
  isPlaying: (ayahId: string) => boolean;
}

const AudioContext = createContext<AudioContextType | null>(null);

const LOCK_SCREEN_OPTIONS = {
  showSeekBackward: true,
  showSeekForward: true,
} as const;

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const playbackCallbacksRef = useRef<Pick<PlayAyahOptions, "onComplete" | "onError">>({});
  const requestIdRef = useRef(0);
  const isMounted = useRef(true);
  const reciterRef = useRef<Reciter>(DEFAULT_RECITER);
  const statusRef = useRef<AudioStatus>("idle");

  const [status, setStatus] = useState<AudioStatus>("idle");
  const [currentAyahId, setCurrentAyahId] = useState<string | null>(null);
  const [currentSurahId, setCurrentSurahId] = useState<number | null>(null);
  const [currentAyahNumber, setCurrentAyahNumber] = useState<number | null>(null);
  const [reciter, setReciterState] = useState<Reciter>(DEFAULT_RECITER);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>("none");
  const [error, setError] = useState<AudioErrorState | null>(null);

  // Stats for internal use
  const playbackRateRef = useRef(1);
  const repeatModeRef = useRef<RepeatMode>("none");
  const currentSurahIdRef = useRef<number | null>(null);
  const currentAyahNumberRef = useRef<number | null>(null);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
    repeatModeRef.current = repeatMode;
    currentSurahIdRef.current = currentSurahId;
    currentAyahNumberRef.current = currentAyahNumber;
    reciterRef.current = reciter;
    statusRef.current = status;
    currentTimeRef.current = currentTime;
    durationRef.current = duration;
  }, [playbackRate, repeatMode, currentSurahId, currentAyahNumber, reciter, status, currentTime, duration]);

  useEffect(() => {
    isMounted.current = true;
    setAudioModeAsync({
      shouldPlayInBackground: true,
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      allowsRecording: false,
    }).catch((err) => console.warn("Failed to set audio mode:", err));

    return () => {
      isMounted.current = false;
      if (playerRef.current) {
        try { playerRef.current.setActiveForLockScreen(false); } catch {}
        try { playerRef.current.pause(); } catch {}
        try { playerRef.current.release(); } catch {}
        playerRef.current = null;
      }
    };
  }, []);

  const attachListener = useCallback((player: AudioPlayer) => {
    player.addListener("playbackStatusUpdate", (s: any) => {
      if (!isMounted.current) return;
      if (player !== playerRef.current) return;

      if (s.isPlaying) {
        setStatus("playing");
      } else if (s.playbackState === "paused") {
        setStatus("paused");
      }

      if (typeof s.duration === "number" && s.duration > 0) {
        const pos = s.currentTime ?? 0;
        setProgress(pos / s.duration);
        setCurrentTime(pos * 1000);
        setDuration(s.duration * 1000);
        currentTimeRef.current = pos * 1000;
        durationRef.current = s.duration * 1000;
      }

      if (s.playbackState === "ended" || s.didJustFinish) {
        handleFinished();
      }
    });
  }, []);

  function handleFinished() {
    const sid = currentSurahIdRef.current;
    const aid = currentAyahNumberRef.current;
    const mode = repeatModeRef.current;

    if (!sid || !aid) {
      cleanupAudioState();
      playbackCallbacksRef.current.onComplete?.();
      return;
    }

    if (playbackCallbacksRef.current.onComplete) {
      cleanupAudioState();
      playbackCallbacksRef.current.onComplete();
      return;
    }

    if (mode === "one") {
      playAyahInternal(sid, aid);
      return;
    }

    const surah = SURAHS.find((s) => s.id === sid);
    if (aid < (surah?.totalAyahs ?? 0)) {
      playAyahInternal(sid, aid + 1);
    } else if (sid < 114 && mode === "all") {
      playAyahInternal(sid + 1, 1);
    } else {
      cleanupAudioState();
    }
  }

  function cleanupAudioState() {
    if (playerRef.current) {
      try { playerRef.current.setActiveForLockScreen(false); } catch {}
    }
    if (isMounted.current) {
      setStatus("idle");
      setCurrentAyahId(null);
      setCurrentSurahId(null);
      setCurrentAyahNumber(null);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      currentTimeRef.current = 0;
      durationRef.current = 0;
    }
  }

  function getLockScreenMetadata(surahId: number, ayahNumber: number, activeReciter: Reciter) {
    const surah = SURAHS.find((item) => item.id === surahId);
    const surahName = surah?.nameEnglish ?? `Surah ${surahId}`;

    return {
      title: `${surahName} - Ayah ${ayahNumber}`,
      artist: activeReciter.name,
      albumTitle: "QuranSathi",
    };
  }

  function activateLockScreen(player: AudioPlayer, surahId: number, ayahNumber: number, activeReciter: Reciter) {
    try {
      player.setActiveForLockScreen(
        true,
        getLockScreenMetadata(surahId, ayahNumber, activeReciter),
        LOCK_SCREEN_OPTIONS
      );
    } catch (err) {
      console.warn("Failed to activate lock screen controls:", err);
    }
  }

  function updateLockScreenMetadata(player: AudioPlayer, surahId: number, ayahNumber: number, activeReciter: Reciter) {
    try {
      player.updateLockScreenMetadata(getLockScreenMetadata(surahId, ayahNumber, activeReciter));
    } catch (err) {
      console.warn("Failed to update lock screen metadata:", err);
    }
  }

  async function playAyahInternal(
    surahId: number,
    ayahNumber: number,
    options: PlayAyahInternalOptions = {}
  ) {
    const activeReciter = reciterRef.current;
    const urls = getAyahAudioUrls(surahId, ayahNumber, activeReciter);
    const ayahId = `${surahId}:${ayahNumber}`;
    const startPositionMs = Math.max(0, options.startPositionMs ?? 0);
    const retainedDurationMs = Math.max(0, options.retainedDurationMs ?? 0);
    const autoPlay = options.autoPlay ?? true;

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    if (playerRef.current) {
      try { playerRef.current.pause(); } catch {}
    }

    if (isMounted.current) {
      setStatus("loading");
      setCurrentAyahId(ayahId);
      setCurrentSurahId(surahId);
      setCurrentAyahNumber(ayahNumber);
      setProgress(retainedDurationMs > 0 ? Math.min(startPositionMs / retainedDurationMs, 0.99) : 0);
      setCurrentTime(startPositionMs);
      setDuration(retainedDurationMs);
      currentTimeRef.current = startPositionMs;
      durationRef.current = retainedDurationMs;
      setError(null);
    }

    for (const url of urls) {
      try {
        if (requestId !== requestIdRef.current || !isMounted.current) return;

        if (!playerRef.current) {
          const p = createAudioPlayer(url, { updateInterval: 100 });
          attachListener(p);
          playerRef.current = p;
        } else {
          playerRef.current.replace({ uri: url });
        }

        await waitForReady(playerRef.current, requestId);
        if (requestId !== requestIdRef.current || !isMounted.current) return;

        const p = playerRef.current;
        const rate = playbackRateRef.current;
        applyRate(p, rate);
        activateLockScreen(p, surahId, ayahNumber, activeReciter);
        updateLockScreenMetadata(p, surahId, ayahNumber, activeReciter);
        if (startPositionMs > 0) {
          try {
            await p.seekTo(startPositionMs / 1000);
          } catch {}
        }

        if (autoPlay) {
          p.play();
          if (isMounted.current) setStatus("playing");
        } else if (isMounted.current) {
          setStatus("paused");
        }
        return;
      } catch (e) {
        console.warn(`[Audio] Failed to play ${url}. Error:`, e);
      if (playerRef.current) {
        try { playerRef.current.setActiveForLockScreen(false); } catch {}
        try { playerRef.current.release(); } catch {}
        playerRef.current = null;
      }
      }
    }

    if (requestId === requestIdRef.current && isMounted.current) {
      handleError(urls);
    }
  }

  function applyRate(p: AudioPlayer, rate: number) {
    try {
      if (typeof p.setPlaybackRate === 'function') {
        p.setPlaybackRate(rate);
      } else {
        (p as any).playbackRate = rate;
      }
    } catch {}
  }

  function handleError(urls: string[]) {
    const errorState: AudioErrorState = {
      kind: "network",
      message: "Audio could not be loaded. Please check your connection.",
      urlsTried: urls,
    };
    setStatus("error");
    setCurrentAyahId(null);
    setProgress(0);
    setError(errorState);
    playbackCallbacksRef.current.onError?.(errorState);
  }

  const playAyah = useCallback(async (ayah: AyahMinimal, surahId: number, options?: PlayAyahOptions) => {
    playbackCallbacksRef.current = {
      onComplete: options?.onComplete,
      onError: options?.onError,
    };
    await playAyahInternal(surahId, ayah.ayahNumber);
  }, [reciter]);

  const playSurah = useCallback(async (surahId: number, startAyah: number = 1) => {
    playbackCallbacksRef.current = {};
    await playAyahInternal(surahId, startAyah);
  }, [reciter]);

  const stopAudio = useCallback(async () => {
    requestIdRef.current += 1;
    if (playerRef.current) {
      try { playerRef.current.setActiveForLockScreen(false); } catch {}
      try { playerRef.current.pause(); } catch {}
    }
    playbackCallbacksRef.current = {};
    cleanupAudioState();
  }, []);

  const pauseResume = useCallback(async () => {
    if (!playerRef.current) return;
    try {
      if (playerRef.current.playing) {
        playerRef.current.pause();
        setStatus("paused");
      } else {
        playerRef.current.play();
        setStatus("playing");
      }
    } catch {}
  }, []);

  const seekTo = useCallback(async (ms: number) => {
    if (!playerRef.current) return;
    try { await playerRef.current.seekTo(ms / 1000); } catch {}
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (playerRef.current) applyRate(playerRef.current, rate);
  }, []);

  const setRepeatMode = useCallback((mode: RepeatMode) => {
    setRepeatModeState(mode);
  }, []);

  const setReciter = useCallback((r: Reciter) => {
    const previousSurahId = currentSurahIdRef.current;
    const previousAyahNumber = currentAyahNumberRef.current;
    const previousStatus = statusRef.current;
    const shouldResumeCurrentAyah =
      previousStatus === "playing" ||
      previousStatus === "paused" ||
      previousStatus === "loading";
    const savedDurationMs = durationRef.current;
    const savedPositionMs = Math.min(
      Math.max(0, currentTimeRef.current),
      savedDurationMs > 0 ? Math.max(savedDurationMs - 500, 0) : Number.MAX_SAFE_INTEGER
    );
    const shouldAutoPlayAfterSwitch = previousStatus !== "paused";

    reciterRef.current = r;
    setError(null);
    setReciterState(r);

    requestIdRef.current += 1;
    if (playerRef.current) {
      try { playerRef.current.pause(); } catch {}
    }

    if (shouldResumeCurrentAyah && previousSurahId && previousAyahNumber) {
      playbackCallbacksRef.current = {};
      playAyahInternal(previousSurahId, previousAyahNumber, {
        autoPlay: shouldAutoPlayAfterSwitch,
        startPositionMs: savedPositionMs,
        retainedDurationMs: savedDurationMs,
      }).catch(() => {});
      return;
    }

    playbackCallbacksRef.current = {};
    cleanupAudioState();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const isPlaying = useCallback((ayahId: string) => currentAyahId === ayahId && status === "playing", [currentAyahId, status]);

  const value = {
    status, currentAyahId, currentSurahId, currentAyahNumber, reciter, progress,
    currentTime, duration, playbackRate, repeatMode, error,
    playAyah, playSurah, pauseResume, stopAudio, seekTo,
    setReciter, setPlaybackRate, setRepeatMode, clearError, isPlaying
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudioContext() {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudioContext must be used within an AudioProvider");
  return context;
}

function waitForReady(player: AudioPlayer, requestId: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!player) { reject(new Error("No player")); return; }
    const state = (player as any).currentStatus?.playbackState;
    if (state === "readyToPlay" || state === "playing" || (player as any).isLoaded) {
      resolve(); return;
    }
    let done = false;
    const timeout = setTimeout(() => {
      if (done) return; done = true; sub.remove();
      reject(new Error("Audio loading timed out (25s)"));
    }, 25000);
    const sub = player.addListener("playbackStatusUpdate", (s: any) => {
      if (done) return;
      if (s.playbackState === "readyToPlay" || s.playbackState === "playing" || s.playbackState === "buffering") {
        done = true; sub.remove(); clearTimeout(timeout); resolve();
      } else if (s.playbackState === "error") {
        done = true; sub.remove(); clearTimeout(timeout);
        reject(new Error(`Playback error: ${s.error?.message ?? "Unknown"}`));
      }
    });
  });
}
