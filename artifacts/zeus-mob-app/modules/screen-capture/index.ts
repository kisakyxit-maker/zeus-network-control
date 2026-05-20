import { requireNativeModule } from "expo-modules-core";

type CaptureModule = {
  requestPermission: () => Promise<boolean>;
  start: (options: { fps?: number; quality?: number; maxWidth?: number }) => Promise<boolean>;
  stop: () => Promise<void>;
  isActive: () => Promise<boolean>;
  // Native module proxies from expo-modules-core 3.x extend EventEmitter directly,
  // so listeners are added on the module itself — no separate EventEmitter needed.
  addListener: (event: string, listener: (data: any) => void) => { remove: () => void };
};

let mod: CaptureModule | null = null;
try {
  mod = requireNativeModule("ScreenCapture") as CaptureModule;
} catch {
  mod = null;
}

export const ScreenCapture = {
  available: mod !== null,
  async requestPermission(): Promise<boolean> {
    if (!mod) return false;
    return mod.requestPermission();
  },
  async start(opts: { fps?: number; quality?: number; maxWidth?: number } = {}): Promise<boolean> {
    if (!mod) return false;
    return mod.start({ fps: opts.fps ?? 8, quality: opts.quality ?? 30, maxWidth: opts.maxWidth ?? 720 });
  },
  async stop(): Promise<void> {
    if (!mod) return;
    return mod.stop();
  },
  async isActive(): Promise<boolean> {
    if (!mod) return false;
    return mod.isActive();
  },
  onFrame(cb: (data: { frame: string; width: number; height: number }) => void) {
    if (!mod) return () => {};
    const sub = mod.addListener("onFrame", cb);
    return () => sub.remove();
  },
};

export default ScreenCapture;
