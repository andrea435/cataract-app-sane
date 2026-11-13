# Cataract Screening: developer guide

Expo / React Native (TypeScript) app for community health workers doing field cataract
screening. It implements the `Cataract Screening App.dc.html` design in `../project/`.

Other docs: [closing the treatment gap](docs/impact.md) · [user guide](docs/user-guide.md) · [data model](docs/data-model.md) ·
[building the Android APK](docs/android-build.md).

## Stack

- **Expo SDK 57** (React Native 0.86, React 19). Expo changes between versions; check the
  [v57 docs](https://docs.expo.dev/versions/v57.0.0/) before adding or upgrading packages.
- `expo-camera` for capturing the eye photo, `expo-file-system` to read it for upload.
- `@react-navigation/native-stack` for the screen flow.
- `react-native-svg` for the probability ring and icons.
- `@expo-google-fonts/ibm-plex-sans`, the design's typeface.
- **Supabase** (`@supabase/supabase-js`) for scans, patients, clinics, worker settings and
  the `eye-captures` photo bucket. See [data model](docs/data-model.md).

## Running it

Requires Node 22.

```
npm install
npm start
```

Open the app in **Expo Go** on a physical phone by scanning the QR code (a real camera is
needed to capture images), or use `npm run android` / `npm run ios` with an emulator or
simulator. The iOS Simulator has no camera; the Android emulator's virtual camera works.

| Script | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` / `npm run ios` / `npm run web` | Start and open on that platform |
| `npm run build:apk` | Build a standalone release APK locally (needs the Android SDK) |
| `npm run build:apk:eas` | Build the APK in Expo's cloud (needs an Expo account) |

Standalone builds, signing and releases: [docs/android-build.md](docs/android-build.md).

### Configuration

`.env` (committed) holds `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
They are inlined into the JS bundle at build time, so changing them needs a rebuild. The
anon key is designed to be public; access is meant to be governed by Row Level Security.
To point the app at another Supabase project, change these two values.

## Screen flow

```
Health worker
Onboarding ─► Main (tabs: Scan · History · Clinics · Profile)
                │
                └─ Start new screening
                     PatientInfo ─► Capture ─► Scanning ─► Disclaimer ─► Result ─► Recommend
                                                                                     │
                                       Save without referring / Finish & save ◄──────┤
                                                       Refer to a clinic ─► Refer ◄──┘
History item ─► Result (view only, referral tracker or "Refer to a clinic" ─► Refer)
Clinics tab ─► ClinicForm (add / edit / remove, shows access code)

Clinic staff
Onboarding or Profile ─► ClinicSignIn ─► ClinicHome ─► ClinicReferral
(a phone signed in as a clinic starts on ClinicHome)
```

- **Onboarding**: three intro slides; Skip or Get started replaces it with Main.
- **Main**: hosts the four tabs and a custom `BottomTabBar`; the active tab lives in
  context (`activeTab`) so other screens can send the user to a specific tab. Pull down to
  reload; a banner with Retry appears when loading fails.
- **PatientInfo**: name, optional Patient ID, left/right eye.
- **Capture**: live camera with alignment ring; requests camera permission.
- **Scanning**: 2-second animation, then calls `computeCurrentResult`.
- **Disclaimer**: must tick "screening aid, not a diagnosis" to continue.
- **Result**: ring gauge, status, severity, photo. For saved scans it shows the patient's
  latest referral (clinic, Referred → Attended → Treated stepper, clinic note) or, when
  flagged and not yet referred, **Refer to a clinic**.
- **Recommend**: next steps (different lists for detected / clear). When detected:
  **Refer to a clinic** and **Save without referring**; otherwise **Finish & save**.
- **Refer**: pick a clinic, optional note, send. Saves an in-progress screening first.
- **ClinicForm**: add or edit a clinic, regenerate its access code, remove it.
- **ClinicSignIn**: choose a clinic and enter its 6-digit access code.
- **ClinicHome**: the clinic's referrals with Waiting / Attended / Treated counts and
  filters; live updates and pull to refresh.
- **ClinicReferral**: one referral with result, photo, worker note, status stepper,
  **Mark as attended / treated**, and clinic notes.

## How it works

`src/state/ScreeningContext.tsx` is the single source of state and all Supabase I/O:

- Loaded data: `history` (scans with their patient), `clinics`, `referrals` (with patient,
  scan and clinic name), `settings`, plus `loadError` for the retry banner. A realtime
  subscription reloads `referrals` whenever the table changes.
- `session`: `{ role: 'worker' }` or `{ role: 'clinic', clinicId }`, persisted by
  `src/state/session.ts` in a small JSON file so clinic staff stay signed in.
  `signInClinic()` / `signOut()` change it.
- The in-progress screening draft: patient name/ID, eye, disclaimer tick, photo URI.
- `computeCurrentResult()` produces the result to display. **Today it is a random
  probability (8–97%).** This is the function to replace when a real model is added.
- `finishAndSave()` upserts the patient, inserts the scan, uploads the photo, resets the
  draft, and returns the saved scan (used by Refer to attach the referral).
- `addClinic()`, `updateClinic()`, `deleteClinic()`, `sendReferral()`, `updateReferral()`
  return `{ ok, error }` so screens can show a message instead of failing silently.
  A database trigger mirrors the latest referral's status onto `patients.referral_status`.

Result classification is in `statusFields()` (`src/data/types.ts`): `< 50%` clear,
`50–64` Mild, `65–79` Moderate, `80+` Severe. Text content (onboarding, recommended
steps, disclaimer) is in `src/data/content.ts`.

## Project structure

```
App.tsx                      Fonts, splash screen, providers, navigator
app.json                     Expo config (app name, version, Android package, permissions)
eas.json                     EAS build profiles
plugins/withReleaseSigning.js  Adds Android release signing during prebuild
src/
  theme/colors.ts            Design colours (oklch from the design, converted to hex)
  data/                      Types, result classification, static content, stats, date formatting
  lib/supabase.ts            Supabase client and bucket name
  state/ScreeningContext.tsx Flow state and all Supabase reads/writes
  navigation/                Stack navigator and route types
  screens/                   One file per screen; screens/main/ holds the four tabs
  components/                Buttons, RingGauge, icons, Text (applies the font),
                             ui.tsx (status chip/stepper, segmented control, field, banner, empty state)
docs/                        User guide, data model, Android build guide
```

## Known limitations

- **Detection is mocked**: capture and saving are real, the score is random.
- **No authentication**: one implied worker (`worker_settings` row 1) and open RLS
  policies. Add real auth and per-row access rules before handling real patient data.
- **Clinic access codes are not real security**: the code is checked on the phone and
  is readable with the anon key. Use Supabase Auth for clinic staff before real data.
- Clinic distances are typed in, not computed from location; the Language, Sync data, Help & support and Log out
  settings are not wired up.
- No offline mode: screenings need a connection to save.
- There are no automated tests yet.
