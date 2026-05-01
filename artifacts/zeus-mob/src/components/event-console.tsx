import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useListEvents, DeviceEvent } from "@workspace/api-client-react";
import { format } from "date-fns";

interface EventConsoleProps {
  deviceId?: number;
  className?: string;
  height?: string | number;
}

export function EventConsole({ deviceId, height = "100%" }: EventConsoleProps) {
  const socket = useSocket();
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: initialEvents } = useListEvents(
    { limit: 50, deviceId },
    { query: { enabled: true } }
  );

  useEffect(() => {
    if (initialEvents) setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    const handleNewEvent = (newEvent: DeviceEvent) => {
      if (deviceId && newEvent.deviceId !== deviceId) return;
      setEvents(prev => [newEvent, ...prev].slice(0, 200));
    };
    socket.on("event:new", handleNewEvent);
    return () => { socket.off("event:new", handleNewEvent); };
  }, [socket, deviceId]);

  const getColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "error": case "critical": return "#ff4444";
      case "warning": return "#ffaa00";
      case "command": return "#4499ff";
      case "connection": return "#00ff00";
      case "disconnection": return "#ff6666";
      default: return "#00cc00";
    }
  };

  const getPrefix = (type: string) => {
    switch (type.toLowerCase()) {
      case "error": case "critical": return "[ERR]";
      case "warning": return "[WRN]";
      case "command": return "[CMD]";
      case "connection": return "[CON]";
      case "disconnection": return "[DIS]";
      default: return "[INF]";
    }
  };

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", height, overflow: "hidden" }}>
      <div className="panel-header">
        <span>&gt;_</span>
        <span>EVENT CONSOLE</span>
        <span style={{ marginLeft: "auto", color: "#444" }}>{events.length} ENTRIES</span>
      </div>
      <div
        data-testid="event-console-body"
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#000",
          padding: "4px 6px",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 10,
          lineHeight: 1.5,
          color: "#00cc00",
        }}
      >
        {events.length === 0 && (
          <div style={{ color: "#333", padding: "4px 0" }}>
            &gt; awaiting events<span className="blink">_</span>
          </div>
        )}
        {events.map((event, i) => (
          <div
            key={event.id ?? i}
            data-testid={`event-entry-${event.id}`}
            style={{ display: "flex", gap: 6, padding: "1px 0", borderBottom: "1px solid #060606" }}
          >
            <span style={{ color: "#333", flexShrink: 0, width: 52 }}>
              {format(new Date(event.createdAt), "HH:mm:ss")}
            </span>
            <span style={{ color: getColor(event.type), flexShrink: 0, width: 36 }}>
              {getPrefix(event.type)}
            </span>
            {!deviceId && (
              <span style={{ color: "#00aa88", flexShrink: 0, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {event.deviceName}
              </span>
            )}
            <span style={{ color: "#00cc00", wordBreak: "break-all" }}>{event.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
