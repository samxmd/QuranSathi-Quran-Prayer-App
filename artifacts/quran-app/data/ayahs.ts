export interface Ayah {
  id: string;
  surahId: number;
  ayahNumber: number;
  arabic: string;
  english: string;
  nepali: string;
}

const AL_FATIHA: Ayah[] = [
  {
    id: "1:1",
    surahId: 1,
    ayahNumber: 1,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    english: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    nepali: "अल्लाहको नाममा, जो अत्यन्त दयालु र कृपालु हुनुहुन्छ।",
  },
  {
    id: "1:2",
    surahId: 1,
    ayahNumber: 2,
    arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    english: "All praise is due to Allah, Lord of the worlds.",
    nepali: "सम्पूर्ण प्रशंसा अल्लाहका लागि हो, सबै संसारका पालनकर्ता।",
  },
  {
    id: "1:3",
    surahId: 1,
    ayahNumber: 3,
    arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
    english: "The Entirely Merciful, the Especially Merciful.",
    nepali: "जो अत्यन्त दयालु र विशेष कृपालु हुनुहुन्छ।",
  },
  {
    id: "1:4",
    surahId: 1,
    ayahNumber: 4,
    arabic: "مَالِكِ يَوْمِ الدِّينِ",
    english: "Sovereign of the Day of Recompense.",
    nepali: "प्रतिफल दिनका मालिक।",
  },
  {
    id: "1:5",
    surahId: 1,
    ayahNumber: 5,
    arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    english: "It is You we worship and You we ask for help.",
    nepali: "हामी केवल तपाईंको उपासना गर्छौं र केवल तपाईंसँग मद्दत माग्छौं।",
  },
  {
    id: "1:6",
    surahId: 1,
    ayahNumber: 6,
    arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
    english: "Guide us to the straight path.",
    nepali: "हामीलाई सिधो बाटोमा मार्गदर्शन गर्नुहोस्।",
  },
  {
    id: "1:7",
    surahId: 1,
    ayahNumber: 7,
    arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
    english: "The path of those upon whom You have bestowed favor, not of those who have evoked anger or of those who are astray.",
    nepali: "तिनीहरूको बाटो जसमाथि तपाईंले कृपा गर्नुभएको छ, ती मानिसहरूको होइन जसमाथि क्रोध भएको छ र न त भ्रमित भएकाहरूको।",
  },
];

const AL_IKHLAS: Ayah[] = [
  {
    id: "112:1",
    surahId: 112,
    ayahNumber: 1,
    arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    english: "Say, 'He is Allah, [who is] One.'",
    nepali: "भन्नुहोस्, 'उहाँ अल्लाह हुनुहुन्छ, एक।'",
  },
  {
    id: "112:2",
    surahId: 112,
    ayahNumber: 2,
    arabic: "اللَّهُ الصَّمَدُ",
    english: "Allah, the Eternal Refuge.",
    nepali: "अल्लाह, शाश्वत आश्रय।",
  },
  {
    id: "112:3",
    surahId: 112,
    ayahNumber: 3,
    arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
    english: "He neither begets nor is born.",
    nepali: "उहाँले न जन्म दिनुभयो र न जन्मिनुभयो।",
  },
  {
    id: "112:4",
    surahId: 112,
    ayahNumber: 4,
    arabic: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
    english: "Nor is there to Him any equivalent.",
    nepali: "र उहाँका कोही पनि बराबर छैन।",
  },
];

