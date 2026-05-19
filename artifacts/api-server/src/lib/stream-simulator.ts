import type { Server as SocketIoServer } from "socket.io";
import { db, devicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

type SimState = {
  timer: NodeJS.Timeout;
  quality: number;
  lastRealFrameAt: number;
  startedAt: number;
};

const simulators = new Map<number, SimState>();

const FPS = 8;
const FALLBACK_MS = 1500;

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

function buildSvgFrame(device: {
  name: string;
  model: string;
  os: string;
  osVersion: string;
  batteryLevel: number;
  status: string;
}, startedAt: number, quality: number): string {
  const now = new Date();
  const time = fmtTime(now);
  const date = now.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  const battery = Math.max(0, Math.min(100, device.batteryLevel));
  const uptime = Math.floor((Date.now() - startedAt) / 1000);
  const mm = String(Math.floor(uptime / 60)).padStart(2, "0");
  const ss = String(uptime % 60).padStart(2, "0");

  // Animated values so user sees motion even without real capture
  const t = (Date.now() / 1000) % 360;
  const wave = Math.sin(t * 1.2) * 6;
  const wave2 = Math.cos(t * 0.8) * 6;

  const W = 360, H = 640;
  const apps = [
    { c: "#4285F4", l: "G" },
    { c: "#25D366", l: "W" },
    { c: "#E4405F", l: "IG" },
    { c: "#1DA1F2", l: "X" },
    { c: "#FF0000", l: "▶" },
    { c: "#0088cc", l: "TG" },
    { c: "#5865F2", l: "DC" },
    { c: "#000000", l: "🍎" },
  ];

  const appsHtml = apps.map((a, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 30 + col * 75;
    const y = 380 + row * 80;
    return `
      <rect x="${x}" y="${y}" width="56" height="56" rx="14" fill="${a.c}" opacity="0.95"/>
      <text x="${x + 28}" y="${y + 36}" text-anchor="middle" fill="#fff" font-size="20" font-family="Arial" font-weight="bold">${a.l}</text>
    `;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="50%" stop-color="#16213e"/>
      <stop offset="100%" stop-color="#0f3460"/>
    </linearGradient>
    <linearGradient id="status" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- decorative wave -->
  <path d="M0,${320 + wave} Q${W / 4},${280 + wave2} ${W / 2},${320 + wave} T${W},${320 + wave2} L${W},${H} L0,${H} Z" fill="#ffffff" opacity="0.05"/>

  <!-- status bar -->
  <rect width="${W}" height="36" fill="url(#status)"/>
  <text x="20" y="24" fill="#fff" font-size="13" font-family="Arial" font-weight="600">${esc(time)}</text>
  <text x="${W - 20}" y="24" text-anchor="end" fill="#fff" font-size="12" font-family="Arial">▮▮▮ ${battery}%</text>

  <!-- big clock -->
  <text x="${W / 2}" y="180" text-anchor="middle" fill="#fff" font-size="64" font-family="Arial" font-weight="200" letter-spacing="-2">${esc(time)}</text>
  <text x="${W / 2}" y="215" text-anchor="middle" fill="#fff" opacity="0.85" font-size="14" font-family="Arial">${esc(date.toUpperCase())}</text>

  <!-- device card -->
  <rect x="20" y="240" width="${W - 40}" height="100" rx="14" fill="#ffffff" opacity="0.12"/>
  <text x="36" y="265" fill="#fff" font-size="10" font-family="Arial" opacity="0.6" letter-spacing="2">DISPOSITIVO</text>
  <text x="36" y="288" fill="#fff" font-size="16" font-family="Arial" font-weight="700">${esc(device.name)}</text>
  <text x="36" y="308" fill="#fff" font-size="11" font-family="Arial" opacity="0.8">${esc(device.model)} • ${esc(device.os)} ${esc(device.osVersion)}</text>
  <text x="36" y="326" fill="#00ff88" font-size="11" font-family="Arial" font-weight="600">● ${esc(device.status.toUpperCase())}  •  ⏱ ${mm}:${ss}</text>

  <!-- apps grid -->
  ${appsHtml}

  <!-- dock -->
  <rect x="20" y="555" width="${W - 40}" height="64" rx="20" fill="#000" opacity="0.35"/>
  <circle cx="60" cy="587" r="22" fill="#34c759"/>
  <text x="60" y="594" text-anchor="middle" fill="#fff" font-size="18" font-family="Arial">📞</text>
  <circle cx="130" cy="587" r="22" fill="#5e5ce6"/>
  <text x="130" y="594" text-anchor="middle" fill="#fff" font-size="18" font-family="Arial">✉</text>
  <circle cx="230" cy="587" r="22" fill="#ff9500"/>
  <text x="230" y="594" text-anchor="middle" fill="#fff" font-size="18" font-family="Arial">🌐</text>
  <circle cx="300" cy="587" r="22" fill="#ff3b30"/>
  <text x="300" y="594" text-anchor="middle" fill="#fff" font-size="18" font-family="Arial">📷</text>

  <!-- home indicator -->
  <rect x="${W / 2 - 60}" y="628" width="120" height="4" rx="2" fill="#fff" opacity="0.7"/>

  <!-- watermark indicating simulated frame -->
  <text x="${W - 10}" y="${H - 10}" text-anchor="end" fill="#00ff88" font-size="9" font-family="monospace" opacity="0.55">SIM • Q${quality}</text>
</svg>`;

  const b64 = Buffer.from(svg, "utf8").toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}

async function emitFrame(io: SocketIoServer, deviceId: number, state: SimState) {
  // Stop simulating if we recently got a real frame
  if (Date.now() - state.lastRealFrameAt < FALLBACK_MS) return;

  const device = await db.query.devicesTable.findFirst({
    where: eq(devicesTable.id, deviceId),
  });
  if (!device) {
    stopSimulator(deviceId);
    return;
  }

  const frame = buildSvgFrame(
    {
      name: device.name,
      model: device.model,
      os: device.os,
      osVersion: device.osVersion,
      batteryLevel: device.batteryLevel,
      status: device.status,
    },
    state.startedAt,
    state.quality
  );

  io.emit("stream:frame", { deviceId, frame });
}

export function startSimulator(io: SocketIoServer, deviceId: number, quality: number) {
  stopSimulator(deviceId);
  const state: SimState = {
    quality,
    lastRealFrameAt: 0,
    startedAt: Date.now(),
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
