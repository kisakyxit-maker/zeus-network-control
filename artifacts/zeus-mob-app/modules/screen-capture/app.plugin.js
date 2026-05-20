module.exports = function withScreenCapture(config) {
  const { withAndroidManifest, AndroidConfig } = require("expo/config-plugins");
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const perms = [
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION",
      "android.permission.POST_NOTIFICATIONS",
    ];
    for (const p of perms) {
      AndroidConfig.Permissions.addPermission(manifest, p);
    }
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    app.service = app.service || [];
    const exists = app.service.find(
      (s) => s.$ && s.$["android:name"] === "expo.modules.screencapture.ScreenCaptureService"
    );
    if (!exists) {
      app.service.push({
        $: {
          "android:name": "expo.modules.screencapture.ScreenCaptureService",
          "android:foregroundServiceType": "mediaProjection",
          "android:exported": "false",
        },
      });
    }
    return cfg;
  });
};
