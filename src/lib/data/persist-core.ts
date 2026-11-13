import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Action } from "@/lib/store/actions";
import { applyAction } from "@/lib/store/actions";
import { loadWorkspace, type Session } from "./load";
import { objToRow, TABLES } from "./mapping";
import { supabaseAdmin, supabaseUser } from "@/lib/supabase/server";

type Key = keyof typeof TABLES;

/**
 * Re-apply an action to a fresh snapshot with the same pure reducer the browser uses,
 * then upsert only the rows that changed.
 */
export async function persistWithSession(session: Session, action: Action) {
  const before = await loadWorkspace(session);
  const after = applyAction(before, action);
  const sb: SupabaseClient = session.kind === "user" ? await supabaseUser() : supabaseAdmin();

  for (const key of Object.keys(TABLES) as Key[]) {
    const prev = new Map((before[key] as { id: string }[]).map((r) => [r.id, JSON.stringify(r)]));
    const changed = (after[key] as { id: string }[]).filter((r) => prev.get(r.id) !== JSON.stringify(r));
    if (!changed.length) continue;
    const rows = changed.map((r) => ({ ...objToRow(r), org_id: session.orgId }));
    const { error } = await sb.from(TABLES[key]).upsert(rows);
    if (error) throw new Error(`${TABLES[key]}: ${error.message}`);
  }
  if (JSON.stringify(before.org) !== JSON.stringify(after.org)) {
    const { name, brandColour, timezone, currency, email, phone, address, website } = after.org;
    const { error } = await sb.from("organisations").update(objToRow({ name, brandColour, timezone, currency, email, phone, address, website })).eq("id", session.orgId);
    if (error) throw new Error(error.message);
  }
}

/** Server-to-server writes (public API) authenticated by API key rather than a user. */
export function persistForOrg(orgId: string, action: Action) {
  return persistWithSession({ kind: "demo", orgId }, action);
}
