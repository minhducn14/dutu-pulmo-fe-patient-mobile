const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidManifestFix(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Fix 1: Add xmlns:tools
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const application = manifest.application?.[0];
    if (!application) return config;

    // Fix 2: Add tools:replace to Firebase notification color meta-data
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }
    const metaDataList = application['meta-data'];
    let colorMeta = metaDataList.find(
      (m) =>
        m.$?.['android:name'] ===
        'com.google.firebase.messaging.default_notification_color'
    );

    if (!colorMeta) {
      colorMeta = {
        $: {
          'android:name': 'com.google.firebase.messaging.default_notification_color',
          'android:resource': '@color/notification_icon_color',
        },
      };
      metaDataList.push(colorMeta);
    }

    // Explicitly set tools:replace
    colorMeta.$['tools:replace'] = 'android:resource';

    // Fix 3: Remove duplicate DailyOngoingMeetingForegroundService
    const services = application['service'] || [];
    const seen = new Set();
    application['service'] = services.filter((s) => {
      const name = s.$?.['android:name'];
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });

    return config;
  });
};