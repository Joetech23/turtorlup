import "server-only";
import { cookies } from "next/headers";
import type { Organisation, Workspace } from "@/lib/types";
import { buildDemoWorkspace } from "@/lib/demo/seed";
import { DEMO_COOKIE, isSupabaseConfigured } from "./config";
import { rowToObj, TABLES } from "./mapping";
import { supabaseAdmin, supabaseUser } from "@/lib/supabase/server";
import { APP_TZ, startOfToday } from "@/lib/dates";

export type Session = { kind: "demo"; orgId: string } | { kind: "user"; orgId: string; userId: string };

export const DEMO_ORG_SLUG = "brightpath";

/** Who is looking at the app, and which organisation they belong to. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const demo = store.get(DEMO_COOKIE)?.value === "demo";
  if (!isSupabaseConfigured()) return demo ? { kind: "demo", orgId: "org_brightpath" } : null;

  if (demo) {
    const { data } = await supabaseAdmin().from("organisations").select("id").eq("slug", DEMO_ORG_SLUG).maybeSingle();
    return data ? { kind: "demo", orgId: data.id as string } : null;
  }
  const sb = await supabaseUser();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data: member } = await sb.from("team_members").select("org_id").eq("user_id", auth.user.id).limit(1).maybeSingle();
  if (!member) return null;
  return { kind: "user", orgId: member.org_id as string, userId: auth.user.id };
}

/** Load the whole workspace snapshot for the current session. */
export async function loadWorkspace(session: Session): Promise<Workspace> {
  if (!isSupabaseConfigured()) return buildDemoWorkspace(new Date());

  const sb = session.kind === "demo" ? supabaseAdmin() : await supabaseUser();
  const orgRes = await sb.from("organisations").select("*").eq("id", session.orgId).single();
  if (orgRes.error) throw orgRes.error;
  const entries = await Promise.all(
    Object.entries(TABLES).map(async ([key, table]) => {
      // Supabase caps a single select at 1000 rows by default; page through.
      const rows: Record<string, unknown>[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await sb.from(table).select("*").eq("org_id", session.orgId).range(from, from + 999);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      return [key, rows.map((r) => rowToObj(r))] as const;
    }),
  );
  const coll = Object.fromEntries(entries) as unknown as Omit<Workspace, "org" | "anchor" | "now" | "mode">;
  const byDesc = <T extends Record<string, unknown>>(xs: T[], k: string) => xs.sort((a, b) => String(b[k]).localeCompare(String(a[k])));
  // API keys live in a service-role-only table; the session above has already been verified.
  const keyRes = await supabaseAdmin().from("api_keys").select("key").eq("org_id", session.orgId).limit(1).maybeSingle();
  return {
    ...coll,
    org: { ...rowToObj<Organisation>(orgRes.data), apiKey: (keyRes.data?.key as string | undefined) ?? "" },
    lessons: coll.lessons.sort((a, b) => a.start.localeCompare(b.start)),
    enquiries: byDesc(coll.enquiries, "createdAt"),
    runs: byDesc(coll.runs, "at"),
    messages: byDesc(coll.messages, "at"),
    anchor: startOfToday(APP_TZ).toISOString(),
    now: new Date().toISOString(),
    mode: "supabase",
  };
}
