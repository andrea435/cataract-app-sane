# Building a standalone Android APK

These steps produce a real installable app (`app-release.apk`). It runs on its own: no
Expo Go, no dev server, no laptop on the same Wi-Fi. The JavaScript bundle, fonts and
Supabase config (from `.env`) are all baked into the APK at build time.

App id: `com.andrea435.cataractscreening` (set in `app.json` → `android.package`).
Once the app is published on the Play Store this id can never change.

There are three ways to build it. Pick one.

## Just want the app? Use the download link

Open this on an Android phone to download the newest APK:

https://github.com/andrea435/cataract-app-sane/releases/download/apk-latest/cataract-screening.apk

That link always points at the latest build of `main`. You can share it, put it in a QR
code, or send it over WhatsApp.

## Option A: GitHub Actions (no setup on your machine)

The **Android APK** workflow runs on its own:

- **Merge to main** that changes the app: builds the APK and replaces the file behind the
  download link above (the `apk-latest` release). Takes about 15 minutes.
- **Pull request** that changes the app: builds the APK so you can test it before merging.
  Download it from the run's **cataract-screening-apk** artifact (a zip containing
  `app-release.apk`). The download link isn't touched.
- Changes that only touch docs or `.md` files don't trigger a build.

To build by hand, open **Actions → Android APK → Run workflow** (this also updates the
download link). Pushing a tag such as `v1.0.0` does the same.

## Option B: Expo EAS cloud build

Needs a free Expo account.

```
cd mobile
npm install
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

The first run asks to create an EAS project and offers to generate a signing key for
you; say yes. When the build finishes, EAS prints a link and QR code to download the APK.
The `preview` and `production` profiles in `eas.json` both output an APK.

## Option C: Build locally

Needs Node 22, JDK 17 or 21, and the Android SDK (easiest via Android Studio; set
`ANDROID_HOME`, e.g. `~/Library/Android/sdk` on macOS).

```
cd mobile
npm install
npm run build:apk
```

That runs `expo prebuild` (generates the `android/` folder, which is not committed) and
then `./gradlew assembleRelease`. The APK lands at
`mobile/android/app/build/outputs/apk/release/app-release.apk`.

## Installing the APK on a phone

- Copy the APK to the phone (USB, Google Drive, email…) and tap it. Android will ask to
  allow installs from that source the first time.
- Or with USB debugging on: `adb install -r app-release.apk`.

## Signing

Every APK must be signed. Without extra setup, release builds are signed with the
Android **debug key**. That installs and runs fine for testing and field trials, but the
Play Store won't accept it, and a phone won't install an update signed with a different
key over it (uninstall first).

For a real release key (do this once and **back the file and passwords up**; losing
them means you can't ship updates to the same app):

```
keytool -genkeypair -v -storetype PKCS12 -keystore upload.keystore \
  -alias cataract-upload -keyalg RSA -keysize 2048 -validity 10000
```

Then either:

- **Locally:** put the file in `mobile/android/app/` (or anywhere, using an absolute
  path) and add to `~/.gradle/gradle.properties`:
  ```
  CATARACT_UPLOAD_STORE_FILE=upload.keystore
  CATARACT_UPLOAD_STORE_PASSWORD=...
  CATARACT_UPLOAD_KEY_ALIAS=cataract-upload
  CATARACT_UPLOAD_KEY_PASSWORD=...
  ```
  The same names also work as environment variables.
- **GitHub Actions:** add repo secrets `ANDROID_KEYSTORE_BASE64` (output of
  `base64 -i upload.keystore`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
  `ANDROID_KEY_PASSWORD`.
- **EAS:** EAS manages its own key, nothing to do here.

The wiring lives in `plugins/withReleaseSigning.js`, an Expo config plugin that adds the
release signing config every time `expo prebuild` regenerates `android/`.

## Shipping an update

Bump `expo.version` in `app.json` (the version users see, e.g. `1.0.2`), then merge.
GitHub Actions builds set `expo.android.versionCode` to the run number, so each build
installs over the previous one. For local or EAS builds, bump `expo.android.versionCode`
in `app.json` yourself (it must go up by at least 1 every release).

## Play Store

The Play Store wants an `.aab` bundle rather than an APK. Use
`./gradlew bundleRelease` (local) or change `buildType` to `app-bundle` in the
`production` profile of `eas.json`.
