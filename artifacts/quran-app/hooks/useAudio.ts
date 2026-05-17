import { useAudioContext } from "@/context/AudioContext";
import type { AudioStatus, RepeatMode, AudioErrorState, AyahMinimal } from "@/context/AudioContext";
import type { Reciter } from "@/services/audioService";
import { useCallback, useEffect } from "react";

export type { AudioStatus, RepeatMode, AudioErrorState, AyahMinimal };

interface PlayAyahOptions {
  onComplete?: () => void;
  onError?: (error: AudioErrorState) => void;
}

interface UseAudioReturn {
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
  freezeAudio: () => void;
  setReciter: (r: Reciter) => void;
  setPlaybackRate: (rate: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  clearError: () => void;
  isPlaying: (ayahId: string) => boolean;
}

export function useAudio(initialReciter?: Reciter): UseAudioReturn {
  const context = useAudioContext();

  useEffect(() => {
    if (!initialReciter) return;
    if (context.reciter.id !== initialReciter.id) {
      context.setReciter(initialReciter);
    }
  }, [context, initialReciter]);

  const freezeAudio = useCallback(() => {
    // Legacy support for reader screen. 
    // In global context, we just pause if it's playing.
    if (context.status === "playing") {
      context.pauseResume().catch(() => {});
    }
  }, [context]);

  return {
    ...context,
    freezeAudio,
  };
}
