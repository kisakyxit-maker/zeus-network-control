import { Layout, TopBar } from "@/components/layout";
import { DeviceGrid } from "@/components/device-grid";
import { useListDevices, getListDevicesQueryKey } from "@workspace/api-client-react";
import { useSocket } from "@/hooks/use-socket";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function Devices() {
  const { data: devices, isLoading } = useListDevices();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

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

  const filtered = devices?.filter(d => filter === "all" || d.status === filter) ?? [];

  const counts = {
    all: devices?.length ?? 0,
    online: devices?.filter(d => d.status === "online").length ?? 0,
    offline: devices?.filter(d => d.status === "offline").length ?? 0,
    idle: devices?.filter(d => d.status === "idle").length ?? 0,
    busy: devices?.filter(d => d.status === "busy").length ?? 0,
  };

  return (
    <Layout>
      <TopBar title="ZEUS MOB // DEVICE REGISTRY">
        <span>{devices?.length ?? 0} TOTAL</span>
      </TopBar>

      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {(["all", "online", "offline", "idle", "busy"] as const).map(f => (
          <button
            key={f}
            data-testid={`filter-${f}`}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? (f === "offline" ? "#1a0000" : f === "online" ? "#002200" : "#0a0a0a") : "#000",
              border: `1px solid ${filter === f ? (f === "online" ? "#00ff00" : f === "offline" ? "#ff0000" : "#555") : "#222"}`,
              color: filter === f ? (f === "online" ? "#00ff00" : f === "offline" ? "#ff4444" : "#aaa") : "#444",
              padding: "3px 8px",
              fontSize: 9,
              fontFamily: "'Courier New', monospace",
              cursor: "pointer",
              letterSpacing: "0.08em",
              fontWeight: "bold",
            }}
          >
            {f.toUpperCase()} ({counts[f]})
          </button>
        ))}
      </div>

      <DeviceGrid devices={filtered} isLoading={isLoading} />
    </Layout>
  );
}
