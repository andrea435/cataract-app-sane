// Adds a `release` signing config to the generated android/app/build.gradle so
// `./gradlew assembleRelease` produces an APK signed with your own upload key.
//
// The keystore is read from Gradle properties or environment variables:
//   CATARACT_UPLOAD_STORE_FILE      path to the .jks/.keystore (relative to android/app or absolute)
//   CATARACT_UPLOAD_STORE_PASSWORD
//   CATARACT_UPLOAD_KEY_ALIAS
//   CATARACT_UPLOAD_KEY_PASSWORD
// When they are not set, release builds fall back to the debug keystore so a
// local test APK still builds (fine for sideloading, not for the Play Store).
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// @cataract-release-signing';

const RELEASE_SIGNING_CONFIG = `
        ${MARKER}
        release {
            def storePath = findProperty('CATARACT_UPLOAD_STORE_FILE') ?: System.getenv('CATARACT_UPLOAD_STORE_FILE')
            if (storePath) {
                storeFile file(storePath)
                storePassword findProperty('CATARACT_UPLOAD_STORE_PASSWORD') ?: System.getenv('CATARACT_UPLOAD_STORE_PASSWORD')
                keyAlias findProperty('CATARACT_UPLOAD_KEY_ALIAS') ?: System.getenv('CATARACT_UPLOAD_KEY_ALIAS')
                keyPassword findProperty('CATARACT_UPLOAD_KEY_PASSWORD') ?: System.getenv('CATARACT_UPLOAD_KEY_PASSWORD')
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes(MARKER)) return cfg;

    // 1. Declare the release signing config next to the debug one.
    gradle = gradle.replace(/signingConfigs\s*\{/, (match) => `${match}${RELEASE_SIGNING_CONFIG}`);

    // 2. Point the release build type at it, keeping the debug key as a fallback.
    const releaseBlock = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
    if (!releaseBlock.test(gradle)) {
      throw new Error('withReleaseSigning: could not find the release signingConfig in app/build.gradle');
    }
    gradle = gradle.replace(
      releaseBlock,
      '$1signingConfig signingConfigs.release.storeFile ? signingConfigs.release : signingConfigs.debug'
    );

    cfg.modResults.contents = gradle;
    return cfg;
  });
};
