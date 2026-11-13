/** Supabase mode is on when the public URL + anon key are set. Otherwise the built-in demo data is used. */
export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export const DEMO_COOKIE = "tl_session";
