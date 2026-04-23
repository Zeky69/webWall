import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";
import type {
  Client,
  FeatureRecentEvent,
  ImageStatsResponse,
} from "../services/api";

export type Theme = "dark" | "light" | "crt";

const THEME_KEY = "wc-theme";

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(THEME_KEY)) as Theme | null;
    return stored === "light" || stored === "crt" || stored === "dark" ? stored : "dark";
  });

  useEffect(() => {
    document.body.className = `wc-theme-${theme}`;
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
  };

  return [theme, setTheme];
}

export function useVersion() {
  const [version, setVersion] = useState("");
  useEffect(() => {
    api.getVersion().then(setVersion).catch(() => setVersion(""));
  }, []);
  return version;
}

export function useClients(enabled: boolean, intervalMs = 5000) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const list = await api.listClients();
      setClients(list);
      setLastFetch(Date.now());
      setError(null);
    } catch (e: any) {
      setError(e?.message || "fetch failed");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, refresh]);

  return { clients, loading, lastFetch, error, refresh };
}

export function useStats(enabled: boolean, intervalMs = 15000) {
  const [stats, setStats] = useState<ImageStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const s = await api.getImageStats();
      setStats(s);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, refresh]);

  return { stats, loading, refresh };
}

export type EventEntry = {
  t: string;
  ts: number;
  client: string;
  lvl: "INFO" | "WARN" | "ERR";
  msg: string;
  source: "local" | "server";
};

function fmtTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function serverEventsToEntries(events: FeatureRecentEvent[]): EventEntry[] {
  return events.map(e => {
    const ts = e.timestamp * 1000;
    return {
      t: fmtTime(ts),
      ts,
      client: e.details || "-",
      lvl: "INFO",
      msg: `${e.command} · ${e.user}${e.details ? " → " + e.details : ""}`,
      source: "server",
    };
  });
}

const MAX_EVENTS = 200;

export function useEventLog(serverEvents: FeatureRecentEvent[] | undefined) {
  const [local, setLocal] = useState<EventEntry[]>([]);
  const [server, setServer] = useState<EventEntry[]>([]);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!serverEvents || !serverEvents.length) return;
    const mapped = serverEventsToEntries(serverEvents);
    const fresh: EventEntry[] = [];
    for (const e of mapped) {
      const key = `${e.ts}|${e.msg}`;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);
      fresh.push(e);
    }
    if (fresh.length === 0) return;
    setServer(prev => [...fresh, ...prev].slice(0, MAX_EVENTS));
  }, [serverEvents]);

  const push = useCallback(
    (msg: string, client = "-", lvl: EventEntry["lvl"] = "INFO") => {
      const ts = Date.now();
      setLocal(prev =>
        [
          { t: fmtTime(ts), ts, client, lvl, msg, source: "local" as const },
          ...prev,
        ].slice(0, MAX_EVENTS),
      );
    },
    [],
  );

  const events = useMemo(
    () => [...local, ...server].sort((a, b) => b.ts - a.ts).slice(0, MAX_EVENTS),
    [local, server],
  );

  return { events, push };
}
