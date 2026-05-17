// ─── generateSchedule.ts ─────────────────────────────────────────────────────
// Divides the Quran by ayahs across N days.
// Plan tracks independently from readSurahIds (Option A).

import type { DaySchedule, SurahRange } from '../types/readingPlan';

// Complete Quran surah metadata — id, name, ayah count, juz
// Juz boundaries are approximate (a surah can span multiple juz)
export const SURAH_DATA: {
  id: number;
  nameEnglish: string;
  nameNepali: string;
  nameBangla: string;
  totalAyahs: number;
  startJuz: number;
}[] = [
  { id: 1,   nameEnglish: 'Al-Fatiha',       nameNepali: 'अल-फातिहा',      nameBangla: 'আল-ফাতিহা',      totalAyahs: 7,   startJuz: 1 },
  { id: 2,   nameEnglish: 'Al-Baqarah',      nameNepali: 'अल-बकरा',        nameBangla: 'আল-বাকারা',      totalAyahs: 286, startJuz: 1 },
  { id: 3,   nameEnglish: 'Ali \'Imran',     nameNepali: 'आल-इम्रान',      nameBangla: 'আলে-ইমরান',      totalAyahs: 200, startJuz: 3 },
  { id: 4,   nameEnglish: 'An-Nisa',         nameNepali: 'अन-निसा',        nameBangla: 'আন-নিসা',        totalAyahs: 176, startJuz: 4 },
  { id: 5,   nameEnglish: 'Al-Ma\'idah',     nameNepali: 'अल-माइदा',       nameBangla: 'আল-মায়েদা',      totalAyahs: 120, startJuz: 6 },
  { id: 6,   nameEnglish: 'Al-An\'am',       nameNepali: 'अल-अनआम',        nameBangla: 'আল-আনআম',        totalAyahs: 165, startJuz: 7 },
  { id: 7,   nameEnglish: 'Al-A\'raf',       nameNepali: 'अल-अराफ',        nameBangla: 'আল-আরাফ',        totalAyahs: 206, startJuz: 8 },
  { id: 8,   nameEnglish: 'Al-Anfal',        nameNepali: 'अल-अन्फाल',      nameBangla: 'আল-আনফাল',       totalAyahs: 75,  startJuz: 9 },
  { id: 9,   nameEnglish: 'At-Tawbah',       nameNepali: 'अत-तौबा',        nameBangla: 'আত-তাওবা',       totalAyahs: 129, startJuz: 10 },
  { id: 10,  nameEnglish: 'Yunus',           nameNepali: 'युनुस',          nameBangla: 'ইউনুস',          totalAyahs: 109, startJuz: 11 },
  { id: 11,  nameEnglish: 'Hud',             nameNepali: 'हूद',            nameBangla: 'হুদ',            totalAyahs: 123, startJuz: 11 },
  { id: 12,  nameEnglish: 'Yusuf',           nameNepali: 'युसुफ',          nameBangla: 'ইউসুফ',          totalAyahs: 111, startJuz: 12 },
  { id: 13,  nameEnglish: 'Ar-Ra\'d',        nameNepali: 'अर-राद',         nameBangla: 'আর-রাদ',         totalAyahs: 43,  startJuz: 13 },
  { id: 14,  nameEnglish: 'Ibrahim',         nameNepali: 'इब्राहिम',       nameBangla: 'ইব্রাহীম',       totalAyahs: 52,  startJuz: 13 },
  { id: 15,  nameEnglish: 'Al-Hijr',         nameNepali: 'अल-हिज्र',       nameBangla: 'আল-হিজর',        totalAyahs: 99,  startJuz: 14 },
  { id: 16,  nameEnglish: 'An-Nahl',         nameNepali: 'अन-नहल',         nameBangla: 'আন-নাহল',        totalAyahs: 128, startJuz: 14 },
  { id: 17,  nameEnglish: 'Al-Isra',         nameNepali: 'अल-इस्रा',       nameBangla: 'আল-ইসরা',        totalAyahs: 111, startJuz: 15 },
  { id: 18,  nameEnglish: 'Al-Kahf',         nameNepali: 'अल-काहफ',        nameBangla: 'আল-কাহফ',        totalAyahs: 110, startJuz: 15 },
  { id: 19,  nameEnglish: 'Maryam',          nameNepali: 'मरियम',          nameBangla: 'মারইয়াম',        totalAyahs: 98,  startJuz: 16 },
  { id: 20,  nameEnglish: 'Ta-Ha',           nameNepali: 'ता-हा',          nameBangla: 'তা-হা',          totalAyahs: 135, startJuz: 16 },
  { id: 21,  nameEnglish: 'Al-Anbiya',       nameNepali: 'अल-अम्बिया',     nameBangla: 'আল-আম্বিয়া',     totalAyahs: 112, startJuz: 17 },
  { id: 22,  nameEnglish: 'Al-Hajj',         nameNepali: 'अल-हज्ज',        nameBangla: 'আল-হজ্জ',        totalAyahs: 78,  startJuz: 17 },
  { id: 23,  nameEnglish: 'Al-Mu\'minun',    nameNepali: 'अल-मोमिनून',     nameBangla: 'আল-মুমিনুন',     totalAyahs: 118, startJuz: 18 },
  { id: 24,  nameEnglish: 'An-Nur',          nameNepali: 'अन-नूर',         nameBangla: 'আন-নূর',         totalAyahs: 64,  startJuz: 18 },
  { id: 25,  nameEnglish: 'Al-Furqan',       nameNepali: 'अल-फुरकान',      nameBangla: 'আল-ফুরকান',      totalAyahs: 77,  startJuz: 18 },
  { id: 26,  nameEnglish: 'Ash-Shu\'ara',    nameNepali: 'अश-शुअरा',       nameBangla: 'আশ-শুআরা',       totalAyahs: 227, startJuz: 19 },
  { id: 27,  nameEnglish: 'An-Naml',         nameNepali: 'अन-नम्ल',        nameBangla: 'আন-নামল',        totalAyahs: 93,  startJuz: 19 },
  { id: 28,  nameEnglish: 'Al-Qasas',        nameNepali: 'अल-कसस',         nameBangla: 'আল-কাসাস',       totalAyahs: 88,  startJuz: 20 },
  { id: 29,  nameEnglish: 'Al-\'Ankabut',    nameNepali: 'अल-अन्काबूत',    nameBangla: 'আল-আনকাবুত',     totalAyahs: 69,  startJuz: 20 },
  { id: 30,  nameEnglish: 'Ar-Rum',          nameNepali: 'अर-रूम',         nameBangla: 'আর-রুম',         totalAyahs: 60,  startJuz: 21 },
  { id: 31,  nameEnglish: 'Luqman',          nameNepali: 'लुकमान',         nameBangla: 'লুকমান',         totalAyahs: 34,  startJuz: 21 },
  { id: 32,  nameEnglish: 'As-Sajdah',       nameNepali: 'अस-सज्दा',       nameBangla: 'আস-সাজদা',       totalAyahs: 30,  startJuz: 21 },
  { id: 33,  nameEnglish: 'Al-Ahzab',        nameNepali: 'अल-अहज़ाब',      nameBangla: 'আল-আহযাব',       totalAyahs: 73,  startJuz: 21 },
  { id: 34,  nameEnglish: 'Saba',            nameNepali: 'सबा',            nameBangla: 'সাবা',           totalAyahs: 54,  startJuz: 22 },
  { id: 35,  nameEnglish: 'Fatir',           nameNepali: 'फातिर',          nameBangla: 'ফাতির',          totalAyahs: 45,  startJuz: 22 },
  { id: 36,  nameEnglish: 'Ya-Sin',          nameNepali: 'यासीन',          nameBangla: 'ইয়া-সীন',        totalAyahs: 83,  startJuz: 22 },
  { id: 37,  nameEnglish: 'As-Saffat',       nameNepali: 'अस-साफ्फात',     nameBangla: 'আস-সাফফাত',      totalAyahs: 182, startJuz: 23 },
  { id: 38,  nameEnglish: 'Sad',             nameNepali: 'साद',            nameBangla: 'সাদ',            totalAyahs: 88,  startJuz: 23 },
  { id: 39,  nameEnglish: 'Az-Zumar',        nameNepali: 'अज़-ज़ुमर',       nameBangla: 'আয-যুমার',       totalAyahs: 75,  startJuz: 23 },
  { id: 40,  nameEnglish: 'Ghafir',          nameNepali: 'गाफिर',          nameBangla: 'গাফির',          totalAyahs: 85,  startJuz: 24 },
  { id: 41,  nameEnglish: 'Fussilat',        nameNepali: 'फुस्सिलत',       nameBangla: 'ফুসসিলাত',       totalAyahs: 54,  startJuz: 24 },
  { id: 42,  nameEnglish: 'Ash-Shura',       nameNepali: 'अश-शूरा',        nameBangla: 'আশ-শূরা',        totalAyahs: 53,  startJuz: 25 },
  { id: 43,  nameEnglish: 'Az-Zukhruf',      nameNepali: 'अज़-ज़ुखरुफ',    nameBangla: 'আয-যুখরুফ',      totalAyahs: 89,  startJuz: 25 },
  { id: 44,  nameEnglish: 'Ad-Dukhan',       nameNepali: 'अद-दुखान',       nameBangla: 'আদ-দুখান',       totalAyahs: 59,  startJuz: 25 },
  { id: 45,  nameEnglish: 'Al-Jathiyah',     nameNepali: 'अल-जासिया',      nameBangla: 'আল-জাসিয়া',      totalAyahs: 37,  startJuz: 25 },
  { id: 46,  nameEnglish: 'Al-Ahqaf',        nameNepali: 'अल-अहकाफ',       nameBangla: 'আল-আহকাফ',       totalAyahs: 35,  startJuz: 26 },
  { id: 47,  nameEnglish: 'Muhammad',        nameNepali: 'मुहम्मद',         nameBangla: 'মুহাম্মাদ',       totalAyahs: 38,  startJuz: 26 },
  { id: 48,  nameEnglish: 'Al-Fath',         nameNepali: 'अल-फत्ह',        nameBangla: 'আল-ফাতহ',        totalAyahs: 29,  startJuz: 26 },
  { id: 49,  nameEnglish: 'Al-Hujurat',      nameNepali: 'अल-हुजुरात',     nameBangla: 'আল-হুজুরাত',     totalAyahs: 18,  startJuz: 26 },
  { id: 50,  nameEnglish: 'Qaf',             nameNepali: 'काफ',            nameBangla: 'কাফ',            totalAyahs: 45,  startJuz: 26 },
  { id: 51,  nameEnglish: 'Adh-Dhariyat',    nameNepali: 'अज़-ज़ारियात',    nameBangla: 'আয-যারিয়াত',     totalAyahs: 60,  startJuz: 26 },
  { id: 52,  nameEnglish: 'At-Tur',          nameNepali: 'अत-तूर',         nameBangla: 'আত-তূর',         totalAyahs: 49,  startJuz: 27 },
  { id: 53,  nameEnglish: 'An-Najm',         nameNepali: 'अन-नज्म',        nameBangla: 'আন-নাজম',        totalAyahs: 62,  startJuz: 27 },
  { id: 54,  nameEnglish: 'Al-Qamar',        nameNepali: 'अल-कमर',         nameBangla: 'আল-কামার',       totalAyahs: 55,  startJuz: 27 },
  { id: 55,  nameEnglish: 'Ar-Rahman',       nameNepali: 'अर-रहमान',       nameBangla: 'আর-রহমান',       totalAyahs: 78,  startJuz: 27 },
  { id: 56,  nameEnglish: 'Al-Waqi\'ah',     nameNepali: 'अल-वाकिआ',       nameBangla: 'আল-ওয়াকিআ',     totalAyahs: 96,  startJuz: 27 },
  { id: 57,  nameEnglish: 'Al-Hadid',        nameNepali: 'अल-हदीद',        nameBangla: 'আল-হাদীদ',       totalAyahs: 29,  startJuz: 27 },
  { id: 58,  nameEnglish: 'Al-Mujadila',     nameNepali: 'अल-मुजादला',     nameBangla: 'আল-মুজাদালা',    totalAyahs: 22,  startJuz: 28 },
  { id: 59,  nameEnglish: 'Al-Hashr',        nameNepali: 'अल-हश्र',        nameBangla: 'আল-হাশর',        totalAyahs: 24,  startJuz: 28 },
  { id: 60,  nameEnglish: 'Al-Mumtahanah',   nameNepali: 'अल-मुम्तहना',    nameBangla: 'আল-মুমতাহানা',   totalAyahs: 13,  startJuz: 28 },
  { id: 61,  nameEnglish: 'As-Saf',          nameNepali: 'अस-साफ',         nameBangla: 'আস-সাফ',         totalAyahs: 14,  startJuz: 28 },
  { id: 62,  nameEnglish: 'Al-Jumu\'ah',     nameNepali: 'अल-जुमुआ',       nameBangla: 'আল-জুমুআ',       totalAyahs: 11,  startJuz: 28 },
  { id: 63,  nameEnglish: 'Al-Munafiqun',    nameNepali: 'अल-मुनाफिकून',   nameBangla: 'আল-মুনাফিকুন',   totalAyahs: 11,  startJuz: 28 },
  { id: 64,  nameEnglish: 'At-Taghabun',     nameNepali: 'अत-तगाबुन',      nameBangla: 'আত-তাগাবুন',     totalAyahs: 18,  startJuz: 28 },
  { id: 65,  nameEnglish: 'At-Talaq',        nameNepali: 'अत-तलाक',        nameBangla: 'আত-তালাক',       totalAyahs: 12,  startJuz: 28 },
  { id: 66,  nameEnglish: 'At-Tahrim',       nameNepali: 'अत-तहरीम',       nameBangla: 'আত-তাহরীম',      totalAyahs: 12,  startJuz: 28 },
  { id: 67,  nameEnglish: 'Al-Mulk',         nameNepali: 'अल-मुल्क',       nameBangla: 'আল-মুলক',        totalAyahs: 30,  startJuz: 29 },
  { id: 68,  nameEnglish: 'Al-Qalam',        nameNepali: 'अल-कलम',         nameBangla: 'আল-কালাম',       totalAyahs: 52,  startJuz: 29 },
  { id: 69,  nameEnglish: 'Al-Haqqah',       nameNepali: 'अल-हाक्का',      nameBangla: 'আল-হাককা',       totalAyahs: 52,  startJuz: 29 },
  { id: 70,  nameEnglish: 'Al-Ma\'arij',     nameNepali: 'अल-मआरिज',       nameBangla: 'আল-মাআরিজ',      totalAyahs: 44,  startJuz: 29 },
  { id: 71,  nameEnglish: 'Nuh',             nameNepali: 'नूह',            nameBangla: 'নূহ',            totalAyahs: 28,  startJuz: 29 },
  { id: 72,  nameEnglish: 'Al-Jinn',         nameNepali: 'अल-जिन्न',       nameBangla: 'আল-জিন',         totalAyahs: 28,  startJuz: 29 },
  { id: 73,  nameEnglish: 'Al-Muzzammil',    nameNepali: 'अल-मुज्ज़म्मिल', nameBangla: 'আল-মুযযাম্মিল',  totalAyahs: 20,  startJuz: 29 },
  { id: 74,  nameEnglish: 'Al-Muddaththir',  nameNepali: 'अल-मुद्दस्सिर',  nameBangla: 'আল-মুদ্দাসসির',  totalAyahs: 56,  startJuz: 29 },
  { id: 75,  nameEnglish: 'Al-Qiyamah',      nameNepali: 'अल-क़ियामा',     nameBangla: 'আল-কিয়ামা',     totalAyahs: 40,  startJuz: 29 },
  { id: 76,  nameEnglish: 'Al-Insan',        nameNepali: 'अल-इन्सान',      nameBangla: 'আল-ইনসান',       totalAyahs: 31,  startJuz: 29 },
  { id: 77,  nameEnglish: 'Al-Mursalat',     nameNepali: 'अल-मुर्सलात',    nameBangla: 'আল-মুরসালাত',    totalAyahs: 50,  startJuz: 29 },
  { id: 78,  nameEnglish: 'An-Naba',         nameNepali: 'अन-नबा',         nameBangla: 'আন-নাবা',        totalAyahs: 40,  startJuz: 30 },
  { id: 79,  nameEnglish: 'An-Nazi\'at',     nameNepali: 'अन-नाजिआत',      nameBangla: 'আন-নাযিআত',      totalAyahs: 46,  startJuz: 30 },
  { id: 80,  nameEnglish: '\'Abasa',         nameNepali: 'अबस',            nameBangla: 'আবাসা',          totalAyahs: 42,  startJuz: 30 },
  { id: 81,  nameEnglish: 'At-Takwir',       nameNepali: 'अत-तकवीर',       nameBangla: 'আত-তাকভীর',      totalAyahs: 29,  startJuz: 30 },
  { id: 82,  nameEnglish: 'Al-Infitar',      nameNepali: 'अल-इन्फितार',    nameBangla: 'আল-ইনফিতার',     totalAyahs: 19,  startJuz: 30 },
  { id: 83,  nameEnglish: 'Al-Mutaffifin',   nameNepali: 'अल-मुतफ्फिफीन',  nameBangla: 'আল-মুতাফফিফীন',  totalAyahs: 36,  startJuz: 30 },
  { id: 84,  nameEnglish: 'Al-Inshiqaq',     nameNepali: 'अल-इन्शिकाक',    nameBangla: 'আল-ইনশিকাক',     totalAyahs: 25,  startJuz: 30 },
  { id: 85,  nameEnglish: 'Al-Buruj',        nameNepali: 'अल-बुरूज',       nameBangla: 'আল-বুরুজ',       totalAyahs: 22,  startJuz: 30 },
  { id: 86,  nameEnglish: 'At-Tariq',        nameNepali: 'अत-तारिक',       nameBangla: 'আত-তারিক',       totalAyahs: 17,  startJuz: 30 },
  { id: 87,  nameEnglish: 'Al-A\'la',        nameNepali: 'अल-अला',         nameBangla: 'আল-আলা',         totalAyahs: 19,  startJuz: 30 },
  { id: 88,  nameEnglish: 'Al-Ghashiyah',    nameNepali: 'अल-गाशिया',      nameBangla: 'আল-গাশিয়া',     totalAyahs: 26,  startJuz: 30 },
  { id: 89,  nameEnglish: 'Al-Fajr',         nameNepali: 'अल-फज्र',        nameBangla: 'अल-ফাজর',        totalAyahs: 30,  startJuz: 30 },
  { id: 90,  nameEnglish: 'Al-Balad',        nameNepali: 'अल-बलद',         nameBangla: 'আল-বালাদ',       totalAyahs: 20,  startJuz: 30 },
  { id: 91,  nameEnglish: 'Ash-Shams',       nameNepali: 'अश-शम्स',        nameBangla: 'আশ-শামস',        totalAyahs: 15,  startJuz: 30 },
  { id: 92,  nameEnglish: 'Al-Layl',         nameNepali: 'अल-लैल',         nameBangla: 'আল-লাইল',        totalAyahs: 21,  startJuz: 30 },
  { id: 93,  nameEnglish: 'Ad-Duha',         nameNepali: 'अद-दुहा',        nameBangla: 'আদ-দুহা',        totalAyahs: 11,  startJuz: 30 },
  { id: 94,  nameEnglish: 'Ash-Sharh',       nameNepali: 'अश-शर्ह',        nameBangla: 'আশ-শারহ',        totalAyahs: 8,   startJuz: 30 },
  { id: 95,  nameEnglish: 'At-Tin',          nameNepali: 'अत-तीन',         nameBangla: 'আত-তীন',         totalAyahs: 8,   startJuz: 30 },
  { id: 96,  nameEnglish: 'Al-\'Alaq',       nameNepali: 'अल-अलक',         nameBangla: 'আল-আলাক',        totalAyahs: 19,  startJuz: 30 },
  { id: 97,  nameEnglish: 'Al-Qadr',         nameNepali: 'अल-कद्र',        nameBangla: 'আল-কদর',         totalAyahs: 5,   startJuz: 30 },
  { id: 98,  nameEnglish: 'Al-Bayyinah',     nameNepali: 'अल-बय्यिना',     nameBangla: 'আল-বাইয়্যিনা',  totalAyahs: 8,   startJuz: 30 },
  { id: 99,  nameEnglish: 'Az-Zalzalah',     nameNepali: 'अज़-जलज़ला',     nameBangla: 'আয-যালযালা',     totalAyahs: 8,   startJuz: 30 },
  { id: 100, nameEnglish: 'Al-\'Adiyat',     nameNepali: 'अल-आदियात',      nameBangla: 'আল-আদিয়াত',     totalAyahs: 11,  startJuz: 30 },
  { id: 101, nameEnglish: 'Al-Qari\'ah',     nameNepali: 'अल-कारिआ',       nameBangla: 'আল-কারিআ',       totalAyahs: 11,  startJuz: 30 },
  { id: 102, nameEnglish: 'At-Takathur',     nameNepali: 'अत-तकासुर',      nameBangla: 'আত-তাাকাসুর',    totalAyahs: 8,   startJuz: 30 },
  { id: 103, nameEnglish: 'Al-\'Asr',        nameNepali: 'अल-अस्र',        nameBangla: 'আল-আসর',         totalAyahs: 3,   startJuz: 30 },
  { id: 104, nameEnglish: 'Al-Humazah',      nameNepali: 'अल-हुमज़ा',      nameBangla: 'আল-হুমাযা',      totalAyahs: 9,   startJuz: 30 },
  { id: 105, nameEnglish: 'Al-Fil',          nameNepali: 'अल-फील',         nameBangla: 'আল-ফীল',         totalAyahs: 5,   startJuz: 30 },
  { id: 106, nameEnglish: 'Quraysh',         nameNepali: 'कुरैश',          nameBangla: 'কুরাইশ',         totalAyahs: 4,   startJuz: 30 },
  { id: 107, nameEnglish: 'Al-Ma\'un',       nameNepali: 'अल-माऊन',        nameBangla: 'আল-মাউন',        totalAyahs: 7,   startJuz: 30 },
  { id: 108, nameEnglish: 'Al-Kawthar',      nameNepali: 'अल-कौसर',        nameBangla: 'আল-কাউসার',      totalAyahs: 3,   startJuz: 30 },
  { id: 109, nameEnglish: 'Al-Kafirun',      nameNepali: 'अल-काफिरून',     nameBangla: 'আল-কাফিরুন',     totalAyahs: 6,   startJuz: 30 },
  { id: 110, nameEnglish: 'An-Nasr',         nameNepali: 'अन-नस्र',        nameBangla: 'আন-নাসর',        totalAyahs: 3,   startJuz: 30 },
  { id: 111, nameEnglish: 'Al-Masad',        nameNepali: 'अल-मसद',         nameBangla: 'আল-মাসাদ',       totalAyahs: 5,   startJuz: 30 },
  { id: 112, nameEnglish: 'Al-Ikhlas',       nameNepali: 'अल-इखलास',       nameBangla: 'আল-ইখলাস',       totalAyahs: 4,   startJuz: 30 },
  { id: 113, nameEnglish: 'Al-Falaq',        nameNepali: 'अल-फलक',         nameBangla: 'আল-ফালাক',       totalAyahs: 5,   startJuz: 30 },
  { id: 114, nameEnglish: 'An-Nas',          nameNepali: 'अन-नास',         nameBangla: 'আন-নাস',         totalAyahs: 6,   startJuz: 30 },
];

