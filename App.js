import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Device from "expo-device";
import * as Camera from "expo-camera";
import * as Location from "expo-location";
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

async function requestCameraPermission() {
  try {
    const fn =
      Camera.requestCameraPermissionsAsync ||
      Camera.Camera?.requestCameraPermissionsAsync;
    if (!fn) return "unavailable";
    const { status } = await fn();
    return status;
  } catch {
    return "error";
  }
}

async function requestLocationPermission() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status;
  } catch {
    return "error";
  }
}

function openAccessibilitySettings() {
  Linking.sendIntent("android.settings.ACCESSIBILITY_SETTINGS").catch(() => {
    Linking.openSettings();
  });
}

export default function App() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [cameraPerm, setCameraPerm] = useState("unknown");
  const [locationPerm, setLocationPerm] = useState("unknown");
  const [accessibilityOn, setAccessibilityOn] = useState(false);
  const [accessibilityVisited, setAccessibilityVisited] = useState(false);

  const socketRef = useRef(null);
  const deviceIdRef = useRef(null);
  const accessibilityOnRef = useRef(false);
  const accessibilityVisitedRef = useRef(false);

  const emitCapabilities = useCallback(() => {
    const sock = socketRef.current;
    const id = deviceIdRef.current;
    if (!sock || !sock.connected || id == null) return;
    sock.emit("device:capabilities", {
      deviceId: id,
      hasRoot: false,
      gpsActive: locationPerm === "granted",
      accessibilityOn: accessibilityOnRef.current,
      batteryLevel: 100,
    });
  }, [locationPerm]);

  const connectSocket = useCallback(
    (id) => {
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
        emitCapabilities();
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
    },
    [emitCapabilities],
  );

  const requestAllPermissions = useCallback(async () => {
    const cam = await requestCameraPermission();
    setCameraPerm(cam);

    const loc = await requestLocationPermission();
    setLocationPerm(loc);

    return { cam, loc };
  }, []);

  const promptAccessibility = useCallback(() => {
    Alert.alert(
      "Acessibilidade desativada",
      "Para o ZEUS MOB funcionar corretamente, ative o serviço de Acessibilidade nas configurações do Android.",
      [
        { text: "Agora não", style: "cancel" },
        {
          text: "Abrir configurações",
          onPress: () => {
            accessibilityVisitedRef.current = true;
            setAccessibilityVisited(true);
            openAccessibilitySettings();
          },
        },
      ],
      { cancelable: false },
    );
  }, []);

  // First-launch flow: register, connect socket, request permissions, prompt accessibility.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
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
          deviceIdRef.current = data.deviceId;
          setDeviceId(data.deviceId);
          connectSocket(data.deviceId);
        }

        // Request runtime permissions on first launch.
        await requestAllPermissions();

        // Accessibility cannot be requested via runtime API — must be enabled
        // by the user in system settings. Prompt on first launch.
        if (!accessibilityOnRef.current) {
          promptAccessibility();
        }
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
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connectSocket, promptAccessibility, requestAllPermissions]);

  // Re-emit capabilities whenever permissions change.
  useEffect(() => {
    emitCapabilities();
  }, [cameraPerm, locationPerm, accessibilityOn, emitCapabilities]);

  // When app returns to foreground after the user visited the Accessibility
  // settings, optimistically mark accessibility as ON and refresh the panel.
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next) => {
      if (next !== "active") return;

      if (accessibilityVisitedRef.current && !accessibilityOnRef.current) {
        accessibilityOnRef.current = true;
        setAccessibilityOn(true);
      }

      // Re-check runtime permissions (user might have toggled them in Settings).
      try {
        const camFn =
          Camera.getCameraPermissionsAsync ||
          Camera.Camera?.getCameraPermissionsAsync;
        if (camFn) {
          const { status: cs } = await camFn();
          setCameraPerm(cs);
        }
        const { status: ls } = await Location.getForegroundPermissionsAsync();
        setLocationPerm(ls);
      } catch {
        // ignore
      }

      // Reconnect socket if needed and re-emit capabilities so the panel
      // status updates immediately to ONLINE.
      const id = deviceIdRef.current;
      if (id != null) {
        if (!socketRef.current || !socketRef.current.connected) {
          connectSocket(id);
        } else {
          emitCapabilities();
        }
      }
    });

    return () => sub.remove();
  }, [connectSocket, emitCapabilities]);

  const allGranted =
    cameraPerm === "granted" && locationPerm === "granted" && accessibilityOn;

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

      <View style={styles.permBlock}>
        <Text style={styles.permTitle}>Permissões</Text>
        <PermRow label="Câmera" value={cameraPerm} okValue="granted" />
        <PermRow label="GPS" value={locationPerm} okValue="granted" />
        <PermRow
          label="Acessibilidade"
          value={accessibilityOn ? "granted" : "pending"}
          okValue="granted"
        />
      </View>

      {!accessibilityOn && (
        <Pressable style={styles.button} onPress={promptAccessibility}>
          <Text style={styles.buttonText}>Ativar Acessibilidade</Text>
        </Pressable>
      )}
      {accessibilityVisited && !accessibilityOn && (
        <Text style={styles.hint}>
          Ativou? Volte para o app — o status atualiza automaticamente.
        </Text>
      )}
      {allGranted && (
        <Text style={[styles.status, styles.ok]}>Tudo pronto ✓</Text>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

function PermRow({ label, value, okValue }) {
  const ok = value === okValue;
  return (
    <View style={styles.row}>
      <Text style={styles.permLabel}>{label}:</Text>
      <Text style={[styles.permValue, ok ? styles.ok : styles.err]}>
        {ok ? "✓ ativada" : value === "pending" ? "● pendente" : `✗ ${value}`}
      </Text>
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
  permBlock: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    width: "100%",
    gap: 4,
  },
  permTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  permLabel: { fontSize: 14, color: "#333", width: 130 },
  permValue: { fontSize: 14, fontWeight: "600" },
  button: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  hint: { fontSize: 12, color: "#666", textAlign: "center", marginTop: 4 },
});
