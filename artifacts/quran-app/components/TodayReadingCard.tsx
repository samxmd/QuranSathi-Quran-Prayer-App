import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { useReadingPlan } from '../hooks/useReadingPlan';
import { useTheme } from '../hooks/useTheme';

export function TodayReadingCard() {
  const { plan, progress, todaySchedule, completeTodayReading, showSuccess } = useReadingPlan();
  const theme = useTheme();
  const s = styles(theme);

  if (!plan || !progress || !todaySchedule) return null;

  const todayDone = todaySchedule.isComplete;
  const isBehind = progress.daysAhead < 0;
  const firstRange = todaySchedule.ranges[0];

  const gradColors: [string, string] = theme.isDark 
    ? ['#1C1710', '#2C251D'] // Rich charcoal to deep bronze
    : ['#FDFCF9', '#F9F5EE']; // Cream to slight parchment

  return (
    <TouchableOpacity
      onPress={() => router.push('/planner')}
      activeOpacity={0.9}
      style={s.cardWrapper}
    >
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.card, { borderColor: theme.border }]}
      >
        {/* Top row */}
        <View style={s.topRow}>
          <View style={s.labelRow}>
            <View style={[s.dot, { backgroundColor: theme.primary }]} />
            <Text style={[s.label, { color: theme.primary }]}>{plan.label}</Text>
            {isBehind && (
              <View style={s.behindBadge}>
                <Text style={s.behindText}>
                  {Math.abs(progress.daysAhead)}d behind
                </Text>
              </View>
            )}
          </View>
          <Text style={[s.dayCount, { color: theme.textSecondary }]}>
            Day {progress.currentDay}/{plan.totalDays}
          </Text>
        </View>

        {/* Celebration State */}
        {showSuccess && !todayDone ? (
           <View style={s.celebration}>
             <Feather name="award" size={24} color={theme.primary} />
             <Text style={[s.celebrationText, { color: theme.textPrimary }]}>Mashallah! Today's goal met.</Text>
           </View>
        ) : (
          <>
            <Text style={[s.readingTitle, { color: theme.textPrimary }]}>
              {firstRange
                ? firstRange.fromAyah === 1 && firstRange.toAyah === firstRange.totalAyahs
                  ? `Surah ${firstRange.surahName}`
                  : `${firstRange.surahName} · Ayah ${firstRange.fromAyah}–${firstRange.toAyah}`
                : 'Reading complete'}
              {todaySchedule.ranges.length > 1
                ? ` +${todaySchedule.ranges.length - 1} more`
                : ''}
            </Text>
            <Text style={[s.ayahCount, { color: theme.textSecondary }]}>
              {todaySchedule.totalAyahs} ayahs • Juz {todaySchedule.juzNumber}
            </Text>
          </>
        )}

        {/* Progress bar */}
        <View style={[s.barTrack, { backgroundColor: theme.isDark ? '#3D3428' : '#EEE5D3' }]}>
          <View style={[s.barFill, { backgroundColor: theme.primary, width: `${progress.percentComplete}%` }]} />
        </View>

        {/* Action row */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.doneBtn, { borderColor: theme.primary }, todayDone && { backgroundColor: theme.primary }]}
            onPress={e => {
              e.stopPropagation();
              completeTodayReading();
            }}
          >
            <Feather
              name={todayDone ? 'check-circle' : 'circle'}
              size={13}
              color={todayDone ? '#FFFFFF' : theme.primary}
            />
            <Text style={[s.doneBtnText, { color: theme.primary }, todayDone && { color: '#FFFFFF' }]}>
              {todayDone ? 'Done' : 'Mark Done'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.readBtn, { backgroundColor: theme.primary }]}
            onPress={e => {
              e.stopPropagation();
              if (firstRange) {
                router.push({
                  pathname: "/reader/[id]",
                  params: { id: firstRange.surahId, ayah: firstRange.fromAyah },
                });
              }
            }}
          >
            <Text style={s.readBtnText}>Read Now</Text>
            <Feather name="arrow-right" size={12} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function styles(theme: any) {
  return StyleSheet.create({
    cardWrapper: { marginHorizontal: 0, marginTop: 16 },
    card: {
      borderRadius: 20,
      padding: 16,
      borderWidth: 1.5,
      ...Platform.select({
        web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' },
        native: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }
      })
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 5, height: 5, borderRadius: 2.5 },
    label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    behindBadge: { backgroundColor: '#FDF8EE', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
    behindText: { fontSize: 9, color: '#8B6914', fontWeight: '700' },
    dayCount: { fontSize: 10, fontWeight: '500' },
    readingTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, letterSpacing: -0.3 },
    ayahCount: { fontSize: 12, marginBottom: 12 },
    celebration: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 10 },
    celebrationText: { fontSize: 14, fontWeight: '600' },
    barTrack: { height: 5, borderRadius: 2.5, overflow: 'hidden', marginBottom: 16 },
    barFill: { height: '100%', borderRadius: 2.5 },
    actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    doneBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
    doneBtnText: { fontSize: 12, fontWeight: '700' },
    readBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    readBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  });
}
