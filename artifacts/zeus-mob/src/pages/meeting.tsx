import { useMemo, useState } from "react";
import { Layout, TopBar, Panel, PanelHeader } from "@/components/layout";

const G = "#00ff88";

const participants = [
  { id: 1, name: "Cliente 01", role: "Aluno", status: "online" },
  { id: 2, name: "Cliente 02", role: "Professor", status: "online" },
  { id: 3, name: "Cliente 03", role: "Observador", status: "idle" },
];

export default function Meeting() {
  const [sharing, setSharing] = useState(false);
  const [devices, setDevices] = useState<string[]>([]);
  const [joined, setJoined] = useState(true);

  const summary = useMemo(
    () => [
      { label: "SALAS ATIVAS", value: "03", color: G },
      { label: "PARTICIPANTES", value: String(participants.length), color: "#44aaff" },
      { label: "STATUS", value: joined ? "ONLINE" : "OFFLINE", color: joined ? G : "#ff4444" },
    ],
    [joined],
  );

  const handleShare = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setDevices(["Screen share indisponível neste navegador."]);
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const tracks = stream.getVideoTracks();
      setDevices(tracks.map((t) => t.label || "Tela compartilhada"));
      setSharing(true);
      tracks[0].onended = () => setSharing(false);
    } catch {
      setSharing(false);
    }
  };

  return (
    <Layout>
      <TopBar title="SALA DE REUNIÃO // SUPPORT ROOM">
        <span style={{ color: G }}>{joined ? "ONLINE" : "OFFLINE"}</span>
      </TopBar>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 10 }}>
        <Panel>
          <PanelHeader>
            <span>&gt; SALA DE REUNIÃO</span>
            <span style={{ color: "#445", fontSize: 8 }}>DARK / NEON</span>
          </PanelHeader>
          <div style={{ padding: 12, display: "grid", gap: 12 }}>
            <div
              style={{
                minHeight: 260,
                border: "1px solid rgba(0,255,136,0.14)",
                background:
                  "radial-gradient(circle at top left, rgba(0,255,136,0.10), transparent 30%), linear-gradient(180deg, rgba(10,12,18,0.96), rgba(3,5,8,0.96))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#8fa1b7",
                fontSize: 12,
                padding: 24,
              }}
            >
              <div>
                <div style={{ color: G, fontSize: 14, marginBottom: 8, letterSpacing: "0.2em" }}>
                  SESSÃO DE TREINAMENTO
                </div>
                <div>Use esta aba para chat, presença e orientação guiada.</div>
                <div style={{ marginTop: 10, color: "#445" }}>
                  Compartilhamento manual de tela pode ser iniciado pelo próprio usuário.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleShare}
                style={{
                  background: sharing ? "#1a0000" : G,
                  color: sharing ? "#ff4444" : "#000",
                  border: `1px solid ${sharing ? "#ff4444" : G}`,
                  padding: "10px 14px",
                  fontFamily: "inherit",
                  fontWeight: "bold",
                  cursor: "pointer",
                  letterSpacing: "0.15em",
                }}
              >
                {sharing ? "[ PARAR COMPARTILHAMENTO ]" : "[ COMPARTILHAR TELA ]"}
              </button>
              <button
                onClick={() => setJoined((v) => !v)}
                style={{
                  background: "transparent",
                  color: G,
                  border: `1px solid ${G}`,
                  padding: "10px 14px",
                  fontFamily: "inherit",
                  fontWeight: "bold",
                  cursor: "pointer",
                  letterSpacing: "0.15em",
                }}
              >
                {joined ? "[ SAIR DA SALA ]" : "[ ENTRAR NA SALA ]"}
              </button>
            </div>

            {devices.length > 0 && (
              <div style={{ color: "#8fa1b7", fontSize: 10 }}>
                Dispositivo: {devices.join(", ")}
              </div>
            )}
          </div>
        </Panel>

        <div style={{ display: "grid", gap: 10 }}>
          {summary.map((item) => (
            <Panel key={item.label}>
              <PanelHeader>
                <span>{item.label}</span>
              </PanelHeader>
              <div style={{ padding: 12, color: item.color, fontSize: 24, fontWeight: 700 }}>
                {item.value}
              </div>
            </Panel>
          ))}

          <Panel>
            <PanelHeader>
              <span>&gt; PARTICIPANTES</span>
            </PanelHeader>
            <div style={{ padding: 12, display: "grid", gap: 8 }}>
              {participants.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: "1px solid rgba(0,255,136,0.12)",
                    padding: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ color: "#f3f8ff", fontSize: 12 }}>{p.name}</div>
                    <div style={{ color: "#7a8699", fontSize: 9 }}>{p.role}</div>
                  </div>
                  <div style={{ color: p.status === "online" ? G : "#ffaa00", fontSize: 10 }}>
                    {p.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </Layout>
  );
}