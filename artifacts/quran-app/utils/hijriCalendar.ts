import type { UiLanguage } from "@/services/i18n";

const HIJRI_MONTHS_EN = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
];

const HIJRI_MONTHS_AR = [
  "Ù…Ø­Ø±Ù…", "ØµÙØ±", "Ø±Ø¨ÙŠØ¹ Ø§Ù„Ø£ÙˆÙ„", "Ø±Ø¨ÙŠØ¹ Ø§Ù„Ø¢Ø®Ø±",
  "Ø¬Ù…Ø§Ø¯Ù‰ Ø§Ù„Ø£ÙˆÙ„Ù‰", "Ø¬Ù…Ø§Ø¯Ù‰ Ø§Ù„Ø¢Ø®Ø±Ø©", "Ø±Ø¬Ø¨", "Ø´Ø¹Ø¨Ø§Ù†",
  "Ø±Ù…Ø¶Ø§Ù†", "Ø´ÙˆØ§Ù„", "Ø°Ùˆ Ø§Ù„Ù‚Ø¹Ø¯Ø©", "Ø°Ùˆ Ø§Ù„Ø­Ø¬Ø©",
];

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthNameEn: string;
  monthNameAr: string;
  formatted: string;
}

export interface IslamicEvent {
  key:
    | "islamic-new-year"
    | "ashura"
    | "mawlid"
    | "isra-miraj"
    | "shab-e-barat"
    | "ramadan"
    | "laylat-al-qadr"
    | "eid-al-fitr"
    | "eid-al-adha";
  month: number;
  day?: number;
  labels: Record<UiLanguage, string>;
}

export function toHijri(date: Date = new Date()): HijriDate {
  const jd = gregorianToJulian(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const { year, month, day } = julianToHijri(jd);

  return {
    day,
    month,
    year,
    monthNameEn: HIJRI_MONTHS_EN[month - 1] ?? "",
    monthNameAr: HIJRI_MONTHS_AR[month - 1] ?? "",
    formatted: `${day} ${HIJRI_MONTHS_EN[month - 1]} ${year} AH`,
  };
}

function gregorianToJulian(y: number, m: number, d: number): number {
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function julianToHijri(jd: number): { year: number; month: number; day: number } {
  const z = Math.floor(jd + 0.5);
  const l = z - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const ll = l - 10631 * n + 354;
  const j = Math.floor((10985 - ll) / 5316) * Math.floor((50 * ll) / 17719)
    + Math.floor(ll / 5670) * Math.floor((43 * ll) / 15238);
  const lll = ll - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * lll) / 709);
  const day = lll - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

const ISLAMIC_EVENTS: IslamicEvent[] = [
  {
    key: "islamic-new-year",
    month: 1,
    day: 1,
    labels: {
      en: "Islamic New Year",
      ne: "इस्लामिक नयाँ वर्ष",
      bn: "ইসলামি নববর্ষ",
    },
  },
  {
    key: "ashura",
    month: 1,
    day: 10,
    labels: {
      en: "Ashura",
      ne: "आशुरा",
      bn: "আশুরা",
    },
  },
  {
    key: "mawlid",
    month: 3,
    day: 12,
    labels: {
      en: "Mawlid al-Nabi",
      ne: "मावलिदुन्नबी",
      bn: "মাওলিদুন্নবী",
    },
  },
  {
    key: "isra-miraj",
    month: 7,
    day: 27,
    labels: {
      en: "Isra and Mi'raj",
      ne: "इस्रा र मेराज",
      bn: "ইসরা ও মিরাজ",
    },
  },
  {
    key: "shab-e-barat",
    month: 8,
    day: 15,
    labels: {
      en: "Shab-e-Barat",
      ne: "शब-ए-बरात",
      bn: "শবে বরাত",
    },
  },
  {
    key: "ramadan",
    month: 9,
    labels: {
      en: "Ramadan",
      ne: "रमजान",
      bn: "রমজান",
    },
  },
  {
    key: "laylat-al-qadr",
    month: 9,
    day: 27,
    labels: {
      en: "Laylat al-Qadr",
      ne: "लैलतुल कद्र",
      bn: "লাইলাতুল কদর",
    },
  },
  {
    key: "eid-al-fitr",
    month: 10,
    day: 1,
    labels: {
      en: "Eid al-Fitr",
      ne: "ईदुल फित्र",
      bn: "ঈদুল ফিতর",
    },
  },
  {
    key: "eid-al-adha",
    month: 12,
    day: 10,
    labels: {
      en: "Eid al-Adha",
      ne: "ईदुल अजहा",
      bn: "ঈদুল আজহা",
    },
  },
];

export function getIslamicEvent(hijri: HijriDate): IslamicEvent | null {
  const { day, month } = hijri;
  return (
    ISLAMIC_EVENTS.find((event) => event.month === month && (event.day === undefined || event.day === day)) ??
    null
  );
}

export function getIslamicEventLabel(
  hijri: HijriDate,
  language: UiLanguage = "en"
): string | null {
  const event = getIslamicEvent(hijri);
  return event?.labels[language] ?? null;
}
