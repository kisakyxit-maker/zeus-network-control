import { useEffect, useMemo, useRef, useState } from "react";
import { Layout, TopBar, Panel, PanelHeader } from "@/components/layout";

const G = "#00ff88";

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  id: number;
  points: Point[];
};

const participants = [
  { id: 1, name: "Cliente 01", role: "Aluno", status: "online" },
  { id: 2, name: "Cliente 02", role: "Professor", status: "online" },
  { id: 3, name: "Cliente 03", role: "Observador", status: "idle" },
];

export default function Meeting() {
  const [sharing, setSharing] = useState(false);
  const [devices, setDevices] = useState<string[]>([]);
  const [joined, setJoined] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [shareStatus, setShareStatus] = useState("Pronto para compartilhar");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const drawStateRef = useRef<{ id: number; active: boolean }>({ id: 0, active: false });

  const summary = useMemo(
    () => [
      { label: "SALAS ATIVAS", value: "03", color: G },
      { label: "PARTICIPANTES", value: String(participants.length), color: "#44aaff" },
      { label: "STATUS", value: joined ? "ONLINE" : "OFFLINE", color: joined ? G : "#ff4444" },
    ],
    [joined],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * window.devicePixelRatio));
      canvas.height = Math.max(1, Math.floor(rect.height * window.devicePixelRatio));
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      strokes.forEach((stroke) => {
        ctx.strokeStyle = G;
        ctx.beginPath();
        stroke.points.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      });
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [strokes]);

  const pushPoint = (x: number, y: number) => {
    const id = drawStateRef.current.id;
    setStrokes((current) => {
      const next = [...current];
      const last = next[next.length - 1];
      if (!last || last.id !== id) return next;
      last.points = [...last.points, { x, y }];
      return [...next];
    });
  };

  const startStroke = (x: number, y: number) => {
    const id = Date.now();
    drawStateRef.current = { id, active: true };
    setDrawing(true);
    setStrokes((current) => [...current, { id, points: [{ x, y }] }]);
  };

  const stopStroke = () => {
    drawStateRef.current.active = false;
    setDrawing(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    startStroke(event.clientX - rect.left, event.clientY - rect.top);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawStateRef.current.active) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pushPoint(event.clientX - rect.left, event.clientY - rect.top);
  };

  const handlePointerUp = () => stopStroke();

  const clearCanvas = () => setStrokes([]);

  const handleShare = async () => {
    try {
      const media = navigator.mediaDevices;
      const getDisplayMedia = media?.getDisplayMedia?.bind(media);
      if (!getDisplayMedia) {
        setShareStatus("Compartilhamento sem suporte neste navegador");
        setDevices(["Compatibilidade limitada"]);
        return;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setShareStatus("Abrindo seletor de tela...");
      const stream = await getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      const tracks = stream.getVideoTracks();
      setDevices(tracks.map((t) => t.label || "Tela compartilhada"));
      setSharing(true);
      setShareStatus("Compartilhando tela");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(() => undefined);
      }
      const screenTrack = tracks[0];
      screenTrack.onended = () => {
        setSharing(false);
        setPreview(null);
        setShareStatus("Compartilhamento encerrado");
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };
      const captureFrame = () => {
        if (!videoRef.current || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) return;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setPreview(canvas.toDataURL("image/png"));
      };
      captureFrame();
      const timer = window.setInterval(captureFrame, 1200);
      screenTrack.addEventListener("ended", () => window.clearInterval(timer), { once: true });
    } catch {
      setSharing(false);
      setShareStatus("Falha ao iniciar compartilhamento");
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
              <div style={{ width: "100%", display: "grid", gap: 12 }}>
                <div>
                  <div style={{ color: G, fontSize: 14, marginBottom: 8, letterSpacing: "0.2em" }}>
                    SESSÃO DE TREINAMENTO
                  </div>
                  <div>Use esta aba para chat, presença e orientação guiada.</div>
                  <div style={{ marginTop: 10, color: "#445" }}>{shareStatus}</div>
                </div>
                <video ref={videoRef} muted playsInline style={{ width: "100%", border: "1px solid rgba(0,255,136,0.14)", background: "#000" }} />
                {preview && (
                  <img
                    src={preview}
                    alt="preview"
                    style={{ width: "100%", border: "1px solid rgba(0,255,136,0.14)" }}
                  />
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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

          <Panel>
            <PanelHeader>
              <span>&gt; CANVAS COLABORATIVO</span>
              <button
                onClick={clearCanvas}
                style={{
                  background: "transparent",
                  border: "none",
                  color: G,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 8,
                  letterSpacing: "0.12em",
                }}
              >
                LIMPAR
              </button>
            </PanelHeader>
            <div style={{ padding: 12 }}>
              <div style={{ color: "#7a8699", fontSize: 10, marginBottom: 10 }}>
                Desenho local com estrutura pronta para sincronização visual entre participantes.
              </div>
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                style={{
                  width: "100%",
                  height: 220,
                  display: "block",
                  border: "1px solid rgba(0,255,136,0.18)",
                  background:
                    "linear-gradient(180deg, rgba(8,12,16,0.98), rgba(4,6,8,0.98)), radial-gradient(circle at top right, rgba(0,255,136,0.08), transparent 35%)",
                  touchAction: "none",
                  cursor: drawing ? "crosshair" : "crosshair",
                }}
              />
            </div>
          </Panel>
        </div>
      </div>
    </Layout>
  );
}
