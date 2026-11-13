import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE } from "@/lib/data/config";

/** One-click, password-free sign-in to the Brightpath Tutoring demo workspace. */
export function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to");
  const dest = to && to.startsWith("/app") ? to : "/app";
  const res = NextResponse.redirect(new URL(dest, req.url));
  res.cookies.set(DEMO_COOKIE, "demo", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14, secure: process.env.NODE_ENV === "production" });
  return res;
}
