import { useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../services/api";
import { useClients, useEventLog, useStats, useTheme, useVersion } from "./hooks";
import { Ctx } from "./context";
import type { CtxValue, Section } from "./context";
import {
  ClientsStrip,
  EffectsPanel,
  FocusClient,
  LogStream,
  QuickActions,
  ScreenViewer,
  StatsRail,
  StatusBar,
  TopBar,
} from "./parts";
import { WCBar, WCBox, WCBtn, WCKV, WCLabel, WCLvl, WCSectionHead, mono } from "./primitives";

type Props = {
  onLogout: () => void;
};

export function CommandCenter({ onLogout }: Props) {
  const version = useVersion();
  const [theme, setTheme] = useTheme();
  const isAdmin = api.isAdmin();
  const user = useMemo(() => {
    return sessionStorage.getItem("wallchange_user") || (isAdmin ? "admin" : "user");
  }, [isAdmin]);

  const { clients, loading: clientsLoading, lastFetch, error, refresh } = useClients(true, 5000);
  const { stats, loading: statsLoading, refresh: refreshStats } = useStats(true, 15000);
  const { events, push } = useEventLog(stats?.feature_stats?.recent_events);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [screenFor, setScreenFor] = useState<string | null>(null);

  const toggleSelected = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelected = useCallback(() => setSelected(new Set()), []);
  const selectAll = useCallback(() => {
    setSelected(new Set(clients.map(c => c.id)));
  }, [clients]);

  const broadcastAction: CtxValue["broadcastAction"] = useCallback(
    async (label, action, opts) => {
      const targets = Array.from(selected);
      const effective = targets.length ? targets : focusId ? [focusId] : [];
      if (effective.length === 0) {
        toast.error("aucune cible sélectionnée");
        return;
      }
      if (opts?.confirm && !window.confirm(opts.confirm)) return;

      const results = await Promise.allSettled(effective.map(id => action(id)));
      let ok = 0;
      let ko = 0;
      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          ok++;
          push(label, effective[i]);
        } else {
          ko++;
          push(`${label} FAIL`, effective[i], "ERR");
        }
      });
      if (ok && !ko) toast.success(`${label} → ${ok}`);
      else if (ok && ko) toast.warning(`${label} → ${ok} ok · ${ko} err`);
      else toast.error(`${label} → échec`);
    },
    [focusId, push, selected],
  );

  const ctx: CtxValue = {
    version,
    clients,
    clientsError: error,
    clientsLoading,
    refreshClients: refresh,
    lastFetch,
    stats,
    statsLoading,
    refreshStats,
    events,
    pushEvent: push,
    selected,
    toggleSelected,
    clearSelected,
    selectAll,
    focusId,
    setFocusId,
    theme,
    setTheme,
    isAdmin,
    user,
    onLogout,
    openScreen: setScreenFor,
    section,
    setSection,
    broadcastAction,
  };

  return (
    <Ctx.Provider value={ctx}>
      <div
        className="wc-root"
        style={{
          width: "100%",
          height: "100vh",
          display: "grid",
          gridTemplateRows: "44px 1fr 28px",
          background: "var(--wc-bg)",
          color: "var(--wc-fg)",
          overflow: "hidden",
        }}
      >
        <TopBar />
        <div style={{ minHeight: 0, overflow: "hidden" }}>
          {section === "overview" && <OverviewSection />}
          {section === "clients" && <ClientsSection />}
          {section === "effects" && <EffectsSection />}
          {section === "shell" && <ClientsSection />}
          {section === "logs" && <LogsSection />}
          {section === "stats" && <StatsSection />}
          {section === "config" && <ConfigSection />}
        </div>
        <StatusBar />
        <ScreenViewer clientId={screenFor} onClose={() => setScreenFor(null)} />
      </div>
    </Ctx.Provider>
  );
}

/* ─────────────────────────── Sections ─────────────────────────── */

