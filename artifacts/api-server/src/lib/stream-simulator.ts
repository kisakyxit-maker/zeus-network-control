import type { Server as SocketIoServer } from "socket.io";
import { db, devicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

type Screen = "home" | "locked" | "app";

type Tap = { x: number; y: number; at: number };

type SimState = {
  timer: NodeJS.Timeout;
  quality: number;
  lastRealFrameAt: number;
  startedAt: number;
  screen: Screen;
  appId: string | null;
  taps: Tap[];
  notifications: { id: number; app: string; text: string }[];
  notifSeq: number;
};

const simulators = new Map<number, SimState>();

const FPS = 10;
const FALLBACK_MS = 1500;
const W = 360;
const H = 640;

function esc(s: string): string {
  return String(s).replace(/[<>&"']/g, (c) =>
    c === "<" ? "&lt;" :
    c === ">" ? "&gt;" :
    c === "&" ? "&amp;" :
    c === '"' ? "&quot;" : "&#39;"
  );
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

type AppDef = { id: string; name: string; color: string; icon: string };

const APPS: AppDef[] = [
  { id: "messages", name: "Mensagens", color: "#34c759", icon: "💬" },
  { id: "whatsapp", name: "WhatsApp", color: "#25D366", icon: "W" },
  { id: "instagram", name: "Instagram", color: "#E4405F", icon: "IG" },
  { id: "x", name: "X", color: "#1DA1F2", icon: "X" },
  { id: "youtube", name: "YouTube", color: "#FF0000", icon: "▶" },
  { id: "telegram", name: "Telegram", color: "#0088cc", icon: "TG" },
  { id: "chrome", name: "Chrome", color: "#4285F4", icon: "G" },
  { id: "settings", name: "Ajustes", color: "#8e8e93", icon: "⚙" },
];

function appAt(px: number, py: number): AppDef | null {
  for (let i = 0; i < APPS.length; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 30 + col * 75;
    const y = 380 + row * 80;
    const cx = (x + 28) / W;
    const cy = (y + 28) / H;
    if (Math.hypot(px - cx, py - cy) < 0.10) return APPS[i] ?? null;
  }
  return null;
}

function statusBar(time: string, battery: number): string {
  return `
  <rect width="${W}" height="36" fill="#000" opacity="0.35"/>
  <text x="20" y="24" fill="#fff" font-size="13" font-family="Arial" font-weight="600">${esc(time)}</text>
  <text x="${W - 20}" y="24" text-anchor="end" fill="#fff" font-size="12" font-family="Arial">▮▮▮ ${battery}%</text>`;
}

function homeIndicator(): string {
  return `<rect x="${W / 2 - 60}" y="628" width="120" height="4" rx="2" fill="#fff" opacity="0.7"/>`;
}

function tapMarkers(taps: Tap[]): string {
  const now = Date.now();
  return taps
    .filter((t) => now - t.at < 600)
    .map((t) => {
      const age = (now - t.at) / 600;
      const r = 14 + age * 30;
      const op = (1 - age).toFixed(2);
      return `<circle cx="${t.x * W}" cy="${t.y * H}" r="${r.toFixed(1)}" fill="none" stroke="#00ff88" stroke-width="2" opacity="${op}"/>`;
    })
    .join("");
}

function renderHome(state: SimState, device: { name: string; model: string; os: string; osVersion: string; batteryLevel: number; status: string }, time: string, date: string): string {
  const uptime = Math.floor((Date.now() - state.startedAt) / 1000);
  const mm = String(Math.floor(uptime / 60)).padStart(2, "0");
  const ss = String(uptime % 60).padStart(2, "0");
  const t = (Date.now() / 1000) % 360;
  const wave = Math.sin(t * 1.2) * 6;
  const wave2 = Math.cos(t * 0.8) * 6;

  const apps = APPS.map((a, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 30 + col * 75;
    const y = 380 + row * 80;
    return `
      <rect x="${x}" y="${y}" width="56" height="56" rx="14" fill="${a.color}" opacity="0.95"/>
      <text x="${x + 28}" y="${y + 38}" text-anchor="middle" fill="#fff" font-size="20" font-family="Arial" font-weight="bold">${a.icon}</text>
      <text x="${x + 28}" y="${y + 70}" text-anchor="middle" fill="#fff" font-size="9" font-family="Arial" opacity="0.9">${esc(a.name)}</text>
    `;
  }).join("");

  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="50%" stop-color="#16213e"/>
      <stop offset="100%" stop-color="#0f3460"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <path d="M0,${320 + wave} Q${W / 4},${280 + wave2} ${W / 2},${320 + wave} T${W},${320 + wave2} L${W},${H} L0,${H} Z" fill="#ffffff" opacity="0.05"/>
  ${statusBar(time, device.batteryLevel)}

  <text x="${W / 2}" y="180" text-anchor="middle" fill="#fff" font-size="64" font-family="Arial" font-weight="200" letter-spacing="-2">${esc(time)}</text>
  <text x="${W / 2}" y="215" text-anchor="middle" fill="#fff" opacity="0.85" font-size="14" font-family="Arial">${esc(date.toUpperCase())}</text>

  <rect x="20" y="240" width="${W - 40}" height="100" rx="14" fill="#ffffff" opacity="0.12"/>
  <text x="36" y="265" fill="#fff" font-size="10" font-family="Arial" opacity="0.6" letter-spacing="2">DISPOSITIVO</text>
  <text x="36" y="288" fill="#fff" font-size="16" font-family="Arial" font-weight="700">${esc(device.name)}</text>
  <text x="36" y="308" fill="#fff" font-size="11" font-family="Arial" opacity="0.8">${esc(device.model)} • ${esc(device.os)} ${esc(device.osVersion)}</text>
  <text x="36" y="326" fill="#00ff88" font-size="11" font-family="Arial" font-weight="600">● ${esc(device.status.toUpperCase())}  •  ⏱ ${mm}:${ss}</text>

  ${apps}

  <rect x="20" y="555" width="${W - 40}" height="64" rx="20" fill="#000" opacity="0.35"/>
  <circle cx="60" cy="587" r="22" fill="#34c759"/>
  <text x="60" y="595" text-anchor="middle" fill="#fff" font-size="18" font-family="Arial">📞</text>
  <circle cx="130" cy="587" r="22" fill="#5e5ce6"/>
  <text x="130" y="595" text-anchor="middle" fill="#fff" font-size="18" font-family="Arial">✉</text>
  <circle cx="230" cy="587" r="22" fill="#ff9500"/>
  <text x="230" y="595" text-anchor="middle" fill="#fff" font-size="18" font-family="Arial">🌐</text>
  <circle cx="300" cy="587" r="22" fill="#ff3b30"/>
  <text x="300" y="595" text-anchor="middle" fill="#fff" font-size="18" font-family="Arial">📷</text>

  ${homeIndicator()}
  ${tapMarkers(state.taps)}
  `;
}

function renderLocked(state: SimState, batteryLevel: number, time: string, date: string): string {
  const pulse = (Math.sin(Date.now() / 400) * 0.5 + 0.5).toFixed(2);
  return `
  <defs>
    <linearGradient id="lockBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000"/>
      <stop offset="100%" stop-color="#0a0a1a"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#lockBg)"/>
  ${statusBar(time, batteryLevel)}

  <g opacity="${pulse}">
    <circle cx="${W / 2}" cy="220" r="60" fill="none" stroke="#ff3b30" stroke-width="2"/>
  </g>
  <rect x="${W / 2 - 30}" y="200" width="60" height="50" rx="8" fill="#ff3b30"/>
  <path d="M ${W / 2 - 18} 200 v -16 a 18 18 0 0 1 36 0 v 16" stroke="#ff3b30" stroke-width="6" fill="none" stroke-linecap="round"/>
  <text x="${W / 2}" y="232" text-anchor="middle" fill="#fff" font-size="22" font-family="Arial" font-weight="bold">🔒</text>

  <text x="${W / 2}" y="320" text-anchor="middle" fill="#fff" font-size="48" font-family="Arial" font-weight="200" letter-spacing="-1">${esc(time)}</text>
  <text x="${W / 2}" y="350" text-anchor="middle" fill="#fff" opacity="0.7" font-size="13" font-family="Arial">${esc(date.toUpperCase())}</text>

  <rect x="40" y="400" width="${W - 80}" height="60" rx="10" fill="#ff3b30" opacity="0.15" stroke="#ff3b30" stroke-width="1"/>
  <text x="${W / 2}" y="425" text-anchor="middle" fill="#ff3b30" font-size="11" font-family="Arial" font-weight="700" letter-spacing="2">DISPOSITIVO BLOQUEADO</text>
  <text x="${W / 2}" y="445" text-anchor="middle" fill="#fff" opacity="0.6" font-size="10" font-family="Arial">Bloqueado remotamente pelo administrador</text>

  <text x="${W / 2}" y="600" text-anchor="middle" fill="#fff" opacity="${pulse}" font-size="11" font-family="Arial">▲ Deslize para desbloquear</text>

  ${homeIndicator()}
  ${tapMarkers(state.taps)}
  `;
}

function renderApp(state: SimState, app: AppDef, time: string, batteryLevel: number): string {
  // Generic app shell with header + content list
  const items = Array.from({ length: 7 }).map((_, i) => {
    const y = 100 + i * 70;
    const t = (Date.now() / 1000 + i) % 60;
    return `
      <rect x="0" y="${y}" width="${W}" height="70" fill="#fff" opacity="${i % 2 === 0 ? 0.04 : 0.07}"/>
      <circle cx="36" cy="${y + 35}" r="22" fill="${app.color}" opacity="0.8"/>
      <text x="36" y="${y + 41}" text-anchor="middle" fill="#fff" font-size="14" font-family="Arial" font-weight="bold">${app.icon}</text>
      <text x="76" y="${y + 30}" fill="#fff" font-size="13" font-family="Arial" font-weight="600">${esc(app.name)} • item ${i + 1}</text>
      <text x="76" y="${y + 50}" fill="#fff" opacity="0.6" font-size="11" font-family="Arial">Atividade em tempo real ${t.toFixed(0)}s atrás</text>
    `;
  }).join("");

  return `
  <rect width="${W}" height="${H}" fill="#0b0b10"/>
  ${statusBar(time, batteryLevel)}
  <rect x="0" y="36" width="${W}" height="56" fill="${app.color}"/>
  <text x="${W / 2}" y="72" text-anchor="middle" fill="#fff" font-size="18" font-family="Arial" font-weight="700">${esc(app.name)}</text>
  ${items}
  ${homeIndicator()}
  ${tapMarkers(state.taps)}
  `;
}

function buildSvgFrame(
  state: SimState,
  device: { name: string; model: string; os: string; osVersion: string; batteryLevel: number; status: string }
): string {
  const now = new Date();
  const time = fmtTime(now);
  const date = now.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  const battery = Math.max(0, Math.min(100, device.batteryLevel));

  let inner = "";
  if (state.screen === "locked") {
    inner = renderLocked(state, battery, time, date);
  } else if (state.screen === "app") {
    const app = APPS.find((a) => a.id === state.appId) ?? APPS[0]!;
    inner = renderApp(state, app, time, battery);
  } else {
    inner = renderHome(state, device, time, date);
  }

  const watermark = `<text x="${W - 10}" y="${H - 10}" text-anchor="end" fill="#00ff88" font-size="9" font-family="monospace" opacity="0.55">SIM • Q${state.quality} • ${state.screen.toUpperCase()}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}${watermark}</svg>`;
  const b64 = Buffer.from(svg, "utf8").toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}

async function emitFrame(io: SocketIoServer, deviceId: number, state: SimState) {
  if (Date.now() - state.lastRealFrameAt < FALLBACK_MS) return;
  const device = await db.query.devicesTable.findFirst({ where: eq(devicesTable.id, deviceId) });
  if (!device) {
    stopSimulator(deviceId);
    return;
  }

  // GC old taps
  const now = Date.now();
  state.taps = state.taps.filter((t) => now - t.at < 800);

  const frame = buildSvgFrame(state, {
    name: device.name,
    model: device.model,
    os: device.os,
    osVersion: device.osVersion,
    batteryLevel: device.batteryLevel,
    status: device.status,
  });
  io.emit("stream:frame", { deviceId, frame });
}

export function startSimulator(io: SocketIoServer, deviceId: number, quality: number) {
  const existing = simulators.get(deviceId);
  if (existing) {
    existing.quality = quality;
    return;
  }
  const state: SimState = {
    quality,
    lastRealFrameAt: 0,
    startedAt: Date.now(),
    screen: "home",
    appId: null,
    taps: [],
    notifications: [],
    notifSeq: 0,
    timer: setInterval(() => {
      emitFrame(io, deviceId, state).catch(() => {});
    }, Math.floor(1000 / FPS)),
  };
  simulators.set(deviceId, state);
}

export function stopSimulator(deviceId: number) {
  const s = simulators.get(deviceId);
  if (s) {
    clearInterval(s.timer);
    simulators.delete(deviceId);
  }
}

export function setSimulatorQuality(deviceId: number, quality: number) {
  const s = simulators.get(deviceId);
  if (s) s.quality = quality;
}

export function notifyRealFrame(deviceId: number) {
  const s = simulators.get(deviceId);
  if (s) s.lastRealFrameAt = Date.now();
}

export function lockSimulator(deviceId: number) {
  const s = simulators.get(deviceId);
  if (s) {
    s.screen = "locked";
    s.appId = null;
  }
}

export function unlockSimulator(deviceId: number) {
  const s = simulators.get(deviceId);
  if (s) {
    s.screen = "home";
    s.appId = null;
  }
}

export function simulateTap(deviceId: number, x: number, y: number) {
  const s = simulators.get(deviceId);
  if (!s) return;
  s.taps.push({ x, y, at: Date.now() });

  if (s.screen === "locked") {
    // Tap on the unlock hint area unlocks
    if (y > 0.85 || y < 0.45) {
      s.screen = "home";
    }
    return;
  }

  if (s.screen === "app") {
    // Tap near top-left header acts as back
    if (y < 0.15 && x < 0.2) {
      s.screen = "home";
      s.appId = null;
    }
    return;
  }

  // home: detect app tap
  const app = appAt(x, y);
  if (app) {
    s.screen = "app";
    s.appId = app.id;
  }
}

export function simulateSwipe(deviceId: number, x1: number, y1: number, x2: number, y2: number) {
  const s = simulators.get(deviceId);
  if (!s) return;
  s.taps.push({ x: x2, y: y2, at: Date.now() });
  // Swipe up from bottom on lock screen unlocks
  if (s.screen === "locked" && y1 - y2 > 0.15) {
    s.screen = "home";
    return;
  }
  // Swipe down from top while on app goes back to home
  if (s.screen === "app" && y2 - y1 > 0.2) {
    s.screen = "home";
    s.appId = null;
  }
}
