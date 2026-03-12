import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with service role. Bypasses RLS.
 * Use only in server-side code (e.g. webhooks) that must act on behalf of any user.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key);
}
