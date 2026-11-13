"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Workspace } from "@/lib/types";
import { applyAction, type Action, type Effect } from "./actions";
import { persistAction } from "@/lib/data/persist";
import { buildDemoWorkspace } from "@/lib/demo/seed";

type Ctx = {
  ws: Workspace;
  dispatch: (a: Action) => void;
  reset: () => void;
  now: Date;
};

const WorkspaceContext = createContext<Ctx | null>(null);

export const INBOUND_KEY = "tutorlup:inbound";

const storageKey = (ws: Workspace) => `tutorlup:demo:v1:${ws.org.id}:${ws.anchor.slice(0, 10)}`;

function readLog(key: string): Action[] {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Action[]) : [];
  } catch {
    return [];
  }
}
function writeLog(key: string, log: Action[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(log));
  } catch {
    /* storage full or blocked: changes stay in memory only */
  }
}

/**
 * In demo mode the server only sends a timestamp: the seed is deterministic, so the
 * browser rebuilds the identical workspace itself instead of downloading ~1.5 MB of JSON.
 */
export function WorkspaceProvider({ initial: given, demoNow, children }: { initial?: Workspace; demoNow?: string; children: React.ReactNode }) {
  const [initial] = useState<Workspace>(() => given ?? buildDemoWorkspace(new Date(demoNow ?? Date.now())));
  const [ws, setWsState] = useState<Workspace>(initial);
  const wsRef = useRef<Workspace>(initial);
  const setWs = useCallback((next: Workspace) => {
    wsRef.current = next;
    setWsState(next);
  }, []);
  const logRef = useRef<Action[]>([]);
  const key = storageKey(initial);
  const [now, setNow] = useState(() => new Date(initial.now));

  const dispatch = useCallback(
    (a: Action) => {
      const effects: Effect[] = [];
      setWs(applyAction(wsRef.current, a, effects));
      for (const e of effects) toast.success(e.title, { description: e.description });
      if (initial.mode === "demo") {
        logRef.current = [...logRef.current, a];
        writeLog(key, logRef.current);
      } else {
        persistAction(a).catch((err: unknown) => toast.error("Could not save change", { description: String(err) }));
      }
    },
    [initial.mode, key, setWs],
  );

  // Replay locally saved demo changes after hydration. localStorage only exists in the
  // browser, so this has to run after the first (server-matching) render.
  useEffect(() => {
    if (initial.mode !== "demo") return;
    const log = readLog(key);
    logRef.current = log;
    if (!log.length) return;
    let next = initial;
    for (const a of log) next = applyAction(next, a);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off sync from browser storage
    setWs(next);
  }, [initial, key, setWs]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Pick up enquiries posted through the public API / embed form (demo mode).
  useEffect(() => {
    if (initial.mode !== "demo") return;
    let stop = false;
    const poll = async () => {
      try {
        // Same-origin embed form drops new enquiries here (works even when serverless
        // instances don't share memory); the server inbox catches API calls.
        let local: Action[] = [];
        try {
          local = JSON.parse(window.localStorage.getItem(INBOUND_KEY) ?? "[]") as Action[];
        } catch {
          /* ignore */
        }
        let remote: Action[] = [];
        const res = await fetch("/api/demo/inbound", { cache: "no-store" }).catch(() => null);
        if (res?.ok) remote = ((await res.json()) as { actions: Action[] }).actions;
        const incoming = [...local, ...remote];
        if (stop || !incoming.length) return;
        const known = new Set(logRef.current.filter((a) => a.type === "enquiry.create").map((a) => (a as Extract<Action, { type: "enquiry.create" }>).enquiry.id));
        for (const a of incoming) {
          if (a.type === "enquiry.create" && !known.has(a.enquiry.id)) {
            known.add(a.enquiry.id);
            dispatch(a);
          }
        }
      } catch {
        /* offline */
      }
    };
    poll();
    const t = setInterval(poll, 8000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [initial.mode, dispatch]);

  const reset = useCallback(() => {
    logRef.current = [];
    try {
      window.localStorage.removeItem(key);
      window.localStorage.removeItem(INBOUND_KEY);
    } catch {
      /* ignore */
    }
    setWs(initial);
    fetch("/api/demo/inbound", { method: "DELETE" }).catch(() => {});
    toast.success("Demo reset", { description: "All demo data is back to its original state." });
  }, [initial, key, setWs]);

  const value = useMemo(() => ({ ws, dispatch, reset, now }), [ws, dispatch, reset, now]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
