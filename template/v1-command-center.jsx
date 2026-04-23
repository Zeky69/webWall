// V1 — Command Center dashboard (dense, Grafana/Linear-inspired)
const V1CommandCenter = () => {
  const [selected, setSelected] = useState(new Set(["W-01A9"]));
  const [tab, setTab] = useState("fond");
  const [effectPressed, setEffectPressed] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  useWCTicker(2000);

  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const fireEffect = (fx) => {
    setEffectPressed(fx);
    setLastAction(`BROADCAST effect=${fx} targets=${selected.size}`);
    setTimeout(() => setEffectPressed(null), 600);
  };

  const focusClient = WC_CLIENTS.find(c => selected.has(c.id)) || WC_CLIENTS[0];

  return (
    <div className="wc-root" style={{ width: 1600, height: 1000, display: "grid", gridTemplateRows: "44px 1fr 28px", background: "var(--wc-bg)", color: "var(--wc-fg)", fontFamily: "var(--wc-sans)" }}>
      {/* ─── TOP BAR ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr auto", borderBottom: "1px solid var(--wc-border)", background: "var(--wc-panel)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 16px", borderRight: "1px solid var(--wc-border)", gap: 10 }}>
          <div style={{ width: 14, height: 14, background: "var(--wc-accent)", position: "relative" }}>
            <div style={{ position: "absolute", inset: 3, background: "var(--wc-bg)" }} />
          </div>
          <div style={{ fontFamily: "var(--wc-mono)", fontSize: 13, fontWeight: 600, letterSpacing: "0.02em" }}>WALLCHANGE</div>
          <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)" }}>0.4.2</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", padding: "0 16px", gap: 24, fontFamily: "var(--wc-mono)", fontSize: 11 }}>
          {["OVERVIEW","CLIENTS","EFFECTS","SHELL","LOGS","STATS","CONFIG"].map((t, i) => (
            <div key={t} style={{ color: i === 0 ? "var(--wc-fg)" : "var(--wc-muted)", borderBottom: i === 0 ? "2px solid var(--wc-accent)" : "none", padding: "14px 0", cursor: "pointer" }}>
              {t}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", padding: "0 16px", gap: 16, fontFamily: "var(--wc-mono)", fontSize: 11, color: "var(--wc-muted)" }}>
          <span>wallchange.codeky.fr</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <WCDot status="online" /> WS connected
          </span>
          <span style={{ color: "var(--wc-fg)" }}>thibault <span style={{ color: "var(--wc-accent)" }}>admin</span></span>
        </div>
      </div>

      {/* ─── MAIN GRID ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 360px", minHeight: 0 }}>
        {/* LEFT — stats rail */}
        <div style={{ borderRight: "1px solid var(--wc-border)", background: "var(--wc-panel)", overflow: "auto" }}>
          <V1SectionHead title="FLEET" sub="temps réel" />
          <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <WCKV label="ONLINE" value={WC_STATS.online} sub={`/ ${WC_STATS.total}`} accent="var(--wc-ok)" />
            <WCKV label="OFFLINE" value={WC_STATS.offline} accent="var(--wc-muted)" />
            <WCKV label="UPTIME" value={WC_STATS.uptime} />
            <WCKV label="LATENCY" value={WC_STATS.latencyAvg} sub={`p99 ${WC_STATS.latencyP99}`} />
          </div>

          <V1SectionHead title="THROUGHPUT" sub="60s" />
          <div style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
              <div>
                <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase" }}>msg/s</div>
                <div style={{ fontFamily: "var(--wc-mono)", fontSize: 22, fontWeight: 500 }}>{WC_STATS.msgsPerSec}</div>
              </div>
              <WCSparkline data={WC_SPARK_MSGS} color="var(--wc-accent)" width={120} height={32} />
            </div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase" }}>cpu pool</div>
                <div style={{ fontFamily: "var(--wc-mono)", fontSize: 22, fontWeight: 500 }}>23%</div>
              </div>
              <WCSparkline data={WC_SPARK_CPU} color="var(--wc-warn)" width={120} height={32} />
            </div>
          </div>

          <V1SectionHead title="ACTIVITÉ" sub="aujourd'hui" />
          <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, gridTemplateRows: "auto auto" }}>
            <WCKV label="COMMANDES" value={WC_STATS.commandsToday} />
            <WCKV label="CAPTURES" value={WC_STATS.screenshotsToday} />
            <WCKV label="FX ACTIFS" value={WC_STATS.effectsActive} accent="var(--wc-accent)" />
            <WCKV label="SHELLS" value={WC_STATS.shellsOpen} accent="var(--wc-err)" />
          </div>

          <V1SectionHead title="RÉPARTITION OS" />
          <div style={{ padding: "12px 16px", fontFamily: "var(--wc-mono)", fontSize: 11 }}>
            {[
              { n: "Linux", c: 4, pct: 40 },
              { n: "macOS", c: 2, pct: 20 },
              { n: "Windows", c: 3, pct: 30 },
              { n: "Other", c: 1, pct: 10 },
            ].map(r => (
              <div key={r.n} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span>{r.n}</span><span style={{ color: "var(--wc-muted)" }}>{r.c} · {r.pct}%</span>
                </div>
                <WCBar value={r.pct} color="var(--wc-accent)" />
              </div>
            ))}
          </div>

          <V1SectionHead title="ALERTES" sub="non acquittées" />
          <div style={{ padding: "10px 16px", fontFamily: "var(--wc-mono)", fontSize: 11 }}>
            {[
              { c: "W-08F5", m: "agent.crash signal=11", t: "4m" },
              { c: "W-10B2", m: "ws.disconnect timeout", t: "17m" },
              { c: "W-03F1", m: "cpu > 60% (67%)", t: "2m" },
            ].map((a, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, padding: "6px 0", borderBottom: i < 2 ? "1px dashed var(--wc-border)" : "none" }}>
                <span style={{ color: "var(--wc-err)" }}>●</span>
                <div>
                  <div style={{ color: "var(--wc-fg)" }}>{a.c}</div>
                  <div style={{ color: "var(--wc-muted)", fontSize: 10 }}>{a.m}</div>
                </div>
                <span style={{ color: "var(--wc-muted)", fontSize: 10 }}>{a.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — clients + focus */}
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", minHeight: 0 }}>
          {/* Clients strip */}
          <div style={{ borderBottom: "1px solid var(--wc-border)", background: "var(--wc-panel)" }}>
            <V1SectionHead title={`CLIENTS (${WC_CLIENTS.length})`} sub={`${selected.size} sélectionné${selected.size > 1 ? "s" : ""}`} right={
              <div style={{ display: "flex", gap: 8, fontFamily: "var(--wc-mono)", fontSize: 10 }}>
                <span style={{ color: "var(--wc-muted)" }}>filtres:</span>
                <span style={{ color: "var(--wc-accent)" }}>all</span>
                <span style={{ color: "var(--wc-muted)" }}>online</span>
                <span style={{ color: "var(--wc-muted)" }}>locked</span>
                <span style={{ color: "var(--wc-muted)" }}>fx</span>
              </div>
            } />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, background: "var(--wc-border)", padding: 1 }}>
              {WC_CLIENTS.map(c => (
                <div key={c.id} onClick={() => toggle(c.id)}
                  style={{
                    background: selected.has(c.id) ? "var(--wc-panel-2)" : "var(--wc-panel)",
                    padding: "10px 12px", cursor: "pointer", position: "relative",
                    borderTop: selected.has(c.id) ? "2px solid var(--wc-accent)" : "2px solid transparent",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <WCDot status={c.status} />
                      <span style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-accent)" }}>{c.id}</span>
                    </div>
                    {c.locked && <span style={{ fontFamily: "var(--wc-mono)", fontSize: 9, color: "var(--wc-warn)", padding: "1px 4px", border: "1px solid var(--wc-warn)" }}>LOCK</span>}
                    {c.effect && <span style={{ fontFamily: "var(--wc-mono)", fontSize: 9, color: "var(--wc-accent)", padding: "1px 4px", border: "1px solid var(--wc-accent)" }}>FX</span>}
                  </div>
                  <div style={{ fontFamily: "var(--wc-mono)", fontSize: 11, color: "var(--wc-fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.host}</div>
                  <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", marginTop: 2 }}>{c.user} · {c.os}</div>
                  <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div>
                      <div style={{ fontSize: 9, color: "var(--wc-muted)", fontFamily: "var(--wc-mono)" }}>CPU</div>
                      <WCBar value={c.cpu} color={c.cpu > 60 ? "var(--wc-warn)" : "var(--wc-accent)"} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: "var(--wc-muted)", fontFamily: "var(--wc-mono)" }}>RAM</div>
                      <WCBar value={c.ram} color={c.ram > 70 ? "var(--wc-warn)" : "var(--wc-accent)"} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Focus client + tabs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", minHeight: 0 }}>
            <div style={{ padding: 18, overflow: "auto" }}>
              <V1FocusClient client={focusClient} tab={tab} setTab={setTab} />
            </div>
            <div style={{ borderLeft: "1px solid var(--wc-border)", background: "var(--wc-panel)", padding: "0", display: "grid", gridTemplateRows: "auto 1fr" }}>
              <V1EffectsPanel effectPressed={effectPressed} onFire={fireEffect} />
            </div>
          </div>

          {/* Bottom bar — quick actions */}
          <div style={{ borderTop: "1px solid var(--wc-border)", background: "var(--wc-panel)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--wc-mono)", fontSize: 11 }}>
            <span style={{ color: "var(--wc-muted)" }}>ACTIONS RAPIDES {selected.size > 0 && `· ${selected.size} cible${selected.size > 1 ? "s" : ""}`}:</span>
            {[
              { k: "Bureau", s: "d" }, { k: "Invert", s: "i" }, { k: "Capture", s: "c" },
              { k: "Lock", s: "l" }, { k: "Blackout", s: "b" }, { k: "Shell", s: "s" },
              { k: "Shutdown", s: "⌫", danger: true }, { k: "Uninstall", s: "⌘⌫", danger: true }
            ].map(a => (
              <button key={a.k} onClick={() => setLastAction(`${a.k.toUpperCase()} → ${selected.size} client(s)`)}
                style={{
                  background: "transparent", border: "1px solid var(--wc-border)", color: a.danger ? "var(--wc-err)" : "var(--wc-fg)",
                  padding: "4px 10px", fontFamily: "var(--wc-mono)", fontSize: 11, cursor: "pointer",
                }}>
                {a.k} <WCKey>{a.s}</WCKey>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — log stream */}
        <div style={{ borderLeft: "1px solid var(--wc-border)", background: "var(--wc-panel)", display: "grid", gridTemplateRows: "auto 1fr auto", minHeight: 0 }}>
          <V1SectionHead title="LOG STREAM" sub="live" right={
            <span style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-ok)", display: "flex", alignItems: "center", gap: 6 }}>
              <WCDot status="online" size={6} /> tail -f
            </span>
          } />
          <div style={{ padding: "10px 14px", overflow: "hidden" }}>
            <WCLogStream limit={28} />
          </div>
          <div style={{ borderTop: "1px solid var(--wc-border)", padding: "8px 14px", fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", display: "flex", justifyContent: "space-between" }}>
            <span>{lastAction ? `→ ${lastAction}` : "waiting for commands…"}</span>
            <span>28 lines</span>
          </div>
        </div>
      </div>

      {/* ─── STATUS BAR ─── */}
      <div style={{ borderTop: "1px solid var(--wc-border)", background: "var(--wc-panel-2)", padding: "0 16px", display: "flex", alignItems: "center", gap: 24, fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)" }}>
        <span style={{ color: "var(--wc-ok)" }}>● READY</span>
        <span>ws://wallchange.codeky.fr/agent</span>
        <span>rtt {WC_STATS.latencyAvg}</span>
        <span>in {WC_STATS.bytesIn}</span>
        <span>out {WC_STATS.bytesOut}</span>
        <span style={{ marginLeft: "auto" }}>mongoose/7.14 · cJSON/1.7.18 · {new Date().toLocaleTimeString("fr-FR")}</span>
      </div>
    </div>
  );
};

const V1SectionHead = ({ title, sub, right }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "8px 16px", borderBottom: "1px solid var(--wc-border)", borderTop: "1px solid var(--wc-border)",
    background: "var(--wc-panel-2)", fontFamily: "var(--wc-mono)", fontSize: 10, letterSpacing: "0.08em",
    color: "var(--wc-muted)", textTransform: "uppercase",
  }}>
    <div><span style={{ color: "var(--wc-fg)" }}>{title}</span> {sub && <span>· {sub}</span>}</div>
    <div>{right}</div>
  </div>
);

const V1FocusClient = ({ client, tab, setTab }) => {
  const tabs = [
    { k: "fond", l: "Fond d'écran" },
    { k: "marquee", l: "Marquee" },
    { k: "particules", l: "Particules" },
    { k: "cover", l: "Cover" },
    { k: "shell", l: "Shell" },
    { k: "logs", l: "Logs" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, marginBottom: 18 }}>
        <div>
          <WCScreenThumb client={client} w={240} h={135} />
          <div style={{ marginTop: 8, display: "flex", gap: 6, fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)" }}>
            <span>LIVE</span><span style={{ color: "var(--wc-ok)" }}>●</span>
            <span style={{ marginLeft: "auto" }}>refresh 2s</span>
          </div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: "var(--wc-mono)", fontSize: 13, color: "var(--wc-accent)" }}>{client.id}</span>
            <span style={{ fontSize: 20, fontWeight: 500 }}>{client.host}</span>
            {client.locked && <span style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-warn)", padding: "2px 6px", border: "1px solid var(--wc-warn)" }}>LOCKED</span>}
          </div>
          <div style={{ fontFamily: "var(--wc-mono)", fontSize: 11, color: "var(--wc-muted)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 14 }}>
            <div><div style={{ fontSize: 9, textTransform: "uppercase" }}>User</div><div style={{ color: "var(--wc-fg)" }}>{client.user}</div></div>
            <div><div style={{ fontSize: 9, textTransform: "uppercase" }}>OS</div><div style={{ color: "var(--wc-fg)" }}>{client.os}</div></div>
            <div><div style={{ fontSize: 9, textTransform: "uppercase" }}>IP</div><div style={{ color: "var(--wc-fg)" }}>{client.ip}</div></div>
            <div><div style={{ fontSize: 9, textTransform: "uppercase" }}>Version</div><div style={{ color: "var(--wc-fg)" }}>{client.version}</div></div>
            <div><div style={{ fontSize: 9, textTransform: "uppercase" }}>Session</div><div style={{ color: "var(--wc-fg)" }}>{client.session}</div></div>
            <div><div style={{ fontSize: 9, textTransform: "uppercase" }}>Écran</div><div style={{ color: "var(--wc-fg)" }}>{client.screen}</div></div>
            <div><div style={{ fontSize: 9, textTransform: "uppercase" }}>Uptime</div><div style={{ color: "var(--wc-fg)" }}>{client.uptime}</div></div>
            <div><div style={{ fontSize: 9, textTransform: "uppercase" }}>Role</div><div style={{ color: client.role === "admin" ? "var(--wc-accent)" : "var(--wc-fg)" }}>{client.role}</div></div>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--wc-border)", marginBottom: 14 }}>
        {tabs.map(t => (
          <div key={t.k} onClick={() => setTab(t.k)}
            style={{
              padding: "8px 14px", fontFamily: "var(--wc-mono)", fontSize: 11, cursor: "pointer",
              color: tab === t.k ? "var(--wc-fg)" : "var(--wc-muted)",
              borderBottom: tab === t.k ? "2px solid var(--wc-accent)" : "2px solid transparent",
              marginBottom: -1,
            }}>
            {t.l}
          </div>
        ))}
      </div>

      {/* tab body */}
      {tab === "fond" && <V1TabFond />}
      {tab === "marquee" && <V1TabMarquee />}
      {tab === "particules" && <V1TabParticules />}
      {tab === "cover" && <V1TabCover />}
      {tab === "shell" && <V1TabShell client={client} />}
      {tab === "logs" && <V1TabLogs client={client} />}
    </div>
  );
};

const V1TabFond = () => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
    <div style={{ border: "1px dashed var(--wc-border)", padding: 14 }}>
      <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", marginBottom: 10 }}>Upload image</div>
      <div style={{ aspectRatio: "16/9", border: "1px dashed var(--wc-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--wc-muted)", fontFamily: "var(--wc-mono)", fontSize: 11 }}>
        drag .jpg / .png ici
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <V1Btn>Parcourir</V1Btn>
        <V1Btn primary>Appliquer</V1Btn>
      </div>
    </div>
    <div style={{ border: "1px solid var(--wc-border)", padding: 14 }}>
      <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", marginBottom: 10 }}>URL distante</div>
      <input defaultValue="https://cdn.example.com/wall.jpg"
        style={{ width: "100%", background: "var(--wc-panel-2)", border: "1px solid var(--wc-border)", color: "var(--wc-fg)", padding: "8px 10px", fontFamily: "var(--wc-mono)", fontSize: 11, outline: "none" }} />
      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)" }}>
          <input type="checkbox" defaultChecked style={{ marginRight: 4 }} />fit=cover
        </label>
        <V1Btn primary>Appliquer</V1Btn>
      </div>
      <div style={{ marginTop: 14, fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase" }}>Historique</div>
      <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
        {["bg1","bg2","bg3","bg4","bg5"].map((h, i) => (
          <div key={h} style={{ width: 56, height: 32, background: `linear-gradient(${45 + i*30}deg, var(--wc-panel-2), var(--wc-accent-soft))`, border: "1px solid var(--wc-border)", cursor: "pointer" }} />
        ))}
      </div>
    </div>
  </div>
);

const V1TabMarquee = () => (
  <div style={{ border: "1px solid var(--wc-border)", padding: 14 }}>
    <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", marginBottom: 10 }}>Texte défilant</div>
    <input defaultValue="RÉUNION ALL-HANDS 14H — SALLE CASSINI"
      style={{ width: "100%", background: "var(--wc-panel-2)", border: "1px solid var(--wc-border)", color: "var(--wc-fg)", padding: "10px 12px", fontFamily: "var(--wc-mono)", fontSize: 13, outline: "none", letterSpacing: "0.05em" }} />
    <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
      <V1Knob label="Vitesse" value="1.2x" />
      <V1Knob label="Direction" value="← gauche" />
      <V1Knob label="Taille" value="48px" />
      <V1Knob label="Couleur" value="#E8B547" swatch="var(--wc-accent)" />
    </div>
    <div style={{ marginTop: 14, padding: "16px 0", background: "var(--wc-panel-2)", overflow: "hidden", border: "1px dashed var(--wc-border)" }}>
      <div style={{ fontFamily: "var(--wc-mono)", fontSize: 18, letterSpacing: "0.1em", color: "var(--wc-accent)", whiteSpace: "nowrap", animation: "wc-marquee 14s linear infinite" }}>
        RÉUNION ALL-HANDS 14H — SALLE CASSINI ··· RÉUNION ALL-HANDS 14H — SALLE CASSINI ···
      </div>
    </div>
    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
      <V1Btn>Stop</V1Btn>
      <V1Btn primary>Diffuser</V1Btn>
    </div>
  </div>
);

const V1TabParticules = () => (
  <div>
    <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", marginBottom: 10 }}>Type de particules</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
      {["Confetti","Bulles","Étincelles","Poussière","Points","Traits","Ondes","Lucioles"].map((p, i) => (
        <div key={p} style={{ padding: "16px 10px", border: `1px solid ${i === 0 ? "var(--wc-accent)" : "var(--wc-border)"}`, fontFamily: "var(--wc-mono)", fontSize: 11, cursor: "pointer", textAlign: "center", color: i === 0 ? "var(--wc-accent)" : "var(--wc-fg)" }}>
          {p}
        </div>
      ))}
    </div>
    <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
      <V1Knob label="Densité" value="0.6" />
      <V1Knob label="Vitesse" value="1.0x" />
      <V1Knob label="Durée" value="∞" />
    </div>
  </div>
);

const V1TabCover = () => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
    <div style={{ border: "1px solid var(--wc-border)", padding: 14 }}>
      <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", marginBottom: 10 }}>Image plein écran</div>
      <div style={{ aspectRatio: "16/9", border: "1px dashed var(--wc-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--wc-muted)", fontFamily: "var(--wc-mono)", fontSize: 11, background: "repeating-linear-gradient(45deg, transparent 0 8px, var(--wc-panel-2) 8px 9px)" }}>
        cover.png
      </div>
    </div>
    <div style={{ border: "1px solid var(--wc-border)", padding: 14 }}>
      <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", marginBottom: 10 }}>Options</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontFamily: "var(--wc-mono)", fontSize: 11 }}>
        <label><input type="checkbox" defaultChecked /> bloquer input</label>
        <label><input type="checkbox" /> audio loop</label>
        <label><input type="checkbox" defaultChecked /> sur tous écrans</label>
        <label><input type="checkbox" /> minuterie auto</label>
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <V1Btn>Preview</V1Btn>
        <V1Btn primary>Afficher</V1Btn>
        <V1Btn danger>Retirer</V1Btn>
      </div>
    </div>
  </div>
);

const V1TabShell = ({ client }) => (
  <div style={{ background: "var(--wc-panel-2)", border: "1px solid var(--wc-border)", fontFamily: "var(--wc-mono)", fontSize: 12 }}>
    <div style={{ padding: "6px 12px", borderBottom: "1px solid var(--wc-border)", display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--wc-muted)" }}>
      <span>reverse-shell · {client.ip}:4444</span>
      <span style={{ color: "var(--wc-err)" }}>● SESSION ACTIVE</span>
    </div>
    <div style={{ padding: 14, minHeight: 220, color: "var(--wc-fg-2)", lineHeight: 1.6 }}>
      <div><span style={{ color: "var(--wc-ok)" }}>$</span> whoami</div>
      <div>{client.user}</div>
      <div><span style={{ color: "var(--wc-ok)" }}>$</span> uname -a</div>
      <div>{client.os} {client.host} 6.8.0-generic #1 SMP x86_64 GNU/Linux</div>
      <div><span style={{ color: "var(--wc-ok)" }}>$</span> ls ~/Documents</div>
      <div style={{ color: "var(--wc-muted)" }}>notes.md  project/  secrets.kdbx  screenshots/</div>
      <div style={{ marginTop: 6 }}>
        <span style={{ color: "var(--wc-ok)" }}>$</span> <span style={{ borderRight: "6px solid var(--wc-accent)", animation: "wc-blink 1s step-end infinite", paddingLeft: 4 }}></span>
      </div>
    </div>
  </div>
);

const V1TabLogs = ({ client }) => (
  <div style={{ border: "1px solid var(--wc-border)", padding: 14 }}>
    <WCLogStream filterClient={client.id} limit={14} />
  </div>
);

const V1Knob = ({ label, value, swatch }) => (
  <div>
    <div style={{ fontFamily: "var(--wc-mono)", fontSize: 9, color: "var(--wc-muted)", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
    <div style={{ border: "1px solid var(--wc-border)", padding: "6px 10px", fontFamily: "var(--wc-mono)", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--wc-panel-2)" }}>
      {swatch && <span style={{ width: 10, height: 10, background: swatch, marginRight: 6 }} />}
      <span>{value}</span>
      <span style={{ color: "var(--wc-muted)" }}>◂ ▸</span>
    </div>
  </div>
);

const V1Btn = ({ children, primary, danger, onClick }) => (
  <button onClick={onClick} style={{
    background: primary ? "var(--wc-accent)" : "transparent",
    color: primary ? "var(--wc-bg)" : danger ? "var(--wc-err)" : "var(--wc-fg)",
    border: `1px solid ${primary ? "var(--wc-accent)" : danger ? "var(--wc-err)" : "var(--wc-border)"}`,
    padding: "6px 14px", fontFamily: "var(--wc-mono)", fontSize: 11, cursor: "pointer", letterSpacing: "0.05em",
  }}>{children}</button>
);

const V1EffectsPanel = ({ effectPressed, onFire }) => (
  <>
    <V1SectionHead title="EFFETS" sub={`${WC_EFFECTS.length} disponibles`} right={
      <span style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-accent)" }}>broadcast</span>
    } />
    <div style={{ padding: 14, overflow: "auto" }}>
      {["fun","visual","admin"].map(cat => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--wc-mono)", fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.08em" }}>
            {cat === "fun" ? "Ludique" : cat === "visual" ? "Visuel" : "Admin / restreint"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {WC_EFFECTS.filter(e => e.cat === cat).map(e => (
              <button key={e.id} onClick={() => onFire(e.id)}
                style={{
                  padding: "10px 8px", background: effectPressed === e.id ? "var(--wc-accent)" : "var(--wc-panel-2)",
                  color: effectPressed === e.id ? "var(--wc-bg)" : "var(--wc-fg)",
                  border: `1px solid ${effectPressed === e.id ? "var(--wc-accent)" : "var(--wc-border)"}`,
                  fontFamily: "var(--wc-mono)", fontSize: 11, cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "all 0.12s", position: "relative",
                }}>
                <span style={{ fontSize: 14, color: effectPressed === e.id ? "var(--wc-bg)" : "var(--wc-accent)" }}>{e.icon}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
                {e.admin && <span style={{ fontSize: 8, opacity: 0.6 }}>▲</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  </>
);

window.V1CommandCenter = V1CommandCenter;
