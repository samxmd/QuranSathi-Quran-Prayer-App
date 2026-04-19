export interface Ayah {
  id: string;
  surahId: number;
  ayahNumber: number;
  arabic: string;
  translations: Record<string, string>;
}
