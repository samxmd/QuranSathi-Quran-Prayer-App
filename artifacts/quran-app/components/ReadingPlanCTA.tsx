import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';

export function ReadingPlanCTA() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const s = styles(theme);

  const gradColors: [string, string] = theme.isDark 
    ? ['#1C1710', '#252018'] // Darker, subtle
    : ['#FFFBF4', '#F9F5EE']; // Light parchment

  return (
    <TouchableOpacity
      onPress={() => router.push('/planner')}
      activeOpacity={0.9}
      style={s.container}
    >
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.card, { borderColor: theme.border }]}
      >
        <View style={s.contentRow}>
          <View style={s.textSide}>
            <View style={s.quoteRow}>
              <Feather name="star" size={10} color={theme.accent} />
              <Text style={[s.quote, { color: theme.textSecondary }]}>
                {i18n.language === 'en' 
                  ? "The best among you are those who learn the Quran and teach it."
                  : i18n.language === 'ne'
                    ? "तपाईंहरूमध्ये उत्तम ती हुन् जसले कुरआन सिक्छन् र सिकाउँछन्।"
                    : "তোমাদের মধ্যে সর্বোত্তম সেই যে কুরআন শিক্ষা করে এবং শিক্ষা দেয়।"}
              </Text>
            </View>
            <Text style={[s.title, { color: theme.textPrimary }]}>{t("startSpiritualJourney")}</Text>
            <Text style={[s.desc, { color: theme.textSecondary }]}>{t("journeyInvite")}</Text>
          </View>
          
          <View style={[s.iconCircle, { backgroundColor: theme.primary + '15' }]}>
            <Feather name="trending-up" size={24} color={theme.primary} />
          </View>
        </View>

        <View style={[s.btn, { backgroundColor: theme.primary }]}>
          <Text style={s.btnText}>Begin Journey</Text>
          <Feather name="arrow-right" size={12} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function styles(theme: any) {
  return StyleSheet.create({
    container: { marginHorizontal: 0, marginTop: 16 },
    card: {
      borderRadius: 20,
      padding: 20,
      borderWidth: 1.5,
      ...Platform.select({
        web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.04)' },
        native: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 }
      })
    },
    contentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 16 },
    textSide: { flex: 1 },
    quoteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    quote: { fontSize: 10, fontStyle: 'italic', fontWeight: '500' },
    title: { fontSize: 17, fontWeight: '800', marginBottom: 4, letterSpacing: -0.2 },
    desc: { fontSize: 12, lineHeight: 18 },
    iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start', gap: 8 },
    btnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  });
}
