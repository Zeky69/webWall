import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, MouseEvent as RMouseEvent } from "react";
import { toast } from "sonner";
import { api } from "../services/api";
import type { Client } from "../services/api";
import {
  WCBar,
  WCBox,
  WCBtn,
  WCDot,
  WCKV,
  WCKey,
  WCLabel,
  WCLvl,
  WCScreenThumb,
  WCSectionHead,
  WCSparkline,
  mono,
} from "./primitives";
import { useCtx } from "./context";
import type { Section } from "./context";

/* ─────────────────────────── helpers ─────────────────────────── */

function osCategory(os?: string): "linux" | "macos" | "windows" | "other" {
  if (!os) return "other";
  const s = os.toLowerCase();
  if (s.includes("mac") || s.includes("darwin")) return "macos";
  if (s.includes("win")) return "windows";
  if (
    s.includes("linux") ||
    s.includes("ubuntu") ||
    s.includes("debian") ||
    s.includes("arch") ||
    s.includes("fedora") ||
    s.includes("mint")
  )
    return "linux";
  return "other";
}

function shortClientId(c: Client): string {
  return c.id;
}

/* ─────────────────────────── TopBar ─────────────────────────── */

const SECTION_LABELS: [Section, string][] = [
  ["overview", "OVERVIEW"],
  ["clients", "CLIENTS"],
  ["effects", "EFFECTS"],
  ["logs", "LOGS"],
  ["stats", "STATS"],
  ["config", "CONFIG"],
];

