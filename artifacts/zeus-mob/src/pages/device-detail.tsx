import { Layout } from "@/components/layout";
import { StreamViewer } from "@/components/stream-viewer";
import { EventConsole } from "@/components/event-console";
import { CommandPanel } from "@/components/command-panel";
import { DeviceStatusBadge } from "@/components/device-grid";
import { useGetDevice, getGetDeviceQueryKey } from "@workspace/api-client-react";
import { useSocket } from "@/hooks/use-socket";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Cpu, Network, Monitor, Battery, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const deviceId = parseInt(id, 10);
  
  const { data: device, isLoading } = useGetDevice(deviceId, { 
    query: { enabled: !!deviceId, queryKey: getGetDeviceQueryKey(deviceId) } 
  });
  
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleDeviceStatus = (data: { deviceId: number; status: string }) => {
      if (data.deviceId === deviceId) {
        queryClient.setQueryData(getGetDeviceQueryKey(deviceId), (old: any) => {
          if (!old) return old;
          return { ...old, status: data.status };
        });
      }
    };

    socket.on("device:status", handleDeviceStatus);
    return () => {
      socket.off("device:status", handleDeviceStatus);
    };
  }, [socket, queryClient, deviceId]);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-[1600px] mx-auto space-y-6">
          <Skeleton className="h-8 w-48 bg-white/5" />
          <Skeleton className="h-32 w-full bg-white/5 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] w-full bg-white/5 rounded-xl" />
            <Skeleton className="h-[400px] w-full bg-white/5 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!device) {
    return (
      <Layout>
        <div className="max-w-[1600px] mx-auto text-center py-20">
          <h2 className="text-2xl font-bold text-white mb-4">Device not found</h2>
          <Link href="/devices">
            <a className="text-primary hover:underline font-mono">Return to fleet</a>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div>
          <Link href="/devices">
            <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-4 font-mono text-sm cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              BACK TO FLEET
            </div>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center">
                <Monitor className="w-8 h-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black tracking-wider text-white">{device.name}</h1>
                  <DeviceStatusBadge status={device.status} />
                </div>
                <p className="text-sm font-mono text-muted-foreground tracking-wider uppercase">
                  {device.id} • REGISTERED {format(new Date(device.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="relative z-10 flex gap-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-none">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-bold tracking-widest flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> SYSTEM
                </span>
                <span className="font-mono text-sm text-white">{device.model}</span>
                <span className="font-mono text-xs text-white/60">{device.os} {device.osVersion}</span>
              </div>
              <div className="w-px bg-white/10 h-10 self-center hidden md:block" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-bold tracking-widest flex items-center gap-1">
                  <Network className="w-3 h-3" /> NETWORK
                </span>
                <span className="font-mono text-sm text-white">{device.ipAddress}</span>
                <span className="font-mono text-xs text-white/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 
                  {formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
                </span>
              </div>
              <div className="w-px bg-white/10 h-10 self-center hidden md:block" />
              <div className="flex flex-col gap-1 w-32">
                <span className="text-[10px] text-muted-foreground font-bold tracking-widest flex items-center justify-between">
                  <span className="flex items-center gap-1"><Battery className="w-3 h-3" /> POWER</span>
                  <span>{device.batteryLevel}%</span>
                </span>
                <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden mt-1.5 border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      device.batteryLevel > 20 ? "bg-primary" : "bg-destructive"
                    } shadow-[0_0_10px_currentColor]`}
                    style={{ width: `${device.batteryLevel}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[450px]">
          <StreamViewer preselectedDeviceId={device.id} />
          <CommandPanel preselectedDeviceId={device.id} />
        </div>

        <div className="h-[500px]">
          <EventConsole deviceId={device.id} />
        </div>
      </div>
    </Layout>
  );
}
