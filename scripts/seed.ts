/**
 * Seed (or re-seed) the "Brightpath Tutoring" demo workspace into Supabase.
 *
 *   npm run db:seed
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Safe to re-run: it deletes the demo organisation (cascade) and inserts fresh data
 * with dates relative to today.
 */
import { createClient } from "@supabase/supabase-js";
import { buildDemoWorkspace } from "../src/lib/demo/seed";
import { objToRow, TABLES } from "../src/lib/data/mapping";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local) first.");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const ws = buildDemoWorkspace(new Date());
  console.log(`Seeding ${ws.org.name}…`);

  const del = await sb.from("organisations").delete().eq("id", ws.org.id);
  if (del.error) throw del.error;

  const { apiKey, ...org } = ws.org;
  const ins = await sb.from("organisations").insert(objToRow(org));
  if (ins.error) throw ins.error;
  const k = await sb.from("api_keys").insert({ key: apiKey, org_id: org.id, label: "Website" });
  if (k.error) throw k.error;

  // Insert in dependency order.
  const order: (keyof typeof TABLES)[] = [
    "team", "families", "guardians", "students", "tutors", "enquiries", "lessons", "packages",
    "credits", "invoices", "reports", "goals", "automations", "runs", "messages", "tasks",
  ];
  for (const coll of order) {
    const rows = (ws[coll] as object[]).map((r) => objToRow(r));
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await sb.from(TABLES[coll]).insert(rows.slice(i, i + 500));
      if (error) throw new Error(`${TABLES[coll]}: ${error.message}`);
    }
    console.log(`  ${TABLES[coll].padEnd(18)} ${rows.length}`);
  }
  console.log("Done. Open the app and click “Try the live demo”.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
