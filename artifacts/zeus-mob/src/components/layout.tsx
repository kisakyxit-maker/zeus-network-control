import { Link, useLocation } from "wouter";
import { useGetDeviceStats } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth";

const NAV = [
  { href: "/", label: "HOME" },
  { href: "/devices", label: "DEVICES" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: stats } = useGetDeviceStats();
  const { user, logout } = useAuth();

  const navItems = [...NAV];
  if (user?.role === "admin") {
    navItems.push({ href: "/members", label: "SOCIOS" });
  }

  return (
    <aside style={{ width: 160, minWidth: 160, background: "#020202", borderRight: "1px solid #222", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
      <div style={{ padding: "8px", borderBottom: "1px solid #222", textAlign: "center" }}>
        <img src="/zeus-logo.jpeg" alt="ZEUS" style={{ width: 60, height: 60, borderRadius: "50%", border: "1px solid #00ff00", marginBottom: 8, objectFit: "contain", margin: "0 auto 8px auto", display: "block" }} />
        <div style={{ fontSize: 13, fontWeight: "bold", letterSpacing: "0.15em", color: "#00ff00", lineHeight: 1 }}>
          ZEUS<span style={{ color: "#fff" }}>MOB</span>
        </div>
        <div style={{ fontSize: 9, color: "#444", marginTop: 2, letterSpacing: "0.1em" }}>MDM CONSOLE v4.2</div>
      </div>

      <nav style={{ flex: 1, padding: "4px 0" }}>
        {navItems.map((item) => {
          const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                data-testid={`nav-${item.label.toLowerCase()}`}
                style={{
                  padding: "5px 10px",
                  fontSize: 10,
                  fontWeight: "bold",
                  letterSpacing: "0.1em",
                  color: isActive ? "#00ff00" : "#555",
                  background: isActive ? "#0a1a0a" : "transparent",
                  borderLeft: isActive ? "2px solid #00ff00" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.1s",
                }}
              >
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "8px", borderTop: "1px solid #222" }}>
        {stats && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: "#444", marginBottom: 4, letterSpacing: "0.08em" }}>FLEET STATUS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                <span style={{ color: "#555" }}>TOTAL</span>
                <span style={{ color: "#ccc" }}>{stats.total}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                <span style={{ color: "#00ff00" }}>ONLINE</span>
                <span style={{ color: "#00ff00" }}>{stats.online}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                <span style={{ color: "#ff4444" }}>OFFLINE</span>
                <span style={{ color: "#ff4444" }}>{stats.offline}</span>
              </div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#00ff00", marginBottom: 8 }}>
          <span className="status-dot status-online pulse-green" />
          SYS ONLINE
        </div>
        
        {user && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8, paddingTop: 8, borderTop: "1px dashed #222" }}>
            <div style={{ fontSize: 8, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
            <button onClick={logout} style={{ background: "transparent", border: "1px solid #333", color: "#ff4444", fontSize: 9, padding: "2px 0", cursor: "pointer", fontFamily: "inherit" }} onMouseOver={e => e.currentTarget.style.background = "#1a0000"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>[ LOGOUT ]</button>
          </div>
        )}
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#00cc00", fontFamily: "'Courier New', monospace" }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export function TopBar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #222" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: "bold", letterSpacing: "0.15em", color: "#00ff00" }}>
          {title}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9, color: "#555" }}>
        {children}
        <span className="blink" style={{ color: "#00ff00" }}>_</span>
      </div>
    </div>
  );
}
