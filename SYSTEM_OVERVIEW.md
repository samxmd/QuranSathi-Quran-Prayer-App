# Quran App — System Overview

> Last updated: April 16, 2026

---

## 1. Project Purpose

A mobile Quran application built for **Nepali-speaking Muslims**. The unique value proposition is displaying all 114 surahs with three languages side-by-side:

| Language | Source | Notes |
|----------|--------|-------|
| Arabic | AlQuran Cloud API (`quran-uthmani` edition) | Uthmani script |
| English | AlQuran Cloud API (`en.sahih` edition) | Sahih International |
| Nepali | Quran.com API (Translation ID 108) | Ahl Al-Hadith Central Society of Nepal |

---

## 2. Repository Structure

```
workspace/                        ← pnpm monorepo root
├── artifacts/
│   ├── quran-app/                ← PRIMARY: React Native / Expo app
│   ├── api-server/               ← Express 5 API (unused by Quran app)
│   └── mockup-sandbox/           ← Vite component preview server (design tool)
├── replit.md                     ← Project memory
├── SYSTEM_OVERVIEW.md            ← This file
└── package.json                  ← Workspace root
```

---

## 3. Quran App (`artifacts/quran-app/`)

### 3.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native via **Expo SDK** |
| Routing | **Expo Router** (file-based, similar to Next.js) |
| State | React Context + `AsyncStorage` (no backend) |
| Fonts | `@expo-google-fonts/inter` (400, 500, 600, 700) |
| Icons | `@expo/vector-icons` (Feather set) |
| Safe area | `react-native-safe-area-context` |
| Blur effect | `expo-blur` (iOS tab bar) |
| Query | `@tanstack/react-query` (available but minimal use) |

### 3.2 Directory Structure

```
artifacts/quran-app/
├── app/
│   ├── _layout.tsx              ← Root layout: fonts, providers, Stack navigator
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← Tab bar (iOS native glass / classic cross-platform)
│   │   └── index.tsx            ← HOME / DASHBOARD screen
│   ├── surahs.tsx               ← Full surah list (search + Meccan/Medinan filter)
│   ├── reader/[id].tsx          ← Surah reader (dynamic route, id = surah number)
│   ├── bookmarks.tsx            ← Saved ayahs list
│   ├── settings.tsx             ← App preferences
│   └── +not-found.tsx           ← 404 fallback
│
├── components/
│   ├── AyahCard.tsx             ← Single ayah display (Arabic + English + Nepali)
│   ├── SurahCard.tsx            ← Surah list item
│   ├── ErrorBoundary.tsx        ← React error boundary wrapper
│   ├── ErrorFallback.tsx        ← Fallback UI for errors
│   └── KeyboardAwareScrollViewCompat.tsx
│
├── context/
│   └── QuranContext.tsx          ← Global app state (see §3.4)
│
├── data/
│   ├── surahs.ts                ← Static metadata for all 114 surahs
│   └── ayahs.ts                 ← Ayah type definition + legacy local data (unused for content)
│
├── hooks/
│   ├── useTheme.ts              ← Returns current theme colors based on darkMode toggle
│   ├── useColors.ts             ← Raw color access
│   └── useDailyAyah.ts          ← Fetches today's rotating ayah from APIs (see §3.6)
│
├── services/
│   └── quranApi.ts              ← API fetch logic + AsyncStorage caching (see §3.5)
│
└── constants/
    └── colors.ts                ← Light/dark color palette tokens
```

---

### 3.3 Navigation

```
Stack (root)
├── (tabs)                       ← Tab navigator (single tab: Home)
│   └── index (Home/Dashboard)
├── surahs                       ← Full surah list
├── reader/[id]                  ← Ayah reader, param: surah ID (1–114)
├── bookmarks                    ← Saved bookmarks
└── settings                     ← User preferences
```

Navigation is handled entirely by **Expo Router**. Routes are driven by file names.

---

### 3.4 Global State — `QuranContext`

All persistent state lives in `QuranContext` (no backend/database). Everything is persisted to **AsyncStorage**.

| State field | Type | AsyncStorage key | Description |
|-------------|------|-----------------|-------------|
| `bookmarks` | `Bookmark[]` | `@quran_bookmarks` | Saved ayahs with Arabic text + reference |
| `lastRead` | `LastRead \| null` | `@quran_last_read` | Most recently read surah + ayah number |
| `readSurahIds` | `number[]` | `@quran_read_surahs` | IDs of surahs opened at least once |
| `fontSize` | `number` | `@quran_font_size` | Arabic text size (default 26, range 20–36) |
| `showNepali` | `boolean` | `@quran_show_nepali` | Toggle Nepali translation (default: on) |
| `showEnglish` | `boolean` | `@quran_show_english` | Toggle English translation (default: on) |
| `darkMode` | `boolean` | `@quran_dark_mode` | Dark mode override (default: off) |

