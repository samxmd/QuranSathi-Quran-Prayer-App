import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuran } from "@/context/QuranContext";
import { useTheme } from "@/hooks/useTheme";
import { toHijri, getIslamicEventLabel } from "@/utils/hijriCalendar";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { PageHeader } from "@/components/PageHeader";

const PRAYER_ICONS: Record<string, string> = {
  fajr: "sunrise",
  sunrise: "sun",
  dhuhr: "sun",
  asr: "cloud",
  maghrib: "sunset",
  isha: "moon",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function PrayerScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { uiLanguage } = useQuran();
  
  const {
    location,
    prayers,
    currentPrayer,
    nextPrayer,
    countdown,
    loading,
    alerts,
    toggleAlert,
    refreshLocation,
  } = usePrayerTimes();

  const gradColors: [string, string] = theme.isDark
    ? [theme.gradientStart, theme.gradientEnd]
    : [theme.gradientStart, theme.gradientEnd];

  const hijri = toHijri();
  const islamicEvent = getIslamicEventLabel(hijri, uiLanguage);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader
        title={location?.city ?? "Prayer Times"}
        arabicTitle="مواقيت الصلاة"
        subtitle={nextPrayer && !loading ? `Next: ${nextPrayer.name} in ${countdown}` : hijri.formatted}
      >        
        {/* Hijri chip */}
        {islamicEvent ? (
          <View style={styles.eventChip}>
            <Text style={styles.eventText}>✦ {islamicEvent}</Text>
          </View>
        ) : null}
      </PageHeader>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadText, { color: theme.textSecondary }]}>Finding your location...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 16, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          {prayers.map((prayer) => {
            const isCurrent = prayer.key === currentPrayer;
            const isNext = prayer.key === nextPrayer?.key;
            const isAlertEnabled = alerts[prayer.key];

            return (
              <View
                key={prayer.key}
                style={[
                  styles.prayerRow,
                  {
                    backgroundColor: isCurrent
                      ? theme.primary
                      : isNext
                      ? theme.cardBackground
                      : theme.cardBackground,
                    borderColor: isCurrent
                      ? theme.primary
                      : isNext
                      ? theme.accent
                      : theme.border,
                    marginBottom: 10,
                  },
                ]}
              >
                <View style={styles.prayerLeft}>
                  <View
                    style={[
                      styles.prayerIconBox,
                      {
                        backgroundColor: isCurrent
                          ? "rgba(255,255,255,0.15)"
                          : theme.cardBackground,
                      },
                    ]}
                  >
                    <Feather
                      name={PRAYER_ICONS[prayer.key] as any}
                      size={18}
                      color={isCurrent ? "#FFF" : theme.primary}
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.prayerName,
                        { color: isCurrent ? "#FFF" : theme.textPrimary },
                      ]}
                    >
                      {prayer.name}
                    </Text>
                    <Text
                      style={[
                        styles.prayerArabic,
                        { color: isCurrent ? "rgba(255,255,255,0.75)" : theme.textSecondary },
                      ]}
                    >
                      {prayer.arabic}
                    </Text>
                  </View>
                </View>

                <View style={styles.prayerRight}>
                  {isCurrent && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                  {isNext && !isCurrent && (
                    <View style={[styles.nextBadge, { backgroundColor: `${theme.accent}22`, borderColor: theme.accent }]}>
                      <Text style={[styles.nextBadgeText, { color: theme.accent }]}>{countdown}</Text>
                    </View>
                  )}
                  
                  <View style={styles.timeAndToggle}>
                    <Text
                      style={[
                        styles.prayerTime,
                        { color: isCurrent ? "#FFF" : theme.textPrimary },
                      ]}
                    >
                      {formatTime(prayer.time)}
                    </Text>
                    <TouchableOpacity
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => toggleAlert(prayer.key)}
                      style={[
                        styles.alertToggle,
                        { backgroundColor: isAlertEnabled ? (isCurrent ? 'rgba(255,255,255,0.2)' : theme.cardBackground) : 'transparent' }
                      ]}
                    >
                      <Feather 
                        name={isAlertEnabled ? "bell" : "bell-off"} 
                        size={16} 
                        color={isAlertEnabled ? (isCurrent ? '#FFF' : theme.primary) : theme.textSecondary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Refresh location row */}
          <TouchableOpacity
            style={[styles.refreshBtn, { borderColor: theme.border }]}
            onPress={refreshLocation}
          >
            <Feather name="refresh-cw" size={14} color={theme.textSecondary} />
            <Text style={[styles.refreshText, { color: theme.textSecondary }]}>
              Update location
            </Text>
          </TouchableOpacity>

          {/* Settings note */}
          <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>
            Tap the bell icon to toggle prayer notifications.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  eventChip: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  eventText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  prayerRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1,
  },
  prayerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  prayerIconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  prayerName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  prayerArabic: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 1 },
  prayerRight: { alignItems: "flex-end", gap: 6 },
  timeAndToggle: { flexDirection: "row", alignItems: "center", gap: 10 },
  prayerTime: { fontSize: 17, fontFamily: "Inter_700Bold" },
  alertToggle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  currentBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  currentBadgeText: { fontSize: 10, color: "#FFF", fontFamily: "Inter_600SemiBold" },
  nextBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1,
    marginBottom: 4,
  },
  nextBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  refreshBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginTop: 4,
  },
  refreshText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  dateLabel: {
    textAlign: "center", fontSize: 13,
    fontFamily: "Inter_500Medium", marginTop: 16,
  },
});
