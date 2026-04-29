import { useState, useCallback, useEffect } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Coordinates, CalculationMethod, PrayerTimes, Madhab, HighLatitudeRule } from "adhan";
import type * as ExpoNotifications from "expo-notifications";
import { syncPrayerNotifications, PrayerAlerts } from "@/services/notificationService";

const LOCATION_STORAGE_KEY = "@prayer_location";
const ALERTS_STORAGE_KEY = "@prayer_alerts_v2";
const FALLBACK_LOCATION: LocationData = {
  latitude: 27.7172,
  longitude: 85.324,
  city: "Kathmandu",
};

function getNotifications(): typeof ExpoNotifications | null {
  if (Platform.OS === "web") return null;
  return require("expo-notifications") as typeof ExpoNotifications;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
}

export interface PrayerEntry {
  key: keyof PrayerAlerts;
  name: string;
  arabic: string;
  time: Date;
}

const DEFAULT_ALERTS: PrayerAlerts = {
  fajr: true,
  sunrise: false,
  dhuhr: true,
  asr: true,
  maghrib: true,
  isha: true,
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Now";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function usePrayerTimes(enabled: boolean = true) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [prayers, setPrayers] = useState<PrayerEntry[]>([]);
  const [currentPrayer, setCurrentPrayer] = useState<string>("");
  const [nextPrayer, setNextPrayer] = useState<PrayerEntry | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  
  const [alerts, setAlerts] = useState<PrayerAlerts>(DEFAULT_ALERTS);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Clock ticks every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const computePrayers = useCallback((loc: LocationData, date: Date) => {
    const coords = new Coordinates(loc.latitude, loc.longitude);
    const params = CalculationMethod.MuslimWorldLeague();
    params.madhab = Madhab.Shafi;
    params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;

    const pt = new PrayerTimes(coords, date, params);

    const entries: PrayerEntry[] = [
      { key: "fajr", name: "Fajr", arabic: "الفجر", time: pt.fajr },
      { key: "sunrise", name: "Sunrise", arabic: "الشروق", time: pt.sunrise },
      { key: "dhuhr", name: "Dhuhr", arabic: "الظهر", time: pt.dhuhr },
      { key: "asr", name: "Asr", arabic: "العصر", time: pt.asr },
      { key: "maghrib", name: "Maghrib", arabic: "المغرب", time: pt.maghrib },
      { key: "isha", name: "Isha", arabic: "العشاء", time: pt.isha },
    ];

    const curr = pt.currentPrayer(date);
    const next = pt.nextPrayer(date);

    setCurrentPrayer(curr ?? "");
    const nextEntry = entries.find((e) => e.key === next) ?? null;
    
    // If next prayer is tomorrow's Fajr (returns none/null for today), compute tomorrow's
    if (!nextEntry && next === 'none') {
       const tmrw = new Date(date);
       tmrw.setDate(tmrw.getDate() + 1);
       const ptTmrw = new PrayerTimes(coords, tmrw, params);
       setNextPrayer({ key: "fajr", name: "Fajr", arabic: "الفجر", time: ptTmrw.fajr });
       setCountdown(formatCountdown(ptTmrw.fajr.getTime() - date.getTime()));
    } else {
       setNextPrayer(nextEntry);
       if (nextEntry) {
         setCountdown(formatCountdown(nextEntry.time.getTime() - date.getTime()));
       }
    }
    
    setPrayers(entries);
  }, []);

  const loadSettingsAndLocation = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    let currentLoc = location;

    try {
      const savedAlerts = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
      let parsedAlerts = DEFAULT_ALERTS;
      if (savedAlerts) {
        parsedAlerts = JSON.parse(savedAlerts);
        setAlerts(parsedAlerts);
      }

      const cachedLoc = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (cachedLoc) {
        currentLoc = JSON.parse(cachedLoc);
      }

      if (!currentLoc) {
        currentLoc = FALLBACK_LOCATION;
      }

      if (forceRefresh) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
            const geocode = await Location.reverseGeocodeAsync({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            currentLoc = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              city: geocode[0]?.city ?? geocode[0]?.region ?? "Your Location",
            };
            await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(currentLoc));
          }
        } catch {
          currentLoc = currentLoc ?? FALLBACK_LOCATION;
        }
      }

      setLocation(currentLoc);
      computePrayers(currentLoc, new Date());

      /* Ensure prayer notifications are scheduled if we have permissions */
      const Notifications = getNotifications();
      const { status } = Notifications ? await Notifications.getPermissionsAsync() : { status: "denied" };
      if (Notifications && status === "granted") {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const hasPrayerNotifs = scheduled.some((item) => item.content.data?.type === "prayer");
        
        if (forceRefresh || !hasPrayerNotifs) {
          syncPrayerNotifications(currentLoc, parsedAlerts).catch(() => {});
        }
      }
    } catch {
      setLocation(FALLBACK_LOCATION);
      computePrayers(FALLBACK_LOCATION, new Date());
    } finally {
      setLoading(false);
    }
  }, [location, computePrayers]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    loadSettingsAndLocation();
  }, [enabled]); // Mount fetch

  useEffect(() => {
    if (location) computePrayers(location, now);
  }, [now, location, computePrayers]);

  const toggleAlert = async (key: keyof PrayerAlerts) => {
    const newAlerts = { ...alerts, [key]: !alerts[key] };
    setAlerts(newAlerts);
    await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(newAlerts));

    if (location) {
      syncPrayerNotifications(location, newAlerts).catch(() => {});
    }
  };

  return {
    location,
    prayers,
    currentPrayer,
    nextPrayer,
    countdown,
    loading,
    alerts,
    toggleAlert,
    refreshLocation: () => loadSettingsAndLocation(true),
  };
}
