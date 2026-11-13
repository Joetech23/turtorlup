import { NextResponse } from "next/server";
import { demoInbox } from "@/lib/data/enquiries";

export const dynamic = "force-dynamic";

/** Demo mode only: enquiries received through the API/embed form, for the open app to pick up. */
export function GET() {
  return NextResponse.json({ actions: demoInbox.actions });
}

export function DELETE() {
  demoInbox.actions = [];
  return NextResponse.json({ ok: true });
}
