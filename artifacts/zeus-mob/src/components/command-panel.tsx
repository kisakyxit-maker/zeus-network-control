import { useState } from "react";
import { useListCommands, useSendCommand, Device } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface CommandPanelProps {
  devices?: Device[];
  preselectedDeviceId?: number;
  height?: string | number;
}

const DANGER_COMMANDS = ["factory_reset", "reboot"];

export function CommandPanel({ devices = [], preselectedDeviceId, height }: CommandPanelProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    preselectedDeviceId ? String(preselectedDeviceId) : ""
  );
  const { data: commands, isLoading } = useListCommands();
  const sendCommand = useSendCommand();
  const { toast } = useToast();

  const handleCommand = (commandId: string, commandLabel: string) => {
    if (!selectedDeviceId) {
      toast({ title: "No device selected", description: "Select a target device first.", variant: "destructive" });
      return;
    }
    sendCommand.mutate(
      { data: { deviceId: parseInt(selectedDeviceId, 10), command: commandId } },
      {
        onSuccess: (result) => {
          toast({ title: `> ${commandLabel}`, description: result.message, className: "border-[#00ff00] bg-black text-[#00ff00] font-mono text-xs" });
        },
        onError: (error: any) => {
          toast({ title: "COMMAND FAILED", description: error.message ?? "Execution error", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", height: height ?? "auto" }}>
      <div className="panel-header" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>■</span>
          <span>COMMAND PANEL</span>
        </div>
        {devices.length > 0 && !preselectedDeviceId && (
          <select
            data-testid="command-device-select"
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
            <option value="">-- TARGET --</option>
            {devices.map(d => (
              <option key={d.id} value={String(d.id)}>
                {d.name} [{d.status.toUpperCase()}]
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ padding: 6, display: "flex", flexDirection: "column", gap: 3, flex: 1, background: "#020202" }}>
        {!commands && isLoading ? (
          <div style={{ color: "#333", fontSize: 10, padding: 4 }}>&gt; loading commands<span className="blink">_</span></div>
        ) : (
          commands?.map(cmd => (
            <button
              key={cmd.id}
              data-testid={`command-btn-${cmd.id}`}
              className={`cmd-btn${DANGER_COMMANDS.includes(cmd.id) ? " danger" : ""}`}
              onClick={() => handleCommand(cmd.id, cmd.label)}
              disabled={!selectedDeviceId || sendCommand.isPending}
            >
              <span style={{ marginRight: 4, width: 10 }}>
                {DANGER_COMMANDS.includes(cmd.id) ? "!" : ">"}
              </span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "bold", fontSize: 10, letterSpacing: "0.05em" }}>{cmd.label.toUpperCase()}</span>
                <span style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>{cmd.description}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