**Exported functions:**
- `addBookmark(bookmark)` — prepends bookmark, dedupes by ayahId
- `removeBookmark(ayahId)` — removes by ayahId
- `isBookmarked(ayahId)` → boolean
- `setLastRead(lr)` — updates last read position
- `setFontSize(size)` — persists font preference
- `setShowNepali(bool)` / `setShowEnglish(bool)` — translation toggles
- `toggleDarkMode()` — flips dark mode
- `markSurahRead(surahId)` — adds to `readSurahIds` if not already present

---

### 3.5 API Service — `services/quranApi.ts`

**Two external APIs are called in parallel** for every surah load:

#### API 1 — AlQuran Cloud
```
GET https://api.alquran.cloud/v1/surah/{id}/editions/quran-uthmani,en.sahih
```
Returns both Arabic (Uthmani) and English (Sahih International) in one response.

#### API 2 — Quran.com
```
GET https://api.quran.com/api/v4/quran/translations/108?chapter_number={id}
```
Returns Nepali translation (ID 108, Ahl Al-Hadith Central Society of Nepal).
- Nepali text is stripped of Devanagari number prefixes (e.g. `"१) text"` → `"text"`)
- HTML tags are stripped from the response

#### Merging
Results are merged by array index (both APIs return ayahs in order) into `Ayah` objects:
```ts
interface Ayah {
  id: string;           // "surahId:ayahNumber" e.g. "2:255"
  surahId: number;
  ayahNumber: number;
  arabic: string;
  english: string;
  nepali: string;
}
```

#### Caching (AsyncStorage)
- **Cache key**: `@quran_surah_v2_{surahId}`
- **TTL**: 7 days
- On cache hit within TTL: returns immediately, no network call
- On cache miss or expiry: fetches both APIs, merges, stores result
- `clearSurahCache(surahId?)` — clears one or all surah caches

---

### 3.6 Daily Ayah Hook — `hooks/useDailyAyah.ts`

Fetches a different ayah each calendar day from a curated pool of 30 meaningful ayahs.

**Selection logic:**
```
dayIndex = dayOfYear % 30
```

**APIs called for the chosen ayah:**
```
GET https://api.alquran.cloud/v1/ayah/{verseKey}/editions/quran-uthmani,en.sahih
GET https://api.quran.com/api/v4/verses/by_key/{verseKey}?translations=108
```

