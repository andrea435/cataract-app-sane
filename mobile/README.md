# Cataract Screening — mobile app

Expo / React Native implementation of the `Cataract Screening App.dc.html` design
(from `../project/`), built for community health workers doing field eye screening.

## Stack

- **Expo (React Native, TypeScript)** — `expo-camera` for the real device camera capture,
  `@react-navigation/native-stack` for the screen flow, `react-native-svg` for the ring
  gauge and icons, `@expo-google-fonts/ibm-plex-sans` for the design's typeface.
- **Supabase** — a dedicated project (`cataract-screening-app`) backs scan history,
  referral clinics, and worker settings. Schema: `scans`, `clinics`, `worker_settings`
  tables, plus a public `eye-captures` storage bucket for captured eye photos.

## Running it

```
npm install
npm start
```

Then open in Expo Go on a physical device (needed for the real camera), or run
`npm run android` / `npm run ios` with a simulator/emulator — note iOS Simulator has no
camera, so use a physical device or Android emulator's virtual camera to test capture.

`.env` already contains the Supabase project URL and anon (public) key needed to run out
of the box — these are safe to ship client-side, access is meant to be governed by RLS.

## Standalone Android APK

To build an installable APK that runs without Expo Go, see
[docs/android-build.md](docs/android-build.md). Short version: run the **Android APK**
GitHub Action, or `npm run build:apk` locally, or `npx eas-cli build -p android --profile preview`.

## Known scope limitations (by design, for this iteration)

- **No authentication.** There's a single implied worker (seeded in `worker_settings`),
  and Supabase RLS policies currently allow open read/write from the anon key. Fine for a
  prototype; **add real auth + row-level scoping before this touches real patient data.**
- **The cataract detection itself is mocked** — capture and Supabase persistence are real,
  but the probability score is still randomly generated client-side (`computeCurrentResult`
  in `src/state/ScreeningContext.tsx`), matching the original design. Wiring an actual ML
  model is a separate follow-up.
- Clinic "distance" values are static seed data (no real geolocation).

## Structure

```
src/
  theme/colors.ts       oklch(...) values from the design, converted to hex 1:1
  data/                 types, status/severity logic, seed content, stats
  lib/supabase.ts       Supabase client
  state/ScreeningContext.tsx   flow state + all Supabase reads/writes
  navigation/           stack navigator + route types
  screens/              one file per design screen; screens/main/ holds the 4 tabs
  components/           shared Button/RingGauge/icon/Text primitives
```
