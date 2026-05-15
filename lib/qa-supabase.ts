import type { ParsedQuery } from "./qa-parse";
import { createSupabaseServiceClient } from "./supabase/service";

export type YpgaRowCounts = {
  members: number;
  participants: number;
  tournaments: number;
};

export type YpgaDataRowCountsOutcome =
  | { ok: true; counts: YpgaRowCounts }
  | { ok: false; kind: "no_client" }
  | {
      ok: false;
      kind: "query_failed";
      /** PostgREST 오류 요약(키 전체는 포함되지 않음) */
      summary: string;
      hints: readonly string[];
    };

function buildRowCountHints(summary: string): readonly string[] {
  const s = summary.toLowerCase();
  const hints: string[] = [];

  if (
    s.includes("does not exist") ||
    s.includes("42p01") ||
    s.includes("undefined_table")
  ) {
    hints.push(
      "`ypga_members`, `ypga_participants`, `ypga_tournaments` 테이블이 없습니다. Supabase Dashboard → SQL Editor에서 이 저장소의 `supabase/migrations/003_ypga_data_tables.sql`을 해당 프로젝트에 실행했는지 확인하세요.",
    );
  }

  if (
    s.includes("jwt") ||
    s.includes("invalid api key") ||
    s.includes("pgrst301") ||
    s.includes("401")
  ) {
    hints.push(
      "API 키가 거절되었습니다. Vercel의 `SUPABASE_SERVICE_ROLE_KEY`가 Supabase Dashboard → Project Settings → API의 **service_role**(secret)인지, `NEXT_PUBLIC_SUPABASE_URL`(또는 `SUPABASE_URL`)과 **같은 프로젝트**에서 복사했는지 확인하세요. anon 키와 혼동하면 안 됩니다.",
    );
  }

  if (
    s.includes("permission denied") ||
    s.includes("42501") ||
    s.includes("insufficient_privilege")
  ) {
    hints.push(
      "권한이 부족합니다. service_role 키를 쓰고 있는지, Supabase에서 해당 테이블에 대한 접근이 막혀 있지 않은지(예: 잘못된 스키마/복제본) 확인하세요.",
    );
  }

  if (hints.length === 0) {
    hints.push(
      "Vercel 환경 변수 저장 후 **Redeploy** 했는지, Supabase 프로젝트가 운영 중인지 확인하세요. 아래 요약 메시지로 원인을 좁힐 수 있습니다.",
    );
  }

  return hints;
}

/** 행 수 조회 결과(실패 시 PostgREST 요약 포함) */
export async function getYpgaDataRowCountsOutcome(): Promise<YpgaDataRowCountsOutcome> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, kind: "no_client" };

  const [m, p, t] = await Promise.all([
    supabase.from("ypga_members").select("*", { count: "exact", head: true }),
    supabase
      .from("ypga_participants")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("ypga_tournaments")
      .select("*", { count: "exact", head: true }),
  ]);

  const errors = [m.error, p.error, t.error].filter(
    (e): e is NonNullable<typeof m.error> => e != null,
  );
  if (errors.length) {
    const summary = errors
      .map((e) => `${e.code ?? "ERR"}: ${e.message}`.replace(/\s+/g, " ").trim())
      .join(" | ");
    return {
      ok: false,
      kind: "query_failed",
      summary,
      hints: buildRowCountHints(summary),
    };
  }

  return {
    ok: true,
    counts: {
      members: m.count ?? 0,
      participants: p.count ?? 0,
      tournaments: t.count ?? 0,
    },
  };
}

/** 서비스 키 없음·조회 실패 시 null */
export async function getYpgaDataRowCounts(): Promise<YpgaRowCounts | null> {
  const r = await getYpgaDataRowCountsOutcome();
  return r.ok ? r.counts : null;
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
