import { NextResponse, type NextRequest } from "next/server";
import { supabaseUser } from "@/lib/supabase/server";

/** Supabase magic-link callback: exchange the code for a session, then open the app. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (code) {
    const sb = await supabaseUser();
    await sb.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/app", req.url));
}
