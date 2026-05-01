import { useState } from "react";
import { Link } from "wouter";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Registration failed");
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#000", color: "#00ff00", fontFamily: "'Courier New', Courier, monospace" }}>
      <img src="/zeus-logo.jpeg" alt="ZEUS LOGO" style={{ width: 100, height: 100, marginBottom: 20, objectFit: "contain", borderRadius: "50%", border: "2px solid #00ff00" }} />
      <h1 style={{ fontSize: 24, margin: 0, letterSpacing: "0.2em" }}>SOLICITAR ACESSO</h1>
      <p style={{ color: "#555", fontSize: 12, marginTop: 5, marginBottom: 40 }}>MDM CONTROL PANEL v4.2</p>

      {success ? (
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ color: "#00ff00", border: "1px solid #00ff00", padding: 15, backgroundColor: "#002200", marginBottom: 20 }}>
            &gt; SOLICITACAO ENVIADA. Aguarde aprovacao do administrador.
          </div>
          <Link href="/login">
            <div style={{ color: "#aaa", cursor: "pointer", textDecoration: "underline" }}>&gt; BACK TO LOGIN</div>
          </Link>
        </div>
      ) : (
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
            {loading ? "PROCESSING..." : "[ SUBMIT ]"}
          </button>

          <Link href="/login">
            <div style={{ textAlign: "center", color: "#555", fontSize: 12, marginTop: 20, cursor: "pointer", textDecoration: "none" }} onMouseOver={e => e.currentTarget.style.color = "#00ff00"} onMouseOut={e => e.currentTarget.style.color = "#555"}>
              &gt; BACK TO LOGIN
            </div>
          </Link>
        </form>
      )}
    </div>
  );
}
