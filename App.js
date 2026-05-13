import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import axios from "axios";

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

        await axios.post(REPORT_URL, payload, { timeout: 15000 });
        if (!cancelled) setStatus("sent");
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(err?.message ?? "Unknown error");
        }
      }
    }

    reportInventory();
    return () => {
      cancelled = true;
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
