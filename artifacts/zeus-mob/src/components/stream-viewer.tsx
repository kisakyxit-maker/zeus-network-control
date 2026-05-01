import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { Device } from "@workspace/api-client-react";

interface StreamViewerProps {
  devices?: Device[];
  preselectedDeviceId?: number;
  height?: string | number;
}

export function StreamViewer({ devices = [], preselectedDeviceId, height = "100%" }: StreamViewerProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    preselectedDeviceId ? String(preselectedDeviceId) : ""
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [frameData, setFrameData] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socket = useSocket();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!selectedDeviceId) {
      setIsStreaming(false);
      setFrameData(null);
      return;
    }
    const handleStreamFrame = (data: { deviceId: number; frame: string }) => {
      if (String(data.deviceId) === selectedDeviceId) {
        setIsStreaming(true);
        setFrameData(data.frame);
        setFrameCount(c => c + 1);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsStreaming(false), 3000);
      }
    };
    socket.on("stream:frame", handleStreamFrame);
    return () => {
      socket.off("stream:frame", handleStreamFrame);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [selectedDeviceId, socket]);

  useEffect(() => {
    if (frameData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientWidth / (img.width / img.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = frameData.startsWith("data:image") ? frameData : `data:image/jpeg;base64,${frameData}`;
      }
    }
  }, [frameData]);

  useEffect(() => {
    if (preselectedDeviceId) setSelectedDeviceId(String(preselectedDeviceId));
  }, [preselectedDeviceId]);

  const selectedDevice = devices.find(d => String(d.id) === selectedDeviceId);

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", height, overflow: "hidden" }}>
      <div className="panel-header" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>▶</span>
          <span>LIVE STREAM</span>
          {isStreaming && (
            <>
              <span className="status-dot status-online blink" />
              <span style={{ color: "#ff0000", fontSize: 9 }}>REC</span>
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isStreaming && <span style={{ fontSize: 9, color: "#555" }}>FRAMES: {frameCount}</span>}
          {devices.length > 0 && !preselectedDeviceId && (
            <select
              data-testid="stream-device-select"
              value={selectedDeviceId}
              onChange={e => setSelectedDeviceId(e.target.value)}
              style={{
                background: "#000",
                border: "1px solid #333",
                color: "#00ff00",
                fontSize: 9,
                padding: "2px 4px",
                fontFamily: "'Courier New', monospace",
                cursor: "pointer",
              }}
            >
              <option value="">-- SELECT DEVICE --</option>
              {devices.map(d => (
                <option key={d.id} value={String(d.id)}>
                  {d.name} [{d.status.toUpperCase()}]
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          background: "#000",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {selectedDeviceId ? (
          isStreaming ? (
            <canvas ref={canvasRef} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <div style={{ textAlign: "center", color: "#333", fontFamily: "'Courier New', monospace", fontSize: 11 }}>
              <div style={{ marginBottom: 8, fontSize: 18 }}>□</div>
              <div>WAITING FOR SIGNAL</div>
              <div style={{ fontSize: 9, color: "#222", marginTop: 4 }}>{selectedDevice?.name}</div>
            </div>
          )
        ) : (
          <div style={{ textAlign: "center", color: "#333", fontFamily: "'Courier New', monospace", fontSize: 11 }}>
            <div style={{ marginBottom: 8, fontSize: 18 }}>▣</div>
            <div>SELECT A DEVICE TO VIEW STREAM</div>
          </div>
        )}

        <div className="scanline-overlay" />

        {selectedDeviceId && (
          <div style={{
            position: "absolute",
            bottom: 6,
            right: 6,
            fontSize: 9,
            color: isStreaming ? "#00ff00" : "#333",
            fontFamily: "'Courier New', monospace",
          }}>
            {isStreaming ? "● LIVE" : "○ STANDBY"}
          </div>
        )}
      </div>
    </div>
  );
}
