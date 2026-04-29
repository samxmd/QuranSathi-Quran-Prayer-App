export interface TranslationEdition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
}

export const LANGUAGE_NAMES: Record<string, string> = {
  ar: "Arabic",
  bn: "Bangla",
  de: "German",
  en: "English",
  es: "Spanish",
  fa: "Persian",
  fr: "French",
  hi: "Hindi",
  id: "Indonesian",
  ml: "Malayalam",
  ms: "Malay",
  ne: "Nepali",
  ru: "Russian",
  ta: "Tamil",
  tr: "Turkish",
  ur: "Urdu",
  zh: "Chinese",
};

export function getLanguageDisplayName(languageCode: string): string {
  return LANGUAGE_NAMES[languageCode] || languageCode.toUpperCase();
}

export function getEditionDisplayInfo(code: string): { label: string; sublabel: string } {
  const popularEdition = POPULAR_TRANSLATIONS.find((edition) => edition.identifier === code);
  if (popularEdition) {
    return {
      label: getLanguageDisplayName(popularEdition.language),
      sublabel: popularEdition.englishName,
    };
  }

  const [languageCode, translatorCode] = code.split(".");
  const translatorName = translatorCode
    ? translatorCode
        .split(/[_-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : code;

  return {
    label: getLanguageDisplayName(languageCode || "unknown"),
    sublabel: translatorName,
  };
}

export const POPULAR_TRANSLATIONS: TranslationEdition[] = [
  { identifier: "fr.hamidullah", language: "fr", name: "Muhammad Hamidullah", englishName: "Muhammad Hamidullah" },
  { identifier: "es.cortes", language: "es", name: "Julio Cortes", englishName: "Julio Cortes" },
  { identifier: "de.aburida", language: "de", name: "Abu Rida Muhammad Ibn Ahmad Ibn Rassoul", englishName: "Abu Rida Muhammad Ibn Ahmad Ibn Rassoul" },
  { identifier: "tr.ates", language: "tr", name: "Suleyman Ates", englishName: "Suleyman Ates" },
  { identifier: "id.indonesian", language: "id", name: "Bahasa Indonesia", englishName: "Bahasa Indonesia" },
  { identifier: "ru.kuliev", language: "ru", name: "Elmir Kuliev", englishName: "Elmir Kuliev" },
  { identifier: "zh.jian", language: "zh", name: "Ma Jian", englishName: "Ma Jian" },
  { identifier: "fa.ansarian", language: "fa", name: "Hussein Ansarian", englishName: "Hussein Ansarian" },
  { identifier: "ms.basmeih", language: "ms", name: "Abdullah Muhammad Basmeih", englishName: "Abdullah Muhammad Basmeih" },
  { identifier: "ml.abdulhameed", language: "ml", name: "Cheriyamundam Abdul Hameed and Kunhi Mohammed Parappoor", englishName: "Cheriyamundam Abdul Hameed and Kunhi Mohammed Parappoor" },
  { identifier: "ta.janay", language: "ta", name: "Jan Turst Foundation", englishName: "Jan Turst Foundation" },
  { identifier: "hi.farooq", language: "hi", name: "Muhammad Farooq Khan & Muhammad Ahmed", englishName: "Muhammad Farooq Khan & Muhammad Ahmed" },
];
