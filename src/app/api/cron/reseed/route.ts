import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/data/config";
import { buildDemoWorkspace } from "@/lib/demo/seed";
import { objToRow, TABLES } from "@/lib/data/mapping";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Supabase mode: refresh the shared demo workspace so its dates stay relative to today.
 * Protected by CRON_SECRET (Vercel Cron sends it as a Bearer token). See vercel.json.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ skipped: "demo mode: data is generated on the fly" });

  const sb = supabaseAdmin();
  const ws = buildDemoWorkspace(new Date());
  const { apiKey, ...org } = ws.org;
  const del = await sb.from("organisations").delete().eq("id", org.id);
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });
  await sb.from("organisations").insert(objToRow(org));
  await sb.from("api_keys").insert({ key: apiKey, org_id: org.id, label: "Website" });
  const order: (keyof typeof TABLES)[] = ["team", "families", "guardians", "students", "tutors", "enquiries", "lessons", "packages", "credits", "invoices", "reports", "goals", "automations", "runs", "messages", "tasks"];
  for (const coll of order) {
    const rows = (ws[coll] as object[]).map((r) => objToRow(r));
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await sb.from(TABLES[coll]).insert(rows.slice(i, i + 500));
      if (error) return NextResponse.json({ error: `${TABLES[coll]}: ${error.message}` }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
