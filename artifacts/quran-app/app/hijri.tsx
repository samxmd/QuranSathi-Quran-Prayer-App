import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "@/hooks/useTheme";
import { PageHeader } from "@/components/PageHeader";
import {
  toHijri,
  getIslamicEvent,
  type HijriDate,
} from "@/utils/hijriCalendar";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
];

const HIJRI_MONTHS_AR = [
  "مُحَرَّم", "صَفَر", "رَبِيع الْأَوَّل", "رَبِيع الْآخِر",
  "جُمَادَى الْأُولَى", "جُمَادَى الْآخِرَة", "رَجَب", "شَعْبَان",
  "رَمَضَان", "شَوَّال", "ذُو الْقَعْدَة", "ذُو الْحِجَّة",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// All Islamic events with descriptions
const ISLAMIC_EVENTS_FULL: {
  month: number;
  day?: number;
  name: string;
  arabicName: string;
  description: string;
  color: string;
}[] = [
  {
    month: 1, day: 1,
    name: "Islamic New Year",
    arabicName: "رأس السنة الهجرية",
    description: "The first day of Muharram marks the Islamic New Year, commemorating the Hijra of the Prophet ﷺ from Makkah to Madinah.",
    color: "#2E7D32",
  },
  {
    month: 1, day: 10,
    name: "Day of Ashura",
    arabicName: "يوم عاشوراء",
    description: "The day Musa (AS) and the Israelites were saved from Pharaoh. The Prophet ﷺ fasted on this day and encouraged fasting on the 9th and 10th.",
    color: "#1565C0",
  },
  {
    month: 3, day: 12,
    name: "Mawlid al-Nabi",
    arabicName: "المولد النبوي",
    description: "The birth anniversary of the Prophet Muhammad ﷺ. Muslims remember his blessed life and character.",
    color: "#6A1B9A",
  },
  {
    month: 7, day: 27,
    name: "Isra and Mi'raj",
    arabicName: "الإسراء والمعراج",
    description: "The Night Journey and Ascension — when the Prophet ﷺ was taken from Makkah to Jerusalem and ascended through the heavens. The 5 daily prayers were prescribed on this night.",
    color: "#00695C",
  },
  {
    month: 8, day: 15,
    name: "Shab-e-Barat",
    arabicName: "شعبان",
    description: "The 15th night of Sha'ban — a night of worship and seeking forgiveness. Many scholars recommend spending the night in prayer.",
    color: "#C8860B",
  },
  {
    month: 9,
    name: "Ramadan",
    arabicName: "رَمَضَان",
    description: "The blessed month of fasting, one of the Five Pillars of Islam. The Quran was revealed in this month. Muslims fast from Fajr to Maghrib.",
    color: "#E65100",
  },
  {
    month: 9, day: 27,
    name: "Laylat al-Qadr",
    arabicName: "لَيْلَة الْقَدْر",
    description: "The Night of Decree — better than 1000 months. Found in the last 10 nights of Ramadan (most likely the 27th). Angels descend and Allah decrees affairs for the coming year.",
    color: "#4A148C",
  },
  {
    month: 10, day: 1,
    name: "Eid al-Fitr",
    arabicName: "عِيد الْفِطْر",
    description: "The Festival of Breaking the Fast — celebrated on the first day of Shawwal after Ramadan. Includes Eid prayer, giving Zakat al-Fitr, and joyful family gatherings.",
    color: "#2E7D32",
  },
  {
    month: 12, day: 8,
    name: "Day of Arafah",
    arabicName: "يوم عرفة",
    description: "The 9th of Dhu al-Hijjah — the most important day of Hajj. Pilgrims stand on the plains of Arafah. Fasting on this day expiates sins of the previous and coming year.",
    color: "#1565C0",
  },
  {
    month: 12, day: 10,
    name: "Eid al-Adha",
    arabicName: "عِيد الْأَضْحَى",
    description: "The Festival of Sacrifice — commemorating Ibrahim's willingness to sacrifice his son. Muslims sacrifice an animal and distribute the meat to family, neighbours and the poor.",
    color: "#B71C1C",
  },
];

function getDaysInHijriMonth(month: number, year: number): number {
  // Hijri months alternate between 29 and 30 days; 12 is always 29 except in leap years
  return month % 2 === 1 ? 30 : (month === 12 && year % 30 === 2 ? 30 : 29);
}

function buildCalendarGrid(hijri: HijriDate): (HijriDate | null)[] {
  const daysInMonth = getDaysInHijriMonth(hijri.month, hijri.year);
  // Approximate weekday of the first: use today's weekday offset
  const today = new Date();
  const todayWeekday = today.getDay();
  const firstDayOffset = (todayWeekday - (hijri.day - 1) + 7) % 7;

  const cells: (HijriDate | null)[] = [];
  for (let i = 0; i < firstDayOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ ...hijri, day: d });
  }
  return cells;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function HijriCalendarScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const todayHijri = toHijri();
  const [viewHijri, setViewHijri] = useState<HijriDate>(todayHijri);
  const [selectedDay, setSelectedDay] = useState<number>(todayHijri.day);

  const accentGold = "#C8860B";

  const navMonth = (dir: -1 | 1) => {
    let newMonth = viewHijri.month + dir;
    let newYear = viewHijri.year;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newMonth > 12) { newMonth = 1; newYear++; }
    setViewHijri({
      ...viewHijri,
      month: newMonth,
      year: newYear,
      monthNameEn: HIJRI_MONTHS[newMonth - 1],
      monthNameAr: HIJRI_MONTHS_AR[newMonth - 1],
      day: 1,
      formatted: `1 ${HIJRI_MONTHS[newMonth - 1]} ${newYear} AH`,
    });
    setSelectedDay(1);
  };

  const calendarCells = buildCalendarGrid(viewHijri);
  const selectedHijri = { ...viewHijri, day: selectedDay };
  const eventToday = getIslamicEvent(selectedHijri);
  const eventDetails = ISLAMIC_EVENTS_FULL.find(
    (e) => e.month === viewHijri.month && (e.day === selectedDay || e.day === undefined)
  );

  const isToday = (d: number) =>
    viewHijri.month === todayHijri.month &&
    viewHijri.year === todayHijri.year &&
    d === todayHijri.day;

  const hasEvent = (d: number) =>
    ISLAMIC_EVENTS_FULL.some(
      (e) => e.month === viewHijri.month && (e.day === d || e.day === undefined)
    );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title="Hijri Calendar"
        arabicTitle="التَّقْوِيم الْهِجْرِي"
        subtitle={`Today: ${todayHijri.formatted}`}
        showBack
      />

      {/* ── TODAY CHIP ─────────────────────────────────────────────── */}
      <View style={styles.todaySection}>
        <View style={[styles.todayCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={[styles.todayLeft, { backgroundColor: theme.primary + "15" }]}>
            <Text style={[styles.todayDayNum, { color: theme.primary }]}>{todayHijri.day}</Text>
            <Text style={[styles.todayMonthAr, { color: theme.primary }]}>
              {HIJRI_MONTHS_AR[todayHijri.month - 1]}
            </Text>
          </View>
          <View style={styles.todayRight}>
            <Text style={[styles.todayLabel, { color: theme.textSecondary }]}>TODAY</Text>
            <Text style={[styles.todayFormatted, { color: theme.textPrimary }]}>
              {todayHijri.formatted}
            </Text>
            <Text style={[styles.todayGregorian, { color: theme.textSecondary }]}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </Text>
          </View>
        </View>
      </View>

      {/* ── CALENDAR ───────────────────────────────────────────────── */}
      <View style={styles.calSection}>
        {/* Month navigation */}
        <View style={styles.calNav}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: theme.cardBackground }]}
            onPress={() => navMonth(-1)}
          >
            <Feather name="chevron-left" size={18} color={theme.primary} />
          </TouchableOpacity>
          <View style={styles.calNavCenter}>
            <Text style={[styles.calMonthAr, { color: theme.textPrimary }]}>
              {HIJRI_MONTHS_AR[viewHijri.month - 1]}
            </Text>
            <Text style={[styles.calMonthEn, { color: theme.textSecondary }]}>
              {HIJRI_MONTHS[viewHijri.month - 1]} {viewHijri.year} AH
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: theme.cardBackground }]}
            onPress={() => navMonth(1)}
          >
            <Feather name="chevron-right" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Weekday headers */}
        <View style={[styles.calGrid, styles.weekdayRow]}>
          {WEEKDAYS.map((d) => (
            <View key={d} style={styles.weekdayCell}>
              <Text
                style={[
                  styles.weekday,
                  { color: d === "Fri" ? theme.primary : theme.textSecondary },
                ]}
              >
                {d}
              </Text>
            </View>
          ))}
        </View>

        {/* Day cells */}
        <View style={styles.calGrid}>
          {calendarCells.map((cell, i) => {
            if (!cell) return <View key={`empty-${i}`} style={styles.calCell} />;
            const active = cell.day === selectedDay;
            const today = isToday(cell.day);
            const event = hasEvent(cell.day);
            const isFriday = (i % 7) === 5;

            return (
              <TouchableOpacity
                key={`${cell.day}`}
                style={styles.calCell}
                onPress={() => setSelectedDay(cell.day)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.dayInner,
                    active && [styles.dayInnerActive, { backgroundColor: theme.primary }],
                    !active && today && [styles.dayInnerToday, { borderColor: theme.primary }],
                  ]}
                >
                  <Text
                    style={[
                      styles.calDayText,
                      {
                        color: active
                          ? "#fff"
                          : today
                          ? theme.primary
                          : isFriday
                          ? theme.primary
                          : theme.textPrimary,
                        fontFamily: active || today ? "Inter_700Bold" : "Inter_400Regular",
                        textAlignVertical: "center",
                        includeFontPadding: false,
                      },
                    ]}
                  >
                    {cell.day}
                  </Text>
                </View>
                {event && !active && (
                  <View style={[styles.eventDot, { backgroundColor: accentGold }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── SELECTED DAY EVENT ─────────────────────────────────────── */}
      {eventDetails ? (
        <View
          style={[
            styles.eventCard,
            {
              backgroundColor: eventDetails.color + (theme.isDark ? "22" : "11"),
              borderColor: eventDetails.color + "44",
            },
          ]}
        >
          <View style={[styles.eventHeader, { borderBottomColor: eventDetails.color + "33" }]}>
            <MaterialCommunityIcons name="star-crescent" size={16} color={eventDetails.color} />
            <Text style={[styles.eventName, { color: eventDetails.color }]}>
              {eventDetails.name}
            </Text>
          </View>
          <Text style={[styles.eventArabic, { color: eventDetails.color }]}>
            {eventDetails.arabicName}
          </Text>
          <Text style={[styles.eventDesc, { color: theme.textPrimary }]}>
            {eventDetails.description}
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.noEventCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <MaterialCommunityIcons name="calendar-check" size={20} color={theme.textSecondary} />
          <Text style={[styles.noEventText, { color: theme.textSecondary }]}>
            {selectedDay} {HIJRI_MONTHS[viewHijri.month - 1]} — No special event on this day.
          </Text>
        </View>
      )}

      {/* ── UPCOMING EVENTS LIST ───────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Islamic Events</Text>
        <View style={styles.eventsList}>
          {ISLAMIC_EVENTS_FULL.map((ev, i) => (
            <View
              key={i}
              style={[
                styles.evItem,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
              ]}
            >
              <View style={[styles.evColorBar, { backgroundColor: ev.color }]} />
              <View style={styles.evInfo}>
                <Text style={[styles.evName, { color: theme.textPrimary }]}>{ev.name}</Text>
                <Text style={[styles.evArabic, { color: ev.color }]}>{ev.arabicName}</Text>
                <Text style={[styles.evWhen, { color: theme.textSecondary }]}>
                  {ev.day ? `${ev.day} ` : ""}{HIJRI_MONTHS[ev.month - 1]} AH
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  todaySection: { paddingHorizontal: 20, marginBottom: 20 },
  todayCard: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  todayLeft: {
    width: 90,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 4,
  },
  todayDayNum: { fontSize: 40, fontFamily: "Inter_700Bold", lineHeight: 44 },
  todayMonthAr: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  todayRight: { flex: 1, padding: 16, gap: 3, justifyContent: "center" },
  todayLabel: { fontSize: 10, fontFamily: "Inter_700Bold" },
  todayFormatted: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  todayGregorian: { fontSize: 12, fontFamily: "Inter_400Regular" },

  calSection: { paddingHorizontal: 16, marginBottom: 16 },
  calNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  calNavCenter: { alignItems: "center", gap: 2 },
  calMonthAr: { fontSize: 20, fontFamily: "Inter_700Bold" },
  calMonthEn: { fontSize: 12, fontFamily: "Inter_400Regular" },

  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  weekdayRow: { marginBottom: 4 },
  weekdayCell: {
    width: `${100 / 7}%`,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  weekday: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayInner: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  dayInnerActive: {
    borderRadius: 19,
  },
  dayInnerToday: {
    borderWidth: 1.5,
    borderRadius: 19,
  },
  calDayText: { fontSize: 14, textAlign: "center" },
  eventDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  eventCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  eventName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  eventArabic: { fontSize: 22, fontFamily: "Inter_400Regular" },
  eventDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 21 },

  noEventCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  noEventText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },

  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },

  eventsList: { gap: 8 },
  evItem: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  evColorBar: { width: 4 },
  evInfo: { flex: 1, padding: 12, gap: 2 },
  evName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  evArabic: { fontSize: 13, fontFamily: "Inter_400Regular" },
  evWhen: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
});