function OverviewSection() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr 360px",
        height: "100%",
        minHeight: 0,
      }}
    >
      <StatsRail />
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", minHeight: 0 }}>
        <ClientsStrip maxRows={2} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", minHeight: 0 }}>
          <div style={{ minHeight: 0, overflow: "hidden" }}>
            <FocusClient />
          </div>
          <div
            style={{
              borderLeft: "1px solid var(--wc-border)",
              background: "var(--wc-panel)",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <EffectsPanel layout="sidebar" />
          </div>
        </div>
        <QuickActions />
      </div>
      <div
        style={{
          borderLeft: "1px solid var(--wc-border)",
          background: "var(--wc-panel)",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <LogStream limit={40} />
      </div>
    </div>
  );
}

function ClientsSection() {
  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", height: "100%", minHeight: 0 }}>
      <ClientsStrip />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", minHeight: 0 }}>
        <div style={{ minHeight: 0, overflow: "hidden" }}>
          <FocusClient />
        </div>
        <div
          style={{
            borderLeft: "1px solid var(--wc-border)",
            background: "var(--wc-panel)",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <EffectsPanel layout="sidebar" />
        </div>
      </div>
      <QuickActions />
    </div>
  );
}

function EffectsSection() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", height: "100%", minHeight: 0 }}>
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", minHeight: 0 }}>
        <ClientsStrip compact maxRows={1} columns={6} />
        <div style={{ minHeight: 0, overflow: "auto" }} className="wc-scroll">
          <div style={{ padding: 20 }}>
            <EffectsPanel layout="wide" />
          </div>
        </div>
        <QuickActions />
      </div>
      <div
        style={{
          borderLeft: "1px solid var(--wc-border)",
          background: "var(--wc-panel)",
          minHeight: 0,
        }}
      >
        <LogStream limit={40} />
      </div>
    </div>
  );
}

function LogsSection() {
  const ctx = useContext(Ctx)!;
  const [filter, setFilter] = useState("");
  const filtered = ctx.events.filter(e =>
    filter.trim() ? (e.client + " " + e.msg).toLowerCase().includes(filter.toLowerCase()) : true,
  );

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100%", minHeight: 0 }}>
      <WCSectionHead
        title={`JOURNAL (${filtered.length})`}
        sub="local + serveur"
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              className="wc-input"
              placeholder="filter…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ width: 200, padding: "3px 6px", fontSize: 10 }}
            />
            <WCBtn onClick={() => ctx.pushEvent("marker.user", "-")}>marker</WCBtn>
          </div>
        }
      />
      <div style={{ overflow: "auto", padding: "10px 20px", minHeight: 0 }} className="wc-scroll">
        {filtered.map((l, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "80px 140px 60px 1fr",
              gap: 16,
              padding: "4px 0",
              borderBottom: "1px dashed var(--wc-border)",
              fontSize: 11,
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
            <span style={{ color: "var(--wc-fg)" }}>{l.msg}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ color: "var(--wc-muted)", fontSize: 11, padding: 20, ...mono }}>aucun événement</div>
        )}
      </div>
    </div>
  );
}

