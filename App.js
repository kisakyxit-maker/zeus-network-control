import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import axios from "axios";
import { io } from "socket.io-client";

function resolveApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_DOMAIN;
  const fromExtra =
    Constants?.expoConfig?.extra?.apiBaseUrl ||
    Constants?.manifest?.extra?.apiBaseUrl;
  const raw = fromEnv || fromExtra || "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, "");
  return `https://${raw.replace(/\/+$/, "")}`;
}

const API_BASE_URL = resolveApiBaseUrl();
const REPORT_URL = `${API_BASE_URL}/api/inventory/report`;

export default function App() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const socketRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function reportInventory() {
      if (!API_BASE_URL) {
        setStatus("error");
        setError("API base URL not configured (EXPO_PUBLIC_API_URL).");
        return;
      }
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

        const { data } = await axios.post(REPORT_URL, payload, { timeout: 15000 });
        if (cancelled) return;

        setStatus("sent");
        if (data?.deviceId) {
          setDeviceId(data.deviceId);
          connectSocket(data.deviceId);
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(err?.message ?? "Unknown error");
        }
      }
    }

    function connectSocket(id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setSocketStatus("connecting");
      const socket = io(API_BASE_URL, {
        path: "/api/socket.io",
        transports: ["websocket"],
        query: { deviceId: String(id) },
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 15000,
        secure: API_BASE_URL.startsWith("https://"),
        rejectUnauthorized: false,
      });

      socket.on("connect", () => {
        setSocketStatus("online");
        socket.emit("device:capabilities", {
          deviceId: id,
          hasRoot: false,
          gpsActive: false,
          accessibilityOn: false,
          batteryLevel: 100,
        });
      });

      socket.on("disconnect", (reason) => {
        setSocketStatus(`disconnected (${reason})`);
      });

      socket.on("connect_error", (err) => {
        setSocketStatus(`error: ${err?.message ?? "unknown"}`);
      });

      socket.on("command:received", (cmd) => {
        socket.emit("device:event", {
          deviceId: id,
          type: "command_ack",
          message: `Command received: ${cmd?.command ?? "(none)"}`,
        });
      });

      socketRef.current = socket;
    }

    reportInventory();
    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ZEUS MOB</Text>
      <Text style={styles.subtitle}>Modelo: {Device.modelName ?? "—"}</Text>
      <Text style={styles.url}>Servidor: {API_BASE_URL || "(não configurado)"}</Text>

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

      {deviceId != null && (
        <Text style={styles.status}>Device ID: {deviceId}</Text>
      )}
      <Text
        style={[
          styles.status,
          socketStatus === "online"
            ? styles.ok
            : socketStatus.startsWith("error")
              ? styles.err
              : null,
        ]}
      >
        Socket: {socketStatus}
      </Text>

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
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 16, color: "#444" },
  url: { fontSize: 12, color: "#888", textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  status: { fontSize: 14, color: "#666" },
  ok: { color: "#16a34a" },
  err: { color: "#dc2626" },
});
