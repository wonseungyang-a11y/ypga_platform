import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isValidSupabasePublicUrl } from "@/lib/admin";

function serviceSupabaseUrl(): string | null {
  const raw =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  if (!isValidSupabasePublicUrl(raw)) return null;
  return raw;
}

/** AI 분석·서버 스크립트용. URL·서비스 롤 키가 있고 URL 형식이 맞을 때만 true */
export function isSupabaseServiceConfigured(): boolean {
  const url = serviceSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && key);
}

/** SERVICE_ROLE 전용(서버·스크립트). env 없으면 null */
export function createSupabaseServiceClient(): SupabaseClient | null {
  const url = serviceSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
