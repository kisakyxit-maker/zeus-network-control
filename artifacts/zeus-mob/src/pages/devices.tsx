import { Layout } from "@/components/layout";
import { DeviceGrid } from "@/components/device-grid";
import { useListDevices } from "@workspace/api-client-react";
import { useSocket } from "@/hooks/use-socket";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListDevicesQueryKey } from "@workspace/api-client-react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Devices() {
  const { data: devices, isLoading } = useListDevices();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

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

  const filteredDevices = devices?.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.model.toLowerCase().includes(search.toLowerCase()) ||
    d.ipAddress.includes(search)
  ) || [];

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-widest text-white">DEVICE FLEET</h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">Manage and monitor all connected terminals</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search devices..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-black/40 border-white/10 text-white font-mono text-sm focus-visible:ring-primary focus-visible:border-primary transition-all"
              />
            </div>
            <button className="h-10 px-4 flex items-center justify-center gap-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold tracking-wider">
              <Filter className="w-4 h-4" />
              FILTER
            </button>
          </div>
        </div>

        <DeviceGrid devices={filteredDevices} isLoading={isLoading} />
      </div>
    </Layout>
  );
}
