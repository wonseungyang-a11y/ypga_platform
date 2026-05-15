/**
 * ypga_* 테이블 영문 스키마 재생성 + data/*.csv 동기화
 *
 * 1) rebuild_ypga_schema RPC (007 마이그레이션 적용 후)
 * 2) 실패 시 SUPABASE_DB_URL 로 007 SQL 파일 실행 (선택)
 * 3) npm run sync:db 와 동일한 CSV 적재
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createSupabaseServiceClient } from "../lib/supabase/service";
import { syncCsvToSupabase } from "./sync-csv-to-supabase";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

async function tryRebuildViaRpc(): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    console.error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
    return false;
  }

  const { error } = await supabase.rpc("rebuild_ypga_schema");
  if (!error) {
    console.log("rebuild_ypga_schema RPC 완료 (영문 스키마 재생성)");
    return true;
  }

  if (
    error.message.includes("does not exist") ||
    error.message.includes("Could not find the function")
  ) {
    console.warn(
      "rebuild_ypga_schema 함수가 없습니다. supabase/migrations/007_rebuild_ypga_tables.sql 을 SQL Editor에서 실행하세요.",
    );
    return false;
  }

  console.error("rebuild_ypga_schema 실패:", error.message);
  return false;
}

async function tryRebuildViaPg(): Promise<boolean> {
  const url =
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "";
  if (!url) return false;

  let pg: typeof import("pg");
  try {
    pg = await import("pg");
  } catch {
    console.warn("pg 패키지 없음 — npx tsx scripts/rebuild-ypga-and-sync.ts 전에 npm install -D pg 실행");
    return false;
  }

  const sqlPath = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "007_rebuild_ypga_tables.sql",
  );
  const sql = readFileSync(sqlPath, "utf-8");
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);
    console.log("007_rebuild_ypga_tables.sql 적용 완료 (SUPABASE_DB_URL)");
    return true;
  } catch (e) {
    console.error(
      "SQL 실행 실패:",
      e instanceof Error ? e.message : String(e),
    );
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function main() {
  const rebuilt = (await tryRebuildViaRpc()) || (await tryRebuildViaPg());
  if (!rebuilt) {
    console.error(
      "\n스키마 재생성에 실패했습니다. Supabase Dashboard → SQL Editor에서",
    );
    console.error("supabase/migrations/007_rebuild_ypga_tables.sql 을 실행한 뒤");
    console.error("다시 npm run db:rebuild-ypga 를 실행하세요.\n");
    process.exit(1);
  }

  console.log("\nCSV 동기화 시작…");
  await syncCsvToSupabase();
  console.log("\n완료: 스키마 재생성 + CSV 동기화");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
