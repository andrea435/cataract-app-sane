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
anon key is designed to be public; access is governed by Supabase Auth and Row Level
Security (see [docs/data-model.md](docs/data-model.md#access-control)). Account creation
runs in the `manage-accounts` Edge Function (`../supabase/functions/`).
To point the app at another Supabase project, change these two values.

## Screen flow

```
Health worker (after sign-in)
Main (tabs: Scan · History · Clinics · Profile)
                │
                └─ Start new screening
                     PatientInfo ─► Capture ─► Scanning ─► Disclaimer ─► Result ─► Recommend
                                                                                     │
                                       Save without referring / Finish & save ◄──────┤
                                                       Refer to a clinic ─► Refer ◄──┘
History item ─► Result (view only, referral tracker or "Refer to a clinic" ─► Refer)
Clinics tab ─► ClinicForm (add / edit / remove, clinic logins) ─► AddAccount
Profile ─► Team (health workers) ─► AddAccount

Signed out
Onboarding ─► SignIn (─► Setup, only while no accounts exist)

Clinic staff
ClinicHome ─► ClinicReferral
```

`RootNavigator` renders one of three screen groups depending on who is signed in
(`profile` in context): signed out, health worker or clinic staff. Signing in or out swaps
the group, so nobody can navigate into the other role's screens.

- **Onboarding**: three intro slides, shown when signed out; Skip or Get started goes to SignIn.
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
- **ClinicForm**: add or edit a clinic, list, add and remove its staff logins, remove it.
- **SignIn** / **Setup**: email and password sign-in; Setup creates the first admin
  account and is offered only while no accounts exist.
- **Team**: health workers; admins add and remove them.
- **AddAccount**: create a worker or clinic login with a suggested temporary password,
  then show the details to pass on.
- **ClinicHome**: the clinic's referrals with Waiting / Attended / Treated counts and
  filters; live updates and pull to refresh.
- **ClinicReferral**: one referral with result, photo, worker note, status stepper,
  **Mark as attended / treated**, and clinic notes.

## How it works

`src/state/ScreeningContext.tsx` is the single source of state and all Supabase I/O:

- Loaded data: `history` (scans with their patient), `clinics`, `referrals` (with patient,
  scan and clinic name), `settings`, plus `loadError` for the retry banner. A realtime
  subscription reloads `referrals` whenever the table changes.
- Sign-in: `authReady`, `profile`, `signIn()`, `signOut()`, `setupFirstAccount()`. The
  Supabase session is persisted by `src/lib/authStorage.ts` (files in the app's document
  folder; `localStorage` on web). `App.tsx` keeps the splash screen up until the saved
  session has been checked.
- Accounts: `accounts` (all profiles, for workers), `createWorker()`,
  `createClinicLogin()`, `removeAccount()`, all via the `manage-accounts` Edge Function
  (`manageAccounts()` in `src/lib/supabase.ts`).
- Photos: the bucket is private; `photoUrlFor(path)` returns a signed link fetched in bulk
  after each load.
- The in-progress screening draft: patient name/ID, eye, disclaimer tick, photo URI.
- `computeCurrentResult()` produces the result to display. **Today it is a random
  probability (8–97%).** This is the function to replace when a real model is added.
- `finishAndSave()` puts the screening in the offline outbox (below), resets the draft,
  waits up to 8 seconds for it to upload, and returns the scan (still `pending` if it
  hasn't uploaded; used by Refer to attach the referral).
- **Offline mode** (`src/state/outbox.ts`, `src/lib/localStore.ts`). New screenings and
  referrals are written to an outbox on the phone (`outbox-<user id>.json` in the app's
  document folder, photos copied to `outbox-photos/`) and uploaded oldest first by
  `syncNow()`: on save, after each successful refresh, every 30 seconds while anything is
  waiting or the last load failed, and when the app returns to the foreground. Ids are made
  on the phone, so a retried upload never duplicates a row (a `23505` means an earlier try
  got through). A run stops at the first connection error so a referral never overtakes its
  screening; a job the server refuses stays in the outbox with its `error`. Waiting items
  are merged into `history` / `referrals` with `pending: true`, and `sync` exposes the
  counts for the banners. The last data loaded is cached per user (`cache-<user id>.json`)
  so the app opens offline. When the access token has expired offline, Supabase reports no
  session; the app then uses the user id of the saved session (`storedSessionUserId()`)
  and does no network reads until the token renews, so the cache isn't overwritten with an
  anonymous (empty) answer.
- `addClinic()`, `updateClinic()`, `deleteClinic()`, `sendReferral()`, `updateReferral()`
  return `{ ok, error }` so screens can show a message instead of failing silently.
  `sendReferral()` also goes through the outbox and reports `queued` when it is waiting.
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
  lib/localStore.ts          JSON files and photo copies on the phone (offline mode)
  state/ScreeningContext.tsx Flow state and all Supabase reads/writes
  state/outbox.ts            Offline outbox: upload of waiting screenings and referrals
  navigation/                Stack navigator and route types
  screens/                   One file per screen; screens/main/ holds the four tabs
  components/                Buttons, RingGauge, icons, Text (applies the font),
                             ui.tsx (status chip/stepper, segmented control, field, banner, empty state)
docs/                        User guide, data model, Android build guide
```

## Known limitations

- **Detection is mocked**: capture and saving are real, the score is random.
- **No self-service password reset**: a lost password means removing the login and
  creating a new one. All health workers can see all patients (no per-programme split).
- Clinic distances are typed in, not computed from location; the Language and Help & support
  settings are not wired up.
- Offline mode covers new screenings and referrals. Adding or editing clinics and logins,
  changing a referral's status and clinic notes still need a connection, and signing in
  needs one.
- There are no automated tests yet.
