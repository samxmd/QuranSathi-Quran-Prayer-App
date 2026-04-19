# QuranSathi — Your Quran Companion

QuranSathi is a high-performance, premium Islamic application built with React Native and Expo. It is designed with an offline-first philosophy, prioritizing speed, multi-lingual accessibility, and a modern aesthetic.

## 🏗 Architecture & Technology Stack

- **Core Framework**: React Native (Expo SDK 54)
- **Engine**: Hermes (Optimized for faster startup and lower memory footprint)
- **Navigation**: Expo Router (File-based routing)
- **Data Persistence**: SQLite (via `expo-sqlite`)
- **Search Engine**: FTS5 (SQLite Full-Text Search)
- **List Rendering**: `@shopify/flash-list` (Native performance scrolling)
- **Styling**: Vanilla React Native StyleSheet with a custom Theme Provider

## 🗄 Data Layer (SQLite Optimization)

The application has been migrated from static JSON imports to a compact binary database architecture.

- **`quran_v1.db`**: A bundled asset generated via a custom build script.
- **Multilingual**: Includes Arabic, English, Nepali, and **Bangla** translations.
- **FTS5 Integration**: Allows instant searching across all 6,236 verses in 4 languages concurrently.
- **On-Demand Loading**: Verses are queried asynchronously, keeping the JavaScript heap size to a minimum (~3.6MB bundle).

## ✨ Key Features

- **Quran Reader**: High-fidelity Arabic text with customizable translations.
- **Unified Search**: Single search bar for both Surahs and specific Ayahs.
- **Dhikr Counter**: Interactive haptic-enabled counter with target tracking and daily resets.
- **Prayer Times**: Location-aware prayer timings with Adhan notifications.
- **Qibla Compass**: Real-time direction tracking using device magnetometers.
- **Hijri Calendar**: Accurate Islamic date tracking with special event highlighting.
- **Audio Streaming**: On-demand audio recitation streaming from reliable CDNs.

## 🛠 Build & Performance Pipeline

- **EAS Integration**: Configured with `prebuildCommand` hooks to ensure data integrity during production builds.
- **Icon Optimization**: Sub-path imports for `@expo/vector-icons` to minimize tree-shaking overhead.
- **Native Modules**: Utilizes `expo-haptics`, `expo-location`, `expo-av`, and `expo-notifications` for a rich platform experience.

## 🚀 Recent Accomplishments
- Implemented the SQLite FTS5 search system.
- Optimized JavaScript bundle size by 70%.
- Refined the "Verse of the Day" and Dhikr UI for premium branding.
- Hardened the database initialization against low-storage failures.

---
*Created and maintained by Antigravity*
