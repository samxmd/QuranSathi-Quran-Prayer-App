// ─── useReadingPlan.ts ────────────────────────────────────────────────────────
// Drop-in hook. No changes needed to QuranContext.

import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { ReadingPlan, PlanType, PlanProgress } from '../types/readingPlan';
import {
  getActivePlan,
  createPlan,
  markDayComplete,
  markDayIncomplete,
  extendPlan,
  deletePlan,
  resetPlan,
  syncPlanWithDatabase,
} from '../services/readingPlanService';
import { calculateProgress, getTodayString, daysBetween } from '../utils/generateSchedule';

interface UseReadingPlanReturn {
  plan: ReadingPlan | null;
  progress: PlanProgress | null;
  todaySchedule: ReadingPlan['schedule'][0] | null;
  isLoading: boolean;
  showSuccess: boolean;

  // Actions
  startPlan: (type: PlanType, options?: {
    customDays?: number;
    startDate?: string;
    notificationHour?: number;
  }) => Promise<void>;
  completeTodayReading: () => Promise<void>;
  undoTodayReading: () => Promise<void>;
  catchUpByExtending: () => Promise<void>;
  removePlan: () => Promise<void>;
  restart: (type: PlanType) => Promise<void>;
}

export function useReadingPlan(): UseReadingPlanReturn {
  const navigation = useNavigation();
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const refresh = useCallback(async () => {
    const p = await getActivePlan();
    if (p) {
      const synced = await syncPlanWithDatabase(p);
      setPlan(synced);
    } else {
      setPlan(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));

    // Listen for screen focus to refresh data (e.g. returning from Planner to Home)
    const unsubscribe = navigation.addListener('focus', refresh);
    return unsubscribe;
  }, [navigation, refresh]);

  // Derived values
  const progress = plan ? calculateProgress(plan) : null;

  const todaySchedule = (() => {
    if (!plan || !progress) return null;
    return plan.schedule.find(d => d.day === progress.currentDay) ?? null;
  })();

  const startPlan = useCallback(async (
    type: PlanType,
    options?: { customDays?: number; startDate?: string; notificationHour?: number }
  ) => {
    setIsLoading(true);
    const newPlan = await createPlan(type, options);
    setPlan(newPlan);
    setIsLoading(false);
  }, []);

  const completeTodayReading = useCallback(async () => {
    if (!plan || !progress) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const updated = await markDayComplete(progress.currentDay);
    setPlan(updated);
    if (updated?.schedule[progress.currentDay - 1]?.isComplete) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [plan, progress]);

  const undoTodayReading = useCallback(async () => {
    if (!plan || !progress) return;
    const updated = await markDayIncomplete(progress.currentDay);
    setPlan(updated);
  }, [plan, progress]);

  const catchUpByExtending = useCallback(async () => {
    if (!plan || !progress) return;
    const daysBehind = Math.max(-progress.daysAhead, 0);
    if (daysBehind === 0) return;
    const updated = await extendPlan(daysBehind);
    setPlan(updated);
  }, [plan, progress]);

  const removePlan = useCallback(async () => {
    await deletePlan();
    setPlan(null);
  }, []);

  const restart = useCallback(async (type: PlanType) => {
    setIsLoading(true);
    const newPlan = await resetPlan(type);
    setPlan(newPlan);
    setIsLoading(false);
  }, []);

  return {
    plan,
    progress,
    todaySchedule,
    isLoading,
    showSuccess,
    startPlan,
    completeTodayReading,
    undoTodayReading,
    catchUpByExtending,
    removePlan,
    restart,
  };
}
