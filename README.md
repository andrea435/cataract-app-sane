# Cataract Screening

A mobile app that helps community health workers screen patients for cataracts in the
field. The worker enters the patient's details, photographs the front of the eye with the
phone camera, and gets a cataract probability score, a suggested severity, and recommended
next steps. Every screening is saved to a shared history, patients flagged for cataract can
be referred to a nearby clinic, and their referral is tracked from **referred** to
**attended** to **treated**.

> **Screening aid, not a diagnosis.** The app is meant to help prioritise referrals. Every
> positive result must be confirmed by an ophthalmologist or trained eye care professional.
> In the current version the probability score is **simulated** (see
> [Current limitations](#current-limitations)).

## Documentation

| Document | For | What's in it |
| --- | --- | --- |
| [User guide](mobile/docs/user-guide.md) | Health workers, trainers | Installing the app and doing a screening step by step |
| [Developer guide](mobile/README.md) | Developers | Running the app, project structure, how data flows |
| [Data model](mobile/docs/data-model.md) | Developers | Supabase tables, storage bucket and access rules |
| [Building the Android APK](mobile/docs/android-build.md) | Developers, release managers | Producing and signing an installable APK, shipping updates |

## Repository layout

```
mobile/                 The app (Expo / React Native, TypeScript)
  docs/                 User guide, data model, Android build guide
supabase/migrations/    SQL migrations for the backend database
.github/workflows/      "Android APK" build on GitHub Actions
project/                Original HTML design prototype (and HANDOFF.md, the design handoff note)
chats/                  Design conversation that produced the prototype
```

## Quick start

```
cd mobile
npm install
npm start
```

Scan the QR code with Expo Go on a phone. To get a standalone app that installs like any
other, use **Actions → Android APK → Run workflow** on GitHub and download the APK from the
finished run. Details in [Building the Android APK](mobile/docs/android-build.md).

## Current limitations

- **The detection is simulated.** Camera capture, photo upload and saving are real, but the
  probability score is a random number generated on the phone. A trained model still needs
  to be plugged in.
- **No sign-in.** There is one implied health worker, and the database allows open read and
  write with the public key. Add authentication and per-user access rules before using the
  app with real patient data.
- **Clinic distances are fixed** sample values, not based on the phone's location.
- Profile items such as Language, Sync data, Help & support and Log out are visual only.
