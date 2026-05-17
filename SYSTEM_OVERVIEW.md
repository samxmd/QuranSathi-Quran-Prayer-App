# QuranSathi - System Overview (Android Release Track v1.0.5)

> Last updated: May 17, 2026
> Status: **ANDROID PRODUCTION RELEASED**

## 1. Purpose
QuranSathi is a high-performance Islamic application designed for a global audience with a South Asian focus. It prioritizes speed, scholarly accuracy, and habit reinforcement through strong data design and localized UX.

---

## 2. Technical Stack (v3.3)

| Layer | Technology | Status |
| :--- | :--- | :--- |
| **Framework** | Expo SDK 55 (React Native 0.83.6) | Active, patched |
| **Engine** | Hermes | Optimized |
| **UI Framework** | Vanilla React Native + LayoutAnimation | Fluid UI |
| **Data Layer** | Hybrid: SQLite (Native) + Cloud API (Web) | Hybrid enabled |
| **Observability** | Sentry (Error Tracking & Performance) | Fully integrated |
| **Localization** | i18n-js + custom translation engine | 6-language support |

---

## 3. UI/UX Architecture (v3.3 Standard)

### 3.1 Unified Design Language
- **PageHeader Component**: A standardized, high-detail header used across all secondary screens. It incorporates traditional Islamic geometry while maintaining safe-area navigation.
- **LayoutAnimation Engine**: Integrated into sensitive UI flows such as journal deletion to preserve a fluid experience on both iOS and Android.

### 3.2 Intelligent Dashboard
- **Priority Hierarchy**: The dashboard leads with **Daily Ayah** inspiration, followed by a consolidated **My Journey** section.
- **Consolidated Progress**: "Last Read" and "Goal Progress" are merged into a single actionable hub to reduce cognitive load.

---

## 4. Key Feature Map (Production Phase)

### Spiritual Hub and Journaling
- **Mood Discovery**: Algorithmic mapping of user emotions to relevant Quranic verses.
- **Gratitude Journal**: An offline-first journal with persistent storage and smooth entry management.

### Global Localization Engine
- **Full UI Chrome**: Complete onboarding and UI support for English, Nepali, Bangla, Hindi, Urdu, and Arabic.
- **Reader Translations**: Offline translations for Arabic, English, Nepali, and Bangla, with Hindi and Urdu available through the cloud API path.
- **On-Demand Translation Downloads**: Additional AlQuran.cloud translation editions can be downloaded, registered, enabled, disabled, and removed from Settings.
- **Fast Translation Catalogue**: The translation picker opens instantly with a curated starter list, reuses a 24-hour cached full catalogue when available, and fetches the full catalogue only after the user requests it. Full catalogue requests use an 8-second timeout to avoid blocking the modal.

### Habit Persistence (The Pulse)
- **AppState Tracker**: A centralized timer in `QuranContext` monitors foreground application usage.
- **Multi-Session Calculation**: Usage time is persisted and accumulated across multiple opens in a single day.
- **Hasanat Gamification**: Real-time spiritual reward tracking (10 Hasanat per letter) with progress visualization on the Home screen.

### Spiritual Productivity
- **Live Prayer System**: Real-time `HH:MM:SS` countdowns help users track the next salah.
- **Reading Planner**: Detailed goal tracking with surah completion rings and habit streaks.
- **Tajweed Engine**: Integrated color-coded tajweed rules for Arabic Uthmani script.

### Multimedia and Sharing
- **Background Audio**: Streaming engine with persistent background playback support.
- **Ayah Image Sharing**: Share sheet for exporting verses as high-quality images.

---

## 5. Deployment and Identity

### Android Build Pipeline (v1.0.5)
- **Version Control**: `app.json` and `android/app/build.gradle` are synced to version `1.0.5`, versionCode `6`. (Note: Native Android builds prioritize `build.gradle` for version numbers over `app.json`).
- **Dynamic Splash Screen**: App version is dynamically pulled using `expo-application` inside `LoadingScreen.tsx`.
- **Android Keystore**: EAS Production build is configured to use the local `release.keystore` via `credentials.json` and `eas.json` (`"credentialsSource": "local"`) to ensure matching SHA1 signatures for Google Play.
- **Dependencies**: Expo SDK 55 versions rigidly synchronized via `npx expo install --fix` and locked in `pnpm-lock.yaml`.
- **EAS Profiles**: `preview` is configured for `.apk` internal distribution, and `production` is configured for `.aab` Google Play distribution.
- **Primary Commands**: Use `pnpm run android:preview` and `pnpm run android:release` from the `artifacts/quran-app` directory.
- **Build Size Optimization**: `.easignore` file explicitly excludes large artifacts (`node_modules`, `build`, `.gradle`) to maintain lightweight build uploads.

---

## 6. Technical Maintenance Notes

1. **Cache Management**: The "Clear Cache" feature in Settings resets surah `AsyncStorage` overlays and in-memory reader caches.
2. **Privacy**: The app is anonymous and offline-first. Personal user data is not stored on external servers; bookmarks and history remain on-device.
3. **Performance**: `@shopify/flash-list` is used for the ayah list to keep scrolling stable.
4. **Translation Catalogue Performance**: `translationDownloadService.fetchAvailableEditions({ allowNetwork: false })` supports cache-only reads so the translation modal can render without a network wait. Network catalogue fetches remain available through the explicit "Full catalog" action.

---
