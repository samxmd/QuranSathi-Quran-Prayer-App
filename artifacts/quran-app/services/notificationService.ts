import { Platform } from "react-native";
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from "adhan";
import type * as ExpoNotifications from "expo-notifications";

import { trackError } from "./telemetry";

const DEFAULT_ANDROID_CHANNEL_ID = "default";

function getNotifications(): typeof ExpoNotifications | null {
  if (Platform.OS === "web") return null;
  return require("expo-notifications") as typeof ExpoNotifications;
}

const Notifications = getNotifications();

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface LocationData {
  latitude: number;
  longitude: number;
}

export type PrayerAlerts = {
  fajr: boolean;
  sunrise: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
};

const DEFAULT_ALERTS: PrayerAlerts = {
  fajr: true,
  sunrise: false,
  dhuhr: true,
  asr: true,
  maghrib: true,
  isha: true,
};

const PRAYER_NOTIFICATION_MESSAGES: Record<string, string> = {
  fajr: "Rise for salah and begin your day with the remembrance of Allah.",
  sunrise: "A new morning has arrived. Keep your heart connected to Allah.",
  dhuhr: "Pause your day and return to Allah in prayer.",
  asr: "Let salah renew your heart before the day slips away.",
  maghrib: "As the sun sets, answer the call to prayer with gratitude.",
  isha: "Salah is indeed the conversation of the soul with Allah.",
};

function formatPrayerNotificationTitle(label: string, time: Date): string {
  const formattedTime = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${label} Prayer at ${formattedTime}`;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) return false;

  try {
    await ensureNotificationChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (e) {
    trackError("notifications.permission_failed", e).catch(() => {});
    return false;
  }
}

export async function ensureNotificationChannel() {
  if (!Notifications || Platform.OS !== "android") return;

  try {
    await Notifications.setNotificationChannelAsync(DEFAULT_ANDROID_CHANNEL_ID, {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#003D29",
      sound: "default",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  } catch (e) {
    trackError("notifications.channel_failed", e).catch(() => {});
  }
}

export async function clearAllNotifications() {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    trackError("notifications.clear_failed", e).catch(() => {});
  }
}

export async function clearPrayerNotifications() {
  if (!Notifications) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const prayerNotifs = scheduled.filter(item => item.content.data?.type === "prayer");
    for (const notif of prayerNotifs) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  } catch (e) {
    trackError("notifications.clear_failed", e).catch(() => {});
  }
}

export async function syncPrayerNotifications(
  location: LocationData,
  alerts: PrayerAlerts = DEFAULT_ALERTS,
  daysToSchedule: number = 7
) {
  if (!Notifications) return;

  try {
    await ensureNotificationChannel();
    await clearPrayerNotifications();
    const coords = new Coordinates(location.latitude, location.longitude);
    const params = CalculationMethod.MuslimWorldLeague();
    params.madhab = Madhab.Hanafi;

    for (let i = 0; i < daysToSchedule; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const prayerTimes = new PrayerTimes(coords, date, params);

      const times = [
        { id: "fajr", time: prayerTimes.fajr, label: "Fajr" },
        { id: "sunrise", time: prayerTimes.sunrise, label: "Sunrise" },
        { id: "dhuhr", time: prayerTimes.dhuhr, label: "Dhuhr" },
        { id: "asr", time: prayerTimes.asr, label: "Asr" },
        { id: "maghrib", time: prayerTimes.maghrib, label: "Maghrib" },
        { id: "isha", time: prayerTimes.isha, label: "Isha" },
      ];

      for (const { id, time, label } of times) {
        if (alerts[id as keyof PrayerAlerts] && time > new Date()) {
          const identifier = `prayer-${id}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
              title: formatPrayerNotificationTitle(label, time),
              body: PRAYER_NOTIFICATION_MESSAGES[id] ?? `It is time for ${label} prayer.`,
              sound: true,
              data: { type: "prayer", prayer: id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: time,
              channelId: DEFAULT_ANDROID_CHANNEL_ID,
            },
          });
        }
      }
    }
  } catch (e) {
    trackError("notifications.sync_failed", e).catch(() => {});
  }
}

export async function scheduleReadingReminder(hour: number, minute: number = 0) {
  if (!Notifications) return;

  try {
    await ensureNotificationChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Quran Reading Reminder",
        body: "Have you reached your goal for today? Open QuranSathi to continue your journey.",
        sound: true,
        data: { type: "reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: DEFAULT_ANDROID_CHANNEL_ID,
      },
    });
  } catch (e) {
    trackError("notifications.reminder_failed", e).catch(() => {});
  }
}

export async function scheduleDailyAyahNotification(hour: number = 9, minute: number = 0) {
  if (!Notifications) return;

  try {
    await ensureNotificationChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Ayah of the Day",
        body: "A new inspiration from the Holy Quran is waiting for you. Open now to reflect.",
        sound: true,
        data: { type: "daily_ayah" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: DEFAULT_ANDROID_CHANNEL_ID,
      },
    });
  } catch (e) {
    trackError("notifications.daily_ayah_failed", e).catch(() => {});
  }
}

export async function ensureDailyAyahNotificationScheduled(hour: number = 9, minute: number = 0) {
  if (!Notifications) return;

  try {
    await ensureNotificationChannel();

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const hasDailyAyah = scheduled.some((item) => item.content.data?.type === "daily_ayah");

    if (!hasDailyAyah) {
      await scheduleDailyAyahNotification(hour, minute);
    }
  } catch (e) {
    trackError("notifications.daily_ayah_ensure_failed", e).catch(() => {});
  }
}
