import { useGetDeviceStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Zap, Moon, AlertCircle, CheckCircle2 } from "lucide-react";

export function StatsBar() {
  const { data: stats, isLoading } = useGetDeviceStats();

  if (isLoading) {
    return <Skeleton className="h-24 w-full bg-white/5 border border-white/10 rounded-lg" />;
  }

  if (!stats) return null;

  const statItems = [
    { label: "Total Devices", value: stats.total, icon: Activity, color: "text-white" },
    { label: "Online", value: stats.online, icon: CheckCircle2, color: "text-primary" },
    { label: "Offline", value: stats.offline, icon: AlertCircle, color: "text-destructive" },
    { label: "Busy", value: stats.busy, icon: Zap, color: "text-blue-500" },
    { label: "Idle", value: stats.idle, icon: Moon, color: "text-yellow-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} className="glass-panel rounded-lg p-4 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between z-10 relative">
              <span className="text-sm text-muted-foreground font-mono">{item.label}</span>
              <Icon className={`w-4 h-4 ${item.color} opacity-70`} />
            </div>
            <div className="mt-4 z-10 relative">
              <span className={`text-3xl font-bold tracking-tighter ${item.color}`}>
                {item.value}
              </span>
            </div>
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-10 bg-current ${item.color}`} />
          </div>
        );
      })}
    </div>
  );
}
