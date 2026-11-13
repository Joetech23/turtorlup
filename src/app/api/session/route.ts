import { NextResponse } from "next/server";
import { DEMO_COOKIE, isSupabaseConfigured } from "@/lib/data/config";
import { supabaseUser } from "@/lib/supabase/server";

export async function DELETE() {
  if (isSupabaseConfigured()) {
    const sb = await supabaseUser();
    await sb.auth.signOut();
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(DEMO_COOKIE);
  return res;
}
