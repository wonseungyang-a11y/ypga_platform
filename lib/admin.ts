/**
 * PostgREST 기준 URL만 허용(경로 없음).
 * 실수로 앱 URL을 넣으면 요청이 Next 앱 안으로 가며 응답이 꼬일 수 있음.
 */
export function isValidSupabasePublicUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const p = u.pathname.replace(/\/+$/, "") || "/";
    return p === "/";
  } catch {
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  return isValidSupabasePublicUrl(url);
}
