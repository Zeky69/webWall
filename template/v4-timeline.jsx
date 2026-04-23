// V4 — Timeline Ops / chronological journal view
const V4TimelineOps = () => {
  const [range, setRange] = useState("1h");
  const [trackFilter, setTrackFilter] = useState("all");
  useWCTicker(2000);

  // Generate events along a 100% timeline
  const events = useMemo(() => {
    const types = [
      { t: "fx", color: "var(--wc-accent)" },
      { t: "wallpaper", color: "var(--wc-ok)" },
      { t: "capture", color: "var(--wc-accent2)" },
      { t: "shell", color: "var(--wc-err)" },
      { t: "lock", color: "var(--wc-warn)" },
      { t: "marquee", color: "var(--wc-accent)" },
    ];
    const rows = [];
    WC_CLIENTS.forEach((c, ci) => {
      const n = 4 + Math.floor(Math.random() * 6);
      for (let i = 0; i < n; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const start = Math.random() * 92;
        const width = 1 + Math.random() * 12;
        rows.push({ client: c.id, type: type.t, color: type.color, start, width, label: type.t });
      }
    });
    return rows;
  }, []);

  return (
    <div className="wc-root" style={{ width: 1600, height: 1000, background: "var(--wc-bg)", color: "var(--wc-fg)", fontFamily: "var(--wc-sans)", display: "grid", gridTemplateRows: "56px auto 1fr auto" }}>
      {/* HEADER */}
      <div style={{ padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--wc-border)", background: "var(--wc-panel)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 14, height: 14, background: "var(--wc-accent)" }} />
            <span style={{ fontFamily: "var(--wc-mono)", fontSize: 13, fontWeight: 600 }}>WALLCHANGE</span>
            <span style={{ fontFamily: "var(--wc-mono)", fontSize: 11, color: "var(--wc-muted)" }}>/ ops.timeline</span>
          </div>
          <div style={{ display: "flex", gap: 6, fontFamily: "var(--wc-mono)", fontSize: 10 }}>
            {["15m","1h","6h","24h","7d"].map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                padding: "4px 10px", background: range === r ? "var(--wc-accent)" : "var(--wc-panel-2)",
                color: range === r ? "var(--wc-bg)" : "var(--wc-muted)",
                border: "1px solid var(--wc-border)", fontFamily: "var(--wc-mono)", fontSize: 10, cursor: "pointer"
              }}>{r}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, fontFamily: "var(--wc-mono)", fontSize: 11 }}>
          <span><span style={{ color: "var(--wc-muted)" }}>events</span> {WC_STATS.commandsToday}</span>
          <span><span style={{ color: "var(--wc-muted)" }}>fx</span> {WC_STATS.effectsActive}</span>
          <span><span style={{ color: "var(--wc-muted)" }}>shells</span> {WC_STATS.shellsOpen}</span>
          <span><span style={{ color: "var(--wc-muted)" }}>captures</span> {WC_STATS.screenshotsToday}</span>
          <span style={{ color: "var(--wc-ok)" }}>● LIVE</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", borderBottom: "1px solid var(--wc-border)", background: "var(--wc-panel)" }}>
        {[
          { label: "FLEET", value: `${WC_STATS.online}/${WC_STATS.total}`, spark: WC_SPARK_MSGS.slice(20), color: "var(--wc-ok)" },
          { label: "MSG/S", value: WC_STATS.msgsPerSec, spark: WC_SPARK_MSGS, color: "var(--wc-accent)" },
          { label: "CPU POOL", value: "23%", spark: WC_SPARK_CPU, color: "var(--wc-warn)" },
          { label: "RTT AVG", value: WC_STATS.latencyAvg, spark: WC_SPARK_MSGS.map(v => 60 - v * 0.3), color: "var(--wc-accent)" },
          { label: "BYTES IN", value: WC_STATS.bytesIn, spark: WC_SPARK_CPU.slice().reverse(), color: "var(--wc-ok)" },
          { label: "ERRORS", value: "3", spark: [1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0], color: "var(--wc-err)" },
        ].map((k, i) => (
          <div key={k.label} style={{ padding: "14px 18px", borderRight: i < 5 ? "1px solid var(--wc-border)" : "none" }}>
            <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k.label}</div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6 }}>
              <div style={{ fontFamily: "var(--wc-mono)", fontSize: 24, fontWeight: 500 }}>{k.value}</div>
              <WCSparkline data={k.spark} color={k.color} width={80} height={28} />
            </div>
          </div>
        ))}
      </div>

      {/* TIMELINE BODY */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 300px", minHeight: 0 }}>
        {/* Left rail — track filter */}
        <div style={{ borderRight: "1px solid var(--wc-border)", background: "var(--wc-panel)", padding: "12px 0", overflow: "auto" }}>
          <div style={{ padding: "4px 18px 10px", fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Agents</div>
          {WC_CLIENTS.map(c => (
            <div key={c.id} style={{
              padding: "10px 18px", display: "flex", alignItems: "center", gap: 8,
              borderLeft: "3px solid transparent", cursor: "pointer",
            }}>
              <WCDot status={c.status} />
              <span style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-accent)" }}>{c.id}</span>
              <span style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-fg-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.host.slice(0, 14)}</span>
              {c.locked && <span style={{ fontSize: 9, color: "var(--wc-warn)" }}>L</span>}
              {c.effect && <span style={{ fontSize: 9, color: "var(--wc-accent)" }}>FX</span>}
            </div>
          ))}
        </div>

        {/* Center — timeline swim lanes */}
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", minHeight: 0 }}>
          {/* timeline axis */}
          <div style={{ borderBottom: "1px solid var(--wc-border)", padding: "10px 20px", display: "flex", justifyContent: "space-between", fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)" }}>
            {["-60m","-50m","-40m","-30m","-20m","-10m","now"].map(t => (
              <span key={t} style={{ color: t === "now" ? "var(--wc-accent)" : "var(--wc-muted)" }}>{t}</span>
            ))}
          </div>

          {/* swim lanes */}
          <div style={{ position: "relative", overflow: "auto" }}>
            {/* vertical grid */}
            <div style={{ position: "absolute", inset: 0, display: "flex", pointerEvents: "none" }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{ flex: 1, borderRight: i < 6 ? "1px dashed var(--wc-border)" : "none" }} />
              ))}
            </div>

            {WC_CLIENTS.map(c => (
              <div key={c.id} style={{ position: "relative", height: 46, borderBottom: "1px solid var(--wc-border)", padding: "0 20px" }}>
                <div style={{ position: "absolute", left: 20, top: 6, fontFamily: "var(--wc-mono)", fontSize: 9, color: "var(--wc-muted)" }}>{c.id}</div>
                {events.filter(e => e.client === c.id).map((e, i) => (
                  <div key={i} title={`${e.type} @ ${c.id}`} style={{
                    position: "absolute", top: 20, height: 18,
                    left: `calc(20px + ${e.start}%)`,
                    width: `${e.width}%`,
                    background: e.color, opacity: 0.75,
                    borderLeft: `2px solid ${e.color}`,
                    paddingLeft: 4, fontFamily: "var(--wc-mono)", fontSize: 9,
                    color: "var(--wc-bg)", lineHeight: "18px",
                    overflow: "hidden", whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}>
                    {e.label}
                  </div>
                ))}
              </div>
            ))}

            {/* now cursor */}
            <div style={{ position: "absolute", right: 20, top: 0, bottom: 0, width: 1, background: "var(--wc-accent)" }}>
              <div style={{ position: "absolute", top: 0, right: -4, width: 8, height: 8, background: "var(--wc-accent)" }} />
            </div>
          </div>

          {/* bottom axis */}
          <div style={{ borderTop: "1px solid var(--wc-border)", padding: "8px 20px", background: "var(--wc-panel-2)", fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", display: "flex", gap: 16 }}>
            <span>legend:</span>
            <span><span style={{ background: "var(--wc-accent)", padding: "0 4px", color: "var(--wc-bg)" }}>fx</span></span>
            <span><span style={{ background: "var(--wc-ok)", padding: "0 4px", color: "var(--wc-bg)" }}>wallpaper</span></span>
            <span><span style={{ background: "var(--wc-accent2)", padding: "0 4px", color: "var(--wc-bg)" }}>capture</span></span>
            <span><span style={{ background: "var(--wc-err)", padding: "0 4px", color: "var(--wc-bg)" }}>shell</span></span>
            <span><span style={{ background: "var(--wc-warn)", padding: "0 4px", color: "var(--wc-bg)" }}>lock</span></span>
          </div>
        </div>

        {/* Right — live log */}
        <div style={{ borderLeft: "1px solid var(--wc-border)", background: "var(--wc-panel)", display: "grid", gridTemplateRows: "auto 1fr" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--wc-border)", fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", justifyContent: "space-between" }}>
            <span>JOURNAL · LIVE</span>
            <span style={{ color: "var(--wc-ok)" }}>● tail</span>
          </div>
          <div style={{ padding: "10px 14px", overflow: "hidden" }}>
            <WCLogStream limit={24} />
          </div>
        </div>
      </div>

      {/* FOOTER / command bar */}
      <div style={{ borderTop: "1px solid var(--wc-border)", background: "var(--wc-panel-2)", padding: "0 20px", display: "flex", alignItems: "center", gap: 20, fontFamily: "var(--wc-mono)", fontSize: 11 }}>
        <span style={{ color: "var(--wc-accent)" }}>›</span>
        <input placeholder="wcctl ops <client> <action> --since 15m" defaultValue=""
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--wc-fg)", fontFamily: "var(--wc-mono)", fontSize: 12, padding: "10px 0" }} />
        <div style={{ display: "flex", gap: 8, color: "var(--wc-muted)" }}>
          <WCKey>/</WCKey><span>focus</span>
          <WCKey>G</WCKey><span>go to now</span>
          <WCKey>Z</WCKey><span>zoom</span>
        </div>
      </div>
    </div>
  );
};

window.V4TimelineOps = V4TimelineOps;
