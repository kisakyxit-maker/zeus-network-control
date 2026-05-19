import { useEffect, useRef, useState } from "react";

const G = "#00ff88";

export function CustomCursor() {
  const [enabled, setEnabled] = useState(true);
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [down, setDown] = useState(false);
  const [hot, setHot] = useState(false);
  const [hidden, setHidden] = useState(true);
  const trailRef = useRef<HTMLDivElement>(null);
  const trailPos = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("zeus:cursor");
    if (saved === "0") setEnabled(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove("zeus-cursor-on");
      return;
    }
    document.documentElement.classList.add("zeus-cursor-on");

    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setHidden(false);
      const t = e.target as HTMLElement | null;
      if (t) {
        const interactive =
          t.closest("button, a, [role='button'], input, select, textarea, [data-cursor='hot']");
        setHot(!!interactive);
      }
    };
    const out = () => setHidden(true);
    const dn = () => setDown(true);
    const up = () => setDown(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", out);
    window.addEventListener("mousedown", dn);
    window.addEventListener("mouseup", up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", out);
      window.removeEventListener("mousedown", dn);
      window.removeEventListener("mouseup", up);
      document.documentElement.classList.remove("zeus-cursor-on");
    };
  }, [enabled]);

  // Smooth trailing dot
  useEffect(() => {
    if (!enabled) return;
    const loop = () => {
      trailPos.current.x += (pos.x - trailPos.current.x) * 0.18;
      trailPos.current.y += (pos.y - trailPos.current.y) * 0.18;
      if (trailRef.current) {
        trailRef.current.style.transform = `translate(${trailPos.current.x - 4}px, ${trailPos.current.y - 4}px)`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, pos.x, pos.y]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("zeus:cursor", next ? "1" : "0");
  };

  return (
    <>
      {/* Toggle button (always visible) */}
      <button
        onClick={toggle}
        title={enabled ? "Desativar cursor" : "Ativar cursor"}
        style={{
          position: "fixed",
          bottom: 12,
          right: 12,
          zIndex: 99999,
          background: "#020e05",
          color: G,
          border: `1px solid ${enabled ? G : "#1a3a20"}`,
          padding: "4px 8px",
          fontSize: 9,
          fontFamily: "'Courier New', monospace",
          letterSpacing: "0.1em",
          cursor: "pointer",
          boxShadow: enabled ? `0 0 8px ${G}44` : "none",
        }}
      >
        ⊕ CURSOR {enabled ? "ON" : "OFF"}
      </button>

      {!enabled ? null : (
        <>
          {/* Trailing dot */}
          <div
            ref={trailRef}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: G,
              opacity: hidden ? 0 : 0.35,
              boxShadow: `0 0 10px ${G}`,
              pointerEvents: "none",
              zIndex: 99998,
              transition: "opacity 0.15s",
            }}
          />

          {/* Crosshair cursor */}
          <div
            style={{
              position: "fixed",
              left: pos.x,
              top: pos.y,
              width: hot ? 32 : 24,
              height: hot ? 32 : 24,
              marginLeft: hot ? -16 : -12,
              marginTop: hot ? -16 : -12,
              pointerEvents: "none",
              zIndex: 99999,
              opacity: hidden ? 0 : 1,
              transform: down ? "scale(0.85)" : "scale(1)",
              transition: "width 0.12s, height 0.12s, transform 0.08s, opacity 0.15s",
              mixBlendMode: "screen",
            }}
          >
            {/* Vertical line */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                width: 2,
                height: "100%",
                marginLeft: -1,
                background: G,
                boxShadow: `0 0 6px ${G}`,
              }}
            />
            {/* Horizontal line */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                height: 2,
                width: "100%",
                marginTop: -1,
                background: G,
                boxShadow: `0 0 6px ${G}`,
              }}
            />
            {/* Center ring */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: hot ? 14 : 8,
                height: hot ? 14 : 8,
                marginLeft: hot ? -7 : -4,
                marginTop: hot ? -7 : -4,
                border: `1.5px solid ${G}`,
                borderRadius: "50%",
                background: down ? G : "transparent",
                boxShadow: `0 0 8px ${G}`,
                transition: "width 0.12s, height 0.12s, background 0.08s",
              }}
            />
            {/* Corner brackets when hovering interactive */}
            {hot && (
              <>
                {[
                  { top: 0, left: 0, rot: 0 },
                  { top: 0, right: 0, rot: 90 },
                  { bottom: 0, right: 0, rot: 180 },
                  { bottom: 0, left: 0, rot: 270 },
                ].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      width: 6,
                      height: 6,
                      borderTop: `2px solid ${G}`,
                      borderLeft: `2px solid ${G}`,
                      transform: `rotate(${c.rot}deg)`,
                      ...c,
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
