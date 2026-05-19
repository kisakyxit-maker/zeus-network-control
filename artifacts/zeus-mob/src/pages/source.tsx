import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { useSocket } from "@/hooks/use-socket";

const G = "#00ff88";
const DIM = "#1a3a20";

export default function Source() {
  const { id } = useParams<{ id: string }>();
  const deviceId = Number(id);
  const socket = useSocket();

  const [streaming, setStreaming] = useState(false);
  const [fps, setFps] = useState(0);
  const [quality, setQuality] = useState(30);
  const [targetFps, setTargetFps] = useState(12);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(socket.connected);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const sentTimes = useRef<number[]>([]);
  const lastSendRef = useRef(0);
  const qualityRef = useRef(quality);
  const fpsRef = useRef(targetFps);

  useEffect(() => { qualityRef.current = quality; }, [quality]);
  useEffect(() => { fpsRef.current = targetFps; }, [targetFps]);

  useEffect(() => {
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    socket.on("connect", on);
    socket.on("disconnect", off);
    if (!socket.connected) socket.connect();
    return () => { socket.off("connect", on); socket.off("disconnect", off); };
  }, [socket]);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStreaming(false);
    setFps(0);
    sentTimes.current = [];
  };

  const start = async () => {
    setError(null);
    try {
      const media = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30, max: 60 } },
        audio: false,
      });
      streamRef.current = media;
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play().catch(() => {});
      }
      media.getVideoTracks()[0].addEventListener("ended", stop);
      setStreaming(true);
      loop();
    } catch (e: any) {
      setError(e?.message || "Falha ao capturar tela. Permissão negada?");
    }
  };

  const loop = () => {
    const tick = () => {
      const now = performance.now();
      const interval = 1000 / Math.max(1, Math.min(30, fpsRef.current));
      if (now - lastSendRef.current >= interval) {
        lastSendRef.current = now;
        sendFrame();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const sendFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    const maxW = 960;
    const scale = Math.min(1, maxW / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const q = Math.max(0.05, Math.min(1, qualityRef.current / 100));
    const dataUrl = canvas.toDataURL("image/jpeg", q);

    socket.emit("device:stream", { deviceId, frame: dataUrl });

    const t = Date.now();
    sentTimes.current.push(t);
    sentTimes.current = sentTimes.current.filter((s) => t - s < 1000);
    setFps(sentTimes.current.length);
  };

  useEffect(() => () => stop(), []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: G,
        fontFamily: "monospace",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 16, fontWeight: "bold", letterSpacing: "0.15em" }}>
          ZEUS · FONTE DE TELA
        </div>
        <div style={{ fontSize: 10, color: "#445" }}>DEVICE #{deviceId}</div>
        <div style={{ fontSize: 10, color: connected ? G : "#ff4444", marginLeft: "auto" }}>
          {connected ? "● ONLINE" : "● OFFLINE"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {!streaming ? (
          <button
            onClick={start}
            style={{
              background: G,
              color: "#000",
              border: `1px solid ${G}`,
              padding: "8px 18px",
              fontSize: 11,
              fontFamily: "inherit",
              fontWeight: "bold",
              letterSpacing: "0.12em",
              cursor: "pointer",
              boxShadow: `0 0 15px ${G}55`,
            }}
          >
            ▶ INICIAR COMPARTILHAMENTO
          </button>
        ) : (
          <button
            onClick={stop}
            style={{
              background: "#1a0000",
              color: "#ff4444",
              border: "1px solid #ff4444",
              padding: "8px 18px",
              fontSize: 11,
              fontFamily: "inherit",
              fontWeight: "bold",
              letterSpacing: "0.12em",
              cursor: "pointer",
            }}
          >
            ■ PARAR
          </button>
        )}
        <span style={{ fontSize: 10, color: fps > 0 ? G : "#664" }}>{fps} FPS</span>

        <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: 12 }}>
          <span style={{ fontSize: 9, color: "#445" }}>QUALIDADE:</span>
          {[10, 20, 30, 70, 100].map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              style={{
                background: quality === q ? G : "transparent",
                color: quality === q ? "#000" : "#445",
                border: `1px solid ${quality === q ? G : "#223"}`,
                fontSize: 9,
                padding: "2px 7px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: "bold",
              }}
            >
              {q}%
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: 8 }}>
          <span style={{ fontSize: 9, color: "#445" }}>FPS ALVO:</span>
          {[5, 10, 15, 24].map((f) => (
            <button
              key={f}
              onClick={() => setTargetFps(f)}
              style={{
                background: targetFps === f ? G : "transparent",
                color: targetFps === f ? "#000" : "#445",
                border: `1px solid ${targetFps === f ? G : "#223"}`,
                fontSize: 9,
                padding: "2px 7px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: "bold",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ color: "#ff4444", fontSize: 11, border: "1px solid #ff4444", padding: 8 }}>
          {error}
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 240,
          background: "#020e05",
          border: `1px solid ${streaming ? G : DIM}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          boxShadow: streaming ? `0 0 24px ${G}33` : "none",
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "contain", display: streaming ? "block" : "none" }}
        />
        {!streaming && (
          <div style={{ color: "#334", fontSize: 11, textAlign: "center", padding: 24 }}>
            CLIQUE EM <span style={{ color: G }}>INICIAR COMPARTILHAMENTO</span> E ESCOLHA A TELA / ABA<br />
            QUE DESEJA ESPELHAR PARA O PAINEL.
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <div style={{ fontSize: 9, color: "#445", letterSpacing: "0.08em", lineHeight: 1.6 }}>
        ▸ ESTA PÁGINA TRANSMITE O QUE VOCÊ ESCOLHER NO DIÁLOGO DO NAVEGADOR PARA O DEVICE #{deviceId} EM TEMPO REAL.<br />
        ▸ MANTENHA A ABA ABERTA. ANDROID CHROME: ESCOLHA "ESTA ABA" OU "TELA INTEIRA".<br />
        ▸ FECHAR ESTA ABA OU CLICAR EM PARAR ENCERRA O ESPELHAMENTO.
      </div>
    </div>
  );
}
