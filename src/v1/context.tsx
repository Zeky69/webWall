import { createContext, useContext } from "react";
import type { Client, ImageStatsResponse } from "../services/api";
import type { EventEntry, Theme } from "./hooks";

export type Section = "overview" | "clients" | "effects" | "shell" | "logs" | "stats" | "config";

export type CtxValue = {
  version: string;
  clients: Client[];
  clientsError: string | null;
  clientsLoading: boolean;
  refreshClients: () => Promise<void> | void;
  lastFetch: number;

  stats: ImageStatsResponse | null;
  statsLoading: boolean;
  refreshStats: () => Promise<void> | void;

  events: EventEntry[];
  pushEvent: (msg: string, client?: string, lvl?: EventEntry["lvl"]) => void;

  selected: Set<string>;
  toggleSelected: (id: string) => void;
  clearSelected: () => void;
  selectAll: () => void;
  focusId: string | null;
  setFocusId: (id: string | null) => void;

  theme: Theme;
  setTheme: (t: Theme) => void;

  isAdmin: boolean;
  user: string;
  onLogout: () => void;

  openScreen: (id: string) => void;

  section: Section;
  setSection: (s: Section) => void;

  broadcastAction: (
    label: string,
    action: (id: string) => Promise<unknown>,
    opts?: { confirm?: string },
  ) => Promise<void>;
};

export const Ctx = createContext<CtxValue | null>(null);

export function useCtx(): CtxValue {
  const c = useContext(Ctx);
  if (!c) throw new Error("Ctx missing");
  return c;
}
