// ─── readingPlanService.ts ────────────────────────────────────────────────────
// All AsyncStorage operations for the reading plan.
// Completely independent from readSurahIds (Option A).

import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Notifications from 'expo-notifications';
import type { ReadingPlan, PlanType } from '../types/readingPlan';
import {
  generateSchedule,
  getTodayString,
  addDays,
} from '../utils/generateSchedule';
import { PLAN_CONFIGS } from '../types/readingPlan';
import { dbService } from './database';
import { scheduleReadingReminder, clearAllNotifications } from './notificationService';

const STORAGE_KEY = '@quransathi_reading_plan_v1';

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createPlan(
  type: PlanType,
  options?: {
    customDays?: number;       // for 'custom' type
    startDate?: string;        // defaults to today
    notificationHour?: number; // 0-23, default 6 (after Fajr)
  }
): Promise<ReadingPlan> {
  const config = PLAN_CONFIGS[type];
  const totalDays = type === 'custom'
    ? (options?.customDays ?? 60)
    : config.days;

  const startDate = options?.startDate ?? getTodayString();
  const endDate = addDays(startDate, totalDays - 1);
  const schedule = generateSchedule(totalDays);

  const plan: ReadingPlan = {
    id: `plan_${Date.now()}`,
    type,
    label: config.label,
    startDate,
    endDate,
    totalDays,
    ayahsPerDay: Math.ceil(6236 / totalDays),
    schedule,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plan));

  // Schedule daily notification
  if (options?.notificationHour !== undefined) {
    await schedulePlanNotification(plan, options.notificationHour);
  }

  return plan;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getActivePlan(): Promise<ReadingPlan | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const plan: ReadingPlan = JSON.parse(raw);
    return plan.isActive ? plan : null;
  } catch {
    return null;
  }
}

// ─── Mark Day Complete ────────────────────────────────────────────────────────

export async function markDayComplete(
  dayNumber: number
): Promise<ReadingPlan | null> {
  const plan = await getActivePlan();
  if (!plan) return null;

  const dayIndex = plan.schedule.findIndex(d => d.day === dayNumber);
  if (dayIndex === -1) return plan;

  plan.schedule[dayIndex] = {
    ...plan.schedule[dayIndex],
    isComplete: true,
    completedAt: new Date().toISOString(),
  };

  // Auto-close plan if all days done
  const allDone = plan.schedule.every(d => d.isComplete);
  if (allDone) plan.isActive = false;

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  return plan;
}

// ─── Mark Day Incomplete (undo) ───────────────────────────────────────────────

export async function markDayIncomplete(
  dayNumber: number
): Promise<ReadingPlan | null> {
  const plan = await getActivePlan();
  if (!plan) return null;

  const dayIndex = plan.schedule.findIndex(d => d.day === dayNumber);
  if (dayIndex === -1) return plan;

  plan.schedule[dayIndex] = {
    ...plan.schedule[dayIndex],
    isComplete: false,
    completedAt: undefined,
  };

  plan.isActive = true;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  return plan;
}

// ─── Extend Plan (catch-up) ───────────────────────────────────────────────────

export async function extendPlan(extraDays: number): Promise<ReadingPlan | null> {
  const plan = await getActivePlan();
  if (!plan) return null;

  const newEndDate = addDays(plan.endDate, extraDays);
  const completedCount = plan.schedule.filter(d => d.isComplete).length;
  const remainingAyahs = plan.schedule
    .filter(d => !d.isComplete)
    .reduce((sum, d) => sum + d.totalAyahs, 0);

  // Regenerate only the incomplete portion
  const newTotalDays = plan.schedule.filter(d => !d.isComplete).length + extraDays;
  const newTotalSchedule = generateSchedule(newTotalDays);

  // Re-attach remaining ayahs to extended schedule
  plan.schedule = [
    ...plan.schedule.filter(d => d.isComplete),
    ...newTotalSchedule.map((d, i) => ({
      ...d,
      day: completedCount + i + 1,
    })),
  ];

  plan.endDate = newEndDate;
  plan.totalDays = plan.schedule.length;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  return plan;
}

// ─── Delete / Reset ───────────────────────────────────────────────────────────

export async function deletePlan(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  await cancelPlanNotifications();
}

export async function resetPlan(type: PlanType): Promise<ReadingPlan> {
  await deletePlan();
  return createPlan(type);
}

// ─── Sync with SQLite ─────────────────────────────────────────────────────────

export async function syncPlanWithDatabase(plan: ReadingPlan): Promise<ReadingPlan> {
  const completedIds = await dbService.getCompletedSurahIds();
  let changed = false;

  const updatedSchedule = plan.schedule.map(day => {
    // If already complete, skip
    if (day.isComplete) return day;

    // Check if all surahs in this day's ranges are completed
    const allSurahsDone = day.ranges.every(range => completedIds.includes(range.surahId));

    if (allSurahsDone) {
      changed = true;
      return {
        ...day,
        isComplete: true,
        completedAt: new Date().toISOString(),
      };
    }

    return day;
  });

  if (changed) {
    const updatedPlan = { ...plan, schedule: updatedSchedule };
    // Auto-close if finished
    if (updatedSchedule.every(d => d.isComplete)) {
      updatedPlan.isActive = false;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlan));
    return updatedPlan;
  }

  return plan;
}

// ─── Notifications ────────────────────────────────────────────────────────────

async function schedulePlanNotification(
  plan: ReadingPlan,
  hour: number
): Promise<void> {
  try {
    await scheduleReadingReminder(hour, 0);
  } catch (e) {
    console.warn("⚠️ Failed to schedule plan notification:", e);
  }
}

async function cancelPlanNotifications(): Promise<void> {
  try {
    await clearAllNotifications();
  } catch (e) {
    console.warn("⚠️ Failed to cancel plan notifications:", e);
  }
}