export const TOTAL_AYAHS = SURAH_DATA.reduce((sum, s) => sum + s.totalAyahs, 0);
// = 6236

// ─── Core Generator ───────────────────────────────────────────────────────────

export function generateSchedule(totalDays: number): DaySchedule[] {
  const ayahsPerDay = Math.ceil(TOTAL_AYAHS / totalDays);
  const schedule: DaySchedule[] = [];

  let surahIndex = 0;
  let ayahCursor = 1; // current position within current surah

  for (let day = 1; day <= totalDays; day++) {
    const ranges: SurahRange[] = [];
    let ayahsRemaining = ayahsPerDay;

    while (ayahsRemaining > 0 && surahIndex < SURAH_DATA.length) {
      const surah = SURAH_DATA[surahIndex];
      const ayahsLeftInSurah = surah.totalAyahs - ayahCursor + 1;

      if (ayahsLeftInSurah <= ayahsRemaining) {
        // consume the rest of this surah
        ranges.push({
          surahId: surah.id,
          surahName: surah.nameEnglish,
          fromAyah: ayahCursor,
          toAyah: surah.totalAyahs,
          totalAyahs: ayahsLeftInSurah,
        });
        ayahsRemaining -= ayahsLeftInSurah;
        surahIndex++;
        ayahCursor = 1;
      } else {
        // partial surah — stop here
        ranges.push({
          surahId: surah.id,
          surahName: surah.nameEnglish,
          fromAyah: ayahCursor,
          toAyah: ayahCursor + ayahsRemaining - 1,
          totalAyahs: ayahsRemaining,
        });
        ayahCursor += ayahsRemaining;
        ayahsRemaining = 0;
      }
    }

    const totalForDay = ranges.reduce((s, r) => s + r.totalAyahs, 0);

    // Identify which Juz this day PRIMARILY belongs to
    // or if it spans multiple, mark the starting one.
    let juzNumber: number | undefined;
    if (ranges.length > 0) {
      const firstSurah = SURAH_DATA.find(s => s.id === ranges[0].surahId);
      juzNumber = firstSurah?.startJuz;
    }

    schedule.push({
      day,
      juzNumber,
      ranges,
      totalAyahs: totalForDay,
      isComplete: false,
    });
  }

  return schedule;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

// ─── Progress Calculator ──────────────────────────────────────────────────────

export function calculateProgress(plan: import('../types/readingPlan').ReadingPlan): import('../types/readingPlan').PlanProgress {
  const today = getTodayString();
  const daysSinceStart = daysBetween(plan.startDate, today) + 1;
  const currentDay = Math.min(Math.max(daysSinceStart, 1), plan.totalDays);
  const completedDays = plan.schedule.filter(d => d.isComplete).length;
  const daysAhead = completedDays - currentDay;
  const percentComplete = Math.round((completedDays / plan.totalDays) * 100);
  const totalAyahsRead = plan.schedule
    .filter(d => d.isComplete)
    .reduce((sum, d) => sum + d.totalAyahs, 0);
  const remainingDays = plan.totalDays - completedDays;
  const isFinished = completedDays >= plan.totalDays;
  const projectedEndDate = addDays(today, remainingDays);

  return {
    currentDay,
    completedDays,
    daysAhead,
    percentComplete,
    totalAyahsRead,
    remainingDays,
    isFinished,
    projectedEndDate,
  };
}
