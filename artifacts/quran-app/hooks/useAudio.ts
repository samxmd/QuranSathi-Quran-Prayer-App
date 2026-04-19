import { useAudioPlayer, useAudioPlayerStatus, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { getAyahAudioUrls, type Reciter, DEFAULT_RECITER } from "@/services/audioService";
import type { Ayah } from "@/data/ayahs";

export type AudioStatus = "idle" | "loading" | "playing" | "paused" | "error";
type AudioErrorKind = "network" | "playback" | "unknown";

export interface AudioErrorState {
  kind: AudioErrorKind;
  message: string;
  urlsTried: string[];
}

interface PlayAyahOptions {
  onComplete?: () => void;
  onError?: (error: AudioErrorState) => void;
}

interface UseAudioReturn {
  status: AudioStatus;
  currentAyahId: string | null;
  reciter: Reciter;
  progress: number;
  error: AudioErrorState | null;
  playAyah: (ayah: Ayah, surahId: number, options?: PlayAyahOptions) => Promise<void>;
  pauseResume: () => Promise<void>;
  stopAudio: () => Promise<void>;
  freezeAudio: () => void;
  setReciter: (r: Reciter) => void;
  clearError: () => void;
  isPlaying: (ayahId: string) => boolean;
}

export function useAudio(initialReciter: Reciter = DEFAULT_RECITER): UseAudioReturn {
  // We use a ref for the player to ensure it persists and we can control it imperatively
  const playerRef = useRef<any>(null);
  const playbackCallbacksRef = useRef<Pick<PlayAyahOptions, "onComplete" | "onError">>({});
  const activeRequestIdRef = useRef(0);
  
  const [status, setStatus] = useState<AudioStatus>("idle");
  const [currentAyahId, setCurrentAyahId] = useState<string | null>(null);
  const [reciter, setReciterState] = useState<Reciter>(initialReciter);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<AudioErrorState | null>(null);
  const isMounted = useRef(true);

  // Status updates from the player
  useEffect(() => {
    if (!playerRef.current) return;

    const subscription = playerRef.current.addListener("playbackStatusUpdate", (statusUpdate: any) => {
      if (!isMounted.current) return;

      if (statusUpdate.isPlaying) {
        setStatus("playing");
      } else if (statusUpdate.playbackState === "paused" || statusUpdate.playbackState === "readyToPlay") {
         // If we are ready but not playing, it might be paused or just loaded
         if (status === "playing") setStatus("paused");
      }

      if (statusUpdate.duration > 0) {
        setProgress(statusUpdate.currentTime / statusUpdate.duration);
      }

      if (statusUpdate.playbackState === "finished") {
        setStatus("idle");
        setCurrentAyahId(null);
        setProgress(0);
        playbackCallbacksRef.current.onComplete?.();
      }
    });

    return () => subscription.remove();
  }, [playerRef.current]);

  useEffect(() => {
    isMounted.current = true;
    
    // Set global audio mode for consistent behavior on mobile
    setAudioModeAsync({
      shouldPlayInBackground: true,
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    }).catch((err) => {
      console.warn("Failed to set audio mode:", err);
    });

    return () => {
      isMounted.current = false;
      if (playerRef.current) {
        playerRef.current.release();
        playerRef.current = null;
      }
    };
  }, []);

  const stopAudio = useCallback(async () => {
    activeRequestIdRef.current += 1;

    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.release();
      playerRef.current = null;
    }

    playbackCallbacksRef.current = {};
    if (isMounted.current) {
      setStatus("idle");
      setCurrentAyahId(null);
      setProgress(0);
    }
  }, []);

  const freezeAudio = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const playAyah = useCallback(
    async (ayah: Ayah, surahId: number, options?: PlayAyahOptions) => {
      activeRequestIdRef.current += 1;
      const requestId = activeRequestIdRef.current;

      // Clean up previous player
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.release();
        playerRef.current = null;
      }

      playbackCallbacksRef.current = {
        onComplete: options?.onComplete,
        onError: options?.onError,
      };

      setStatus("loading");
      setCurrentAyahId(ayah.id);
      setProgress(0);
      setError(null);

      const urls = getAyahAudioUrls(surahId, ayah.ayahNumber, reciter);

      for (const url of urls) {
        let player: any = null;
        try {
          if (requestId !== activeRequestIdRef.current) return;

          player = createAudioPlayer(url);
          
          // Wait for player to be ready or fail
          await new Promise<void>((resolve, reject) => {
            const sub = player.addListener("playbackStatusUpdate", (s: any) => {
              if (s.playbackState === "readyToPlay") {
                sub.remove();
                resolve();
              } else if (s.playbackState === "error") {
                sub.remove();
                reject(new Error("Playback error"));
              }
            });
            
            // Timeout safety for network hangs
            setTimeout(() => {
                sub.remove();
                reject(new Error("Timeout"));
            }, 8000);
          });

          if (requestId !== activeRequestIdRef.current) {
            player.release();
            return;
          }

          playerRef.current = player;
          player.play();
          setStatus("playing");
          return;
        } catch (e) {
          // Silent fail to try next URL
          console.warn(`[Audio] Failed to play ${url}. Error:`, e);
          if (player) {
            try { player.release(); } catch {}
          }
        }
      }

      // If we reach here, all URLs failed
      const errorState: AudioErrorState = {
        kind: "network",
        message:
          urls.length > 1
            ? "Audio could not be loaded from the primary or backup source. Please check your connection and try again."
            : "Audio could not be loaded right now. Please check your connection and try again.",
        urlsTried: urls,
      };

      if (requestId === activeRequestIdRef.current) {
        setStatus("error");
        setCurrentAyahId(null);
        setProgress(0);
        setError(errorState);
        playbackCallbacksRef.current.onError?.(errorState);
      }
    },
    [reciter]
  );

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

  const setReciter = useCallback(
    (r: Reciter) => {
      stopAudio();
      setError(null);
      setReciterState(r);
    },
    [stopAudio]
  );

  const isPlaying = useCallback(
    (ayahId: string) => currentAyahId === ayahId && status === "playing",
    [currentAyahId, status]
  );

  return {
    status,
    currentAyahId,
    reciter,
    progress,
    error,
    playAyah,
    pauseResume,
    stopAudio,
    freezeAudio,
    setReciter,
    clearError,
    isPlaying,
  };
}
