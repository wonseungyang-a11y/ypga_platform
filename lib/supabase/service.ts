import dns from "node:dns";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isValidSupabasePublicUrl } from "@/lib/admin";

/** 일부 호스팅 환경에서 IPv6 경로만 실패해 `fetch failed`가 나는 경우가 있어 IPv4를 우선합니다. */
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

function normalizeSupabaseApiOrigin(urlStr: string): string {
  const u = new URL(urlStr.trim());
  return u.origin;
}

function serviceSupabaseUrl(): string | null {
  const raw =
    process.env.SUPABASE_URL?.replace(/\u00a0/g, " ").trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\u00a0/g, " ").trim();
  if (!raw) return null;
  if (!isValidSupabasePublicUrl(raw)) return null;
  try {
    return normalizeSupabaseApiOrigin(raw);
  } catch {
    return null;
  }
}

/** AI 분석·서버 스크립트용. URL·서비스 롤 키가 있고 URL 형식이 맞을 때만 true */
export function isSupabaseServiceConfigured(): boolean {
  const url = serviceSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\u00a0/g, " ").trim();
  return Boolean(url && key);
}

/** SERVICE_ROLE 전용(서버·스크립트). env 없으면 null */
export function createSupabaseServiceClient(): SupabaseClient | null {
  const url = serviceSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\u00a0/g, " ").trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
