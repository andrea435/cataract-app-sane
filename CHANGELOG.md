# What's changed

Every change merged into `main`, newest first, with the pull request number. Each merge
that changes the app rebuilds the APK behind the
[download link](https://github.com/andrea435/cataract-app-sane/releases/download/apk-latest/cataract-screening.apk).

## 19 November 2026

- **Release APK fix for the detection model (#13).** The model is copied to a file before
  loading, which fixed "detection model did not run" in the release APK. The Scanning screen
  now shows which step failed if it ever fails again.
- **Real cataract model on the phone (#12).** The VGG19 model from the thesis replaces the
  placeholder (random) score. It runs offline, answers cataract / normal / not an eye, and
  asks for a retake when the photo isn't an eye. See
  [Detection model](mobile/docs/detection-model.md).
- **Referral alerts (#11).** Clinic staff are alerted to new referrals, health workers to
  attended, treated and clinic notes. Lock-screen push works once Firebase is set up (see
  below).
- **Reports (#10).** Screenings, flagged, referred, attended and treated, with the treatment
  rate, by clinic and by health worker, for 7, 30 or 90 days or all time. Shareable as text.

## 17 November 2026

- **Follow-up reminders (#9).** Referred patients not marked attended after 14 days (7, 14,
  21 or 30, team-wide) appear in a follow-ups list with Call clinic, Followed up and
  Attended.
- **Patient consent and privacy notice (#8).** A consent step before the photo (patient or
  guardian, consent to screen, consent to share with a clinic), a privacy notice under
  Zimbabwe's Cyber and Data Protection Act naming DreaLens, and the consent summary in
  isiNdebele, chiShona and Setswana. TjiKalanga text is still to be written, and the
  translations are drafts until a first-language speaker checks them.
- **isiNdebele sample names (#7).** Placeholders and sample text use isiNdebele names and
  Matabeleland places.
- **Offline mode (#6).** Screenings and referrals save on the phone and upload by themselves
  when there is signal. The app opens offline with the last data it loaded.

## 13 November 2026

- **Clinics, referrals and the clinic view (#5).** Health workers manage clinics and refer
  patients to a chosen clinic. Clinic staff sign in to their own view, see only their
  clinic's patients and mark them attended and treated. Everyone signs in with email and
  password, and admins create the logins in the app.
- **Fixed APK download link (#4).**

## October 2026

- **Documentation (#3).** README, user guide, developer guide, data model, and the
  "closing the treatment gap" document.
- **Standalone Android APK (#1)**, built by GitHub Actions.
- **Patients table with referral status (#2).**

## Setup still to do

Checked on 19 November 2026:

| What | Why it matters | How |
| --- | --- | --- |
| Run `supabase/migrations/20261113100500_eye_photo_policies.sql` in the Supabase SQL editor | The old open photo policies are still live, so anyone with the app's public key can read and upload eye photos | Dashboard → SQL editor → paste the file → Run |
| Set up Firebase and deploy `notify-referral` | Without it, alerts only arrive while the app is open or was used recently, not on the lock screen | [Push alerts](mobile/docs/push-alerts.md) |
| Have the isiNdebele, chiShona and Setswana consent text checked, and write TjiKalanga | The translations are drafts | `mobile/src/data/patientLanguages.ts` |
| Use a release signing key for the APK (not checked: secrets aren't visible) | Unless the `ANDROID_KEYSTORE_*` secrets are set, builds are signed with the debug key, which the Play Store won't accept | [Building the Android APK](mobile/docs/android-build.md#signing) |
