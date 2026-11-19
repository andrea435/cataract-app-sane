// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle the cataract detection model (assets/models/*.tflite) with the app.
config.resolver.assetExts.push('tflite');

module.exports = config;
