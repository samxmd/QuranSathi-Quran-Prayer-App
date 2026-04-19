import { trackError } from "@/services/telemetry";

// Tafsir service fetches Ibn Kathir from api.quran.com.
// Tafsir ID 169 = "en-tafisr-ibn-kathir" on quran.com.

const TAFSIR_RESOURCE_ID = 169;
const BASE = `https://api.quran.com/api/v4/tafsirs/${TAFSIR_RESOURCE_ID}/by_ayah`;
const REQUEST_TIMEOUT_MS = 12000;

const cache = new Map<string, string>();
const inflightRequests = new Map<string, Promise<string>>();

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function extractTafsirText(json: any): string {
  if (typeof json?.tafsir?.text === "string") {
    return json.tafsir.text;
  }

  if (typeof json?.text === "string") {
    return json.text;
  }

  const firstArrayEntry = Array.isArray(json?.tafsirs) ? json.tafsirs[0] : null;
  if (typeof firstArrayEntry?.text === "string") {
    return firstArrayEntry.text;
  }

  return "";
}

function sanitizeTafsirText(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/#{1,6}\s+/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(h1|h2|h3|h4|h5|h6|div|section|article|blockquote)>/gi, "\n\n")
    .replace(/<(p|div|section|article|blockquote|ul|ol)\b[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/(ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchTafsirInternal(surahNumber: number, ayahNumber: number): Promise<string> {
  const verseKey = `${surahNumber}:${ayahNumber}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE}/${verseKey}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Tafsir fetch failed with status ${res.status}`);
    }

    const json = await res.json();
    const text = extractTafsirText(json);
    const clean = sanitizeTafsirText(text);

    if (!clean) {
      throw new Error("Tafsir response was empty");
    }

    cache.set(verseKey, clean);
    return clean;
  } catch (error) {
    trackError("tafsir.fetch_failed", error, {
      surahNumber,
      ayahNumber,
      resourceId: TAFSIR_RESOURCE_ID,
    }).catch(() => {});
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchTafsir(
  surahNumber: number,
  ayahNumber: number
): Promise<string> {
  const key = `${surahNumber}:${ayahNumber}`;

  if (cache.has(key)) {
    return cache.get(key)!;
  }

  if (inflightRequests.has(key)) {
    return inflightRequests.get(key)!;
  }

  const request = fetchTafsirInternal(surahNumber, ayahNumber).finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, request);
  return request;
}
