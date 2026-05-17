export interface Word {
  id: number;
  position: number;
  text: string;
  translation: string;
  transliteration?: string;
}

export interface Ayah {
  id: string;
  surahId: number;
  ayahNumber: number;
  arabic: string;
  tajweed?: string;
  transliteration?: string;
  translations: Record<string, string>;
  words?: Word[];
}
