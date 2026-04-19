import type { TranslationLanguage } from "@/services/translationSources";

export type UiLanguage = TranslationLanguage;

export const UI_TEXT: Record<
  UiLanguage,
  {
    settings: string;
    appearance: string;
    darkMode: string;
    appLanguage: string;
    quranLanguages: string;
    arabicFontSize: string;
    defaultReciter: string;
    support: string;
    supportDevelopment: string;
    supportDevelopmentSub: string;
    rateApp: string;
    about: string;
    version: string;
    translations: string;
    disclaimer: string;
    dayStreak: string;
    surahsRead: string;
    bookmarks: string;
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    greetingNight: string;
    searchSurahs: string;
    readingProgress: string;
    nextPrayer: string;
    continueReading: string;
    lastRead: string;
    ayah: string;
    dailyAyah: string;
    verseOfTheDay: string;
    couldNotLoadAyah: string;
    quickAccess: string;
    prayer: string;
    qibla: string;
    search: string;
    featuredSurahs: string;
    seeAll: string;
    surahs: string;
    read: string;
    dhikr: string;
    tafsir: string;
  }
> = {
  en: {
    settings: "Settings",
    appearance: "APPEARANCE",
    darkMode: "Dark Mode",
    appLanguage: "APP LANGUAGE",
    quranLanguages: "QURAN LANGUAGES",
    arabicFontSize: "ARABIC FONT SIZE",
    defaultReciter: "DEFAULT RECITER",
    support: "SUPPORT",
    supportDevelopment: "Support Development",
    supportDevelopmentSub: "Keep the app free. JazakAllah Khair.",
    rateApp: "Rate the App",
    about: "ABOUT",
    version: "Version",
    translations: "Translations",
    disclaimer:
      "Please verify translations with qualified Islamic scholars. This app aims for accuracy, but users should consult authentic sources for religious guidance.",
    dayStreak: "Day Streak",
    surahsRead: "Surahs Read",
    bookmarks: "Bookmarks",
    greetingMorning: "Good Morning",
    greetingAfternoon: "Good Afternoon",
    greetingEvening: "Good Evening",
    greetingNight: "Good Night",
    searchSurahs: "Search surahs...",
    readingProgress: "Reading Progress",
    nextPrayer: "Next Prayer",
    continueReading: "Continue Reading",
    lastRead: "Last Read",
    ayah: "Ayah",
    dailyAyah: "Daily Ayah",
    verseOfTheDay: "Verse of the Day",
    couldNotLoadAyah: "Could not load ayah",
    quickAccess: "Quick Access",
    prayer: "Prayer",
    qibla: "Qibla",
    search: "Search",
    featuredSurahs: "Featured Surahs",
    seeAll: "See all",
    surahs: "Surahs",
    read: "Read",
    dhikr: "Dhikr",
    tafsir: "Tafsir",
  },
  ne: {
    settings: "सेटिङ्स",
    appearance: "रूप",
    darkMode: "डार्क मोड",
    appLanguage: "एप भाषा",
    quranLanguages: "कुरआन भाषाहरू",
    arabicFontSize: "अरबी फन्ट साइज",
    defaultReciter: "पूर्वनिर्धारित कारी",
    support: "सहयोग",
    supportDevelopment: "विकासमा सहयोग",
    supportDevelopmentSub: "एपलाई निःशुल्क राख्न सहयोग गर्नुहोस्।",
    rateApp: "एप मूल्यांकन गर्नुहोस्",
    about: "बारेमा",
    version: "संस्करण",
    translations: "अनुवादहरू",
    disclaimer:
      "कृपया अनुवादहरू योग्य इस्लामी विद्वानसँग प्रमाणित गर्नुहोस्। यो एप शुद्धताका लागि बनाइएको हो, तर धार्मिक मार्गदर्शनका लागि प्रामाणिक स्रोत हेर्नुहोस्।",
    dayStreak: "दिनको स्ट्रिक",
    surahsRead: "पढिएका सूराहरू",
    bookmarks: "बुकमार्क",
    greetingMorning: "शुभ प्रभात",
    greetingAfternoon: "शुभ दिउँसो",
    greetingEvening: "शुभ साँझ",
    greetingNight: "शुभ रात्री",
    searchSurahs: "सूरा खोज्नुहोस्...",
    readingProgress: "पठन प्रगति",
    nextPrayer: "अर्को नमाज",
    continueReading: "पढ्न जारी राख्नुहोस्",
    lastRead: "अन्तिम पठन",
    ayah: "आयत",
    dailyAyah: "आजको आयत",
    verseOfTheDay: "आजको आयत",
    couldNotLoadAyah: "आयत लोड हुन सकेन",
    quickAccess: "छिटो पहुँच",
    prayer: "नमाज",
    qibla: "किब्ला",
    search: "खोज",
    featuredSurahs: "विशेष सूराहरू",
    seeAll: "सबै हेर्नुहोस्",
    surahs: "सूराहरू",
    read: "पढिएको",
    dhikr: "जिक्र",
    tafsir: "तफसीर",
  },
  bn: {
    settings: "সেটিংস",
    appearance: "চেহারা",
    darkMode: "ডার্ক মোড",
    appLanguage: "অ্যাপ ভাষা",
    quranLanguages: "কুরআন ভাষা",
    arabicFontSize: "আরবি ফন্ট সাইজ",
    defaultReciter: "ডিফল্ট ক্বারি",
    support: "সহযোগিতা",
    supportDevelopment: "ডেভেলপমেন্টে সহায়তা করুন",
    supportDevelopmentSub: "অ্যাপটি ফ্রি রাখতে সহায়তা করুন।",
    rateApp: "অ্যাপ রেট করুন",
    about: "সম্পর্কে",
    version: "সংস্করণ",
    translations: "অনুবাদসমূহ",
    disclaimer:
      "অনুবাদগুলো যোগ্য ইসলামী আলেমের মাধ্যমে যাচাই করুন। এই অ্যাপ নির্ভুলতার চেষ্টা করে, তবে দ্বীনি নির্দেশনার জন্য নির্ভরযোগ্য উৎস দেখুন।",
    dayStreak: "দিনের স্ট্রিক",
    surahsRead: "পড়া সূরা",
    bookmarks: "বুকমার্ক",
    greetingMorning: "সুপ্রভাত",
    greetingAfternoon: "শুভ অপরাহ্ন",
    greetingEvening: "শুভ সন্ধ্যা",
    greetingNight: "শুভ রাত্রি",
    searchSurahs: "সূরা খুঁজুন...",
    readingProgress: "পড়ার অগ্রগতি",
    nextPrayer: "পরবর্তী সালাত",
    continueReading: "পড়া চালিয়ে যান",
    lastRead: "সর্বশেষ পঠন",
    ayah: "আয়াত",
    dailyAyah: "আজকের আয়াত",
    verseOfTheDay: "আজকের আয়াত",
    couldNotLoadAyah: "আয়াত লোড করা যায়নি",
    quickAccess: "দ্রুত প্রবেশ",
    prayer: "সালাত",
    qibla: "কিবলা",
    search: "খুঁজুন",
    featuredSurahs: "নির্বাচিত সূরা",
    seeAll: "সব দেখুন",
    surahs: "সূরা",
    read: "পড়া",
    dhikr: "জিকির",
    tafsir: "তাফসীর",
  },
};
