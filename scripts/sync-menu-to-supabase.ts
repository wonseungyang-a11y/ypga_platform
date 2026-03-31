/**
 * 기본 메뉴(DEFAULT_SITE_MENU)를 Supabase public.site_menu(id=1)에 덮어씀
 * 사용: npm run sync:menu
 * 필요: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (.env.local)
 */
import { config } from "dotenv";
import path from "node:path";
import { DEFAULT_SITE_MENU } from "../lib/site-menu";
import { createSupabaseServiceClient } from "../lib/supabase/service";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL 와 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.",
    );
    process.exit(1);
  }

  const { error } = await supabase
    .from("site_menu")
    .upsert(
      {
        id: 1,
        items: DEFAULT_SITE_MENU,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) {
    console.error("site_menu upsert 실패:", error.message);
    console.error("마이그레이션 001(site_menu 테이블) 적용 여부를 확인하세요.");
    process.exit(1);
  }

  console.log(
    "site_menu 갱신 완료:",
    DEFAULT_SITE_MENU.map((l) => l.label).join(" → "),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
