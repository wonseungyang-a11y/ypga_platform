/**
 * 로컬 data/*.csv → Supabase ypga_* 테이블 적재
 * 사용: npm run sync:db
 * 선행: supabase/migrations/003_ypga_data_tables.sql 실행
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseMembersCsv } from "../lib/members-csv";
import { parseParticipantsCsv } from "../lib/participants-csv";
import { parseTournamentsCsv } from "../lib/tournaments-csv";
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

async function main() {
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
    console.error("마이그레이션 003에 truncate_ypga_data 가 있는지 확인하세요.");
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
  const parts = parseParticipantsCsv(partRaw).map((p) => ({
    event_title: p.eventLabel,
    event_date: p.date || null,
    location: p.venue,
    group_no: p.groupNo,
    name: p.name,
  }));
  await insertBatches(supabase, "ypga_participants", parts);
  console.log(`ypga_participants: ${parts.length}행`);

  console.log("동기화 완료.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
