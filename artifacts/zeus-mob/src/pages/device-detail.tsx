import { Layout, TopBar } from "@/components/layout";
import { StreamViewer } from "@/components/stream-viewer";
import { EventConsole } from "@/components/event-console";
import { CommandPanel } from "@/components/command-panel";
import { DeviceStatusBadge } from "@/components/device-grid";
import { useGetDevice, getGetDeviceQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const deviceId = parseInt(id, 10);
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
      <TopBar title={`DEVICE // ${device.name}`}>
        <DeviceStatusBadge status={device.status} />
        <Link href="/devices" style={{ color: "#555", fontSize: 9, textDecoration: "none" }}>
          &lt; BACK
        </Link>
      </TopBar>

      <div className="panel" style={{ marginBottom: 6, padding: 0 }}>
        <div className="panel-header">&gt; DEVICE INFO</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 0 }}>
          {[
            ["NAME", device.name],
            ["MODEL", device.model],
            ["OS", `${device.os} ${device.osVersion}`],
            ["IP ADDRESS", device.ipAddress],
            ["BATTERY", `${device.batteryLevel}%`],
            ["CAPS", (
              <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                {device.hasRoot ? (
                  <span style={{ background: "#331100", color: "#ffaa00", border: "1px solid #ffaa00", padding: "1px 3px", fontSize: 8 }}>ROOT</span>
                ) : (
                  <span style={{ background: "#111", color: "#444", border: "1px solid #333", padding: "1px 3px", fontSize: 8 }}>ROOT</span>
                )}
                {device.gpsActive ? (
                  <span style={{ background: "#002200", color: "#00ff00", border: "1px solid #00ff00", padding: "1px 3px", fontSize: 8 }}>GPS</span>
                ) : (
                  <span style={{ background: "#111", color: "#444", border: "1px solid #333", padding: "1px 3px", fontSize: 8 }}>GPS</span>
                )}
                {device.accessibilityOn ? (
                  <span style={{ background: "#002200", color: "#00ff00", border: "1px solid #00ff00", padding: "1px 3px", fontSize: 8 }}>ACC:ON</span>
                ) : (
                  <span style={{ background: "#111", color: "#444", border: "1px solid #333", padding: "1px 3px", fontSize: 8 }}>ACC:OFF</span>
                )}
              </div>
            )],
            ["LAST SEEN", formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })],
          ].map(([label, value]) => (
            <div key={label as string} style={{ padding: "6px 10px", borderRight: "1px solid #111" }}>
              <div style={{ fontSize: 9, color: "#444", marginBottom: 2, letterSpacing: "0.08em" }}>{label}</div>
              <div style={{ fontSize: 11, color: "#00cc00", fontFamily: "'Courier New', monospace" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 6, marginBottom: 6 }}>
        <StreamViewer preselectedDeviceId={deviceId} height={240} />
        <CommandPanel preselectedDeviceId={deviceId} height={240} />
      </div>

      <EventConsole deviceId={deviceId} height={260} />
    </Layout>
  );
}
