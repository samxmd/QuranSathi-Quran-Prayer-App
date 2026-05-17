# Android Release

This app is currently shipping on Android first.

## Source of Truth

- App config: `artifacts/quran-app/app.json`
- EAS build profiles: `artifacts/quran-app/eas.json`
- Root `eas.json` is intentionally minimal and should not be used as the Android release profile file.

## Commands

From the workspace root:

```bash
pnpm android:preview
pnpm android:release
pnpm android:submit
```

From `artifacts/quran-app` directly:

```bash
pnpm run android:preview
pnpm run android:release
pnpm run android:submit
```

or:

```bash
eas build --platform android --profile preview
eas build --platform android --profile production
eas submit --platform android --profile production
```

## What Each Command Does

- `preview`: creates an internal `.apk` build for device testing
- `production`: creates an `.aab` build for Google Play
- `submit`: submits the production Android build to Play Console

## Pre-Release Checklist

1. Run `pnpm --filter @workspace/quransathi run typecheck`.
2. Confirm `artifacts/quran-app/app.json` has the correct `version` and `android.versionCode`.
3. Confirm `artifacts/quran-app/google-services.json` matches the Android package name.
4. Test startup, onboarding, reader, audio playback, prayer times, notifications, bookmarks, and translation download on a physical Android device.
5. Build a preview APK before creating the production bundle.

## Notes

- iOS release work can be added later without changing the Android workflow above.
- Both `preview` and `production` EAS profiles set `SENTRY_DISABLE_AUTO_UPLOAD=true` so Android builds do not fail when Sentry auth is missing or expired.
- If you want Sentry source maps uploaded during release builds, add a valid auth token in EAS secrets and remove that env override from `artifacts/quran-app/eas.json`.
