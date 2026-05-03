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
import atlasPreview from "@assets/screenshot-1777787986236.png";

const G = "#00ff88";
const BG = "#0a0b10";

function GlassCard({
  title,
  value,
  desc,
  accent = G,
}: {
  title: string;
  value: string;
  desc: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(17,20,30,0.82), rgba(9,11,16,0.72))",
        border: "1px solid rgba(0,255,136,0.18)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 24px rgba(0,255,136,0.05)",
        backdropFilter: "blur(16px)",
        padding: 14,
        minHeight: 96,
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: "0.16em", color: "#6c798d", marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent, textShadow: `0 0 12px ${accent}66` }}>{value}</div>
      <div style={{ fontSize: 10, color: "#91a0b9", marginTop: 6, lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

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
    <div style={{ minHeight: "100vh", background: BG }}>
      <Layout>
        <TopBar title="ZEUS MOB // MISSION CONTROL">
          <span style={{ color: G }}>{online} ONLINE</span>
          <span style={{ color: "#334" }}>|</span>
          <span style={{ color: "#445" }}>{total} TOTAL</span>
        </TopBar>

        <div
          style={{
            position: "relative",
            marginBottom: 12,
            padding: 18,
            border: "1px solid rgba(0,255,136,0.16)",
            background:
              "linear-gradient(135deg, rgba(10,11,16,0.96), rgba(13,17,27,0.82)), radial-gradient(circle at top right, rgba(0,255,136,0.14), transparent 35%)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 0 40px rgba(0,255,136,0.04)",
            overflow: "hidden",
          }}
        >
          <div className="scanline-overlay" />
          <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#6c798d", letterSpacing: "0.22em", marginBottom: 10 }}>
                UI / UX CONTROL SURFACE
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#f3f8ff", lineHeight: 1.1 }}>
                Dark glass interface with neon telemetry.
              </div>
              <div style={{ marginTop: 10, color: "#94a3b8", fontSize: 12, lineHeight: 1.7, maxWidth: 760 }}>
                Painel responsivo para acompanhamento visual, filas de eventos, console em tempo real e indicadores de operação.
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <GlassCard title="SYSTEM LOAD" value="82%" desc="Renderização estável com destaque em verde neon." />
              <GlassCard title="SESSION UP" value="14h" desc="Tempo de atividade e conexão visual contínua." accent="#44aaff" />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <Panel>
            <PanelHeader>
              <span>&gt; APRESENTAÇÃO VISUAL</span>
              <span style={{ color: "#445", fontSize: 8, letterSpacing: "0.08em" }}>ATLAS PREVIEW</span>
            </PanelHeader>
            <div
              style={{
                padding: 12,
                background: "linear-gradient(180deg, rgba(12,16,24,0.85), rgba(5,7,10,0.85))",
              }}
            >
              <img
                src={atlasPreview}
                alt="Preview Atlas"
                style={{
                  width: "100%",
                  display: "block",
                  border: "1px solid rgba(0,255,136,0.14)",
                  boxShadow: "0 0 24px rgba(0,255,136,0.08)",
                  objectFit: "cover",
                }}
              />
            </div>
          </Panel>
          <Panel>
            <PanelHeader>
              <span>&gt; SYSTEM SNAPSHOT</span>
              <span style={{ color: "#445", fontSize: 8, letterSpacing: "0.08em" }}>UI STATE</span>
            </PanelHeader>
            <div style={{ padding: 12, display: "grid", gap: 10 }}>
              {[
                { label: "FRAMEWORK", value: "React + Vite", color: G },
                { label: "THEME", value: "Dark / Glass / Neon", color: "#44aaff" },
                { label: "LAYOUT", value: "Responsive Grid", color: "#ffaa00" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: 12,
                    border: "1px solid rgba(0,255,136,0.12)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{ fontSize: 9, color: "#708097", letterSpacing: "0.16em" }}>{item.label}</div>
                  <div style={{ marginTop: 6, color: item.color, fontWeight: 700, fontSize: 18 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <StatsBar />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 12 }}>
          {[
            { href: "/clientes", icon: "📱", label: "CLIENTES", desc: `${total} dispositivos`, color: G },
            { href: "/administrador", icon: "🔐", label: "ADMINISTRADOR", desc: "Logs & Events", color: "#44aaff" },
            { href: "/members", icon: "👥", label: "SOCIOS", desc: "Gestão de membros", color: "#ffaa00" },
            { href: "/apk-generator", icon: "⚙", label: "GERADOR APK", desc: "Build & Deploy", color: "#aa88ff" },
          ].map((card) => (
            <Link key={card.href} href={card.href}>
              <div
                style={{
                  background: "linear-gradient(180deg, rgba(12,16,24,0.95), rgba(7,10,16,0.9))",
                  border: "1px solid rgba(0,255,136,0.14)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 0 18px rgba(0,255,136,0.04)",
                  backdropFilter: "blur(14px)",
                  padding: "14px 12px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "left",
                  minHeight: 92,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = card.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(0,255,136,0.14)";
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{card.icon}</div>
                <div style={{ fontSize: 10, fontWeight: "bold", color: card.color, letterSpacing: "0.12em", marginBottom: 4 }}>
                  {card.label}
                </div>
                <div style={{ fontSize: 8, color: "#7a8699", lineHeight: 1.5 }}>{card.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 10 }}>
          <Panel>
            <PanelHeader>
              <span>&gt; STATUS DO SISTEMA</span>
              <span style={{ color: "#445", fontSize: 8, letterSpacing: "0.08em" }}>REALTIME HEALTH</span>
            </PanelHeader>
            <div style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {[
                { k: "CORE ENGINE", v: "RUNNING", d: "Pipeline principal operacional", c: G },
                { k: "SYNC QUEUE", v: "98%", d: "Sincronização com baixa latência", c: "#44aaff" },
                { k: "EVENT BUS", v: "ACTIVE", d: "Recebendo eventos e atualizações", c: "#ffaa00" },
                { k: "UI RENDER", v: "STABLE", d: "Camadas visuais e glassmorphism", c: "#ffcc66" },
              ].map((item) => (
                <div
                  key={item.k}
                  style={{
                    background: "linear-gradient(180deg, rgba(8,10,14,0.96), rgba(5,7,10,0.9))",
                    border: "1px solid rgba(0,255,136,0.14)",
                    padding: 12,
                    minHeight: 92,
                  }}
                >
                  <div style={{ fontSize: 9, color: "#6b7687", letterSpacing: "0.16em", marginBottom: 10 }}>{item.k}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: item.c, textShadow: `0 0 12px ${item.c}55` }}>{item.v}</div>
                  <div style={{ fontSize: 10, color: "#91a0b9", marginTop: 6, lineHeight: 1.5 }}>{item.d}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader>
              <span>&gt; DISPOSITIVOS ATIVOS</span>
              <Link href="/clientes">
                <span
                  style={{ color: "#445", cursor: "pointer", fontSize: 8, letterSpacing: "0.08em" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = G;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#445";
                  }}
                >
                  VER TODOS →
                </span>
              </Link>
            </PanelHeader>
            <div style={{ maxHeight: 290, overflowY: "auto" }}>
              {!devices || devices.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#334", fontSize: 10 }}>
                  &gt; AGUARDANDO CONEXÕES DE DISPOSITIVOS...
                </div>
              ) : (
                devices.slice(0, 8).map((d: any) => {
                  const isOnline = d.status === "online" || d.status === "idle";
                  return (
                    <Link key={d.id} href="/clientes">
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "10px 1fr auto",
                          gap: 10,
                          padding: "8px 12px",
                          borderBottom: "1px solid rgba(0,255,136,0.08)",
                          alignItems: "center",
                          cursor: "pointer",
                          fontSize: 10,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(0,255,136,0.03)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
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
                          <div style={{ color: "#f4f7fb", fontWeight: "bold", fontSize: 10 }}>{d.name}</div>
                          <div style={{ color: "#64748b", fontSize: 8 }}>{d.model || "Android"}</div>
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
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <EventConsole height={420} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Panel>
              <PanelHeader>
                <span>&gt; RESUMO VISUAL</span>
                <span style={{ color: "#445", fontSize: 8, letterSpacing: "0.08em" }}>GLASS / NEON</span>
              </PanelHeader>
              <div style={{ padding: 12, color: "#91a0b9", fontSize: 11, lineHeight: 1.8 }}>
                Interface desenhada com camadas escuras, bordas sutis e realces em verde neon para leitura rápida.
                Todos os elementos visuais estão declarados localmente no arquivo e no sistema de componentes já existente.
              </div>
            </Panel>
            <CommandPanel devices={devices} height={200} />
          </div>
        </div>
      </Layout>
    </div>
  );
}
