import { ConfigPlugin, withAndroidManifest, AndroidConfig } from "expo/config-plugins";

const withScreenCapture: ConfigPlugin = (config) => {
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
    app.service = app.service ?? [];
    const existing = app.service.find(
      (s: any) => s.$["android:name"] === "expo.modules.screencapture.ScreenCaptureService"
    );
    if (!existing) {
      app.service.push({
        $: {
          "android:name": "expo.modules.screencapture.ScreenCaptureService",
          "android:foregroundServiceType": "mediaProjection",
          "android:exported": "false",
        },
      } as any);
    }
    return cfg;
  });
};

export default withScreenCapture;
