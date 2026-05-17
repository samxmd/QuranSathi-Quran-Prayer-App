import { getOfflineAyah } from "@/data/offlineQuranLoader";

export interface DailyAyah {
  arabic: string;
  nepali: string;
  english: string;
  bangla: string;
  reference: string;
  surahName: string;
}

export const DAILY_AYAH_POOL: Array<{ key: string; surahName: string; ref: string; englishFallback: string }> = [
  { key: "2:255", surahName: "Al-Baqarah", ref: "2:255", englishFallback: "Allah. There is no deity except Him, the Ever-Living, the Sustainer of all existence." },
  { key: "2:286", surahName: "Al-Baqarah", ref: "2:286", englishFallback: "Allah does not burden a soul beyond what it can bear." },
  { key: "3:173", surahName: "Al-Imran", ref: "3:173", englishFallback: "Sufficient for us is Allah, and He is the best Disposer of affairs." },
  { key: "3:185", surahName: "Al-Imran", ref: "3:185", englishFallback: "Every soul will taste death, and you will only be given your full reward on the Day of Resurrection." },
  { key: "9:51", surahName: "At-Tawbah", ref: "9:51", englishFallback: "Never will we be struck except by what Allah has decreed for us; He is our Protector." },
  { key: "13:28", surahName: "Ar-Ra'd", ref: "13:28", englishFallback: "Surely in the remembrance of Allah do hearts find rest." },
  { key: "14:7", surahName: "Ibrahim", ref: "14:7", englishFallback: "If you are grateful, I will surely increase you." },
  { key: "16:97", surahName: "An-Nahl", ref: "16:97", englishFallback: "Whoever does righteousness, whether male or female, while being a believer, We will surely grant them a good life." },
  { key: "18:10", surahName: "Al-Kahf", ref: "18:10", englishFallback: "Our Lord, grant us mercy from Yourself and prepare for us from our affair right guidance." },
  { key: "20:114", surahName: "Ta-Ha", ref: "20:114", englishFallback: "My Lord, increase me in knowledge." },
  { key: "23:1", surahName: "Al-Mu'minun", ref: "23:1", englishFallback: "Certainly will the believers have succeeded." },
  { key: "24:35", surahName: "An-Nur", ref: "24:35", englishFallback: "Allah is the Light of the heavens and the earth." },
  { key: "25:63", surahName: "Al-Furqan", ref: "25:63", englishFallback: "The servants of the Most Merciful are those who walk upon the earth gently." },
  { key: "29:45", surahName: "Al-'Ankabut", ref: "29:45", englishFallback: "Surely the remembrance of Allah is greater." },
  { key: "30:21", surahName: "Ar-Rum", ref: "30:21", englishFallback: "He placed between you affection and mercy." },
  { key: "33:41", surahName: "Al-Ahzab", ref: "33:41", englishFallback: "O you who believe, remember Allah with much remembrance." },
  { key: "39:53", surahName: "Az-Zumar", ref: "39:53", englishFallback: "Do not despair of the mercy of Allah. Indeed, Allah forgives all sins." },
  { key: "40:60", surahName: "Ghafir", ref: "40:60", englishFallback: "Call upon Me; I will respond to you." },
  { key: "49:13", surahName: "Al-Hujurat", ref: "49:13", englishFallback: "Indeed, the most noble of you in the sight of Allah is the most righteous of you." },
  { key: "55:13", surahName: "Ar-Rahman", ref: "55:13", englishFallback: "So which of the favors of your Lord will you deny?" },
  { key: "57:4", surahName: "Al-Hadid", ref: "57:4", englishFallback: "He is with you wherever you are." },
  { key: "62:10", surahName: "Al-Jumu'ah", ref: "62:10", englishFallback: "Seek the bounty of Allah and remember Allah often so that you may succeed." },
  { key: "65:3", surahName: "At-Talaq", ref: "65:3", englishFallback: "Whoever puts their trust in Allah, then He is sufficient for them." },
  { key: "67:2", surahName: "Al-Mulk", ref: "67:2", englishFallback: "He created death and life to test you as to which of you is best in deed." },
  { key: "67:12", surahName: "Al-Mulk", ref: "67:12", englishFallback: "Those who fear their Lord unseen will have forgiveness and a great reward." },
  { key: "73:20", surahName: "Al-Muzzammil", ref: "73:20", englishFallback: "Establish prayer and give zakah and lend to Allah a goodly loan." },
  { key: "84:6", surahName: "Al-Inshiqaq", ref: "84:6", englishFallback: "O mankind, indeed you are laboring toward your Lord with great exertion and will meet Him." },
  { key: "94:5", surahName: "Al-Inshirah", ref: "94:5", englishFallback: "Indeed, with hardship comes ease." },
  { key: "112:1", surahName: "Al-Ikhlas", ref: "112:1", englishFallback: "Say: He is Allah, the One." },
  { key: "114:1", surahName: "An-Nas", ref: "114:1", englishFallback: "Say: I seek refuge in the Lord of mankind." },
];

export function getDailyAyahIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return dayOfYear % DAILY_AYAH_POOL.length;
}

export function getDailyScratchFallback() {
  const entry = DAILY_AYAH_POOL[getDailyAyahIndex()];
  return {
    english: entry.englishFallback,
    reference: entry.ref,
    surahName: entry.surahName,
  };
}

export async function fetchDailyAyahData(): Promise<DailyAyah> {
  const index = getDailyAyahIndex();
  const entry = DAILY_AYAH_POOL[index];
  const [surahIdText, ayahNumberText] = entry.key.split(":");
  const surahId = Number(surahIdText);
  const ayahNumber = Number(ayahNumberText);

  const ayah = await getOfflineAyah(surahId, ayahNumber);
  if (!ayah) {
    throw new Error(`Daily ayah ${entry.key} is missing from bundled data`);
  }

  return {
    arabic: ayah.arabic,
    english: ayah.translations.en ?? "",
    nepali: ayah.translations.ne ?? "",
    bangla: ayah.translations.bn ?? "",
    reference: entry.ref,
    surahName: entry.surahName,
  };
}
