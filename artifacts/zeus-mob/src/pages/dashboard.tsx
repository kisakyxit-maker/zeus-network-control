import { Layout } from "@/components/layout";
import { StatsBar } from "@/components/stats-bar";
import { DeviceGrid } from "@/components/device-grid";
import { StreamViewer } from "@/components/stream-viewer";
import { EventConsole } from "@/components/event-console";
import { CommandPanel } from "@/components/command-panel";
import { useListDevices } from "@workspace/api-client-react";
import { useSocket } from "@/hooks/use-socket";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListDevicesQueryKey } from "@workspace/api-client-react";

export default function Dashboard() {
  const { data: devices, isLoading } = useListDevices();
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleDeviceStatus = (data: { deviceId: number; status: string }) => {
      queryClient.setQueryData(getListDevicesQueryKey(), (old: any) => {
        if (!old) return old;
        return old.map((d: any) => 
          d.id === data.deviceId ? { ...d, status: data.status } : d
        );
      });
    };

    socket.on("device:status", handleDeviceStatus);
    return () => {
      socket.off("device:status", handleDeviceStatus);
    };
  }, [socket, queryClient]);

  const activeDevices = devices?.filter(d => d.status !== 'offline').slice(0, 8) || [];

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-widest text-white">MISSION CONTROL</h1>
          <div className="text-xs font-mono text-muted-foreground flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_5px_rgba(0,255,136,0.8)]" />
            LIVE LINK ACTIVE
          </div>
        </div>

        <StatsBar />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
          <div className="lg:col-span-2">
            <StreamViewer devices={devices} />
          </div>
          <div>
            <CommandPanel devices={devices} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-widest text-white/80">ACTIVE DEVICES</h2>
              <span className="text-xs text-primary font-mono">{activeDevices.length} ONLINE</span>
            </div>
            <DeviceGrid devices={activeDevices} isLoading={isLoading} />
          </div>
          <div className="h-[500px]">
            <EventConsole />
          </div>
        </div>
      </div>
    </Layout>
  );
}
