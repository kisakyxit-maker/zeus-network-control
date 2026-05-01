import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { Device } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonitorPlay, VideoOff } from "lucide-react";

interface StreamViewerProps {
  devices?: Device[];
  preselectedDeviceId?: number;
}

export function StreamViewer({ devices = [], preselectedDeviceId }: StreamViewerProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    preselectedDeviceId ? String(preselectedDeviceId) : ""
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [frameData, setFrameData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socket = useSocket();

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
      }
    };

    socket.on("stream:frame", handleStreamFrame);
    
    // Auto-reset streaming state if no frames received recently
    const timeout = setTimeout(() => setIsStreaming(false), 2000);

    return () => {
      socket.off("stream:frame", handleStreamFrame);
      clearTimeout(timeout);
    };
  }, [selectedDeviceId, socket, frameData]);

  useEffect(() => {
    if (frameData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          // Keep aspect ratio
          const ratio = img.width / img.height;
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientWidth / ratio;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = frameData.startsWith('data:image') ? frameData : `data:image/jpeg;base64,${frameData}`;
      }
    }
  }, [frameData]);

  // Update selected device if preselected device changes (e.g. navigation)
  useEffect(() => {
    if (preselectedDeviceId) {
      setSelectedDeviceId(String(preselectedDeviceId));
    }
  }, [preselectedDeviceId]);

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-full border-white/10">
      <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2 text-sm font-bold tracking-wider">
          <MonitorPlay className="w-4 h-4 text-primary" />
          <span>LIVE STREAM</span>
          {isStreaming && (
            <span className="flex h-2 w-2 relative ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
        </div>
        
        {devices.length > 0 && !preselectedDeviceId && (
          <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
            <SelectTrigger className="w-[200px] h-8 text-xs bg-black/40 border-white/10">
              <SelectValue placeholder="Select device..." />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0b10] border-white/10">
              {devices.map(d => (
                <SelectItem key={d.id} value={String(d.id)} className="text-xs">
                  {d.name} {d.status === 'online' ? '(Online)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex-1 bg-black/60 relative flex items-center justify-center min-h-[300px] overflow-hidden">
        {selectedDeviceId ? (
          isStreaming ? (
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
          ) : (
            <div className="text-center text-muted-foreground flex flex-col items-center animate-pulse">
              <VideoOff className="w-12 h-12 mb-2 opacity-20" />
              <p className="font-mono text-sm">WAITING FOR STREAM SIGNAL...</p>
            </div>
          )
        ) : (
          <div className="text-center text-muted-foreground flex flex-col items-center">
            <MonitorPlay className="w-12 h-12 mb-2 opacity-20" />
            <p className="font-mono text-sm">SELECT A DEVICE TO VIEW STREAM</p>
          </div>
        )}
        
        {/* CRT Scanline effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />
      </div>
    </div>
  );
}
