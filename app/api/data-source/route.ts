import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/admin";
import {
  createSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { fetchAllRowsFromTable } from "@/lib/ypga-supabase-fetch";

export const dynamic = "force-dynamic";

/** 배포·연동 확인용: Supabase 실제 조회 여부 */
export async function GET() {
  const serviceConfigured = isSupabaseServiceConfigured();
  const anonConfigured = isSupabaseConfigured();
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json({
      source: "csv-fallback",
      serviceConfigured,
      anonConfigured,
      counts: null,
      note: "SERVICE_ROLE 미설정 — 페이지는 CSV를 쓸 수 있습니다.",
    });
  }

  try {
    const [members, tournaments, participants] = await Promise.all([
      fetchAllRowsFromTable(supabase, "ypga_members"),
      fetchAllRowsFromTable(supabase, "ypga_tournaments"),
      fetchAllRowsFromTable(supabase, "ypga_participants"),
    ]);
    const probe = members.find(
      (r) => typeof r.name === "string" && r.name === "양원승",
    );
    return NextResponse.json({
      source: "supabase",
      serviceConfigured,
      anonConfigured,
      counts: {
        members: members.length,
        tournaments: tournaments.length,
        participants: participants.length,
      },
      probeNicknameKo:
        probe && typeof probe.nickname_ko === "string"
          ? probe.nickname_ko
          : null,
    });
  } catch (e) {
    return NextResponse.json(
      {
        source: "error",
        serviceConfigured,
        anonConfigured,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}
