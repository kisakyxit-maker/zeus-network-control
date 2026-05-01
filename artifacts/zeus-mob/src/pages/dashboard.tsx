import { Layout, TopBar } from "@/components/layout";
import { StatsBar } from "@/components/stats-bar";
import { DeviceGrid } from "@/components/device-grid";
import { StreamViewer } from "@/components/stream-viewer";
import { EventConsole } from "@/components/event-console";
import { CommandPanel } from "@/components/command-panel";
import { useListDevices, getListDevicesQueryKey } from "@workspace/api-client-react";
import { useSocket } from "@/hooks/use-socket";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAudioAlerts } from "@/hooks/use-audio-alerts";

export default function Dashboard() {
  const { data: devices, isLoading } = useListDevices();
  const socket = useSocket();
  const queryClient = useQueryClient();
  
  useAudioAlerts();

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

  const now = new Date().toLocaleTimeString("en-GB", { hour12: false });

  return (
    <Layout>
      <TopBar title="ZEUS MOB // MISSION CONTROL">
        <span>{now}</span>
        <span style={{ color: "#555" }}>|</span>
        <span>{(devices?.length ?? 0)} DEVICES</span>
      </TopBar>

      <StatsBar />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 6, marginBottom: 6 }}>
        <StreamViewer devices={devices} height={260} />
        <CommandPanel devices={devices} height={260} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 6 }}>
        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-header" style={{ justifyContent: "space-between" }}>
            <span>&gt; DEVICE LIST</span>
            <span style={{ color: "#444", fontSize: 9 }}>
              {devices?.filter(d => d.status !== "offline").length ?? 0} ACTIVE
            </span>
          </div>
          <DeviceGrid devices={devices ?? []} isLoading={isLoading} />
        </div>

        <EventConsole height={400} />
      </div>
    </Layout>
  );
}
