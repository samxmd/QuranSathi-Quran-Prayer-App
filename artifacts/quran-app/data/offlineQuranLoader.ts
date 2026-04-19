import type { Ayah } from "@/data/ayahs";
import { dbService } from "@/services/database";

export async function getOfflineSurahAyahs(surahId: number): Promise<Ayah[]> {
  return dbService.getAyahsBySurah(surahId);
}

export async function getOfflineAyah(
  surahId: number,
  ayahNumber: number
): Promise<Ayah | undefined> {
  return dbService.getAyah(surahId, ayahNumber);
}
