# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9

## Artifacts

### Quran App (Mobile - Expo)

- **Path**: `artifacts/quran-app/`
- **Preview**: `/` (root path)
- **Tech**: React Native + Expo Router
- **Storage**: AsyncStorage only (no backend)

#### Features

- Arabic Quran text (Uthmani script) via AlQuran Cloud API
- English translation (Sahih International) via AlQuran Cloud API
- Nepali translation (Ahl Al-Hadith Central Society of Nepal, Quran.com ID 108) — all 114 surahs
- All 114 surahs list with search + Meccan/Medinan filter
- Full ayah reader with loading/error/offline states
- Bookmark system (AsyncStorage)
- Last read tracking with "Continue Reading" on dashboard
- Reading progress tracking (readSurahIds persisted)
- Dynamic daily ayah (30-ayah rotating pool, fetched live, cached per day)
- Time-based Nepali greeting on dashboard
- Adjustable Arabic font size (20–36pt)
- Toggle English/Nepali translations independently
- Dark mode support (toggle, not system-following)
- Emerald green Islamic color theme (light + dark)

#### API Integration

- AlQuran Cloud: `GET /surah/{id}/editions/quran-uthmani,en.sahih`
- Quran.com: `GET /quran/translations/108?chapter_number={id}`
- Both fetched in parallel, merged, cached (7-day TTL, key `@quran_surah_v2_{id}`)

#### Key Files

- `services/quranApi.ts` — API fetch + AsyncStorage cache logic
- `context/QuranContext.tsx` — global state (bookmarks, lastRead, readSurahIds, settings)
- `hooks/useDailyAyah.ts` — daily rotating ayah hook
- `hooks/useTheme.ts` — theme colors from context darkMode toggle
- `data/surahs.ts` — static metadata for all 114 surahs
- `app/(tabs)/index.tsx` — dashboard (dynamic greeting, progress, daily ayah)
- `app/reader/[id].tsx` — surah reader
- `constants/colors.ts` — light/dark color tokens

### API Server

- **Path**: `artifacts/api-server/`
- **Port**: 8080 (routed via `/api`)
- Not used by Quran app

### Canvas / Mockup Sandbox

- **Path**: `artifacts/mockup-sandbox/`
- **Preview**: `/__mockup`
- Design tool only

## Detailed Documentation

See `SYSTEM_OVERVIEW.md` for a full technical breakdown of every screen, data flow, API, caching strategy, and design decisions.
