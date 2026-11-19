// Extends app.json. When a Firebase config file (google-services.json) is present in this
// folder, the Android build includes it, which turns on lock-screen push alerts. Without
// it the app builds as before and shows referral alerts only while it is running.
// See docs/push-alerts.md.
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const file = './google-services.json';
  if (fs.existsSync(path.join(__dirname, file))) {
    config.android = { ...config.android, googleServicesFile: file };
  }
  return config;
};
