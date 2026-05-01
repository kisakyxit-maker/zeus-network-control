import { useState } from "react";
import { useListCommands, useSendCommand, Device } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TerminalSquare, Play, RefreshCw, Power, Lock, Search, Shield, Zap } from "lucide-react";

interface CommandPanelProps {
  devices?: Device[];
  preselectedDeviceId?: number;
}

export function CommandPanel({ devices = [], preselectedDeviceId }: CommandPanelProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    preselectedDeviceId ? String(preselectedDeviceId) : ""
  );
  
  const { data: commands, isLoading } = useListCommands();
  const sendCommand = useSendCommand();
  const { toast } = useToast();

  const handleCommand = (commandId: string, commandLabel: string) => {
    if (!selectedDeviceId) {
      toast({
        title: "Error",
        description: "Please select a device first",
        variant: "destructive"
      });
      return;
    }

    const deviceId = parseInt(selectedDeviceId, 10);

    sendCommand.mutate({
      data: { deviceId, command: commandId }
    }, {
      onSuccess: (result) => {
        toast({
          title: "Command Sent",
          description: `[${commandLabel}] executed. ${result.message}`,
          className: "border-primary bg-black/80 text-primary"
        });
      },
      onError: (error: any) => {
        toast({
          title: "Command Failed",
          description: error.message || "Failed to execute command",
          variant: "destructive"
        });
      }
    });
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'refresh-cw': return <RefreshCw className="w-4 h-4 mr-2" />;
      case 'power': return <Power className="w-4 h-4 mr-2" />;
      case 'lock': return <Lock className="w-4 h-4 mr-2" />;
      case 'search': return <Search className="w-4 h-4 mr-2" />;
      case 'shield': return <Shield className="w-4 h-4 mr-2" />;
      case 'zap': return <Zap className="w-4 h-4 mr-2" />;
      default: return <Play className="w-4 h-4 mr-2" />;
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-full border-white/10">
      <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2 text-sm font-bold tracking-wider">
          <TerminalSquare className="w-4 h-4 text-primary" />
          <span>COMMAND PANEL</span>
        </div>
        
        {devices.length > 0 && !preselectedDeviceId && (
          <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
            <SelectTrigger className="w-[200px] h-8 text-xs bg-black/40 border-white/10">
              <SelectValue placeholder="Target Device" />
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

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 flex-1">
        {!commands && isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded-md animate-pulse" />
          ))
        ) : (
          commands?.map(cmd => (
            <Button
              key={cmd.id}
              variant="outline"
              className="h-12 justify-start border-white/10 bg-white/5 hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all font-mono text-xs text-left overflow-hidden relative group"
              onClick={() => handleCommand(cmd.id, cmd.label)}
              disabled={!selectedDeviceId || sendCommand.isPending}
            >
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {getIcon(cmd.icon)}
              <div className="flex flex-col items-start ml-1 overflow-hidden">
                <span className="font-bold truncate w-full">{cmd.label}</span>
                <span className="text-[10px] text-muted-foreground truncate w-full group-hover:text-primary/70">{cmd.description}</span>
              </div>
            </Button>
          ))
        )}
      </div>
    </div>
  );
}
