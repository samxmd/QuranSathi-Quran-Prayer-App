import { SURAHS } from "@/data/surahs";

export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  folder: string;
  style: string;
  fallbackEdition?: string;
  fallbackBitrate?: 32 | 40 | 48 | 64 | 128 | 192;
}

export const RECITERS: Reciter[] = [
  {
    id: "alafasy",
    name: "Mishary Alafasy",
    arabicName: "\u0645\u0634\u0627\u0631\u064a \u0627\u0644\u0639\u0641\u0627\u0633\u064a",
    folder: "Alafasy_128kbps",
    style: "Murattal",
    fallbackEdition: "ar.alafasy",
    fallbackBitrate: 128,
  },
  {
    id: "abdulbasit",
    name: "Abdul Basit",
    arabicName: "\u0639\u0628\u062f \u0627\u0644\u0628\u0627\u0633\u0637",
    folder: "Abdul_Basit_Murattal_192kbps",
    style: "Murattal",
    fallbackEdition: "ar.abdulbasitmurattal",
    fallbackBitrate: 192,
  },
  {
    id: "hudhaify",
    name: "Ali Al-Hudhaify",
    arabicName: "\u0639\u0644\u064a \u0627\u0644\u062d\u0630\u064a\u0641\u064a",
    folder: "Hudhaify_128kbps",
    style: "Murattal",
    fallbackEdition: "ar.hudhaify",
    fallbackBitrate: 128,
  },
  {
    id: "maher",
    name: "Maher Al Muaiqly",
    arabicName: "\u0645\u0627\u0647\u0631 \u0627\u0644\u0645\u0639\u064a\u0642\u0644\u064a",
    folder: "MaherAlMuaiqly128kbps",
    style: "Murattal",
  },
  {
    id: "sudais",
    name: "Abdur-Rahman As-Sudais",
    arabicName: "\u0639\u0628\u062f \u0627\u0644\u0631\u062d\u0645\u0646 \u0627\u0644\u0633\u062f\u064a\u0633",
    folder: "Abdurrahmaan_As-Sudais_192kbps",
    style: "Murattal",
  },
];

export const DEFAULT_RECITER = RECITERS[0];

export function getAyahAudioUrl(
  surahNumber: number,
  ayahNumber: number,
  reciter: Reciter = DEFAULT_RECITER
): string {
  const surah = String(surahNumber).padStart(3, "0");
  const ayah = String(ayahNumber).padStart(3, "0");
  return `https://everyayah.com/data/${reciter.folder}/${surah}${ayah}.mp3`;
}

export function getGlobalAyahNumber(surahNumber: number, ayahNumber: number): number {
  const precedingAyahs = SURAHS.slice(0, surahNumber - 1).reduce(
    (total, surah) => total + surah.totalAyahs,
    0
  );

  return precedingAyahs + ayahNumber;
}

export function getAyahAudioBackupUrl(
  surahNumber: number,
  ayahNumber: number,
  reciter: Reciter = DEFAULT_RECITER
): string | null {
  if (!reciter.fallbackEdition || !reciter.fallbackBitrate) {
    return null;
  }

  const globalAyahNumber = getGlobalAyahNumber(surahNumber, ayahNumber);
  return `https://cdn.islamic.network/quran/audio/${reciter.fallbackBitrate}/${reciter.fallbackEdition}/${globalAyahNumber}.mp3`;
}

export function getAyahAudioUrls(
  surahNumber: number,
  ayahNumber: number,
  reciter: Reciter = DEFAULT_RECITER
): string[] {
  const urls = [getAyahAudioUrl(surahNumber, ayahNumber, reciter)];
  const backupUrl = getAyahAudioBackupUrl(surahNumber, ayahNumber, reciter);

  if (backupUrl && backupUrl !== urls[0]) {
    urls.push(backupUrl);
  }

  return urls;
}

export function getBasmalaUrl(reciter: Reciter = DEFAULT_RECITER): string {
  return getAyahAudioUrl(1, 1, reciter);
}

export function getFullSurahAudioUrl(
  surahNumber: number,
  reciter: Reciter = DEFAULT_RECITER
): string | null {
  if (!reciter.fallbackEdition || !reciter.fallbackBitrate) {
    return null;
  }
  return `https://cdn.islamic.network/quran/audio-surah/${reciter.fallbackBitrate}/${reciter.fallbackEdition}/${surahNumber}.mp3`;
}