export function TopBar() {
  const { version, section, setSection, user, isAdmin, clientsError } = useCtx();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr auto",
        borderBottom: "1px solid var(--wc-border)",
        background: "var(--wc-panel)",
        height: 44,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderRight: "1px solid var(--wc-border)",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            background: "var(--wc-accent)",
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", inset: 3, background: "var(--wc-bg)" }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", ...mono }}>
          WALLCHANGE
        </div>
        <div style={{ fontSize: 10, color: "var(--wc-muted)", ...mono }}>{version || "—"}</div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 24,
          fontSize: 11,
          overflow: "auto",
          ...mono,
        }}
        className="wc-scroll"
      >
        {SECTION_LABELS.map(([k, l]) => (
          <div
            key={k}
            onClick={() => setSection(k)}
            style={{
              color: section === k ? "var(--wc-fg)" : "var(--wc-muted)",
              borderBottom: section === k ? "2px solid var(--wc-accent)" : "none",
              padding: "14px 0",
              cursor: "pointer",
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            {l}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 16,
          fontSize: 11,
          color: "var(--wc-muted)",
          ...mono,
        }}
      >
        <span>wallchange.codeky.fr</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <WCDot status={clientsError ? "warn" : "online"} />
          {clientsError ? "degraded" : "API connected"}
        </span>
        <span style={{ color: "var(--wc-fg)" }}>
          {user} <span style={{ color: isAdmin ? "var(--wc-accent)" : "var(--wc-muted)" }}>{isAdmin ? "admin" : "user"}</span>
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── StatsRail (left) ─────────────────────────── */

function useSpark(value: number | undefined, length = 60) {
  const [series, setSeries] = useState<number[]>([]);
  useEffect(() => {
    if (value === undefined) return;
    setSeries(prev => {
      const next = [...prev, value];
      if (next.length > length) next.shift();
      return next;
    });
  }, [value, length]);
  return series;
}

export function StatsRail() {
  const { clients, stats } = useCtx();
  const onlineCount = clients.length;
  const total = onlineCount;

  const commands = stats?.feature_stats?.total_commands ?? 0;
  const captures = stats?.total_uploads ?? 0;
  const uniqueUsers = stats?.feature_stats?.summary?.unique_users ?? 0;
  const featureKinds = stats?.feature_stats?.summary?.feature_kinds ?? 0;
  const failed = stats?.feature_stats?.summary?.failed_requests ?? 0;
  const delivered = stats?.feature_stats?.summary?.total_requests_delivered ?? 0;
  const sent = stats?.feature_stats?.summary?.total_requests_sent ?? 0;
  const successRate = sent > 0 ? Math.round((delivered / sent) * 100) : 100;

  const msgSpark = useSpark(commands);
  const cmdRate = useMemo(() => {
    if (msgSpark.length < 2) return 0;
    return Math.max(0, msgSpark[msgSpark.length - 1] - msgSpark[msgSpark.length - 2]);
  }, [msgSpark]);
  const deltaSpark = useMemo(() => {
    const arr: number[] = [];
    for (let i = 1; i < msgSpark.length; i++) arr.push(Math.max(0, msgSpark[i] - msgSpark[i - 1]));
    return arr.length ? arr : [0];
  }, [msgSpark]);

  const osCounts = useMemo(() => {
    const m = { linux: 0, macos: 0, windows: 0, other: 0 };
    for (const c of clients) m[osCategory(c.os)]++;
    return m;
  }, [clients]);
  const osRows = [
    { n: "Linux", c: osCounts.linux, k: "linux" },
    { n: "macOS", c: osCounts.macos, k: "macos" },
    { n: "Windows", c: osCounts.windows, k: "windows" },
    { n: "Other", c: osCounts.other, k: "other" },
  ];
  const osTotal = clients.length || 1;

  const topHostnames = stats?.feature_stats?.leaderboards?.top_hostnames?.slice(0, 5) ?? [];
  const topFeatures = stats?.feature_stats?.leaderboards?.top_features?.slice(0, 5) ?? [];

  return (
    <div
      className="wc-scroll"
      style={{
        borderRight: "1px solid var(--wc-border)",
        background: "var(--wc-panel)",
        overflow: "auto",
        minHeight: 0,
      }}
    >
      <WCSectionHead title="FLEET" sub="temps réel" />
      <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <WCKV label="ONLINE" value={onlineCount} sub={`/ ${total}`} accent="var(--wc-ok)" />
        <WCKV label="USERS" value={uniqueUsers} accent="var(--wc-accent2)" />
        <WCKV label="FEATURES" value={featureKinds} />
        <WCKV label="SUCCESS" value={`${successRate}%`} sub={`${failed} err`} accent={successRate < 90 ? "var(--wc-warn)" : "var(--wc-ok)"} />
      </div>

      <WCSectionHead title="THROUGHPUT" sub="live" />
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", ...mono }}>cmd/tick</div>
            <div style={{ fontSize: 22, fontWeight: 500, ...mono }}>{cmdRate}</div>
          </div>
          <WCSparkline data={deltaSpark.length ? deltaSpark : [0, 0]} color="var(--wc-accent)" width={120} height={32} />
        </div>
        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", ...mono }}>commandes totales</div>
            <div style={{ fontSize: 22, fontWeight: 500, ...mono }}>{commands}</div>
          </div>
          <WCSparkline data={msgSpark.length ? msgSpark : [0, 0]} color="var(--wc-warn)" width={120} height={32} />
        </div>
      </div>

      <WCSectionHead title="ACTIVITÉ" sub="cumulée" />
      <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <WCKV label="COMMANDES" value={commands} />
        <WCKV label="UPLOADS" value={captures} />
        <WCKV
          label="DELIVERED"
          value={delivered}
          accent="var(--wc-accent)"
        />
        <WCKV label="FAILED" value={failed} accent={failed > 0 ? "var(--wc-err)" : "var(--wc-muted)"} />
      </div>

      <WCSectionHead title="RÉPARTITION OS" />
      <div style={{ padding: "12px 16px", fontSize: 11, ...mono }}>
        {osRows.map(r => {
          const pct = Math.round((r.c / osTotal) * 100);
          return (
            <div key={r.k} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span>{r.n}</span>
                <span style={{ color: "var(--wc-muted)" }}>
                  {r.c} · {pct}%
                </span>
              </div>
              <WCBar value={pct} color="var(--wc-accent)" />
            </div>
          );
        })}
      </div>

      <WCSectionHead title="TOP HOSTNAMES" sub={`${topHostnames.length}`} />
      <div style={{ padding: "10px 16px", fontSize: 11, ...mono }}>
        {topHostnames.length === 0 && (
          <div style={{ color: "var(--wc-muted)", fontSize: 10 }}>pas de données</div>
        )}
        {topHostnames.map((h, i) => (
          <div
            key={h.hostname + i}
            style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed var(--wc-border)" }}
          >
            <span style={{ color: "var(--wc-fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
              {h.hostname}
            </span>
            <span style={{ color: "var(--wc-accent)" }}>{h.count}</span>
          </div>
        ))}
      </div>

      <WCSectionHead title="TOP EFFECTS" />
      <div style={{ padding: "10px 16px", fontSize: 11, ...mono }}>
        {topFeatures.length === 0 && (
          <div style={{ color: "var(--wc-muted)", fontSize: 10 }}>pas de données</div>
        )}
        {topFeatures.map((f, i) => (
          <div
            key={f.feature + i}
            style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed var(--wc-border)" }}
          >
            <span style={{ color: "var(--wc-fg)" }}>{f.feature}</span>
            <span style={{ color: "var(--wc-accent)" }}>{f.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── ClientsStrip (center top) ─────────────────────────── */

type StripFilter = "all" | "online" | "locked";

function ClientMiniCard({
  client,
  selected,
  onSelect,
  onFocus,
  dense = false,
}: {
  client: Client;
  selected: boolean;
  onSelect: (e: RMouseEvent) => void;
  onFocus: () => void;
  dense?: boolean;
}) {
  return (
    <div
      onClick={e => {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          onSelect(e);
        } else {
          onFocus();
        }
      }}
      onContextMenu={e => {
        e.preventDefault();
        onSelect(e as unknown as RMouseEvent);
      }}
      style={{
        background: selected ? "var(--wc-panel-2)" : "var(--wc-panel)",
        padding: dense ? "8px 10px" : "10px 12px",
        cursor: "pointer",
        position: "relative",
        borderTop: selected ? "2px solid var(--wc-accent)" : "2px solid transparent",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <WCDot status="online" />
          <span style={{ fontSize: 10, color: "var(--wc-accent)", ...mono }}>{shortClientId(client)}</span>
        </div>
        {client.locked && (
          <span
            style={{
              fontSize: 9,
              color: "var(--wc-warn)",
              padding: "1px 4px",
              border: "1px solid var(--wc-warn)",
              ...mono,
            }}
          >
            LOCK
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--wc-fg)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          ...mono,
        }}
      >
        {client.hostname || "—"}
      </div>
      <div style={{ fontSize: 10, color: "var(--wc-muted)", marginTop: 2, ...mono }}>
        v{client.version || "?"} · {client.os || "—"}
      </div>
      {!dense && (
        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <div>
            <div style={{ fontSize: 9, color: "var(--wc-muted)", ...mono }}>CPU</div>
            <WCBar value={Number(client.cpu) || 0} color="var(--wc-accent)" />
          </div>
          <div>
            <div style={{ fontSize: 9, color: "var(--wc-muted)", ...mono }}>RAM</div>
            <WCBar value={Number(client.ram) || 0} color="var(--wc-accent)" />
          </div>
        </div>
      )}
    </div>
  );
}

export function ClientsStrip({
  compact = false,
  columns = 5,
  maxRows,
}: {
  compact?: boolean;
  columns?: number;
  maxRows?: number;
}) {
  const { clients, selected, toggleSelected, focusId, setFocusId, refreshClients, clientsLoading, clearSelected, selectAll } = useCtx();
  const [filter, setFilter] = useState<StripFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = clients.filter(c => {
    if (filter === "online") return true;
    if (filter === "locked") return !!c.locked;
    return true;
  }).filter(c => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      (c.hostname || "").toLowerCase().includes(q) ||
      (c.os || "").toLowerCase().includes(q)
    );
  });

  const visible = maxRows ? filtered.slice(0, columns * maxRows) : filtered;

  return (
    <div style={{ borderBottom: "1px solid var(--wc-border)", background: "var(--wc-panel)", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <WCSectionHead
        title={`CLIENTS (${clients.length})`}
        sub={`${selected.size} sélectionné${selected.size > 1 ? "s" : ""}`}
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 10, ...mono }}>
            <input
              placeholder="filter…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                background: "var(--wc-panel)",
                border: "1px solid var(--wc-border)",
                padding: "3px 6px",
                color: "var(--wc-fg)",
                outline: "none",
                width: 120,
                fontSize: 10,
                ...mono,
              }}
            />
            <span style={{ color: "var(--wc-muted)" }}>view:</span>
            {(["all", "online", "locked"] as StripFilter[]).map(f => (
              <span
                key={f}
                onClick={() => setFilter(f)}
                style={{ color: filter === f ? "var(--wc-accent)" : "var(--wc-muted)", cursor: "pointer" }}
              >
                {f}
              </span>
            ))}
            <span
              onClick={() => refreshClients()}
              style={{ color: "var(--wc-muted)", cursor: "pointer", marginLeft: 8 }}
              title="Refresh"
            >
              {clientsLoading ? "…" : "↻"}
            </span>
            <span
              onClick={() => (selected.size === clients.length && clients.length > 0 ? clearSelected() : selectAll())}
              style={{ color: "var(--wc-muted)", cursor: "pointer" }}
              title="Sélectionner tout"
            >
              ⊞
            </span>
          </div>
        }
      />
      {visible.length === 0 ? (
        <div style={{ padding: 20, color: "var(--wc-muted)", fontSize: 11, ...mono }}>
          aucun client connecté
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 1,
            background: "var(--wc-border)",
            padding: 1,
          }}
        >
          {visible.map(c => (
            <ClientMiniCard
              key={c.id}
              client={c}
              selected={selected.has(c.id) || focusId === c.id}
              onSelect={() => toggleSelected(c.id)}
              onFocus={() => setFocusId(c.id)}
              dense={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── FocusClient (center) ─────────────────────────── */

type FocusTab = "fond" | "marquee" | "particules" | "cover" | "shell" | "logs";

export function FocusClient() {
  const { clients, focusId, setFocusId, pushEvent, openScreen, isAdmin } = useCtx();
  const focus: Client | null = useMemo(() => {
    if (focusId) return clients.find(c => c.id === focusId) || null;
    return clients[0] || null;
  }, [clients, focusId]);
  const [tab, setTab] = useState<FocusTab>("fond");

  if (!focus) {
    return (
      <div style={{ padding: 18, color: "var(--wc-muted)", fontSize: 12, ...mono }}>
        aucun client sélectionné
      </div>
    );
  }
  return (
    <div style={{ padding: 18, overflow: "auto" }} className="wc-scroll">
      <FocusHeader client={focus} onClear={() => setFocusId(null)} onScreen={() => openScreen(focus.id)} />

      <div style={{ display: "flex", borderBottom: "1px solid var(--wc-border)", marginBottom: 14, overflow: "auto" }} className="wc-scroll">
        {([
          { k: "fond", l: "Fond" },
          { k: "marquee", l: "Marquee" },
          { k: "particules", l: "Particules" },
          { k: "cover", l: "Cover" },
          { k: "shell", l: "Shell" },
          { k: "logs", l: "Logs" },
        ] as { k: FocusTab; l: string }[]).map(t => (
          <div
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{
              padding: "8px 14px",
              fontSize: 11,
              cursor: "pointer",
              color: tab === t.k ? "var(--wc-fg)" : "var(--wc-muted)",
              borderBottom: tab === t.k ? "2px solid var(--wc-accent)" : "2px solid transparent",
              marginBottom: -1,
              whiteSpace: "nowrap",
              ...mono,
            }}
          >
            {t.l}
          </div>
        ))}
      </div>

      {tab === "fond" && <UploadUrlTab kind="wallpaper" client={focus} onEvent={pushEvent} />}
      {tab === "marquee" && <MarqueeTab client={focus} onEvent={pushEvent} />}
      {tab === "particules" && <UploadUrlTab kind="particles" client={focus} onEvent={pushEvent} />}
      {tab === "cover" && <UploadUrlTab kind="cover" client={focus} onEvent={pushEvent} />}
      {tab === "shell" && <ShellTab client={focus} isAdmin={isAdmin} />}
      {tab === "logs" && <LogsTab client={focus} />}
    </div>
  );
}

function FocusHeader({ client, onClear, onScreen }: { client: Client; onClear: () => void; onScreen: () => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, marginBottom: 18 }}>
      <div>
        <WCScreenThumb client={client} w={240} h={135} />
        <div style={{ marginTop: 8, display: "flex", gap: 10, fontSize: 10, color: "var(--wc-muted)", alignItems: "center", ...mono }}>
          <WCDot status="online" size={6} />
          <span>LIVE</span>
          <WCBtn onClick={onScreen} style={{ marginLeft: "auto" }}>capture ↗</WCBtn>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "var(--wc-accent)", ...mono }}>{client.id}</span>
          <span style={{ fontSize: 20, fontWeight: 500 }}>{client.hostname || "unknown"}</span>
          {client.locked && (
            <span style={{ fontSize: 10, color: "var(--wc-warn)", padding: "2px 6px", border: "1px solid var(--wc-warn)", ...mono }}>
              LOCKED
            </span>
          )}
          <span style={{ marginLeft: "auto" }}>
            <WCBtn onClick={onClear} style={{ fontSize: 10, padding: "3px 8px" }}>clear</WCBtn>
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--wc-muted)",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            marginTop: 14,
            ...mono,
          }}
        >
          <MetaField label="HOST" value={client.hostname} />
          <MetaField label="OS" value={client.os} />
          <MetaField label="VERSION" value={client.version} />
          <MetaField label="UPTIME" value={client.uptime} />
          <MetaField label="CPU" value={client.cpu} />
          <MetaField label="RAM" value={client.ram} />
          <MetaField label="LOCKED" value={client.locked ? "yes" : "no"} />
          <MetaField label="ID" value={client.id} accent />
        </div>
      </div>
    </div>
  );
}

function MetaField({ label, value, accent }: { label: string; value?: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 9, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: accent ? "var(--wc-accent)" : "var(--wc-fg)" }}>{value || "—"}</div>
    </div>
  );
}

function UploadUrlTab({
  kind,
  client,
  onEvent,
}: {
  kind: "wallpaper" | "cover" | "particles";
  client: Client;
  onEvent: (msg: string, client?: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sendUrl = async () => {
    if (!url.trim()) return;
    setBusy(true);
    try {
      if (kind === "wallpaper") await api.changeWallpaper(client.id, url);
      if (kind === "cover") await api.cover(client.id, url);
      if (kind === "particles") await api.particles(client.id, url);
      toast.success(`URL envoyée · ${kind}`);
      onEvent(`${kind}.set url`, client.id);
      setUrl("");
    } catch (e: any) {
      toast.error(e?.message || "échec");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      if (kind === "wallpaper") await api.uploadWallpaper(client.id, file);
      if (kind === "cover") await api.uploadCover(client.id, file);
      if (kind === "particles") await api.uploadParticles(client.id, file);
      toast.success("upload OK");
      onEvent(`${kind}.upload ${file.name}`, client.id);
    } catch (err: any) {
      toast.error(err?.message || "échec");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <WCBox dashed>
        <WCLabel>Upload image</WCLabel>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            aspectRatio: "16/9",
            border: "1px dashed var(--wc-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--wc-muted)",
            fontSize: 11,
            cursor: "pointer",
            ...mono,
          }}
        >
          cliquer ou déposer un fichier
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={upload} style={{ display: "none" }} />
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <WCBtn onClick={() => fileRef.current?.click()} disabled={busy}>Parcourir</WCBtn>
          <WCBtn primary onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? "…" : "Uploader"}</WCBtn>
        </div>
      </WCBox>
      <WCBox>
        <WCLabel>URL distante</WCLabel>
        <input
          className="wc-input"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://…"
        />
        <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "var(--wc-muted)", ...mono }}>→ {client.id}</span>
          <div style={{ marginLeft: "auto" }}>
            <WCBtn primary onClick={sendUrl} disabled={busy}>{busy ? "…" : "Appliquer"}</WCBtn>
          </div>
        </div>
      </WCBox>
    </div>
  );
}

