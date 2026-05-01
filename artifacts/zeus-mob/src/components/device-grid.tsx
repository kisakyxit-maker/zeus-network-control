import { Link } from "wouter";
import { Device } from "@workspace/api-client-react";
import { Battery, Activity, Clock, Server } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DeviceGridProps {
  devices: Device[];
  isLoading?: boolean;
}

export function DeviceStatusBadge({ status }: { status: Device["status"] }) {
  const statusConfig = {
    online: { color: "bg-primary text-primary-foreground", glow: "shadow-[0_0_10px_rgba(0,255,136,0.5)]" },
    idle: { color: "bg-yellow-500 text-black", glow: "shadow-[0_0_10px_rgba(234,179,8,0.5)]" },
    busy: { color: "bg-blue-500 text-white", glow: "shadow-[0_0_10px_rgba(59,130,246,0.5)]" },
    offline: { color: "bg-destructive text-destructive-foreground", glow: "" },
  };

  const config = statusConfig[status];

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${config.color} ${config.glow}`}>
      {status}
    </span>
  );
}

export function DeviceGrid({ devices, isLoading }: DeviceGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel h-40 rounded-xl animate-pulse bg-white/5" />
        ))}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 glass-panel rounded-xl text-muted-foreground border-dashed">
        <Server className="w-12 h-12 mb-4 opacity-50" />
        <p>No devices connected</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {devices.map((device) => (
        <Link key={device.id} href={`/devices/${device.id}`} className="block group">
          <div className="glass-panel rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(0,255,136,0.15)] hover:border-primary/50 relative overflow-hidden h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">
                  {device.name}
                </h3>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {device.model} • {device.os} {device.osVersion}
                </p>
              </div>
              <DeviceStatusBadge status={device.status} />
            </div>

            <div className="space-y-3 mt-auto">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Battery className="w-3 h-3" /> Battery
                  </span>
                  <span className="font-mono">{device.batteryLevel}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      device.batteryLevel > 20 ? "bg-primary" : "bg-destructive"
                    }`}
                    style={{ width: `${device.batteryLevel}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-white/5 pt-2 mt-2">
                <span className="font-mono">{device.ipAddress}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            {device.status === 'online' && (
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-ping opacity-75" />
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
