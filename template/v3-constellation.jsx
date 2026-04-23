// V3 — Constellation / radar topology view
const V3Constellation = () => {
  const [selected, setSelected] = useState("W-01A9");
  const [hoverFx, setHoverFx] = useState(null);
  const [firing, setFiring] = useState([]);
  useWCTicker(1200);

  // compute positions — ring around central server
  const positions = useMemo(() => {
    const cx = 500, cy = 420;
    return WC_CLIENTS.map((c, i) => {
      const n = WC_CLIENTS.length;
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const radius = 280 + (i % 3) * 26;
      return {
        ...c,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        angle,
      };
    });
  }, []);

  const fire = (fxId) => {
    const id = Math.random();
    setFiring(f => [...f, { id, fx: fxId, target: selected }]);
    setTimeout(() => setFiring(f => f.filter(x => x.id !== id)), 1400);
  };

  const selClient = positions.find(p => p.id === selected);

  return (
    <div className="wc-root" style={{ width: 1600, height: 1000, background: "var(--wc-bg)", color: "var(--wc-fg)", fontFamily: "var(--wc-sans)", display: "grid", gridTemplateColumns: "1fr 380px" }}>
      {/* ─── LEFT: constellation ─── */}
      <div style={{ position: "relative", borderRight: "1px solid var(--wc-border)", overflow: "hidden" }}>
        {/* header */}
        <div style={{ position: "absolute", top: 18, left: 20, right: 20, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
          <div>
            <div style={{ fontFamily: "var(--wc-mono)", fontSize: 11, color: "var(--wc-muted)", letterSpacing: "0.1em" }}>WALLCHANGE / CONSTELLATION</div>
            <div style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>10 agents — vue topologique</div>
          </div>
          <div style={{ display: "flex", gap: 20, fontFamily: "var(--wc-mono)", fontSize: 11 }}>
            <div><span style={{ color: "var(--wc-muted)" }}>ws</span> <span style={{ color: "var(--wc-ok)" }}>● up</span></div>
            <div><span style={{ color: "var(--wc-muted)" }}>rtt</span> {WC_STATS.latencyAvg}</div>
            <div><span style={{ color: "var(--wc-muted)" }}>msg/s</span> {WC_STATS.msgsPerSec}</div>
          </div>
        </div>

        {/* concentric rings */}
        <svg width="1000" height="840" style={{ position: "absolute", inset: 0, margin: "auto" }}>
          <defs>
            <radialGradient id="v3-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--wc-accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--wc-accent)" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* ring grid */}
          {[120, 200, 280, 340].map(r => (
            <circle key={r} cx={500} cy={420} r={r} fill="none" stroke="var(--wc-border)" strokeDasharray={r === 280 ? "none" : "2 4"} strokeWidth={r === 280 ? 1 : 0.5} />
          ))}
          {/* radial lines */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={500} y1={420} x2={500 + Math.cos(a) * 360} y2={420 + Math.sin(a) * 360} stroke="var(--wc-border)" strokeWidth={0.3} />;
          })}
          {/* core */}
          <circle cx={500} cy={420} r={120} fill="url(#v3-core)" />

          {/* lines from server to each client */}
          {positions.map(p => (
            <line key={p.id}
              x1={500} y1={420} x2={p.x} y2={p.y}
              stroke={p.status === "online" ? (p.id === selected ? "var(--wc-accent)" : "var(--wc-ok)") : "var(--wc-muted)"}
              strokeWidth={p.id === selected ? 1.5 : 0.6}
              strokeDasharray={p.status === "offline" ? "3 3" : "none"}
              opacity={p.id === selected ? 1 : 0.35}
            />
          ))}

          {/* pulses along selected link */}
          {selClient && firing.map(f => (
            <circle key={f.id} r="4" fill="var(--wc-accent)">
              <animate attributeName="cx" from={500} to={selClient.x} dur="1.2s" fill="freeze" />
              <animate attributeName="cy" from={420} to={selClient.y} dur="1.2s" fill="freeze" />
              <animate attributeName="opacity" from={1} to={0} dur="1.2s" fill="freeze" />
            </circle>
          ))}

          {/* ping pulse on selected */}
          {selClient && (
            <circle cx={selClient.x} cy={selClient.y} r={14} fill="none" stroke="var(--wc-accent)">
              <animate attributeName="r" from={14} to={40} dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" from={0.8} to={0} dur="1.6s" repeatCount="indefinite" />
            </circle>
          )}

          {/* central server node */}
          <g>
            <rect x={470} y={395} width={60} height={50} fill="var(--wc-panel)" stroke="var(--wc-accent)" strokeWidth={1.5} />
            <text x={500} y={418} textAnchor="middle" fill="var(--wc-accent)" fontFamily="var(--wc-mono)" fontSize="11" fontWeight="600">MONGOOSE</text>
            <text x={500} y={432} textAnchor="middle" fill="var(--wc-muted)" fontFamily="var(--wc-mono)" fontSize="9">wallchange.codeky.fr</text>
          </g>
          <text x={500} y={358} textAnchor="middle" fill="var(--wc-muted)" fontFamily="var(--wc-mono)" fontSize="10" letterSpacing="0.15em">● SERVER</text>

          {/* client nodes */}
          {positions.map(p => (
            <g key={p.id} style={{ cursor: "pointer" }} onClick={() => setSelected(p.id)}>
              <rect x={p.x - 46} y={p.y - 16} width={92} height={32}
                fill={p.id === selected ? "var(--wc-accent-soft)" : "var(--wc-panel)"}
                stroke={p.id === selected ? "var(--wc-accent)" : p.status === "online" ? "var(--wc-border)" : "var(--wc-muted)"}
                strokeWidth={p.id === selected ? 1.5 : 1}
                strokeDasharray={p.status === "offline" ? "3 3" : "none"}
              />
              <circle cx={p.x - 38} cy={p.y} r={3}
                fill={p.status === "online" ? "var(--wc-ok)" : "var(--wc-muted)"} />
              <text x={p.x - 30} y={p.y - 3} fill="var(--wc-accent)" fontFamily="var(--wc-mono)" fontSize="9" fontWeight="600">{p.id}</text>
              <text x={p.x - 30} y={p.y + 8} fill="var(--wc-fg-2)" fontFamily="var(--wc-mono)" fontSize="8">{p.host.slice(0, 16)}</text>
              {p.locked && (
                <g>
                  <rect x={p.x + 32} y={p.y - 12} width={12} height={10} fill="var(--wc-warn)" opacity={0.2} stroke="var(--wc-warn)" strokeWidth={0.5} />
                  <text x={p.x + 38} y={p.y - 4} textAnchor="middle" fontFamily="var(--wc-mono)" fontSize="7" fill="var(--wc-warn)">L</text>
                </g>
              )}
              {p.effect && (
                <g>
                  <rect x={p.x + 32} y={p.y + 2} width={12} height={10} fill="var(--wc-accent)" opacity={0.2} stroke="var(--wc-accent)" strokeWidth={0.5} />
                  <text x={p.x + 38} y={p.y + 10} textAnchor="middle" fontFamily="var(--wc-mono)" fontSize="7" fill="var(--wc-accent)">FX</text>
                </g>
              )}
            </g>
          ))}
        </svg>

        {/* legend bottom-left */}
        <div style={{ position: "absolute", left: 20, bottom: 20, fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", display: "flex", gap: 16 }}>
          <span><span style={{ color: "var(--wc-ok)" }}>●</span> online</span>
          <span><span style={{ color: "var(--wc-muted)" }}>●</span> offline</span>
          <span><span style={{ color: "var(--wc-warn)" }}>L</span> locked</span>
          <span><span style={{ color: "var(--wc-accent)" }}>FX</span> effect running</span>
          <span style={{ marginLeft: 16 }}>radial distance = uptime bucket</span>
        </div>

        {/* compass top-right */}
        <div style={{ position: "absolute", right: 20, bottom: 20, fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)" }}>
          <div style={{ width: 64, height: 64, border: "1px solid var(--wc-border)", position: "relative", borderRadius: "50%" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 2, height: 20, background: "var(--wc-accent)", transformOrigin: "bottom center", animation: "wc-sweep 4s linear infinite", position: "absolute", bottom: "50%" }} />
            </div>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: 4, height: 4, background: "var(--wc-accent)", borderRadius: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
          <div style={{ textAlign: "center", marginTop: 4 }}>SCAN</div>
        </div>
      </div>

      {/* ─── RIGHT: selected client panel ─── */}
      <div style={{ display: "grid", gridTemplateRows: "auto auto auto 1fr auto", minHeight: 0, background: "var(--wc-panel)" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--wc-border)" }}>
          <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>NODE SÉLECTIONNÉ</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
            <span style={{ fontFamily: "var(--wc-mono)", fontSize: 14, color: "var(--wc-accent)" }}>{selClient?.id}</span>
            <span style={{ fontSize: 18, fontWeight: 500 }}>{selClient?.host}</span>
          </div>
          <div style={{ fontFamily: "var(--wc-mono)", fontSize: 11, color: "var(--wc-muted)", marginTop: 4 }}>
            {selClient?.user} · {selClient?.os} · {selClient?.ip}
          </div>
        </div>

        <div style={{ padding: 18, borderBottom: "1px solid var(--wc-border)" }}>
          {selClient && <WCScreenThumb client={selClient} w="100%" h={180} />}
        </div>

        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--wc-border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <WCKV label="CPU" value={`${selClient?.cpu}%`} />
          <WCKV label="RAM" value={`${selClient?.ram}%`} />
          <WCKV label="UPTIME" value={selClient?.uptime} />
          <WCKV label="SESSION" value={selClient?.session} />
        </div>

        <div style={{ padding: "12px 18px", overflow: "auto" }}>
          <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", marginBottom: 10 }}>Arsenal — cliquer pour envoyer</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
            {WC_EFFECTS.map(e => (
              <button key={e.id}
                onClick={() => fire(e.id)}
                onMouseEnter={() => setHoverFx(e.id)}
                onMouseLeave={() => setHoverFx(null)}
                style={{
                  padding: "10px 4px", background: hoverFx === e.id ? "var(--wc-accent)" : "var(--wc-panel-2)",
                  color: hoverFx === e.id ? "var(--wc-bg)" : "var(--wc-fg)",
                  border: "1px solid var(--wc-border)",
                  fontFamily: "var(--wc-mono)", fontSize: 10, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  transition: "all 0.1s",
                }}>
                <span style={{ fontSize: 16 }}>{e.icon}</span>
                <span style={{ fontSize: 9, letterSpacing: "0.03em" }}>{e.name}</span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 18, fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", marginBottom: 8 }}>Actions système</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {["Fond d'écran","Marquee","Cover","Capture","Invert","Bureau","Lock","Blackout","Shell","Stop FX","Reboot","Uninstall"].map((a, i) => (
              <button key={a} style={{
                padding: "8px 10px", background: "transparent", color: i >= 10 ? "var(--wc-err)" : "var(--wc-fg)",
                border: `1px solid ${i >= 10 ? "var(--wc-err)" : "var(--wc-border)"}`,
                fontFamily: "var(--wc-mono)", fontSize: 10, cursor: "pointer", textAlign: "left",
              }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "10px 18px", borderTop: "1px solid var(--wc-border)", background: "var(--wc-panel-2)", fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)" }}>
          {firing.length > 0 ? <span style={{ color: "var(--wc-accent)" }}>→ TRANSMITTING {firing.length} packet(s)…</span> : <span>idle · prêt à envoyer</span>}
        </div>
      </div>
    </div>
  );
};

window.V3Constellation = V3Constellation;