function MarqueeTab({ client, onEvent }: { client: Client; onEvent: (msg: string, client?: string) => void }) {
  const [text, setText] = useState("RÉUNION 14H — SALLE CASSINI");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.marquee(client.id, text);
      toast.success("marquee envoyé");
      onEvent(`marquee.text "${text}"`, client.id);
    } catch (e: any) {
      toast.error(e?.message || "échec");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await api.uploadMarquee(client.id, file);
      toast.success("upload OK");
      onEvent(`marquee.upload ${file.name}`, client.id);
    } catch (err: any) {
      toast.error(err?.message || "échec");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <WCBox>
      <WCLabel>Texte / URL de marquee</WCLabel>
      <input
        className="wc-input"
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ fontSize: 13, letterSpacing: "0.05em" }}
      />
      <div
        style={{
          marginTop: 14,
          padding: "16px 0",
          background: "var(--wc-panel-2)",
          overflow: "hidden",
          border: "1px dashed var(--wc-border)",
        }}
      >
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.1em",
            color: "var(--wc-accent)",
            whiteSpace: "nowrap",
            animation: "wc-marquee 14s linear infinite",
            ...mono,
          }}
        >
          {text.repeat(4)}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={upload} style={{ display: "none" }} />
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <WCBtn onClick={() => fileRef.current?.click()} disabled={busy}>Upload image</WCBtn>
        <WCBtn primary onClick={send} disabled={busy}>{busy ? "…" : "Diffuser"}</WCBtn>
      </div>
    </WCBox>
  );
}

