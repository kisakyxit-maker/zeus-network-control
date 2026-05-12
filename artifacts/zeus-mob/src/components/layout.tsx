import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth";
import { useState } from "react";

const G = "#00ff88";
const DIM = "#1a2e20";
const DARK = "#030a05";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: "/", label: "HOME", icon: "⌂" },
    { href: "/clientes", label: "CLIENTES", icon: "📱" },
    ...(user?.role === "admin"
      ? [
          { href: "/members", label: "SOCIOS", icon: "👥" },
          { href: "/administrador", label: "ADMINISTRADOR", icon: "🔐" },
          { href: "/meeting", label: "SALA DE SUPORTE", icon: "🎥" },
          { href: "/apk-generator", label: "GERADOR DE APK", icon: "⚙" },
        ]
      : []),
  ];

  return (
    <aside
      className="sidebar-mobile-hide"
      style={{
        width: collapsed ? 44 : 170,
        minWidth: collapsed ? 44 : 170,
        background: DARK,
        borderRight: `1px solid ${DIM}`,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        transition: "width 0.15s",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 8px",
          borderBottom: `1px solid ${DIM}`,
          textAlign: "center",
          cursor: "pointer",
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <img
          src="/zeus-logo.jpeg"
          alt="ZEUS"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: `2px solid ${G}`,
            objectFit: "cover",
            display: "block",
            margin: "0 auto 6px",
            boxShadow: `0 0 10px ${G}55`,
          }}
        />
        {!collapsed && (
          <>
            <div style={{ fontSize: 13, fontWeight: "bold", letterSpacing: "0.2em", color: G, lineHeight: 1 }}>
              ZEUS<span style={{ color: "#fff" }}>MOB</span>
            </div>
            <div style={{ fontSize: 8, color: "#334", marginTop: 2, letterSpacing: "0.12em" }}>
              MDM CONSOLE v4.2
            </div>
          </>
        )}
      </div>

      <nav style={{ flex: 1, padding: "6px 0" }}>
        {navItems.map((item) => {
          const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                title={item.label}
                style={{
                  padding: collapsed ? "8px 0" : "7px 12px",
                  fontSize: 10,
                  fontWeight: "bold",
                  letterSpacing: "0.1em",
                  color: isActive ? G : "#445",
                  background: isActive ? "#051208" : "transparent",
                  borderLeft: isActive ? `2px solid ${G}` : "2px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  justifyContent: collapsed ? "center" : "flex-start",
                  transition: "all 0.1s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = G; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "#445"; }}
              >
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                {!collapsed && item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {!collapsed && user && (
        <div style={{ padding: "8px", borderTop: `1px solid ${DIM}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: G, marginBottom: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: G, display: "inline-block", boxShadow: `0 0 6px ${G}` }} />
            SYS ONLINE
          </div>
          <div style={{ fontSize: 8, color: "#556", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6 }}>
            {user.email}
          </div>
          <button
            onClick={logout}
            style={{
              width: "100%",
              background: "transparent",
              border: `1px solid #332`,
              color: "#ff4444",
              fontSize: 9,
              padding: "3px 0",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.1em",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#1a0000"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            [ LOGOUT ]
          </button>
        </div>
      )}
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#000",
        color: G,
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      <Sidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", minWidth: 0 }}>
        <div className="main-mobile-pad" style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export function TopBar({ title, children }: { title: string; children?: React.ReactNode }) {
  const now = new Date().toLocaleTimeString("pt-BR", { hour12: false });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
        paddingBottom: 8,
        borderBottom: `1px solid ${DIM}`,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: "bold", letterSpacing: "0.15em", color: G }}>
        &gt; {title}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 9, color: "#445" }}>
        {children}
        <span style={{ color: "#445" }}>{now}</span>
        <span className="blink" style={{ color: G }}>_</span>
      </div>
    </div>
  );
}

export function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        border: `1px solid ${DIM}`,
        background: "#020a04",
        borderRadius: 2,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "5px 10px",
        borderBottom: `1px solid ${DIM}`,
        fontSize: 9,
        fontWeight: "bold",
        letterSpacing: "0.12em",
        color: G,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {children}
    </div>
  );
}
