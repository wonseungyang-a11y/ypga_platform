import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isValidSupabasePublicUrl } from "@/lib/admin";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }
  if (!isValidSupabasePublicUrl(url)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 이 올바르지 않습니다. 예: https://xxxx.supabase.co (경로 없이 프로젝트 API URL만)",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* Server Component 등에서 set 불가한 경우 무시 */
        }
      },
    },
  });
}
