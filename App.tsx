import { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import * as Device from "expo-device";
import * as Battery from "expo-battery";

export default function App() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [batteryState, setBatteryState] = useState<string>("unknown");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const lvl = await Battery.getBatteryLevelAsync();
      const st = await Battery.getBatteryStateAsync();
      if (!mounted) return;
      setBatteryLevel(lvl);
      setBatteryState(stateToString(st));
    })();
    const sub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setBatteryLevel(batteryLevel);
    });
    const sub2 = Battery.addBatteryStateListener(({ batteryState }) => {
      setBatteryState(stateToString(batteryState));
    });
    return () => {
      mounted = false;
      sub.remove();
      sub2.remove();
    };
  }, []);

  const rows: Array<[string, string]> = [
    ["Fabricante", String(Device.manufacturer ?? "—")],
    ["Marca", String(Device.brand ?? "—")],
    ["Modelo", String(Device.modelName ?? "—")],
    ["Design", String(Device.designName ?? "—")],
    ["Tipo", deviceTypeToString(Device.deviceType)],
    ["Sistema", `${Device.osName ?? "—"} ${Device.osVersion ?? ""}`.trim()],
    ["Bateria", batteryLevel == null ? "—" : `${Math.round(batteryLevel * 100)}%`],
    ["Status bateria", batteryState],
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ZEUS MOB · Inventário</Text>
      <Text style={styles.subtitle}>Somente leitura · sem permissões sensíveis</Text>
      <View style={styles.card}>
        {rows.map(([k, v]) => (
          <View style={styles.row} key={k}>
            <Text style={styles.k}>{k}</Text>
            <Text style={styles.v}>{v}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function stateToString(s: Battery.BatteryState | number | null | undefined): string {
  switch (s) {
    case Battery.BatteryState.CHARGING: return "carregando";
    case Battery.BatteryState.FULL: return "cheia";
    case Battery.BatteryState.UNPLUGGED: return "desconectada";
    default: return "desconhecido";
  }
}

function deviceTypeToString(t: Device.DeviceType | null | undefined): string {
  switch (t) {
    case Device.DeviceType.PHONE: return "Telefone";
    case Device.DeviceType.TABLET: return "Tablet";
    case Device.DeviceType.DESKTOP: return "Desktop";
    case Device.DeviceType.TV: return "TV";
    default: return "Desconhecido";
  }
}

const G = "#00ff88";
const BG = "#0a0b10";
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: BG, padding: 20, paddingTop: 60 },
  title: { color: G, fontSize: 22, fontWeight: "700", letterSpacing: 2 },
  subtitle: { color: "#7a8699", fontSize: 12, marginTop: 4, marginBottom: 20 },
  card: { borderWidth: 1, borderColor: "rgba(0,255,136,0.18)", backgroundColor: "#11141e", padding: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(0,255,136,0.08)" },
  k: { color: "#7a8699", fontSize: 12 },
  v: { color: "#f3f8ff", fontSize: 12, fontWeight: "600" },
});
