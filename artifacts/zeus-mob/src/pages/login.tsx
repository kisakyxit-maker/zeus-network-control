import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#000", color: "#00ff00", fontFamily: "'Courier New', Courier, monospace" }}>
      <img src="/zeus-logo.jpeg" alt="ZEUS LOGO" style={{ width: 120, height: 120, marginBottom: 20, objectFit: "contain", borderRadius: "50%", border: "2px solid #00ff00" }} />
      <h1 style={{ fontSize: 32, margin: 0, letterSpacing: "0.2em", textShadow: "0 0 10px #00ff00" }}>ZEUS MOB</h1>
      <p style={{ color: "#555", fontSize: 14, marginTop: 5, marginBottom: 40, letterSpacing: "0.1em" }}>MDM CONTROL PANEL v4.2</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 15, width: 300 }}>
        {error && <div style={{ color: "#ff4444", border: "1px solid #ff4444", padding: 8, fontSize: 12, backgroundColor: "#1a0000" }}>&gt; ERR: {error}</div>}
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="[ EMAIL ]"
          required
          style={{ backgroundColor: "#000", border: "1px solid #333", color: "#00ff00", padding: "10px", outline: "none", fontFamily: "inherit" }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="[ PASSWORD ]"
          required
          style={{ backgroundColor: "#000", border: "1px solid #333", color: "#00ff00", padding: "10px", outline: "none", fontFamily: "inherit" }}
        />
        
        <button type="submit" disabled={loading} style={{ backgroundColor: "#050505", border: "1px solid #00ff00", color: "#00ff00", padding: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "bold", marginTop: 10, transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "#00ff0033"} onMouseOut={e => e.currentTarget.style.backgroundColor = "#050505"}>
          {loading ? "AUTHENTICATING..." : "[ AUTHENTICATE ]"}
        </button>

        <Link href="/register">
          <div style={{ textAlign: "center", color: "#555", fontSize: 12, marginTop: 20, cursor: "pointer", textDecoration: "none" }} onMouseOver={e => e.currentTarget.style.color = "#00ff00"} onMouseOut={e => e.currentTarget.style.color = "#555"}>
            &gt; SOLICITAR ACESSO
          </div>
        </Link>
      </form>
    </div>
  );
}
