// V2 — Terminal Grid / tmux-style operator workstation
const V2TerminalGrid = () => {
  const [focused, setFocused] = useState("pane-grid");
  const [selClient, setSelClient] = useState("W-01A9");
  const [cmd, setCmd] = useState("");
  const [shellLines, setShellLines] = useState([
    { k: "out", t: "Connected to W-01A9 via mongoose/ws on 10.0.12.41:4444" },
    { k: "out", t: "Agent 0.4.2 · cJSON · PID 28194" },
    { k: "prompt" },
  ]);
  useWCTicker(2000);

  const runCmd = (c) => {
    if (!c.trim()) return;
    const responses = {
      "ls": "notes.md  project/  secrets.kdbx  screenshots/  wallchange.log",
      "whoami": "thibault",
      "ps aux | head": "USER PID CPU MEM CMD\nroot 1 0.1 0.2 /sbin/init\nthibault 2841 2.4 1.8 /opt/wallchange/agent",
      "help": "commands: ls, whoami, ps, screenshot, effect <name>, lock, blackout, exit",
    };
    const out = responses[c] || `-sh: ${c}: command not found`;
    setShellLines(prev => [
      ...prev.slice(0, -1),
      { k: "cmd", t: c },
      { k: "out", t: out },
      { k: "prompt" }
    ]);
    setCmd("");
  };

  const client = WC_CLIENTS.find(c => c.id === selClient);

  return (
    <div className="wc-root" style={{ width: 1600, height: 1000, background: "var(--wc-bg)", color: "var(--wc-fg)", fontFamily: "var(--wc-mono)", display: "grid", gridTemplateRows: "28px 1fr 22px" }}>
      {/* TOP — tmux-like status ─── */}
      <div style={{ background: "var(--wc-accent)", color: "var(--wc-bg)", display: "flex", alignItems: "center", padding: "0 10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>
        <span style={{ marginRight: 14 }}>[wallchange]</span>
        <span style={{ background: "var(--wc-bg)", color: "var(--wc-accent)", padding: "2px 8px", marginRight: 4 }}>0:ops*</span>
        <span style={{ opacity: 0.6, padding: "2px 8px", marginRight: 4 }}>1:logs</span>
        <span style={{ opacity: 0.6, padding: "2px 8px", marginRight: 4 }}>2:fx</span>
        <span style={{ opacity: 0.6, padding: "2px 8px", marginRight: 4 }}>3:captures</span>
        <span style={{ marginLeft: "auto", fontSize: 10 }}>
          thibault@wallchange.codeky.fr · 10 clients · {new Date().toLocaleTimeString("fr-FR")}
        </span>
      </div>

      {/* GRID — 3 cols × 2 rows */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 1, background: "var(--wc-border)", minHeight: 0 }}>
        {/* PANE 0 — clients (spans 2 rows) */}
        <V2Pane title="[0] clients" idx="0" focused={focused === "pane-clients"} onClick={() => setFocused("pane-clients")} spanRows style={{ overflow: "hidden" }}>
          <div style={{ padding: "6px 10px", fontSize: 10, color: "var(--wc-muted)", borderBottom: "1px solid var(--wc-border)" }}>
            <span style={{ color: "var(--wc-accent)" }}>$</span> wcctl list --watch
          </div>
          <div style={{ overflow: "auto" }}>
            {WC_CLIENTS.map(c => (
              <div key={c.id} onClick={() => setSelClient(c.id)}
                style={{
                  padding: "8px 10px", cursor: "pointer",
                  background: selClient === c.id ? "var(--wc-accent-soft)" : "transparent",
                  borderLeft: selClient === c.id ? "3px solid var(--wc-accent)" : "3px solid transparent",
                  borderBottom: "1px solid var(--wc-border)",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                  <WCDot status={c.status} />
                  <span style={{ color: "var(--wc-accent)" }}>{c.id}</span>
                  <span style={{ color: "var(--wc-fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{c.host}</span>
                  {c.locked && <span style={{ color: "var(--wc-warn)", fontSize: 9 }}>L</span>}
                  {c.effect && <span style={{ color: "var(--wc-accent)", fontSize: 9 }}>FX</span>}
                </div>
                <div style={{ fontSize: 10, color: "var(--wc-muted)", marginTop: 3, display: "flex", justifyContent: "space-between" }}>
                  <span>{c.os}</span>
                  <span>cpu {c.cpu}% · ram {c.ram}%</span>
                </div>
              </div>
            ))}
          </div>
        </V2Pane>

        {/* PANE 1 — screen preview grid */}
        <V2Pane title="[1] screens" idx="1" focused={focused === "pane-grid"} onClick={() => setFocused("pane-grid")}>
          <div style={{ padding: "6px 10px", fontSize: 10, color: "var(--wc-muted)", borderBottom: "1px solid var(--wc-border)" }}>
            <span style={{ color: "var(--wc-accent)" }}>$</span> wcctl preview --all --live
          </div>
          <div style={{ padding: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, overflow: "auto" }}>
            {WC_CLIENTS.slice(0, 9).map(c => (
              <div key={c.id} onClick={() => setSelClient(c.id)} style={{ cursor: "pointer", border: selClient === c.id ? "1px solid var(--wc-accent)" : "1px solid var(--wc-border)" }}>
                <WCScreenThumb client={c} w="100%" h={90} />
                <div style={{ padding: "4px 6px", fontSize: 10, display: "flex", justifyContent: "space-between", background: "var(--wc-panel-2)" }}>
                  <span style={{ color: "var(--wc-accent)" }}>{c.id}</span>
                  <WCDot status={c.status} size={6} />
                </div>
              </div>
            ))}
          </div>
        </V2Pane>

        {/* PANE 2 — shell */}
        <V2Pane title={`[2] shell · ${selClient}`} idx="2" focused={focused === "pane-shell"} onClick={() => setFocused("pane-shell")}>
          <div style={{ padding: "6px 10px", fontSize: 10, color: "var(--wc-muted)", borderBottom: "1px solid var(--wc-border)", display: "flex", justifyContent: "space-between" }}>
            <span><span style={{ color: "var(--wc-accent)" }}>$</span> reverse-shell → {client?.ip}:4444</span>
            <span style={{ color: "var(--wc-err)" }}>● ACTIVE</span>
          </div>
          <div style={{ padding: 10, fontSize: 11, lineHeight: 1.55, overflow: "auto", height: "100%" }}>
            {shellLines.map((l, i) => {
              if (l.k === "cmd") return <div key={i}><span style={{ color: "var(--wc-ok)" }}>{client?.user}@{client?.host}</span> <span style={{ color: "var(--wc-muted)" }}>$</span> {l.t}</div>;
              if (l.k === "out") return <div key={i} style={{ color: "var(--wc-fg-2)", whiteSpace: "pre-wrap" }}>{l.t}</div>;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "var(--wc-ok)" }}>{client?.user}@{client?.host}</span>
                  <span style={{ color: "var(--wc-muted)", margin: "0 4px" }}>$</span>
                  <input value={cmd} onChange={e => setCmd(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && runCmd(cmd)}
                    autoFocus
                    placeholder="tape 'help'"
                    style={{ flex: 1, background: "transparent", border: "none", color: "var(--wc-fg)", outline: "none", fontFamily: "var(--wc-mono)", fontSize: 11 }} />
                  <span style={{ borderRight: "6px solid var(--wc-accent)", height: 12, animation: "wc-blink 1s step-end infinite" }} />
                </div>
              );
            })}
          </div>
        </V2Pane>

        {/* PANE 3 — effects broadcast */}
        <V2Pane title="[3] fx · broadcast" idx="3" focused={focused === "pane-fx"} onClick={() => setFocused("pane-fx")}>
          <div style={{ padding: "6px 10px", fontSize: 10, color: "var(--wc-muted)", borderBottom: "1px solid var(--wc-border)" }}>
            <span style={{ color: "var(--wc-accent)" }}>$</span> wcctl fx --broadcast
          </div>
          <div style={{ padding: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, overflow: "auto" }}>
            {WC_EFFECTS.map(e => (
              <button key={e.id} style={{
                padding: "10px 6px", background: "var(--wc-panel-2)", color: "var(--wc-fg)",
                border: "1px solid var(--wc-border)", fontFamily: "var(--wc-mono)", fontSize: 10,
                cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ color: "var(--wc-accent)", fontSize: 13 }}>{e.icon}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
              </button>
            ))}
          </div>
        </V2Pane>

        {/* PANE 4 — logs */}
        <V2Pane title="[4] logs · tail -f" idx="4" focused={focused === "pane-logs"} onClick={() => setFocused("pane-logs")}>
          <div style={{ padding: "6px 10px", fontSize: 10, color: "var(--wc-muted)", borderBottom: "1px solid var(--wc-border)" }}>
            <span style={{ color: "var(--wc-accent)" }}>$</span> journalctl -u wallchange-server -f
          </div>
          <div style={{ padding: 10, overflow: "hidden" }}>
            <WCLogStream limit={14} />
          </div>
        </V2Pane>
      </div>

      {/* BOTTOM bar */}
      <div style={{ background: "var(--wc-panel-2)", display: "flex", alignItems: "center", padding: "0 10px", fontSize: 10, color: "var(--wc-muted)", gap: 14 }}>
        <span><span style={{ color: "var(--wc-accent)" }}>^B</span> prefix</span>
        <span>←→ pane</span>
        <span>z zoom</span>
        <span>d detach</span>
        <span>:cmd</span>
        <span style={{ marginLeft: "auto" }}>load avg 0.41 · rtt {WC_STATS.latencyAvg} · in {WC_STATS.bytesIn}</span>
      </div>
    </div>
  );
};

const V2Pane = ({ title, idx, focused, onClick, children, spanRows, style }) => (
  <div onClick={onClick} style={{
    background: "var(--wc-panel)",
    gridRow: spanRows ? "span 2" : undefined,
    border: focused ? "1px solid var(--wc-accent)" : "1px solid transparent",
    display: "flex", flexDirection: "column", minHeight: 0,
    ...style
  }}>
    <div style={{
      padding: "3px 8px", fontSize: 10,
      background: focused ? "var(--wc-accent)" : "var(--wc-panel-2)",
      color: focused ? "var(--wc-bg)" : "var(--wc-muted)",
      borderBottom: "1px solid var(--wc-border)",
      display: "flex", justifyContent: "space-between",
    }}>
      <span>{title}</span>
      <span>{focused ? "●" : "○"}</span>
    </div>
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

window.V2TerminalGrid = V2TerminalGrid;
