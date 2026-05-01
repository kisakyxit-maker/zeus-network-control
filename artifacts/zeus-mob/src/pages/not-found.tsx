import { Link } from "wouter";

export default function NotFound() {
  return (
    <div style={{ background: "#000", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", color: "#00cc00" }}>
      <div style={{ fontSize: 11, marginBottom: 16, color: "#ff4444" }}>
        [ERR] 404 — ROUTE NOT FOUND
      </div>
      <Link href="/" style={{ color: "#00ff00", fontSize: 11, textDecoration: "none" }}>
        &gt; RETURN TO MISSION CONTROL
      </Link>
    </div>
  );
}
