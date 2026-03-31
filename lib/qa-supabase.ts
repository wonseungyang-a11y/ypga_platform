import type { ParsedQuery } from "./qa-parse";
import { createSupabaseServiceClient } from "./supabase/service";

export type YpgaRowCounts = {
  members: number;
  participants: number;
  tournaments: number;
};

/** 서비스 키 없음·조회 실패 시 null */
export async function getYpgaDataRowCounts(): Promise<YpgaRowCounts | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;
  const [m, p, t] = await Promise.all([
    supabase.from("ypga_members").select("*", { count: "exact", head: true }),
    supabase
      .from("ypga_participants")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("ypga_tournaments")
      .select("*", { count: "exact", head: true }),
  ]);
  if (m.error || p.error || t.error) return null;
  return {
    members: m.count ?? 0,
    participants: p.count ?? 0,
    tournaments: t.count ?? 0,
  };
}

/** @deprecated 호환용 — 대회 행 수만 필요할 때 */
export async function getTournamentsRowCount(): Promise<number> {
  const c = await getYpgaDataRowCounts();
  if (!c) return -1;
  return c.tournaments;
}

export async function runDataQuery(
  parsed: ParsedQuery,
): Promise<{ markdown: string } | { error: string }> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return {
      error:
        "Supabase 서비스 키가 없습니다. NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 를 확인하세요.",
    };
  }

  if (parsed.kind === "unknown") {
    return { markdown: `### 안내\n\n${parsed.hint}` };
  }

  if (parsed.kind === "winner_count") {
    const { data, error } = await supabase.rpc("fn_winner_count", {
      p_name: parsed.name,
    });
    if (error) {
      return {
        error: `우승 횟수 조회 실패: ${error.message}. 마이그레이션(003) 적용·sync:db 여부를 확인하세요.`,
      };
    }
    const n = typeof data === "number" ? data : Number(data);
    return {
      markdown:
        `### ${parsed.name} 님 우승 기록(대회 기준)\n\n` +
        `**대회 테이블**(\`ypga_tournaments\`)의 **우승(winner)** 필드에 이름이 포함된 대회 수: **${n}**회\n\n` +
        `*(공동 우승은 한 대회에 여러 이름이 들어가며, 이름이 포함된 대회마다 1회로 집계됩니다.)*`,
    };
  }

  if (parsed.kind === "participant_count") {
    const { data, error } = await supabase.rpc("fn_participant_rows", {
      p_name: parsed.name,
    });
    if (error) {
      return {
        error: `조편성 조회 실패: ${error.message}. 마이그레이션(003) 적용·sync:db 여부를 확인하세요.`,
      };
    }
    const n = typeof data === "number" ? data : Number(data);
    return {
      markdown:
        `### ${parsed.name} 님 조편성 기록\n\n` +
        `**조편성 테이블**(\`ypga_participants\`)에서 이름이 일치하는 **행 수**: **${n}**건\n\n` +
        `*(동일 대회·다른 조에 여러 번 이름이 있으면 그만큼 집계됩니다.)*`,
    };
  }

  if (parsed.kind === "member_lookup") {
    const { data, error } = await supabase
      .from("ypga_members")
      .select(
        "category, serial_no, cohort, name, nickname_ko, nickname_en, residence",
      )
      .eq("name", parsed.name)
      .limit(10);
    if (error) {
      return { error: `회원 조회 실패: ${error.message}` };
    }
    if (!data?.length) {
      return {
        markdown: `### 회원 명단\n\n**${parsed.name}** 이름과 일치하는 행이 \`ypga_members\`에 없습니다. (동기화·철자 확인)`,
      };
    }
    const rows = data
      .map(
        (r) =>
          `| ${r.category ?? ""} | ${r.cohort ?? ""} | ${r.name ?? ""} | ${r.nickname_ko ?? ""} | ${r.residence ?? ""} |`,
      )
      .join("\n");
    return {
      markdown:
        `### ${parsed.name} 회원 정보\n\n` +
        `| 구분 | 기수 | 성명 | 닉네임 | 거주지 |\n| --- | --- | --- | --- | --- |\n` +
        rows,
    };
  }

  return { error: "처리할 수 없는 질문 유형입니다." };
}
