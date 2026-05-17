// ─── Reading Plan Types ───────────────────────────────────────────────────────

export type PlanType = '30days' | '3months' | '1year' | 'ramadan' | 'custom';

export interface SurahRange {
  surahId: number;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  totalAyahs: number;
}

export interface DaySchedule {
  day: number;               // 1-based
  juzNumber?: number;        // which Juz this day falls in (for display)
  ranges: SurahRange[];      // what to read
  totalAyahs: number;        // total ayahs for the day
  isComplete: boolean;       // tracked independently from readSurahIds
  completedAt?: string;      // ISO date string when marked complete
}

export interface ReadingPlan {
  id: string;                // uuid
  type: PlanType;
  label: string;             // "30-Day Khatm", "3-Month Plan", etc.
  startDate: string;         // ISO date — YYYY-MM-DD
  endDate: string;           // ISO date — YYYY-MM-DD
  totalDays: number;
  ayahsPerDay: number;       // approximate
  schedule: DaySchedule[];
  isActive: boolean;
  createdAt: string;         // ISO timestamp
}

export interface PlanProgress {
  currentDay: number;        // which day of plan we're on (1-based)
  completedDays: number;     // how many days marked complete
  daysAhead: number;         // positive = ahead, negative = behind
  percentComplete: number;   // 0-100
  totalAyahsRead: number;
  remainingDays: number;
  isFinished: boolean;
  projectedEndDate: string;  // if behind/ahead, when they'll actually finish
}

export const PLAN_CONFIGS: Record<PlanType, {
  label: string;
  days: number;
  description: string;
  dailySummary: string;
  icon: string;
  recommended?: boolean;
}> = {
  '30days': {
    label: '30-Day Khatm',
    days: 30,
    description: 'Complete the full Quran in one month. Ideal for Ramadan.',
    dailySummary: '~20 pages · 1 Juz per day',
    icon: 'moon',
    recommended: true,
  },
  '3months': {
    label: '3-Month Plan',
    days: 90,
    description: 'A steady, comfortable pace for regular readers.',
    dailySummary: '~7 pages · 10 Juz per month',
    icon: 'calendar',
  },
  '1year': {
    label: '1-Year Journey',
    days: 365,
    description: 'A gentle daily habit. Perfect for beginners.',
    dailySummary: '~2 pages per day',
    icon: 'book-open',
  },
  'ramadan': {
    label: 'Ramadan Khatm',
    days: 30,
    description: 'Special Ramadan plan — 1 Juz per day aligned to Tarawih.',
    dailySummary: '1 Juz per day · Tarawih aligned',
    icon: 'star',
  },
  'custom': {
    label: 'Custom Plan',
    days: 0,                 // set by user
    description: 'Set your own end date.',
    dailySummary: 'Your pace',
    icon: 'sliders',
  },
};
