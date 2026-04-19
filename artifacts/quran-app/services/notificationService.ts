import { Platform } from "react-native";
import { Coordinates, CalculationMethod, PrayerTimes, Madhab, HighLatitudeRule } from "adhan";

let notificationsModulePromise: Promise<typeof import("expo-notifications")> | null = null;

async function getNotificationsModule() {
  if (Platform.OS === "web") return null;

  try {
    notificationsModulePromise ??= import("expo-notifications");
    const Notifications = await notificationsModulePromise;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    return Notifications;
  } catch {
    return null;
  }
}

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

const PRAYER_NAMES: Record<string, string> = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch {
    return false;
  }
}

export async function clearAllNotifications() {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export async function syncPrayerNotifications(
  location: LocationData,
  alerts: PrayerAlerts = DEFAULT_ALERTS,
  daysToSchedule: number = 7
) {
  if (Platform.OS === "web") return;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await clearAllNotifications();

    const coords = new Coordinates(location.latitude, location.longitude);
    const params = CalculationMethod.MuslimWorldLeague();
    params.madhab = Madhab.Shafi;
    params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;

    const now = new Date();

    for (let i = 0; i < daysToSchedule; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + i);

      const pt = new PrayerTimes(coords, targetDate, params);

      const scheduleList = [
        { key: "fajr", time: pt.fajr },
        { key: "sunrise", time: pt.sunrise },
        { key: "dhuhr", time: pt.dhuhr },
        { key: "asr", time: pt.asr },
        { key: "maghrib", time: pt.maghrib },
        { key: "isha", time: pt.isha },
      ] as const;

      for (const prayer of scheduleList) {
        if (!alerts[prayer.key] || prayer.time.getTime() <= now.getTime()) {
          continue;
        }

        const Notifications = await getNotificationsModule();
        if (!Notifications) return;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${PRAYER_NAMES[prayer.key]} Prayer`,
            body: "Indeed, prayer has been decreed upon the believers a decree of specified times. (Quran 4:103)",
            sound: true,
            data: { prayer: prayer.key },
          },
          // @ts-ignore - type definitions vary between expo sdk versions
          trigger: { date: prayer.time },
        });
      }
    }
  } catch {
    return;
  }
}
