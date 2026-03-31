import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** SERVICE_ROLE 전용(서버·스크립트). env 없으면 null */
export function createSupabaseServiceClient(): SupabaseClient | null {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
