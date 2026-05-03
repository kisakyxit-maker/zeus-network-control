import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/auth";

const G = "#00ff88";

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
      setError(err.message || "Falha na autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#000",
        color: G,
        fontFamily: "'Courier New', Courier, monospace",
        padding: 20,
      }}
    >
      {/* Scanline effect */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.015) 2px, rgba(0,255,136,0.015) 4px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-block",
              padding: 4,
              border: `2px solid ${G}`,
              borderRadius: "50%",
              boxShadow: `0 0 24px ${G}44, 0 0 60px ${G}11`,
              marginBottom: 16,
            }}
          >
            <img
              src="/zeus-logo.jpeg"
              alt="ZEUS LOGO"
              style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", display: "block" }}
            />
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: "bold",
              letterSpacing: "0.3em",
              color: G,
              textShadow: `0 0 20px ${G}`,
              marginBottom: 6,
            }}
          >
            ZEUS MOB
          </div>
          <div style={{ fontSize: 10, color: "#334", letterSpacing: "0.18em" }}>
            MDM CONTROL PANEL v4.2
          </div>
        </div>

        {/* Form */}
        <div
          style={{
            border: `1px solid #1a3a20`,
            background: "#020a04",
            padding: "24px",
          }}
        >
          <div style={{ fontSize: 9, color: "#445", letterSpacing: "0.15em", marginBottom: 18, textAlign: "center" }}>
            &gt; AUTENTICAÇÃO REQUERIDA_
          </div>

          {error && (
            <div
              style={{
                color: "#ff4444",
                border: "1px solid #ff444444",
                background: "#1a0000",
                padding: "8px 12px",
                fontSize: 10,
                marginBottom: 16,
                letterSpacing: "0.05em",
              }}
            >
              ✕ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 8, color: "#445", letterSpacing: "0.1em", marginBottom: 4 }}>EMAIL</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="[ EMAIL ]"
                required
                autoComplete="username"
                style={{
                  width: "100%",
                  backgroundColor: "#010801",
                  border: `1px solid ${email ? G : "#223"}`,
                  color: G,
                  padding: "9px 10px",
                  outline: "none",
                  fontFamily: "inherit",
                  fontSize: 11,
                  letterSpacing: "0.05em",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: 8, color: "#445", letterSpacing: "0.1em", marginBottom: 4 }}>SENHA</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="[ SENHA ]"
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  backgroundColor: "#010801",
                  border: `1px solid ${password ? G : "#223"}`,
                  color: G,
                  padding: "9px 10px",
                  outline: "none",
                  fontFamily: "inherit",
                  fontSize: 11,
                  letterSpacing: "0.05em",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#0a1a0a" : G,
                color: loading ? G : "#000",
                border: `2px solid ${G}`,
                padding: "12px",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                fontWeight: "bold",
                fontSize: 12,
                letterSpacing: "0.2em",
                marginTop: 8,
                boxShadow: loading ? "none" : `0 0 20px ${G}44`,
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <>AUTENTICANDO<span className="blink">_</span></>
              ) : (
                "[ AUTENTICAR ]"
              )}
            </button>
          </form>
        </div>

        {/* Register link */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/register">
            <span
              style={{ color: "#334", fontSize: 10, cursor: "pointer", letterSpacing: "0.08em", transition: "color 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = G; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#334"; }}
            >
              &gt; SOLICITAR ACESSO AO SISTEMA
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
