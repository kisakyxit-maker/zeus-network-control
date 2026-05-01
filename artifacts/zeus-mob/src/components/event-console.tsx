import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useListEvents, DeviceEvent } from "@workspace/api-client-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, ShieldAlert, Info, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface EventConsoleProps {
  deviceId?: number;
  className?: string;
}

export function EventConsole({ deviceId, className = "" }: EventConsoleProps) {
  const socket = useSocket();
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: initialEvents } = useListEvents(
    { limit: 50, deviceId },
    { query: { enabled: true } }
  );

  useEffect(() => {
    if (initialEvents) {
      setEvents(initialEvents);
    }
  }, [initialEvents]);

  useEffect(() => {
    const handleNewEvent = (newEvent: DeviceEvent) => {
      if (deviceId && newEvent.deviceId !== deviceId) return;
      
      setEvents(prev => {
        const updated = [newEvent, ...prev];
        return updated.slice(0, 200); // Keep max 200 entries
      });
    };

    socket.on("event:new", handleNewEvent);
    return () => {
      socket.off("event:new", handleNewEvent);
    };
  }, [socket, deviceId]);

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'error':
      case 'critical':
        return <ShieldAlert className="w-3 h-3 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      default:
        return <Info className="w-3 h-3 text-blue-400" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'error':
      case 'critical':
        return 'text-destructive';
      case 'warning':
        return 'text-yellow-500';
      case 'success':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className={`glass-panel rounded-xl overflow-hidden flex flex-col h-full border-white/10 ${className}`}>
      <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-black/20">
        <Terminal className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold tracking-wider">EVENT CONSOLE</span>
        <div className="ml-auto text-[10px] text-muted-foreground font-mono">
          {events.length} EVENTS
        </div>
      </div>
      
      <div className="flex-1 bg-[#050508] relative">
        <ScrollArea className="h-full absolute inset-0" ref={scrollRef}>
          <div className="p-4 space-y-2 font-mono text-xs">
            {events.map((event, i) => (
              <div key={event.id || i} className="flex gap-3 group hover:bg-white/5 p-1 rounded transition-colors">
                <div className="opacity-50 shrink-0 w-[60px]">
                  {format(new Date(event.createdAt), 'HH:mm:ss')}
                </div>
                <div className="shrink-0 mt-0.5">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0 break-words">
                  <span className={`font-bold mr-2 ${getEventColor(event.type)}`}>
                    [{event.type.toUpperCase()}]
                  </span>
                  {!deviceId && (
                    <span className="text-white/60 mr-2">
                      {event.deviceName}
                    </span>
                  )}
                  <span className="text-white/80">{event.message}</span>
                </div>
              </div>
            ))}
            
            {events.length === 0 && (
              <div className="text-muted-foreground italic opacity-50 p-2">
                Awaiting events...
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
