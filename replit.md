# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Quran App (Mobile - Expo)
- **Path**: `artifacts/quran-app/`
- **Preview**: `/` (root path)
- **Tech**: React Native + Expo Router
- **Storage**: AsyncStorage (no backend needed)

#### Features
- Arabic Quran text display
- English translation (Sahih International)
- Nepali translation (unique feature)
- All 114 Surah list with search + filter (Meccan/Medinan)
- Full ayah reader with Basmala header
- Bookmark system (persistent via AsyncStorage)
- Last read tracking
- Adjustable Arabic font size (20–36pt)
- Toggle English/Nepali translations independently
- Dark mode support
- Emerald green Islamic color theme

#### Data
- All 114 surahs with Arabic/English/Nepali names and metadata
- Full ayah data for: Al-Fatiha (1), Ar-Rahman (55, partial), Al-Mulk (67, partial), Al-Qadr (97), Al-Ikhlas (112), Al-Falaq (113), An-Nas (114)
- Remaining surahs show a "coming soon" placeholder until full data is integrated

### API Server
- **Path**: `artifacts/api-server/`
- **Port**: 8080 (routed via `/api`)

### Canvas / Mockup Sandbox
- **Path**: `artifacts/mockup-sandbox/`
- **Preview**: `/__mockup`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
