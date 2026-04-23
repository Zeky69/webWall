// Shared primitives for all WallChange variations
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ───── Sparkline ─────
const WCSparkline = ({ data, color = "currentColor", height = 28, width = 120, fill = true }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = "M " + pts.join(" L ");
  const area = path + ` L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {fill && <path d={area} fill={color} opacity={0.12} />}
      <path d={path} fill="none" stroke={color} strokeWidth={1.2} />
    </svg>
  );
};

// ───── Live-ish ticking timestamp ─────
const useWCTicker = (ms = 1500) => {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(x => x + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return t;
};

// ───── Fake screen thumbnail ─────
const WCScreenThumb = ({ client, w = 160, h = 90, effect = null, theme = "dark" }) => {
  const bg = client.status === "offline"
    ? (theme === "light" ? "#d4d4d0" : "#1a1a1a")
    : (theme === "light" ? "#e8e6df" : "#0f1419");
  const gridColor = theme === "light" ? "#00000010" : "#ffffff08";
  const stripe = `repeating-linear-gradient(135deg, ${gridColor} 0 1px, transparent 1px 8px)`;
  return (
    <div style={{
      width: w, height: h, background: bg, backgroundImage: stripe,
      border: `1px solid ${theme === "light" ? "#c5c3bd" : "#2a2e35"}`,
      position: "relative", overflow: "hidden", fontFamily: "var(--wc-mono)",
      fontSize: 9, color: theme === "light" ? "#555" : "#6b7280",
      display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: "0.05em",
    }}>
      {client.status === "offline" ? (
        <span style={{ opacity: 0.5 }}>NO SIGNAL</span>
      ) : client.locked ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, lineHeight: 1, marginBottom: 4 }}>▢</div>
          <div style={{ fontSize: 8 }}>LOCKED</div>
        </div>
      ) : effect || client.effect ? (
        <span style={{ color: "var(--wc-accent)", textTransform: "uppercase" }}>
          FX · {(effect || client.effect)}
        </span>
      ) : (
        <span style={{ opacity: 0.6 }}>{client.screen}</span>
      )}
      {/* scan */}
      {client.status === "online" && !client.locked && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 49%, var(--wc-accent-soft) 50%, transparent 51%)",
          opacity: 0.3, animation: "wc-scan 3s linear infinite",
        }} />
      )}
    </div>
  );
};

// ───── Status dot ─────
const WCDot = ({ status, size = 8 }) => (
  <span style={{
    display: "inline-block", width: size, height: size, borderRadius: "50%",
    background: status === "online" ? "var(--wc-ok)" : status === "offline" ? "var(--wc-muted)" : "var(--wc-warn)",
    boxShadow: status === "online" ? "0 0 6px var(--wc-ok)" : "none",
    animation: status === "online" ? "wc-pulse 2s ease-in-out infinite" : "none",
  }} />
);

// ───── Log level badge ─────
const WCLvl = ({ lvl }) => {
  const c = lvl.trim() === "ERR" ? "var(--wc-err)" : lvl.trim() === "WARN" ? "var(--wc-warn)" : "var(--wc-muted2)";
  return <span style={{ color: c, fontFamily: "var(--wc-mono)", fontSize: 10 }}>{lvl}</span>;
};

// ───── Bar ─────
const WCBar = ({ value, color = "var(--wc-accent)", height = 4, bg = "var(--wc-panel-2)" }) => (
  <div style={{ width: "100%", height, background: bg, position: "relative" }}>
    <div style={{ width: `${value}%`, height: "100%", background: color }} />
  </div>
);

// ───── Streaming log component ─────
const WCLogStream = ({ theme = "dark", limit = 12, filterClient = null }) => {
  const [lines, setLines] = useState(() => WC_LOGS.slice(0, limit));
  useEffect(() => {
    const id = setInterval(() => {
      const templates = [
        { lvl: "INFO", msg: "agent.heartbeat rtt=${rtt}ms" },
        { lvl: "INFO", msg: "ws.msg bytes=${b}" },
        { lvl: "INFO", msg: "effect.tick frame=${f}" },
        { lvl: "WARN", msg: "cpu.threshold ${v}%" },
        { lvl: "INFO", msg: "screenshot.request size=${s}KB" },
      ];
      const tpl = templates[Math.floor(Math.random() * templates.length)];
      const c = WC_CLIENTS[Math.floor(Math.random() * WC_CLIENTS.length)];
      const now = new Date();
      const t = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
      const msg = tpl.msg
        .replace("${rtt}", Math.floor(8 + Math.random() * 20))
        .replace("${b}", Math.floor(200 + Math.random() * 800))
        .replace("${f}", Math.floor(Math.random() * 9999))
        .replace("${v}", Math.floor(55 + Math.random() * 30))
        .replace("${s}", Math.floor(800 + Math.random() * 1400));
      setLines(prev => [{ t, client: c.id, lvl: tpl.lvl, msg, _new: true }, ...prev].slice(0, limit));
    }, 1800);
    return () => clearInterval(id);
  }, [limit]);
  const filtered = filterClient ? lines.filter(l => l.client === filterClient) : lines;
  return (
    <div style={{ fontFamily: "var(--wc-mono)", fontSize: 11, lineHeight: 1.6 }}>
      {filtered.map((l, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "70px 60px 44px 1fr", gap: 10, color: "var(--wc-fg-2)", opacity: i === 0 ? 1 : Math.max(0.5, 1 - i * 0.04) }}>
          <span style={{ color: "var(--wc-muted)" }}>{l.t}</span>
          <span style={{ color: "var(--wc-accent)" }}>{l.client}</span>
          <WCLvl lvl={l.lvl} />
          <span style={{ color: "var(--wc-fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.msg}</span>
        </div>
      ))}
    </div>
  );
};

// ───── Keycap ─────
const WCKey = ({ children }) => (
  <span style={{
    fontFamily: "var(--wc-mono)", fontSize: 10, padding: "2px 6px",
    border: "1px solid var(--wc-border)", background: "var(--wc-panel-2)",
    color: "var(--wc-fg-2)", borderRadius: 3, marginRight: 4,
  }}>{children}</span>
);

// ───── Label / Value pair (dense stats) ─────
const WCKV = ({ label, value, sub, accent }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--wc-mono)" }}>{label}</div>
    <div style={{ fontSize: 20, color: accent || "var(--wc-fg)", fontFamily: "var(--wc-mono)", fontWeight: 500, lineHeight: 1.1, marginTop: 2 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: "var(--wc-muted)", fontFamily: "var(--wc-mono)", marginTop: 2 }}>{sub}</div>}
  </div>
);

Object.assign(window, { WCSparkline, WCScreenThumb, WCDot, WCLvl, WCBar, WCLogStream, WCKey, WCKV, useWCTicker });