function StatsSection() {
  const ctx = useContext(Ctx)!;
  const s = ctx.stats;

  const summary = s?.feature_stats?.summary;
  const topUsers = s?.feature_stats?.leaderboards?.top_users?.slice(0, 10) ?? [];
  const topFeatures = s?.feature_stats?.leaderboards?.top_features?.slice(0, 10) ?? [];
  const topPcs = s?.feature_stats?.leaderboards?.top_pcs?.slice(0, 10) ?? [];
  const topConnectedUsers = s?.feature_stats?.leaderboards?.top_connected_users?.slice(0, 10) ?? [];
  const topImages = s?.top_images?.slice(0, 8) ?? [];

  return (
    <div className="wc-scroll" style={{ overflow: "auto", height: "100%", minHeight: 0 }}>
      <WCSectionHead
        title="STATISTIQUES"
        sub={ctx.statsLoading ? "chargement…" : "mise à jour 15s"}
        right={<WCBtn onClick={() => ctx.refreshStats()}>↻ refresh</WCBtn>}
      />
      <div style={{ padding: 20, display: "grid", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <WCKV label="UPLOADS" value={s?.total_uploads ?? 0} />
          <WCKV label="UNIQUES" value={s?.total_unique_images ?? 0} />
          <WCKV label="DUPLICATES" value={s?.total_duplicate_uploads ?? 0} />
          <WCKV label="SIZE" value={fmtBytes(s?.total_bytes_uploaded)} />
          <WCKV label="COMMANDES" value={summary?.total_commands ?? 0} accent="var(--wc-accent)" />
          <WCKV label="USERS" value={summary?.unique_users ?? 0} />
          <WCKV label="FEATURES" value={summary?.feature_kinds ?? 0} />
          <WCKV label="DELIVERED" value={summary?.total_requests_delivered ?? 0} accent="var(--wc-ok)" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <LeaderBoard title="TOP USERS" rows={topUsers.map(u => ({ label: u.user, value: u.total_commands }))} />
          <LeaderBoard title="TOP FEATURES" rows={topFeatures.map(f => ({ label: f.feature, value: f.count }))} />
          <LeaderBoard
            title="TOP PC"
            rows={topPcs.map(p => ({
              label: p.hostname || p.machine || p.target_id,
              value: `${p.total_deliveries}/${p.total_requests}`,
              sub: `${Math.round((p.success_rate || 0) * 100)}%`,
            }))}
          />
          <LeaderBoard
            title="TOP CONNECTED USERS"
            rows={topConnectedUsers.map(u => ({
              label: u.user,
              value: fmtSecs(u.total_seconds),
              sub: `${u.session_count} sess.`,
            }))}
          />
        </div>

        <div>
          <WCLabel>IMAGES POPULAIRES</WCLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {topImages.length === 0 && (
              <div style={{ color: "var(--wc-muted)", fontSize: 11, ...mono }}>pas d'images</div>
            )}
            {topImages.map(img => (
              <WCBox key={img.hash} padding={10}>
                <div
                  style={{
                    aspectRatio: "4/3",
                    background: "var(--wc-panel-2)",
                    border: "1px solid var(--wc-border)",
                    marginBottom: 6,
                    backgroundImage: `url(${apiImageUrl(img.stored_path)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--wc-fg)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    ...mono,
                  }}
                >
                  {img.original_name || img.hash.slice(0, 8)}
                </div>
                <div style={{ fontSize: 9, color: "var(--wc-muted)", ...mono }}>
                  ×{img.upload_count} · {fmtBytes(img.size_bytes)}
                </div>
              </WCBox>
            ))}
          </div>
        </div>

        <CommandsDistribution commands={s?.feature_stats?.commands ?? {}} />
      </div>
    </div>
  );
}

function ConfigSection() {
  const ctx = useContext(Ctx)!;
  return (
    <div style={{ padding: 20, display: "grid", gap: 20, maxWidth: 600 }}>
      <WCBox>
        <WCLabel>Thème</WCLabel>
        <div style={{ display: "flex", border: "1px solid var(--wc-border)" }}>
          {(["dark", "light", "crt"] as const).map(t => (
            <button
              key={t}
              onClick={() => ctx.setTheme(t)}
              style={{
                flex: 1,
                background: ctx.theme === t ? "var(--wc-accent)" : "transparent",
                color: ctx.theme === t ? "var(--wc-bg)" : "var(--wc-fg)",
                border: "none",
                padding: "8px 10px",
                cursor: "pointer",
                fontSize: 11,
                textTransform: "uppercase",
                ...mono,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </WCBox>

      <WCBox>
        <WCLabel>Compte</WCLabel>
        <div style={{ fontSize: 12, display: "grid", gap: 6, ...mono }}>
          <div>user: <span style={{ color: "var(--wc-accent)" }}>{ctx.user}</span></div>
          <div>
            role:{" "}
            <span style={{ color: ctx.isAdmin ? "var(--wc-accent)" : "var(--wc-fg)" }}>
              {ctx.isAdmin ? "admin" : "user"}
            </span>
          </div>
          <div>server: <span style={{ color: "var(--wc-fg)" }}>wallchange.codeky.fr</span></div>
          <div>version: <span style={{ color: "var(--wc-fg)" }}>{ctx.version || "?"}</span></div>
          <div>clients: <span style={{ color: "var(--wc-fg)" }}>{ctx.clients.length}</span></div>
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <WCBtn
            onClick={() => {
              ctx.refreshClients();
              ctx.refreshStats();
            }}
          >
            ↻ force refresh
          </WCBtn>
          <WCBtn danger onClick={ctx.onLogout}>
            logout
          </WCBtn>
        </div>
      </WCBox>
    </div>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

function fmtBytes(b?: number): string {
  if (b === undefined || b === null) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fmtSecs(s?: number): string {
  if (!s) return "0s";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m}m`;
}

function apiImageUrl(storedPath?: string): string {
  if (!storedPath) return "";
  const cleaned = storedPath.replace(/^\/+/, "");
  return `https://wallchange.codeky.fr/${cleaned}`;
}

function LeaderBoard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number | string; sub?: string }[];
}) {
  const max =
    rows.reduce((m, r) => {
      const n = typeof r.value === "number" ? r.value : Number((r.value + "").split("/")[0]) || 0;
      return Math.max(m, n);
    }, 0) || 1;
  return (
    <WCBox>
      <WCLabel>{title}</WCLabel>
      {rows.length === 0 && (
        <div style={{ color: "var(--wc-muted)", fontSize: 11, ...mono }}>aucune donnée</div>
      )}
      {rows.map((r, i) => {
        const n = typeof r.value === "number" ? r.value : Number((r.value + "").split("/")[0]) || 0;
        const pct = Math.round((n / max) * 100);
        return (
          <div key={r.label + i} style={{ marginBottom: 8, fontSize: 11, ...mono }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span
                style={{
                  color: "var(--wc-fg)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "60%",
                }}
              >
                {r.label}
              </span>
              <span style={{ color: "var(--wc-accent)" }}>
                {r.value}
                {r.sub && <span style={{ color: "var(--wc-muted)", marginLeft: 6 }}>{r.sub}</span>}
              </span>
            </div>
            <WCBar value={pct} />
          </div>
        );
      })}
    </WCBox>
  );
}

function CommandsDistribution({ commands }: { commands: Record<string, number> }) {
  const entries = Object.entries(commands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  if (entries.length === 0) return null;
  const max = entries[0]?.[1] || 1;
  return (
    <div>
      <WCLabel>RÉPARTITION COMMANDES ({entries.length})</WCLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ fontSize: 11, ...mono }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ color: "var(--wc-fg)" }}>{k}</span>
              <span style={{ color: "var(--wc-accent)" }}>{v}</span>
            </div>
            <WCBar value={(v / max) * 100} />
          </div>
        ))}
      </div>
    </div>
  );
}
