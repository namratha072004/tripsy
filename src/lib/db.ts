import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only. Uses the service role key, so this must never be imported from a
// client component. All tables have RLS on with no public policies.
let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