**Cache key**: `@quran_daily_ayah_{year}_{month}_{day}` — one entry per calendar day, never expires (keeps that day's ayah stable).

**Returns**: `{ ayah: DailyAyah | null, loading: boolean, error: boolean }`

The 30-ayah pool includes well-known verses: Ayat al-Kursi (2:255), 13:28 (hearts at rest), 39:53 (do not despair), 94:5–6 (ease with hardship), 112:1, etc.

---

### 3.7 Dashboard Screen (`app/(tabs)/index.tsx`)

All sections are dynamic:

| Section | Dynamic source |
|---------|---------------|
| Greeting (Arabic + Nepali) | Computed from current hour |
| Continue Reading card | `lastRead` from QuranContext |
| Stat: 114 سूराहरू | Static |
| Stat: बुकमार्क | `bookmarks.length` from QuranContext |
| Stat: पठिएको | `readSurahIds.length` from QuranContext |
| Reading progress bar | `readSurahIds.length / 114 * 100%` |
| Featured Surahs scroll | Static list of 8 IDs [1,36,55,67,97,112,113,114] |
| आजको आयत (Daily Ayah) | `useDailyAyah()` hook — live API fetch |

**Greeting mapping:**

| Hour range | Nepali |
|-----------|--------|
| 0–4 | शुभ रात्री |
| 5–11 | शुभ प्रभात |
| 12–16 | शुभ दिउँसो |
| 17–19 | शुभ साँझ |
| 20–23 | शुभ रात्री |

---

### 3.8 Reader Screen (`app/reader/[id].tsx`)

- Accepts `id` (surah number) and optional `ayah` (ayah number for scroll) params
- Calls `fetchSurahAyahs(surahId)` on mount
- Shows load states: `loading` → spinner, `error` → retry button, `offline` → offline message
- Calls `markSurahRead(surahId)` on successful load
- Updates `lastRead` on scroll (via `onViewableItemsChanged`)
- FlatList renders `AyahCard` per ayah
- Basmala header is shown for all surahs except At-Tawbah (9) and Al-Fatiha (1)
- Respects `fontSize`, `showEnglish`, `showNepali` from context

---

### 3.9 Surah List Screen (`app/surahs.tsx`)

- Full list of 114 surahs via `SurahCard` component
- Live search by English name, Nepali name, or surah number
- Filter tabs: All / Meccan / Medinan
- Tapping a card navigates to `reader/[id]`

---

### 3.10 Bookmarks Screen (`app/bookmarks.tsx`)

- Lists all bookmarked ayahs from context
- Shows Arabic text, surah/ayah reference
- Tap to navigate to reader at that position
- Swipe or button to remove bookmark

---

### 3.11 Settings Screen (`app/settings.tsx`)

| Setting | Type | Default |
|---------|------|---------|
| नेपाली अनुवाद (Ahl Al-Hadith) | Toggle | On |
| English Translation (Sahih Int'l) | Toggle | On |
| Arabic Font Size | Slider (20–36pt) | 26pt |
| Dark Mode | Toggle | Off |

---

### 3.12 Theme & Colors (`constants/colors.ts`, `hooks/useTheme.ts`)

Emerald green Islamic color palette with full light/dark variants.

| Token | Light | Dark |
|-------|-------|------|
| `background` | `#f7f5f0` | `#0d1117` |
| `primary` | `#1b6b3a` | `#4caf70` |
| `card` | `#ffffff` | `#161b22` |
| `accent` | `#c9a84c` (gold) | `#d4a843` (gold) |
| `muted` | `#ede9e0` | `#1c2128` |
| `border` | `#ddd8cc` | `#30363d` |

`useTheme()` reads `darkMode` from `QuranContext` (user toggle), overriding the system color scheme.

---

### 3.13 Data Layer (`data/surahs.ts`, `data/ayahs.ts`)

#### `data/surahs.ts`
Static array of all 114 surahs. Each entry:
```ts
interface Surah {
  id: number;           // 1–114
  nameArabic: string;
  nameEnglish: string;
  nameNepali: string;
  meaning: string;      // English meaning
  totalAyahs: number;
  revelationType: "Meccan" | "Medinan";
  juz: number;          // 1–30
}
```

#### `data/ayahs.ts`
Exports the `Ayah` type used across the app. The local ayah data in this file is legacy and no longer used as a content source — all ayah content comes from the APIs.

---

## 4. Other Artifacts

### 4.1 API Server (`artifacts/api-server/`)
- Express 5 server, port 8080, routed at `/api`
- Drizzle ORM + PostgreSQL
- Not used by the Quran app (Quran app is fully client-side)

### 4.2 Mockup Sandbox (`artifacts/mockup-sandbox/`)
- Vite dev server for isolated component previews
- Used during design exploration on the canvas board
- Not part of the production Quran app

---

## 5. Workflows

| Workflow | Command | Status |
|----------|---------|--------|
| `artifacts/quran-app: expo` | `pnpm --filter @workspace/quran-app run dev` | Running |
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` | Running |
| `artifacts/mockup-sandbox: Component Preview Server` | `pnpm --filter @workspace/mockup-sandbox run dev` | Running |

---

## 6. Data Flow Diagram

```
User opens surah
       │
       ▼
reader/[id].tsx
       │
       ▼
fetchSurahAyahs(id)      ← services/quranApi.ts
       │
       ├─ AsyncStorage hit? ──YES──► return cached Ayah[]
       │
       NO
       │
       ├─ Parallel fetch:
       │   ├─ AlQuran Cloud → Arabic + English ayahs
       │   └─ Quran.com (ID 108) → Nepali translations
       │
       ▼
  Merge into Ayah[]
       │
       ├─ Save to AsyncStorage (TTL 7 days)
       │
       ▼
FlatList of AyahCard components
       │
       ├─ Arabic text (always shown)
       ├─ English text (if showEnglish)
       └─ Nepali text (if showNepali)
```

---

## 7. Key Design Decisions

1. **No backend** — all state is AsyncStorage. Simpler, works offline, no auth needed.
2. **Two APIs, one cache** — AlQuran Cloud (Arabic+English) and Quran.com (Nepali) are fetched in parallel and merged before caching, so subsequent loads only hit AsyncStorage.
3. **Cache key versioning** — key prefix `@quran_surah_v2_` ensures old cached data (v1, pre-Nepali) is ignored automatically.
4. **Daily ayah is deterministic** — same ayah all day for any user, no server needed. Rotates at midnight.
5. **Nepali as the unique differentiator** — the only Quran app targeting Nepali speakers. Translation sourced from the only Nepali translation on Quran.com (ID 108).
6. **Reading progress is local-only** — `readSurahIds` tracks which surahs have been opened; shown as a progress bar on the dashboard.