function ShellTab({ client, isAdmin }: { client: Client; isAdmin: boolean }) {
  const { pushEvent } = useCtx();
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string[]>([]);
  const [cmd, setCmd] = useState("");

  const pushLine = (line: string) => setOut(prev => [...prev, line].slice(-40));

  const doReverse = async () => {
    setBusy(true);
    try {
      const r = await api.reverseScreen(client.id);
      pushLine(`$ reverse → ${r}`);
      pushEvent("reverse.sent", client.id);
    } catch (e: any) {
      pushLine(`! ${e?.message || "err"}`);
    } finally {
      setBusy(false);
    }
  };

  const doKey = async () => {
    if (!cmd.trim()) return;
    setBusy(true);
    try {
      const r = await api.executeKey(client.id, cmd);
      pushLine(`$ key ${cmd} → ${r}`);
      pushEvent(`key ${cmd}`, client.id);
      setCmd("");
    } catch (e: any) {
      pushLine(`! ${e?.message || "err"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: "var(--wc-panel-2)", border: "1px solid var(--wc-border)", fontSize: 12, ...mono }}>
      <div style={{ padding: "6px 12px", borderBottom: "1px solid var(--wc-border)", display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--wc-muted)" }}>
        <span>shell relay · {client.id}{client.hostname ? ` · ${client.hostname}` : ""}</span>
        <span style={{ color: "var(--wc-err)" }}>● {isAdmin ? "ADMIN" : "USER"}</span>
      </div>
      <div style={{ padding: 14, minHeight: 220, maxHeight: 320, overflow: "auto", color: "var(--wc-fg-2)", lineHeight: 1.6 }} className="wc-scroll">
        {out.length === 0 && (
          <div style={{ color: "var(--wc-muted)" }}>
            ↳ `reverse` ouvre le relay d'écran du client.<br />
            ↳ `key combo` envoie un raccourci (ex : ctrl+alt+t).
          </div>
        )}
        {out.map((l, i) => (
          <div key={i} style={{ whiteSpace: "pre-wrap" }}>{l}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 0, borderTop: "1px solid var(--wc-border)" }}>
        <span style={{ padding: "8px 10px", color: "var(--wc-ok)" }}>$</span>
        <input
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          onKeyDown={e => e.key === "Enter" && doKey()}
          placeholder="ctrl+alt+t"
          className="wc-input"
          style={{ flex: 1, border: "none", background: "transparent" }}
        />
        <WCBtn onClick={doKey} disabled={busy}>key ↵</WCBtn>
        <WCBtn primary onClick={doReverse} disabled={busy}>reverse</WCBtn>
      </div>
    </div>
  );
}

function LogsTab({ client }: { client: Client }) {
  const { events } = useCtx();
  const filtered = events.filter(e => e.client === client.id).slice(0, 30);
  return (
    <WCBox>
      <WCLabel>Journal local — {client.id}</WCLabel>
      {filtered.length === 0 && <div style={{ color: "var(--wc-muted)", fontSize: 11, ...mono }}>pas encore d'événements</div>}
      {filtered.map((l, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "70px 44px 1fr",
            gap: 10,
            fontSize: 11,
            padding: "2px 0",
            ...mono,
          }}
        >
          <span style={{ color: "var(--wc-muted)" }}>{l.t}</span>
          <WCLvl lvl={l.lvl} />
          <span style={{ color: "var(--wc-fg)" }}>{l.msg}</span>
        </div>
      ))}
    </WCBox>
  );
}

/* ─────────────────────────── EffectsPanel (right of focus) ─────────────────────────── */

export type EffectDef = {
  id: string;
  name: string;
  cat: "fun" | "visual" | "admin";
  icon: string;
  run: (id: string) => Promise<unknown>;
  prompt?: string;
};

export const EFFECTS: EffectDef[] = [
  { id: "confetti", name: "Confetti", cat: "fun", icon: "✦", run: id => api.confetti(id) },
  { id: "fireworks", name: "Fireworks", cat: "fun", icon: "❋", run: id => api.fireworks(id) },
  { id: "dvd", name: "DVD Bounce", cat: "fun", icon: "◇", run: id => api.dvdbounce(id) },
  { id: "nyan", name: "Nyan Cat", cat: "fun", icon: "⌇", run: id => api.nyancat(id) },
  { id: "fly", name: "The Fly", cat: "fun", icon: "🪰", run: id => api.fly(id) },
  { id: "clones", name: "Clones", cat: "fun", icon: "⁂", run: id => api.clones(id) },
  { id: "drunk", name: "Drunk", cat: "visual", icon: "≋", run: id => api.drunk(id) },
  { id: "waves", name: "Wave Screen", cat: "visual", icon: "∿", run: id => api.wavescreen(id) },
  { id: "spotlight", name: "Spotlight", cat: "visual", icon: "○", run: id => api.spotlight(id) },
  { id: "invert", name: "Invert", cat: "visual", icon: "◐", run: id => api.invert(id) },
  { id: "terminal", name: "Fake Term", cat: "visual", icon: "▸_", run: id => api.faketerminal(id) },
  { id: "textscreen", name: "Text", cat: "visual", icon: "T", run: id => api.textscreen(id, "HELLO"), prompt: "Texte à afficher" },
  { id: "lock", name: "Lock", cat: "admin", icon: "▢", run: id => api.lock(id) },
  { id: "fakelock", name: "Fakelock", cat: "admin", icon: "▣", run: id => api.fakelock(id) },
  { id: "blackout", name: "Blackout", cat: "admin", icon: "■", run: id => api.blackout(id) },
];

const EFFECT_CATS: { key: "fun" | "visual" | "admin"; label: string }[] = [
  { key: "fun", label: "Ludique" },
  { key: "visual", label: "Visuel" },
  { key: "admin", label: "Admin / restreint" },
];

export function EffectsPanel({ layout = "sidebar" }: { layout?: "sidebar" | "wide" }) {
  const { broadcastAction, selected, focusId, isAdmin } = useCtx();
  const [pressed, setPressed] = useState<string | null>(null);
  const [customText, setCustomText] = useState("HELLO WORLD");

  const fire = async (fx: EffectDef) => {
    if (fx.cat === "admin" && !isAdmin) {
      toast.error("admin requis");
      return;
    }
    setPressed(fx.id);
    setTimeout(() => setPressed(null), 600);

    let action = fx.run;
    if (fx.id === "textscreen") {
      const txt = customText.trim() || "HELLO";
      action = id => api.textscreen(id, txt);
    }
    const confirmMsg = fx.cat === "admin"
      ? `Broadcaster "${fx.name}" à ${selected.size || (focusId ? 1 : 0)} cible(s) ?`
      : undefined;
    await broadcastAction(`fx.${fx.id}`, action, { confirm: confirmMsg });
  };

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", minHeight: 0 }}>
      <WCSectionHead title="EFFETS" sub={`${EFFECTS.length} disponibles`} right={
        <span style={{ fontSize: 10, color: "var(--wc-accent)", ...mono }}>broadcast</span>
      } />
      <div style={{ padding: 14, overflow: "auto" }} className="wc-scroll">
        {EFFECT_CATS.map(cat => {
          const visible = EFFECTS.filter(e => e.cat === cat.key);
          if (cat.key === "admin" && !isAdmin) return null;
          return (
            <div key={cat.key} style={{ marginBottom: 16 }}>
              <WCLabel>{cat.label}</WCLabel>
              <div style={{ display: "grid", gridTemplateColumns: layout === "wide" ? "repeat(6, 1fr)" : "repeat(3, 1fr)", gap: 6 }}>
                {visible.map(e => (
                  <button
                    key={e.id}
                    onClick={() => fire(e)}
                    style={{
                      padding: "10px 8px",
                      background: pressed === e.id ? "var(--wc-accent)" : "var(--wc-panel-2)",
                      color: pressed === e.id ? "var(--wc-bg)" : "var(--wc-fg)",
                      border: `1px solid ${pressed === e.id ? "var(--wc-accent)" : "var(--wc-border)"}`,
                      fontSize: 11,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.12s",
                      ...mono,
                    }}
                  >
                    <span style={{ fontSize: 14, color: pressed === e.id ? "var(--wc-bg)" : "var(--wc-accent)" }}>{e.icon}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
                    {e.cat === "admin" && <span style={{ fontSize: 8, opacity: 0.6 }}>▲</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <WCLabel>TextScreen — texte personnalisé</WCLabel>
        <input className="wc-input" value={customText} onChange={e => setCustomText(e.target.value)} />
      </div>
    </div>
  );
}

/* ─────────────────────────── QuickActions (bottom) ─────────────────────────── */

export function QuickActions() {
  const { broadcastAction, selected, focusId, isAdmin } = useCtx();
  const targetsLabel = selected.size > 0 ? `${selected.size} cible${selected.size > 1 ? "s" : ""}` : focusId ? "focus" : "—";

  return (
    <div
      style={{
        borderTop: "1px solid var(--wc-border)",
        background: "var(--wc-panel)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        flexWrap: "wrap",
        ...mono,
      }}
    >
      <span style={{ color: "var(--wc-muted)" }}>ACTIONS · {targetsLabel}</span>
      <WCBtn onClick={() => broadcastAction("desktop", id => api.showDesktop(id))}>
        Bureau <WCKey>d</WCKey>
      </WCBtn>
      <WCBtn onClick={() => broadcastAction("invert", id => api.invert(id))}>
        Invert <WCKey>i</WCKey>
      </WCBtn>
      <WCBtn onClick={() => broadcastAction("screenshot", id => api.requestScreenshot(id))}>
        Capture <WCKey>c</WCKey>
      </WCBtn>
      <WCBtn onClick={() => broadcastAction("update", id => api.triggerUpdate(id))}>
        Update <WCKey>u</WCKey>
      </WCBtn>
      <WCBtn onClick={() => broadcastAction("reverse", id => api.reverseScreen(id))}>
        Reverse <WCKey>r</WCKey>
      </WCBtn>
      {isAdmin && (
        <>
          <WCBtn
            onClick={() =>
              broadcastAction("lock", id => api.lock(id), { confirm: "Verrouiller les clients sélectionnés ?" })
            }
          >
            Lock <WCKey>l</WCKey>
          </WCBtn>
          <WCBtn
            onClick={() =>
              broadcastAction("blackout", id => api.blackout(id), { confirm: "Blackout 20min ?" })
            }
            danger
          >
            Blackout <WCKey>b</WCKey>
          </WCBtn>
          <WCBtn
            onClick={() =>
              broadcastAction("reinstall", id => api.reinstall(id), { confirm: "Réinstaller ?" })
            }
          >
            Reinstall
          </WCBtn>
          <WCBtn
            danger
            onClick={() =>
              broadcastAction(
                "uninstall",
                id => api.uninstallClient(id, "web"),
                { confirm: "DÉSINSTALLER — action irréversible ?" },
              )
            }
          >
            Uninstall <WCKey>⌫</WCKey>
          </WCBtn>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────── LogStream (right) ─────────────────────────── */

export function LogStream({ limit = 28 }: { limit?: number }) {
  const { events, pushEvent } = useCtx();
  const last = events.slice(0, limit);
  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", minHeight: 0 }}>
      <WCSectionHead
        title="LOG STREAM"
        sub="live"
        right={
          <span style={{ fontSize: 10, color: "var(--wc-ok)", display: "flex", alignItems: "center", gap: 6, ...mono }}>
            <WCDot status="online" size={6} /> tail -f
          </span>
        }
      />
      <div style={{ padding: "10px 14px", overflow: "auto", minHeight: 0 }} className="wc-scroll">
        {last.length === 0 && (
          <div style={{ color: "var(--wc-muted)", fontSize: 11, ...mono }}>
            en attente d'événements…
          </div>
        )}
        {last.map((l, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "66px 80px 44px 1fr",
              gap: 10,
              color: "var(--wc-fg-2)",
              opacity: i === 0 ? 1 : Math.max(0.55, 1 - i * 0.03),
              fontSize: 11,
              animation: i === 0 ? "wc-fade-in 0.25s ease" : undefined,
              ...mono,
            }}
          >
            <span style={{ color: "var(--wc-muted)" }}>{l.t}</span>
            <span
              style={{
                color: "var(--wc-accent)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {l.client}
            </span>
            <WCLvl lvl={l.lvl} />
            <span
              style={{
                color: "var(--wc-fg)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {l.msg}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          borderTop: "1px solid var(--wc-border)",
          padding: "8px 14px",
          fontSize: 10,
          color: "var(--wc-muted)",
          display: "flex",
          justifyContent: "space-between",
          ...mono,
        }}
      >
        <span>
          <span
            onClick={() => pushEvent("marker.ping", "-")}
            style={{ cursor: "pointer", color: "var(--wc-muted)" }}
            title="Marqueur"
          >
            ⚑ marker
          </span>
        </span>
        <span>{last.length} lignes</span>
      </div>
    </div>
  );
}

/* ─────────────────────────── StatusBar (bottom) ─────────────────────────── */

export function StatusBar() {
  const { clients, lastFetch, version } = useCtx();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const age = lastFetch ? Math.max(0, Math.round((now - lastFetch) / 1000)) : null;
  return (
    <div
      style={{
        borderTop: "1px solid var(--wc-border)",
        background: "var(--wc-panel-2)",
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        fontSize: 10,
        color: "var(--wc-muted)",
        height: 28,
        ...mono,
      }}
    >
      <span style={{ color: "var(--wc-ok)" }}>● READY</span>
      <span>api · wallchange.codeky.fr</span>
      <span>v{version || "?"}</span>
      <span>clients {clients.length}</span>
      <span>fetch {age !== null ? `${age}s` : "—"}</span>
      <span style={{ marginLeft: "auto" }}>{new Date(now).toLocaleTimeString("fr-FR")}</span>
    </div>
  );
}

/* ─────────────────────────── ScreenViewer modal ─────────────────────────── */

export function ScreenViewer({
  clientId,
  onClose,
}: {
  clientId: string | null;
  onClose: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const latestRef = useRef<string | null>(null);

  const load = async (req = false) => {
    if (!clientId) return;
    setBusy(true);
    setErr(null);
    try {
      if (req) {
        await api.requestScreenshot(clientId);
        await new Promise(r => setTimeout(r, 3500));
      }
      const blob = await api.getLatestScreenshot(clientId, Date.now());
      const url = URL.createObjectURL(blob);
      if (latestRef.current) URL.revokeObjectURL(latestRef.current);
      latestRef.current = url;
      setSrc(url);
    } catch (e: any) {
      setErr(e?.message || "indisponible");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    setSrc(null);
    setErr(null);
    if (clientId) load(false);
    return () => {
      if (latestRef.current) URL.revokeObjectURL(latestRef.current);
      latestRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId) return null;

  const overlay: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  };
  const panel: CSSProperties = {
    background: "var(--wc-panel)",
    border: "1px solid var(--wc-border)",
    width: "min(1200px, 95vw)",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
  };
  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderBottom: "1px solid var(--wc-border)",
            fontSize: 11,
            ...mono,
          }}
        >
          <span>
            screenshot · <span style={{ color: "var(--wc-accent)" }}>{clientId}</span>
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <WCBtn onClick={() => load(false)} disabled={busy}>↻ reload</WCBtn>
            <WCBtn primary onClick={() => load(true)} disabled={busy}>{busy ? "capture…" : "nouvelle capture"}</WCBtn>
            <WCBtn onClick={onClose}>✕</WCBtn>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 300,
            background: "var(--wc-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "auto",
          }}
          className="wc-scroll"
        >
          {busy && (
            <div style={{ position: "absolute", color: "var(--wc-muted)", fontSize: 11, ...mono }}>capture en cours…</div>
          )}
          {!busy && src && (
            <img
              src={src}
              alt={`screen ${clientId}`}
              style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }}
              onError={() => setErr("image indisponible")}
            />
          )}
          {!busy && !src && (
            <div style={{ color: "var(--wc-muted)", fontSize: 11, ...mono }}>
              {err || "pas encore de capture — cliquer sur « nouvelle capture »"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