const AL_FALAQ: Ayah[] = [
  {
    id: "113:1",
    surahId: 113,
    ayahNumber: 1,
    arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
    english: "Say, 'I seek refuge in the Lord of daybreak.'",
    nepali: "भन्नुहोस्, 'म बिहानको पालनकर्तामा शरण माग्छु।'",
  },
  {
    id: "113:2",
    surahId: 113,
    ayahNumber: 2,
    arabic: "مِن شَرِّ مَا خَلَقَ",
    english: "From the evil of that which He created.",
    nepali: "उहाँले सिर्जना गर्नुभएका कुराहरूको खराबीबाट।",
  },
  {
    id: "113:3",
    surahId: 113,
    ayahNumber: 3,
    arabic: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
    english: "And from the evil of darkness when it settles.",
    nepali: "र अन्धकारको खराबीबाट जब यो छाउँछ।",
  },
  {
    id: "113:4",
    surahId: 113,
    ayahNumber: 4,
    arabic: "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ",
    english: "And from the evil of the blowers in knots.",
    nepali: "र गाँठोमा फुक्नेहरूको खराबीबाट।",
  },
  {
    id: "113:5",
    surahId: 113,
    ayahNumber: 5,
    arabic: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    english: "And from the evil of an envier when he envies.",
    nepali: "र हिर्षाको खराबीबाट जब ऊ हिर्षा गर्छ।",
  },
];

const AN_NAS: Ayah[] = [
  {
    id: "114:1",
    surahId: 114,
    ayahNumber: 1,
    arabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
    english: "Say, 'I seek refuge in the Lord of mankind.'",
    nepali: "भन्नुहोस्, 'म मानिसजातिको पालनकर्तामा शरण माग्छु।'",
  },
  {
    id: "114:2",
    surahId: 114,
    ayahNumber: 2,
    arabic: "مَلِكِ النَّاسِ",
    english: "The Sovereign of mankind.",
    nepali: "मानिसजातिका राजा।",
  },
  {
    id: "114:3",
    surahId: 114,
    ayahNumber: 3,
    arabic: "إِلَٰهِ النَّاسِ",
    english: "The God of mankind.",
    nepali: "मानिसजातिका इश्वर।",
  },
  {
    id: "114:4",
    surahId: 114,
    ayahNumber: 4,
    arabic: "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ",
    english: "From the evil of the retreating whisperer.",
    nepali: "पछि हट्ने कानेखुसीकारको खराबीबाट।",
  },
  {
    id: "114:5",
    surahId: 114,
    ayahNumber: 5,
    arabic: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ",
    english: "Who whispers in the breasts of mankind.",
    nepali: "जो मानिसहरूको सीनामा कानेखुसी गर्छ।",
  },
  {
    id: "114:6",
    surahId: 114,
    ayahNumber: 6,
    arabic: "مِنَ الْجِنَّةِ وَالنَّاسِ",
    english: "From among the jinn and mankind.",
    nepali: "जिन्न र मानिसजातिमध्येबाट।",
  },
];

const AL_QADR: Ayah[] = [
  {
    id: "97:1",
    surahId: 97,
    ayahNumber: 1,
    arabic: "إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ",
    english: "Indeed, We sent the Quran down during the Night of Decree.",
    nepali: "निश्चय नै हामीले यसलाई शक्तिको रातमा अवतरण गरायौं।",
  },
  {
    id: "97:2",
    surahId: 97,
    ayahNumber: 2,
    arabic: "وَمَا أَدْرَاكَ مَا لَيْلَةُ الْقَدْرِ",
    english: "And what can make you know what is the Night of Decree?",
    nepali: "र शक्तिको रात के हो भन्ने कुरा तपाईंलाई कसले थाहा दियो?",
  },
  {
    id: "97:3",
    surahId: 97,
    ayahNumber: 3,
    arabic: "لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ",
    english: "The Night of Decree is better than a thousand months.",
    nepali: "शक्तिको रात एक हजार महिना भन्दा उत्तम छ।",
  },
  {
    id: "97:4",
    surahId: 97,
    ayahNumber: 4,
    arabic: "تَنَزَّلُ الْمَلَائِكَةُ وَالرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ",
    english: "The angels and the Spirit descend therein by permission of their Lord for every matter.",
    nepali: "फरिश्ताहरू र रूह त्यसमा आफ्नो पालनकर्ताको आज्ञाले सबै कामका लागि अवतरण गर्दछन्।",
  },
  {
    id: "97:5",
    surahId: 97,
    ayahNumber: 5,
    arabic: "سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ",
    english: "Peace it is until the emergence of dawn.",
    nepali: "बिहानको उदय हुनासम्म यो शान्तिमय छ।",
  },
];

