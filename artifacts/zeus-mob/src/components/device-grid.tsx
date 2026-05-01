import { Link } from "wouter";
import { Device } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";

interface DeviceGridProps {
  devices: Device[];
  isLoading?: boolean;
}

export function DeviceStatusBadge({ status }: { status: Device["status"] }) {
  return <span className={`tag tag-${status}`}>{status.toUpperCase()}</span>;
}

function BatteryIcon({ level }: { level: number }) {
  const color = level <= 20 ? "#ff4444" : level <= 40 ? "#ffaa00" : "#00ff00";
  return (
    <span style={{ color, fontSize: 10, fontFamily: "monospace" }}>
      [{Array.from({ length: 5 }).map((_, i) => i < Math.round(level / 20) ? "█" : "░").join("")}] {level}%
    </span>
  );
}

export function DeviceGrid({ devices, isLoading }: DeviceGridProps) {
  if (isLoading) {
    return (
      <div className="panel" style={{ padding: 0 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="device-row" style={{ color: "#222" }}>
            loading...
          </div>
        ))}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="panel" style={{ padding: 12, color: "#444", fontSize: 11 }}>
        &gt; NO DEVICES FOUND
      </div>
    );
  }

  return (
    <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "6px 1fr 80px 70px 110px 80px 90px", gap: 0, background: "#0a0a0a", borderBottom: "1px solid #222", padding: "3px 8px", fontSize: 9, color: "#444", letterSpacing: "0.08em" }}>
        <span />
        <span>DEVICE / MODEL</span>
        <span>IP ADDRESS</span>
        <span>OS</span>
        <span>BATTERY</span>
        <span>STATUS</span>
        <span>LAST SEEN</span>
      </div>
      {devices.map((device) => (
        <Link key={device.id} href={`/devices/${device.id}`}>
          <div
            className={`device-row ${device.status}`}
            data-testid={`device-row-${device.id}`}
          >
            <span className={`status-dot status-${device.status}`} style={{ flexShrink: 0 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 110px 80px 90px", gap: 0, flex: 1, alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: "bold", color: device.status === "online" ? "#00ff00" : device.status === "offline" ? "#555" : "inherit" }}>
                  {device.name}
                </span>
                <span style={{ color: "#444", marginLeft: 6, fontSize: 10 }}>{device.model}</span>
              </div>
              <span style={{ color: "#00aa88", fontSize: 10, fontFamily: "monospace" }}>{device.ipAddress}</span>
              <span style={{ color: "#666", fontSize: 10 }}>{device.os} {device.osVersion}</span>
              <BatteryIcon level={device.batteryLevel} />
              <DeviceStatusBadge status={device.status} />
              <span style={{ color: "#444", fontSize: 10 }}>
                {formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
