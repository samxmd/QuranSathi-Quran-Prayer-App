import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from "@sentry/react-native";
import { getAnalytics, logEvent } from "@react-native-firebase/analytics/lib/modular";

type TelemetryLevel = "info" | "error";

export interface TelemetryEvent {
  id: string;
  name: string;
  level: TelemetryLevel;
  timestamp: number;
  payload?: Record<string, unknown>;
}

const STORAGE_KEY = "@telemetry_events";
const MAX_EVENTS = 200;

function createEvent(
  name: string,
  level: TelemetryLevel,
  payload?: Record<string, unknown>
): TelemetryEvent {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    level,
    timestamp: Date.now(),
    payload,
  };
}

async function persistEvent(event: TelemetryEvent): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = existing ? (JSON.parse(existing) as TelemetryEvent[]) : [];
    const next = [event, ...parsed].slice(0, MAX_EVENTS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Telemetry should never break app flows.
  }
}

function logDev(event: TelemetryEvent): void {
  if (!__DEV__) return;

  const logger = event.level === "error" ? console.error : console.log;
  logger(`[telemetry] ${event.name}`, event.payload ?? {});
}

/** Firebase Analytics requires names: letters/numbers/underscores only, max 40 chars, no dots */
function sanitizeAnalyticsName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40);
}

export async function trackEvent(
  name: string,
  payload?: Record<string, unknown>
): Promise<void> {
  const event = createEvent(name, "info", payload);
  logDev(event);

  // Keep product analytics as breadcrumbs only. Sending normal app events as
  // Sentry messages creates noisy "issues" such as Event: surah.opened.
  try {
    Sentry.addBreadcrumb({
      category: "app.event",
      message: name,
      level: "info",
      data: payload,
    });
  } catch { /* ignore */ }

  // Forward to Firebase Analytics (sanitize name: no dots allowed)
  logEvent(getAnalytics(), sanitizeAnalyticsName(name), payload).catch(() => {});

  await persistEvent(event);
}

export async function trackError(
  name: string,
  error: unknown,
  payload?: Record<string, unknown>
): Promise<void> {
  const normalizedError =
    error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : {
          message: String(error),
        };

  const event = createEvent(name, "error", {
    ...payload,
    error: normalizedError,
  });

  logDev(event);

  // Forward to Sentry (never let Sentry break app flows)
  try {
    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: { ...payload, eventName: name },
      });
    } else {
      Sentry.captureMessage(`Error Event: ${name}`, {
        level: "error",
        extra: { ...payload, error: String(error) },
      });
    }
  } catch { /* ignore */ }

  // Forward to Firebase Analytics (sanitize name: no dots allowed)
  logEvent(getAnalytics(), `err_${sanitizeAnalyticsName(name)}`, {
    ...payload,
    error_msg: normalizedError.message,
  }).catch(() => {});

  await persistEvent(event);
}

export async function getTelemetryEvents(): Promise<TelemetryEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TelemetryEvent[]) : [];
  } catch {
    return [];
  }
}

export async function clearTelemetryEvents(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}
