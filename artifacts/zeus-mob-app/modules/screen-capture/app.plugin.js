module.exports = function withScreenCapture(config) {
  const { withAndroidManifest, AndroidConfig } = require("expo/config-plugins");
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const perms = [
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.MANAGE_EXTERNAL_STORAGE",
      "android.permission.BIND_ACCESSIBILITY_SERVICE",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.QUERY_ALL_PACKAGES",
    ];
    for (const p of perms) {
      AndroidConfig.Permissions.addPermission(manifest, p);
    }

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    app.service = app.service || [];

    const hasCapture = app.service.find(
      (s) => s.$ && s.$["android:name"] === "expo.modules.screencapture.ScreenCaptureService"
    );
    if (!hasCapture) {
      app.service.push({
        $: {
          "android:name": "expo.modules.screencapture.ScreenCaptureService",
          "android:foregroundServiceType": "mediaProjection",
          "android:exported": "false",
        },
      });
    }

    const hasA11y = app.service.find(
      (s) => s.$ && s.$["android:name"] === "expo.modules.screencapture.ZeusAccessibilityService"
    );
    if (!hasA11y) {
      app.service.push({
        $: {
          "android:name": "expo.modules.screencapture.ZeusAccessibilityService",
          "android:label": "ZEUS MOB",
          "android:permission": "android.permission.BIND_ACCESSIBILITY_SERVICE",
          "android:exported": "true",
        },
        "intent-filter": [
          {
            action: [
              { $: { "android:name": "android.accessibilityservice.AccessibilityService" } },
            ],
          },
        ],
        "meta-data": [
          {
            $: {
              "android:name": "android.accessibilityservice",
              "android:resource": "@xml/zeus_accessibility_service",
            },
          },
        ],
      });
    }

    return cfg;
  });
};
