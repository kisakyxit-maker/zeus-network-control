import { useGetDeviceStats } from "@workspace/api-client-react";

export function StatsBar() {
  const { data: stats, isLoading } = useGetDeviceStats();

  const items = [
    { label: "Total Devices", value: stats?.total ?? 0, color: "#aaa", icon: "⬡" },
    { label: "Online", value: stats?.online ?? 0, color: "#00ff00", icon: "▲" },
    { label: "Offline", value: stats?.offline ?? 0, color: "#ff4444", icon: "▼" },
    { label: "Busy", value: stats?.busy ?? 0, color: "#4499ff", icon: "◆" },
    { label: "Idle", value: stats?.idle ?? 0, color: "#ffaa00", icon: "◇" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 8 }}>
      {items.map((item) => (
        <div
          key={item.label}
          className="stat-box"
          data-testid={`stat-${item.label.toLowerCase().replace(/\s/g, "-")}`}
        >
          <div className="stat-label">
            <span style={{ marginRight: 4, color: item.color }}>{item.icon}</span>
            {item.label}
          </div>
          {isLoading ? (
            <div style={{ fontSize: 22, color: "#333" }}>--</div>
          ) : (
            <div className="stat-value" style={{ color: item.color }}>
              {item.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
