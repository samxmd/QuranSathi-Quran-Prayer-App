# Quran App - System Overview

> Last updated: April 18, 2026

## 1. Purpose

This repository is a `pnpm` monorepo centered on a multilingual Quran app for Nepali-speaking users, with English and Bangla support across Quran reading and selected UI surfaces.

The product focus is the Expo mobile app in `artifacts/quran-app`. The repo also contains a backend scaffold, shared API libraries, and a web mockup sandbox, but the Quran app is currently the primary runtime and the main source of product value.

Current app capabilities include:

- Quran reading with Arabic text plus English, Nepali, and Bangla translations
- Local-first reading with bundled fallback data
- Ayah bookmarking and continue-reading persistence
- Daily ayah
- Prayer times and local prayer notifications
- Qibla finder
- Dua collection and dua bookmarking
- Hijri calendar screen
- Tafsir Hub for Ibn Kathir commentary
- Audio playback with multiple reciters
- Local telemetry and graceful fallback behavior

## 2. Monorepo Layout

```text
D:\Quran-Nepali-English
|- artifacts/
|  |- quran-app/         # Expo / React Native application
|  |- api-server/        # Express 5 backend scaffold
|  `- mockup-sandbox/    # Vite + React UI sandbox
|- lib/
|  |- api-client-react/  # Shared React API client package
|  |- api-spec/          # OpenAPI/codegen source
|  |- api-zod/           # Shared Zod API schemas
|  `- db/                # Shared Drizzle ORM package
|- scripts/              # Workspace helper scripts
|- pnpm-workspace.yaml   # Workspace + catalog + supply-chain policy
|- pnpm-lock.yaml        # Root workspace lockfile
|- SYSTEM_OVERVIEW.md    # This file
`- replit.md             # Project memory / summary
```

## 3. Workspace Tooling

| Area            | Current setup                                        |
| --------------- | ---------------------------------------------------- |
| Package manager | `pnpm@10.33.0`                                       |
| Language        | TypeScript `~5.9.2`                                  |
| Root scripts    | `pnpm run build`, `pnpm run typecheck`               |
| Workspace mode  | Monorepo with `artifacts/*`, `lib/*`, `scripts`      |
| Security policy | `minimumReleaseAge` enabled in `pnpm-workspace.yaml` |

Notable workspace behavior:

- The root `preinstall` script enforces `pnpm` and removes `package-lock.json` / `yarn.lock`.
- Package versions for common libraries are centralized via the workspace `catalog`.
- The workspace uses a supply-chain delay policy through `minimumReleaseAge`.

## 4. Primary App: `artifacts/quran-app`

### 4.1 Stack

| Layer              | Technology                                                               |
| ------------------ | ------------------------------------------------------------------------ |
| Framework          | Expo SDK 54                                                              |
| App router         | Expo Router                                                              |
| UI runtime         | React 19.1 + React Native 0.81.5                                         |
| Build config       | `app.json`, `eas.json`, Babel preset Expo                                |
| State              | React Context + AsyncStorage                                             |
| Lists              | FlashList                                                                |
| Audio              | `expo-av`                                                                |
| Location           | `expo-location`                                                          |
| Notifications      | `expo-notifications`                                                     |
| Styling            | React Native styles + gradients + blur                                   |
| Visual effects     | `expo-linear-gradient`, `expo-blur`, `expo-glass-effect`, `expo-symbols` |
| Fonts              | Inter via `@expo-google-fonts/inter`                                     |
| Prayer calculation | `adhan`                                                                  |

### 4.2 Current App File Structure

```text
artifacts/quran-app/
|- app/
|  |- _layout.tsx
|  |- +not-found.tsx
|  |- bookmarks.tsx
|  |- dhikr.tsx
|  |- duas.tsx
|  |- favorites.tsx
|  |- hijri.tsx
|  |- juz.tsx
|  |- qibla.tsx
|  |- search.tsx
|  |- settings.tsx
|  |- tafsir.tsx
|  |- reader/[id].tsx
|  `- (tabs)/
|     |- _layout.tsx
|     |- audio.tsx
|     |- index.tsx
|     |- prayer.tsx
|     |- surahs.tsx
|     `- utilities.tsx
|- components/
|- constants/
|- context/
|- data/
|- hooks/
|- services/
|- utils/
|- assets/
|- package.json
|- app.json
`- eas.json
```

## 5. Navigation Model

### 5.1 Root stack

Defined in `artifacts/quran-app/app/_layout.tsx`.

Main stack entries:

- `(tabs)` - main application shell
- `duas`
- `dhikr`
- `hijri`
- `tafsir`
- `reader/[id]`
- `bookmarks`
- `juz`
- `settings`
- `qibla`
- `favorites`
- `search`

Cross-cutting wrappers at the root:

- `SafeAreaProvider`
- `ErrorBoundary`
- `GestureHandlerRootView`
- `KeyboardProvider`
- `QuranProvider`

### 5.2 Tab layout

Defined in `artifacts/quran-app/app/(tabs)/_layout.tsx`.

Primary tabs:

- `index` - home dashboard
- `surahs` - Quran directory
- `audio` - audio player and reciter flow
- `prayer` - prayer times and notification controls
- `utilities` - Islamic tools hub

Hidden tab routes:

- `favorites`
- `qibla`

Behavior:

- On supported iOS environments with liquid glass available, the app uses `unstable-native-tabs`.
- Otherwise it falls back to a classic Expo Router `Tabs` implementation with blur on iOS and standard themed tabs elsewhere.

## 6. Global State and Persistence

Global app state lives in `artifacts/quran-app/context/QuranContext.tsx`.

### 6.1 Persisted state

| State                 | Storage key                                 | Purpose                         |
| --------------------- | ------------------------------------------- | ------------------------------- |
| Ayah bookmarks        | `@quran_bookmarks`                          | Saved ayahs                     |
| Dua bookmarks         | `@dua_bookmarks`                            | Saved duas                      |
| Last read             | `@quran_last_read`                          | Reader resume point             |
| Font size             | `@quran_font_size`                          | Reader Arabic text sizing       |
| UI language           | `@quran_ui_language`                        | App chrome localization         |
| Enabled translations  | `@quran_enabled_languages`                  | Reader translation toggles      |
| Legacy migration keys | `@quran_show_nepali`, `@quran_show_english` | Migrated into enabled languages |
| Dark mode             | `@quran_dark_mode`                          | Manual theme override           |
| Read surahs           | `@quran_read_surahs`                        | Progress tracking               |
| Streak                | `@quran_streak`                             | Daily reading streak            |
| Streak date           | `@quran_streak_date`                        | Last counted streak day         |
| Default reciter       | `@quran_default_reciter`                    | Preferred audio reciter         |

### 6.2 Current context responsibilities

- Bookmark add/remove with deduplication
- Dua bookmark add/remove
- Continue-reading persistence
- Enabled translation selection with migration logic
- Manual dark mode toggle
- Surah read/unread tracking
- Reading streak rollover on load
- Default reciter persistence
- Local telemetry hooks for important user actions and failures

## 7. Quran Content Architecture

### 7.1 Ayah data shape

Current ayah objects use a translation map:

```ts
interface Ayah {
  id: string;
  surahId: number;
  ayahNumber: number;
  arabic: string;
  translations: Record<string, string>;
}
```

### 7.2 Translation sources

Defined in `artifacts/quran-app/services/translationSources.ts`.

| Language | Source                               |
| -------- | ------------------------------------ |
| English  | AlQuran Cloud `en.sahih`             |
| Nepali   | Quran.com translation resource `108` |
| Bangla   | Quran.com translation resource `161` |

Arabic text is also sourced through the Quran fetch layer.

### 7.3 Offline-first strategy

The app is local-first for Quran reading.

Current design:

- Large bundled fallback data still exists in `data/offlineQuran.ts`
- App code now loads bundled data through `data/offlineQuranLoader.ts`
- The loader lazy-imports the offline Quran module instead of directly importing it into all consumers
- Quran reading and daily ayah depend on the async loader layer

This reduces hot-path bundle pressure compared with direct static imports, while preserving the current offline fallback behavior.

### 7.4 Quran fetch flow

Implemented in `artifacts/quran-app/services/quranApi.ts`.

High-level flow:

1. Resolve bundled fallback ayahs through `offlineQuranLoader`
2. Check in-memory cache
3. Check AsyncStorage overlay cache
4. Fetch remote Arabic + English via AlQuran Cloud if needed
5. Fetch remote Nepali/Bangla translations from Quran.com
6. Merge remote data over bundled fallback
7. Persist only overlay differences
8. Return normalized ayahs with all configured translation keys present

### 7.5 Caching model

Current cache details:

- In-memory per-surah cache
- In-flight request deduplication
- AsyncStorage overlay cache
- Cache version: `4`
- Max persisted surahs: `24`

This means the app avoids repeatedly storing entire surah payloads when bundled fallback already exists.

## 8. Main User Flows

### 8.1 Home dashboard

Implemented in `artifacts/quran-app/app/(tabs)/index.tsx`.

The current home screen includes:

- Time-based localized greeting
- Centered hero header with Bismillah
- Hijri date chip
- Reading streak chip
- Search entry
- Next prayer card with countdown
- Continue reading card
- Progress tracker
- Quick access cards
- Daily ayah card
- Featured surahs carousel

Home also prefetches likely next surahs based on last-read position and featured picks.

### 8.2 Quran directory

Implemented in `artifacts/quran-app/app/(tabs)/surahs.tsx`.

Capabilities:

- Search/filter over all surahs
- Open reader by surah
- Mark surahs read/unread
- FlashList rendering for scalable scrolling

### 8.3 Reader

Implemented in `artifacts/quran-app/app/reader/[id].tsx`.

Responsibilities:

- Load surah content through the local-first Quran API
- Mark a surah as read
- Persist last-read position
- Render Arabic + enabled translations
- Respect font size and translation preferences
- Refresh remote text when requested
- Support ayah playback and sequential playback
- Integrate bookmarking

### 8.4 Audio tab

Implemented in `artifacts/quran-app/app/(tabs)/audio.tsx`.

Current audio flow:

- Search/select surah
- Start playback from ayah 1
- Continue verse-by-verse playback
- Track current ayah and playback state
- Show reciter and transport controls
- Persist bookmark interactions through shared state

### 8.5 Tafsir Hub

Implemented in `artifacts/quran-app/app/tafsir.tsx`.

Current tafsir UX:

- Surah selection
- Ayah selection grid
- Immediate transition to tafsir reading on ayah tap
- Fetch Ibn Kathir commentary via `tafsirService`
- Graceful loading and retry states

Formatting cleanup for HTML-derived tafsir text is handled in `artifacts/quran-app/services/tafsirService.ts`.

### 8.6 Prayer times

Implemented through:

- `app/(tabs)/prayer.tsx`
- `hooks/usePrayerTimes.ts`
- `services/notificationService.ts`

Capabilities:

- Resolve current location
- Compute prayer times with `adhan`
- Show current/next prayer
- Countdown to next prayer
- Toggle per-prayer local notifications
- Reschedule notification batches locally on device

Current notification strategy:

- Local notifications only
- No remote push backend dependency
- Schedules the next 7 days of enabled prayer alerts

### 8.7 Qibla

Available via `app/qibla.tsx`.

Responsibilities:

- Determine user location
- Compute bearing to the Kaaba
- Use heading when available to orient UI

### 8.8 Duas and dhikr

Current Islamic practice content is split across:

- `app/duas.tsx`
- `app/dhikr.tsx`
- `data/duas.ts`

Capabilities:

- Local curated content
- Bookmarking
- Copy/share interactions
- Daily-practice oriented browsing

### 8.9 Hijri

Available at `app/hijri.tsx` with helper logic in `utils/hijriCalendar`.

Purpose:

- Show Hijri month/date context
- Surface Islamic event labels used elsewhere in the app

### 8.10 Utilities hub

Implemented in `app/(tabs)/utilities.tsx`.

Current utilities surface links to:

- Qibla
- Daily duas
- Favorites/bookmarks
- Settings
- Hijri calendar
- Tafsir Hub

## 9. Daily Ayah

Implemented in `artifacts/quran-app/hooks/useDailyAyah.ts`.

Current behavior:

- Uses a curated pool of ayah references
- Selects the ayah by day-of-year modulo pool size
- Resolves the ayah through the offline Quran loader
- Stores the daily result in AsyncStorage
- Returns Arabic, English, Nepali, and Bangla values when available

This is local-first and no longer requires a fresh network call for normal operation.

## 10. Audio Architecture

Implemented through:

- `services/audioService.ts`
- `hooks/useAudio.ts`

### 10.1 Current reciters

- Mishary Alafasy
- Abdul Basit
- Ali Al-Hudhaify
- Maher Al-Muaiqly

### 10.2 Audio source strategy

Primary source:

- `everyayah.com`

Optional backup source:

- `cdn.islamic.network`

### 10.3 Playback behavior

- Multiple URL fallback per ayah
- Current ayah tracking
- Play/pause/resume/stop
- Sequential verse progression
- Shared reciter model across the app

## 11. Theme and Localization

### 11.1 Theme

Current theme layers:

- `constants/colors.ts`
- `hooks/useTheme.ts`
- `hooks/useColors.ts`

Design direction remains:

- Emerald/green primary palette
- Gold secondary accent
- Light/dark variants
- Manual dark-mode persistence

### 11.2 Localization

UI copy lives in `artifacts/quran-app/services/i18n.ts`.

Current UI languages:

- English
- Nepali
- Bangla

This is separate from reader translation enablement, which is controlled by `enabledLanguages`.

## 12. Error Handling and Telemetry

### 12.1 Error handling

- App rendering is wrapped by `ErrorBoundary`
- Reader and tafsir have visible fallback states
- Quran fetch pipeline gracefully falls back to bundled content
- Audio failures are surfaced in the UI instead of crashing the app

### 12.2 Telemetry

Defined in `artifacts/quran-app/services/telemetry.ts`.

Current telemetry posture:

- Local-only event/error storage
- No remote observability backend
- Debug-oriented instrumentation for failures and key actions

## 13. Expo Build and Runtime Status

### 13.1 Current config

Relevant files:

- `artifacts/quran-app/app.json`
- `artifacts/quran-app/eas.json`

Current Expo identity:

- App name: `NurQuran`
- Slug: `quran-app`
- Android package: `com.nepaliquran.app`
- iOS bundle identifier: `com.nepaliquran.app`
- EAS project ID present

### 13.2 Build profiles

Current `eas.json` profiles:

- `development` - internal dev client
- `preview` - internal Android APK
- `production` - Android app bundle

### 13.3 Current build notes

As of this update:

- `pnpm --dir artifacts/quran-app typecheck` passes
- `npx expo config --type public` resolves successfully
- Expo build readiness improved after removing the `FlashList` typing blocker
- The workspace still depends on the root `pnpm-lock.yaml`, so `package.json` and the lockfile must remain aligned for EAS frozen installs

## 14. Secondary Artifacts

### 14.1 API server

`artifacts/api-server`

Current status:

- Express 5
- TypeScript + esbuild build step
- Uses `cors`, `cookie-parser`, `pino`, `pino-http`
- Depends on shared DB and Zod packages

This backend is currently not on the critical path for the Quran app’s reading, prayer, or bookmark flows.

### 14.2 Mockup sandbox

`artifacts/mockup-sandbox`

Current role:

- Vite + React design sandbox
- Rich component/dev playground
- Not part of the production Expo runtime

## 15. Shared Libraries

### 15.1 `lib/api-client-react`

- Shared React API client package
- Depends on TanStack Query

### 15.2 `lib/api-zod`

- Shared Zod schema package

### 15.3 `lib/db`

- Drizzle ORM + PostgreSQL shared package
- Exposes schema and DB entry points

### 15.4 `lib/api-spec`

- OpenAPI source + Orval codegen entry point

## 16. Current Architectural Decisions

1. The Expo app is still the product center of gravity.
2. Quran reading is local-first, with remote overlays improving bundled data.
3. Translation support is extensible through a translation map rather than fixed language fields.
4. User state is fully local: no auth, no cloud sync, no mandatory backend dependency.
5. Prayer alerts are local scheduled notifications.
6. Telemetry is local-only and primarily operational/debugging support.
7. The route surface has expanded beyond basic reading into a broader Islamic utility app.

## 17. Current Watchouts

- `SYSTEM_OVERVIEW.md` should be refreshed whenever route structure changes again, especially around tabs or tools.
- `artifacts/quran-app/data/offlineQuran.ts` remains very large and is still a significant footprint driver even though access is now routed through a lazy loader.
- `package.json` and `pnpm-lock.yaml` must stay synchronized for EAS builds using frozen lockfiles.
- Some files still contain mojibake/encoding artifacts in string literals or comments from earlier edits; behavior is mostly fine, but cleanup would improve maintainability.
