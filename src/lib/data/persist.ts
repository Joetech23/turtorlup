"use server";

import type { Action } from "@/lib/store/actions";
import { isSupabaseConfigured } from "./config";
import { getSession } from "./load";
import { persistWithSession } from "./persist-core";

/**
 * Persist one action in Supabase mode. In demo mode this is a no-op: the browser keeps
 * demo changes in localStorage so every visitor gets their own sandbox.
 */
export async function persistAction(action: Action): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  await persistWithSession(session, action);
}
