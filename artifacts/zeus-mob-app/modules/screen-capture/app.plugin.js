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

    // NOTE: Service declarations (ScreenCaptureService, ZeusAccessibilityService)
    // live in modules/screen-capture/android/src/main/AndroidManifest.xml and are
    // merged automatically by AGP. Declaring them again here caused the manifest
    // merger to fail at processReleaseManifest with overlapping <intent-filter>
    // / <meta-data> children, which EAS surfaces as "Build complete hook:
    // Unknown error". Do not re-add them here.

    return cfg;
  });
};
