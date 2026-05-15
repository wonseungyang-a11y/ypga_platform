/**
 * 프로젝트 `data/` 폴더 → Supabase
 * - CSV: `members.csv`, `tournaments.csv`, `participants.csv` → `ypga_*`
 * - JSON: `site-menu.json` → `site_menu`, `page-contents.json` → `site_page_content`
 * 사용: npm run sync:db
 * 선행: `001_site_menu.sql`, `002_site_page_content.sql`, `003_ypga_data_tables.sql` 적용
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseMembersCsv } from "../lib/members-csv";
import { parseParticipantsCsv } from "../lib/participants-csv";
import type { ParticipantRow } from "../lib/participants-types";
import { parseTournamentsCsv } from "../lib/tournaments-csv";
import { isSafeContentPath, normalizeContentPath } from "../lib/page-content";
import { createSupabaseServiceClient } from "../lib/supabase/service";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const BATCH = 400;

async function insertBatches<T extends Record<string, unknown>>(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  table: string,
  rows: T[],
) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) {
      throw new Error(`${table} insert ${i}: ${error.message}`);
    }
  }
}

function participantRowsForDb(rows: ParticipantRow[]) {
  return rows.map((p) => ({
    event_title: p.eventLabel,
    event_date: p.date || null,
    location: p.venue,
    group_no: p.groupNo,
    name: p.name,
  }));
}

const SCHEMA_FIX_HINT =
  "Supabase SQL Editor에서 supabase/migrations/007_rebuild_ypga_tables.sql 실행 후 npm run sync:db";

async function syncSiteMenuFromDisk(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  root: string,
) {
  const menuPath = path.join(root, "data", "site-menu.json");
  let raw: string;
  try {
    raw = readFileSync(menuPath, "utf-8");
  } catch {
    console.log("data/site-menu.json 없음 — site_menu 생략");
    return;
  }
  const j = JSON.parse(raw) as { links?: unknown; items?: unknown };
  const items = Array.isArray(j.items) ? j.items : j.links;
  if (!Array.isArray(items)) {
    console.warn(
      "data/site-menu.json: items 또는 links 배열이 없음 — site_menu 생략",
    );
    return;
  }
  const { error } = await supabase.from("site_menu").upsert(
    {
      id: 1,
      items,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`site_menu upsert: ${error.message}`);
  console.log(`site_menu: ${items.length}개 항목`);
}

async function syncPageContentsFromDisk(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  root: string,
) {
  const pcPath = path.join(root, "data", "page-contents.json");
  let raw: string;
  try {
    raw = readFileSync(pcPath, "utf-8");
  } catch {
    console.log("data/page-contents.json 없음 — site_page_content 생략");
    return;
  }
  const obj = JSON.parse(raw) as Record<string, unknown>;
  if (!obj || typeof obj !== "object") {
    console.log("data/page-contents.json 형식 아님 — site_page_content 생략");
    return;
  }
  let n = 0;
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val !== "string") continue;
    const pathNorm = normalizeContentPath(key);
    if (!isSafeContentPath(pathNorm)) {
      console.warn(`page-contents 건너뜀(경로 비허용): ${key}`);
      continue;
    }
    const { error } = await supabase.from("site_page_content").upsert(
      {
        path: pathNorm,
        body_md: val,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "path" },
    );
    if (error) {
      throw new Error(`site_page_content upsert ${pathNorm}: ${error.message}`);
    }
    n += 1;
  }
  console.log(`site_page_content: ${n}행 upsert`);
}

export async function syncCsvToSupabase() {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL 와 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.",
    );
    process.exit(1);
  }

  const { error: trErr } = await supabase.rpc("truncate_ypga_data");
  if (trErr) {
    console.error("truncate_ypga_data 실패:", trErr.message);
    console.error(
      "Supabase에 마이그레이션이 적용되지 않았을 수 있습니다. SQL Editor에서 순서대로 실행하세요:",
    );
    console.error("  1) supabase/migrations/001_site_menu.sql");
    console.error("  2) supabase/migrations/002_site_page_content.sql");
    console.error("  3) supabase/migrations/003_ypga_data_tables.sql");
    console.error(
      "  한글 컬럼·수동 import 로 깨진 경우: supabase/migrations/007_rebuild_ypga_tables.sql 후 npm run db:rebuild-ypga",
    );
    process.exit(1);
  }

  const root = process.cwd();

  const membersRaw = readFileSync(
    path.join(root, "data", "members.csv"),
    "utf-8",
  );
  const members = parseMembersCsv(membersRaw).map((m) => ({
    category: m.category,
    serial_no: m.serialNo,
    cohort: m.cohort,
    name: m.name,
    nickname_ko: m.nicknameKo,
    nickname_en: m.nicknameEn,
    residence: m.residence,
  }));
  await insertBatches(supabase, "ypga_members", members);
  console.log(`ypga_members: ${members.length}행`);

  const tourRaw = readFileSync(
    path.join(root, "data", "tournaments.csv"),
    "utf-8",
  );
  const tours = parseTournamentsCsv(tourRaw).map((t) => {
    const p = parseInt(t.participants, 10);
    return {
      title: t.title,
      event_date: t.date || null,
      location: t.location,
      type: t.type,
      format: t.format,
      participants: Number.isFinite(p) ? p : null,
      winner: t.winner,
      winner_score: t.winnerScore,
      medalist: t.medalist,
      medalist_score: t.medalistScore,
      notes: t.notes,
    };
  });
  await insertBatches(supabase, "ypga_tournaments", tours);
  console.log(`ypga_tournaments: ${tours.length}행`);

  const partRaw = readFileSync(
    path.join(root, "data", "participants.csv"),
    "utf-8",
  );
  const parts = parseParticipantsCsv(partRaw);
  try {
    await insertBatches(
      supabase,
      "ypga_participants",
      participantRowsForDb(parts),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`${msg}\n→ ${SCHEMA_FIX_HINT}`);
  }
  console.log(`ypga_participants: ${parts.length}행`);

  await syncSiteMenuFromDisk(supabase, root);
  await syncPageContentsFromDisk(supabase, root);

  console.log("data/ → Supabase 동기화 완료.");
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  /sync-csv-to-supabase/.test(process.argv[1]);

if (isDirectRun) {
  syncCsvToSupabase().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
