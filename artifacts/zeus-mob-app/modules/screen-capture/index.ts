import { NativeModulesProxy, EventEmitter, requireNativeModule } from "expo-modules-core";

type CaptureModule = {
  requestPermission: () => Promise<boolean>;
  start: (options: { fps?: number; quality?: number; maxWidth?: number }) => Promise<boolean>;
  stop: () => Promise<void>;
  isActive: () => Promise<boolean>;
};

let mod: CaptureModule | null = null;
try {
  mod = requireNativeModule("ScreenCapture") as CaptureModule;
} catch {
  mod = null;
}

const emitter = mod
  ? new EventEmitter(mod as unknown as Parameters<typeof EventEmitter>[0])
  : null;

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
    if (!emitter) return () => {};
    const sub = emitter.addListener("onFrame", cb);
    return () => sub.remove();
  },
};

export default ScreenCapture;