const AL_MULK_PARTIAL: Ayah[] = [
  {
    id: "67:1",
    surahId: 67,
    ayahNumber: 1,
    arabic: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    english: "Blessed is He in whose hand is dominion, and He is over all things competent.",
    nepali: "त्यो महान् हुनुहुन्छ जसको हातमा राज्य छ र उहाँ सबै कुराको सक्षम हुनुहुन्छ।",
  },
  {
    id: "67:2",
    surahId: 67,
    ayahNumber: 2,
    arabic: "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ",
    english: "Who created death and life to test you as to which of you is best in deed - and He is the Exalted in Might, the Forgiving.",
    nepali: "जसले मृत्यु र जीवन सिर्जना गर्नुभयो तपाईंहरूलाई परीक्षा गर्न कि तपाईंहरूमध्ये कुन सबैभन्दा राम्रो काम गर्छ - र उहाँ सर्वशक्तिमान र क्षमाशील हुनुहुन्छ।",
  },
  {
    id: "67:3",
    surahId: 67,
    ayahNumber: 3,
    arabic: "الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ",
    english: "Who created seven heavens in layers. You do not see in the creation of the Most Merciful any inconsistency. So return your vision to the sky; do you see any breaks?",
    nepali: "जसले सात आकाशहरू तहमा सिर्जना गर्नुभयो। तपाईंले अत्यन्त दयालुको सिर्जनामा कुनै असंगति देख्नुहुन्न। त्यसैले आकाशमा दृष्टि फर्काउनुहोस्; के तपाईंले कुनै दरार देख्नुहुन्छ?",
  },
];

const AR_RAHMAN_PARTIAL: Ayah[] = [
  {
    id: "55:1",
    surahId: 55,
    ayahNumber: 1,
    arabic: "الرَّحْمَٰنُ",
    english: "The Most Merciful.",
    nepali: "परम दयालु।",
  },
  {
    id: "55:2",
    surahId: 55,
    ayahNumber: 2,
    arabic: "عَلَّمَ الْقُرْآنَ",
    english: "Taught the Quran.",
    nepali: "कुरआन सिकाउनुभयो।",
  },
  {
    id: "55:3",
    surahId: 55,
    ayahNumber: 3,
    arabic: "خَلَقَ الْإِنسَانَ",
    english: "Created man.",
    nepali: "मानिसलाई सिर्जना गर्नुभयो।",
  },
  {
    id: "55:4",
    surahId: 55,
    ayahNumber: 4,
    arabic: "عَلَّمَهُ الْبَيَانَ",
    english: "And taught him eloquence.",
    nepali: "र उसलाई अभिव्यक्ति सिकाउनुभयो।",
  },
  {
    id: "55:13",
    surahId: 55,
    ayahNumber: 13,
    arabic: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
    english: "So which of the favors of your Lord would you deny?",
    nepali: "त तपाईंको पालनकर्ताका कुन नियामतहरूलाई तपाईं दुवैले झुठ्याउनुहुन्छ?",
  },
];

const AYAH_DATA: Record<number, Ayah[]> = {
  1: AL_FATIHA,
  55: AR_RAHMAN_PARTIAL,
  67: AL_MULK_PARTIAL,
  97: AL_QADR,
  112: AL_IKHLAS,
  113: AL_FALAQ,
  114: AN_NAS,
};

export function getAyahsForSurah(surahId: number): Ayah[] {
  return AYAH_DATA[surahId] ?? [];
}

export function getSurahsWithData(): number[] {
  return Object.keys(AYAH_DATA).map(Number);
}

export { AYAH_DATA };
