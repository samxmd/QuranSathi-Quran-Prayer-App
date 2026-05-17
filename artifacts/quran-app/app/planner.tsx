// ─── app/planner.tsx ──────────────────────────────────────────────────────────
// Route: /planner
// Entry points: Utilities tab → "Reading Plan" card
//               Home screen → Today's Reading card (when plan active)

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList } from 'react-native';
import { useReadingPlan } from '../hooks/useReadingPlan';
import { useTheme } from '../hooks/useTheme';
import { PLAN_CONFIGS } from '../types/readingPlan';
import type { PlanType } from '../types/readingPlan';

export default function PlannerScreen() {
  const { plan, progress, todaySchedule, isLoading, startPlan,
    completeTodayReading, undoTodayReading, catchUpByExtending, removePlan, restart } = useReadingPlan();
  const theme = useTheme();
  const [starting, setStarting] = useState(false);
  const [selectedType, setSelectedType] = useState<PlanType | null>(null);

  const s = styles(theme);

  async function handleStart(type: PlanType) {
    setStarting(true);
    await startPlan(type, { notificationHour: 6 });
    setStarting(false);
  }

  function handleDeletePlan() {
    Alert.alert(
      'Delete Reading Plan',
      'Your progress will be lost. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: removePlan },
      ]
    );
  }

  if (isLoading) {
    return (
      <View style={[s.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  // ── No active plan — show plan selection ──────────────────────────────────
  if (!plan) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Feather name="arrow-left" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Reading Plan</Text>
            <View style={{ width: 36 }} />
          </View>

          <Text style={s.sectionTitle}>Choose your pace</Text>
          <Text style={s.sectionSubtitle}>
            Complete the full Quran at a pace that works for you.
            Your plan tracks independently — you can read freely outside it too.
          </Text>

          {/* Plan cards */}
          {(Object.keys(PLAN_CONFIGS) as PlanType[])
            .filter(t => t !== 'custom')
            .map(type => {
              const config = PLAN_CONFIGS[type];
              const isSelected = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[s.planCard, { backgroundColor: theme.cardBackground }, isSelected && s.planCardSelected]}
                  onPress={() => setSelectedType(isSelected ? null : type)}
                  activeOpacity={0.8}
                >
                  <View style={s.planCardRow}>
                    <View style={[s.planIcon, { backgroundColor: theme.isDark ? '#2C251D' : '#E4DDD0' }, isSelected && s.planIconSelected]}>
                      <Feather
                        name={config.icon as any}
                        size={20}
                        color={isSelected ? '#FFFFFF' : theme.primary}
                      />
                    </View>
                    <View style={s.planCardText}>
                      <View style={s.planCardTitleRow}>
                        <Text style={s.planCardTitle}>{config.label}</Text>
                        {config.recommended && (
                          <View style={s.badge}>
                            <Text style={s.badgeText}>Recommended</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[s.planCardSummary, { color: theme.primary }]}>{config.dailySummary}</Text>
                      <Text style={[s.planCardDesc, { color: theme.textSecondary }]}>{config.description}</Text>
                    </View>
                  </View>

                  {isSelected && (
                    <TouchableOpacity
                      style={[s.startBtn, { backgroundColor: theme.primary }]}
                      onPress={() => handleStart(type)}
                      disabled={starting}
                    >
                      {starting
                        ? <ActivityIndicator color="#FFFFFF" size="small" />
                        : <Text style={s.startBtnText}>Start {config.label}</Text>
                      }
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}

          <Text style={[s.footerNote, { color: theme.textSecondary }]}>
            You will receive a daily reminder at 6:00 AM. You can change this in Settings.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Active plan — show progress ───────────────────────────────────────────
  const isBehind = (progress?.daysAhead ?? 0) < 0;
  const isAhead = (progress?.daysAhead ?? 0) > 0;
  const todayDone = todaySchedule?.isComplete ?? false;

  const gradColors: [string, string] = theme.isDark 
    ? ['#1C1710', '#2C251D'] 
    : ['#FFFBF4', '#F7F1E5'];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{plan.label}</Text>
        <TouchableOpacity onPress={handleDeletePlan}>
          <Feather name="trash-2" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={plan.schedule}
        keyExtractor={item => `day-${item.day}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={s.headerComponent}>
            {/* Progress dashboard */}
            <LinearGradient
              colors={gradColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[s.progressCard, { borderColor: theme.border }]}
            >
              <View style={s.progressRow}>
                <View>
                  <Text style={[s.progressPercent, { color: theme.primary }]}>{progress?.percentComplete ?? 0}%</Text>
                  <Text style={[s.progressLabel, { color: theme.textSecondary }]}>complete</Text>
                </View>
                <View style={s.progressStats}>
                  <View style={s.statItem}>
                    <Text style={[s.statValue, { color: theme.textPrimary }]}>{progress?.completedDays ?? 0}</Text>
                    <Text style={[s.statLabel, { color: theme.textSecondary }]}>days done</Text>
                  </View>
                  <View style={s.statItem}>
                    <Text style={[s.statValue, { color: theme.textPrimary }]}>{progress?.remainingDays ?? 0}</Text>
                    <Text style={[s.statLabel, { color: theme.textSecondary }]}>remaining</Text>
                  </View>
                </View>
              </View>

              <View style={[s.barTrack, { backgroundColor: theme.isDark ? '#3D3428' : '#EEE5D3' }]}>
                <View style={[s.barFill, { backgroundColor: theme.primary, width: `${progress?.percentComplete ?? 0}%` }]} />
              </View>

              <Text style={[s.progressSubtitle, { color: theme.textSecondary }]}>
                Day {progress?.currentDay ?? 1} of {plan.totalDays} • Ends {plan.endDate}
              </Text>
            </LinearGradient>

            {/* Notifications / Status */}
            {isBehind && (
              <View style={[s.banner, s.bannerWarning]}>
                <Feather name="alert-circle" size={16} color="#8B6914" />
                <Text style={s.bannerText}>
                  You are {Math.abs(progress?.daysAhead ?? 0)} day{Math.abs(progress?.daysAhead ?? 0) !== 1 ? 's' : ''} behind.
                </Text>
                <TouchableOpacity onPress={catchUpByExtending}>
                  <Text style={[s.bannerAction, { color: '#8B6914' }]}>Extend plan</Text>
                </TouchableOpacity>
              </View>
            )}
            {isAhead && (
              <View style={[s.banner, s.bannerSuccess]}>
                <Feather name="check-circle" size={16} color="#1A6A4C" />
                <Text style={s.bannerText}>
                  Mashallah! You are {progress?.daysAhead} day{progress?.daysAhead !== 1 ? 's' : ''} ahead.
                </Text>
              </View>
            )}

            {/* Today's reading */}
            {todaySchedule && (
              <View style={[s.todaySection, { borderColor: theme.border }]}>
                <View style={s.todayHeader}>
                  <View style={[s.dot, { backgroundColor: theme.primary }]} />
                  <Text style={[s.todayTitle, { color: theme.textPrimary }]}>Today's Target</Text>
                  <Text style={[s.todayAyahCount, { color: theme.textSecondary }]}>{todaySchedule.totalAyahs} ayahs</Text>
                </View>

                {todaySchedule.ranges.map((range, i) => (
                  <View key={i} style={s.rangeRow}>
                    <View style={s.rangeInfo}>
                      <Text style={[s.rangeName, { color: theme.textPrimary }]}>{range.surahName}</Text>
                      <Text style={[s.rangeAyahs, { color: theme.textSecondary }]}>
                        Ayah {range.fromAyah}{range.toAyah !== range.fromAyah ? ` – ${range.toAyah}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[s.readBtn, { backgroundColor: theme.primary }]}
                      onPress={() => router.push({
                        pathname: "/reader/[id]",
                        params: { id: range.surahId, ayah: range.fromAyah },
                      })}
                    >
                      <Text style={s.readBtnText}>Read Now</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={[s.doneBtn, { borderColor: theme.primary, backgroundColor: todayDone ? theme.primary : 'transparent' }]}
                  onPress={todayDone ? undoTodayReading : completeTodayReading}
                >
                  <Feather name={todayDone ? 'check-circle' : 'circle'} size={18} color={todayDone ? '#FFFFFF' : theme.primary} />
                  <Text style={[s.doneBtnText, { color: todayDone ? '#FFFFFF' : theme.primary }]}>
                    {todayDone ? "Completed Today ✓" : "Mark Today as Done"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={[s.sectionTitle, { color: theme.textPrimary }]}>Full Schedule</Text>
          </View>
        )}
        renderItem={({ item, index }) => {
          const prevItem = plan.schedule[index - 1];
          const isNewJuz = item.juzNumber !== prevItem?.juzNumber;
          
          return (
            <View>
              {isNewJuz && item.juzNumber && (
                <View style={s.juzMilestone}>
                   <View style={[s.milestoneLine, { backgroundColor: theme.border }]} />
                   <View style={[s.milestoneBadge, { backgroundColor: theme.cardBackground, borderStyle: 'dashed', borderColor: theme.primary, borderWidth: 1 }]}>
                     <Text style={[s.milestoneText, { color: theme.primary }]}>Juz {item.juzNumber}</Text>
                   </View>
                   <View style={[s.milestoneLine, { backgroundColor: theme.border }]} />
                </View>
              )}
              <View style={[s.scheduleRow, { borderBottomColor: theme.border }, item.isComplete && s.scheduleRowDone]}>
                <View style={[s.dayDot, { backgroundColor: theme.isDark ? '#2C251D' : '#E4DDD0' }, item.isComplete && { backgroundColor: theme.primary }]}>
                  {item.isComplete
                    ? <Feather name="check" size={10} color="#FFFFFF" />
                    : <Text style={[s.dayDotText, { color: theme.textSecondary }]}>{item.day}</Text>
                  }
                </View>
                <Text style={[s.scheduleText, { color: theme.textPrimary }, item.isComplete && { textDecorationLine: 'line-through', color: theme.textSecondary }]}>
                  {item.ranges.map((r: any) => 
                    r.fromAyah === 1 && r.toAyah === r.totalAyahs ? r.surahName : `${r.surahName} ${r.fromAyah}–${r.toAyah}`
                  ).join(', ')}
                </Text>
                <Text style={[s.scheduleAyahs, { color: theme.textSecondary }]}>{item.totalAyahs} v</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function styles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { padding: 16 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5, borderBottomColor: theme.border },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary },
    headerComponent: { paddingTop: 16 },

    sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary, marginTop: 24, marginBottom: 12 },
    sectionSubtitle: { fontSize: 13, color: theme.textSecondary, lineHeight: 20, marginBottom: 16 },

    planCard: { borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: theme.border },
    planCardSelected: { borderColor: theme.primary },
    planCardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    planIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    planIconSelected: { backgroundColor: theme.primary },
    planCardText: { flex: 1 },
    planCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    planCardTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
    planCardSummary: { fontSize: 12, marginTop: 2, fontWeight: '600' },
    planCardDesc: { fontSize: 12, marginTop: 4, lineHeight: 18 },
    badge: { backgroundColor: '#FDF8EE', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 10, color: '#8B6914', fontWeight: '700' },
    startBtn: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    startBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    footerNote: { fontSize: 11, textAlign: 'center', marginTop: 20, lineHeight: 18 },

    progressCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1.5 },
    progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    progressPercent: { fontSize: 40, fontWeight: '800' },
    progressLabel: { fontSize: 12, fontWeight: '500' },
    progressStats: { flexDirection: 'row', gap: 20 },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '700' },
    statLabel: { fontSize: 10, fontWeight: '500', marginTop: 2, textTransform: 'uppercase' },
    barTrack: { height: 7, borderRadius: 3.5, overflow: 'hidden', marginBottom: 12 },
    barFill: { height: '100%', borderRadius: 3.5 },
    progressSubtitle: { fontSize: 11, fontWeight: '500' },

    banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, marginBottom: 16 },
    bannerWarning: { backgroundColor: '#FDF8EE', borderWidth: 1, borderColor: '#E8C97A' },
    bannerSuccess: { backgroundColor: '#E8F5EE', borderWidth: 1, borderColor: '#A8D5BC' },
    bannerText: { flex: 1, fontSize: 12, color: '#3C3127', fontWeight: '500' },
    bannerAction: { fontSize: 12, fontWeight: '700' },

    todaySection: { borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1.5 },
    todayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    todayTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
    todayAyahCount: { fontSize: 11, fontWeight: '600' },
    rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    rangeInfo: { flex: 1 },
    rangeName: { fontSize: 14, fontWeight: '700' },
    rangeAyahs: { fontSize: 12, marginTop: 2 },
    readBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    readBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    doneBtn: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 2, borderRadius: 14, paddingVertical: 14 },
    doneBtnText: { fontSize: 14, fontWeight: '700' },

    juzMilestone: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
    milestoneLine: { flex: 1, height: 1.5 },
    milestoneBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    milestoneText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

    scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5 },
    scheduleRowDone: { opacity: 0.4 },
    dayDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    dayDotText: { fontSize: 10, fontWeight: '700' },
    scheduleText: { flex: 1, fontSize: 13, fontWeight: '500' },
    scheduleAyahs: { fontSize: 11, fontWeight: '600' },
  });
}
