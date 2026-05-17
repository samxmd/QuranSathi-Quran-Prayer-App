export const TRANSLATION_SOURCES = {
  en: {
    api: "alquran",
    edition: "en.sahih",
    label: "English",
    sourceLabel: "Sahih International",
  },
  ne: {
    api: "quran.com",
    id: 108,
    label: "नेपाली",
    sourceLabel: "Ahl Al-Hadith Central Society",
  },
  bn: {
    api: "quran.com",
    id: 161,
    label: "বাংলা",
    sourceLabel: "Muhiuddin Khan",
  },
  hi: {
    api: "fawazahmed0",
    edition: "hin-muhammadfarooqk",
    label: "हिन्दी",
    sourceLabel: "Muhammad Farooq Khan & Muhammad Ahmed",
  },
} as const;

export type TranslationLanguage = keyof typeof TRANSLATION_SOURCES | (string & {});

export const DEFAULT_ENABLED_LANGUAGES: TranslationLanguage[] = ["en"];
