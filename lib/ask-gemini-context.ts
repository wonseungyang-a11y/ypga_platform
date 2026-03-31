import { extractPublicPdfTextsForAsk } from "./ask-resources-text";
import { getPageMarkdown } from "./page-content";
import type { ParsedQuery } from "./qa-parse";
import { fetchAllRowsFromTable } from "./ypga-supabase-fetch";
import { createSupabaseServiceClient } from "./supabase/service";

/** 문장 앞부분의 한글 이름 후보 (예: "양원승이 가장…" → 양원승) */
function extractLeadingKoreanName(q: string): string | null {
  const t = q.trim();
  const m1 = t.match(/^([가-힣]{2,6})(?:이|가|은|는|의|을|를)(?=\s|$)/);
  if (m1?.[1]) return m1[1];
  const m2 = t.match(/^([가-힣]{2,6})\s/);
  if (m2?.[1]) return m2[1];
  return null;
}

function resolveNameForContext(
  question: string,
  parsed: ParsedQuery,
): string | null {
  if (
    parsed.kind === "winner_count" ||
    parsed.kind === "participant_count" ||
    parsed.kind === "member_lookup"
  ) {
    const n = parsed.name.trim();
    return n || null;
  }
  return extractLeadingKoreanName(question);
}

function countBy<T>(
  items: T[],
  keyFn: (t: T) => string,
): { key: string; count: number }[] {
  const m = new Map<string, number>();
  for (const item of items) {
    const k = keyFn(item).trim();
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Gemini에 넣을 컨텍스트: Supabase 사실(마크다운) + 회원·조편성·대회 전체 테이블 +
 * 자료실 페이지 마크다운 + public/documents PDF 본문 발췌.
 * 이름이 풀리면 해당 인물 관련 행을 추가로 좁혀 넣습니다.
 */
export async function buildGeminiDataBundle(
  question: string,
  parsed: ParsedQuery,
  supabaseFactsMarkdown: string,
): Promise<Record<string, unknown>> {
  const bundle: Record<string, unknown> = {
    parsed,
    supabaseFactsMarkdown,
  };

  const supabase = createSupabaseServiceClient();
  if (supabase) {
    try {
      const [members, participants, tournaments] = await Promise.all([
        fetchAllRowsFromTable(supabase, "ypga_members"),
        fetchAllRowsFromTable(supabase, "ypga_participants"),
        fetchAllRowsFromTable(supabase, "ypga_tournaments"),
      ]);
      bundle.ypga_members = members;
      bundle.ypga_participants = participants;
      bundle.ypga_tournaments = tournaments;
      bundle.datasetSummary = {
        ypga_members: members.length,
        ypga_participants: participants.length,
        ypga_tournaments: tournaments.length,
      };
    } catch (e) {
      bundle.fullTableFetchError =
        e instanceof Error ? e.message : "전체 테이블 조회 실패";
    }
  } else {
    bundle.contextNote =
      "SUPABASE_SERVICE_ROLE_KEY 가 없어 Supabase 전체 테이블은 생략되었습니다.";
  }

  try {
    const md = await getPageMarkdown("/resources");
    if (md?.trim()) {
      bundle.resourcesPageMarkdown = md;
    }
  } catch {
    /* 자료실 본문 없음 */
  }

  try {
    const { excerpts, truncated } = await extractPublicPdfTextsForAsk(100_000);
    bundle.publicDocumentsPdfExcerpts = excerpts;
    if (truncated) bundle.pdfExcerptsTruncated = true;
  } catch (e) {
    bundle.pdfExcerptsError =
      e instanceof Error ? e.message : "PDF 본문 추출 실패";
  }

  const name = resolveNameForContext(question, parsed);
  if (name) {
    bundle.resolvedPersonName = name;
  }
  if (!name || !supabase) {
    return bundle;
  }

  const { data: partRows, error: partErr } = await supabase
    .from("ypga_participants")
    .select("location, event_title, event_date, name")
    .ilike("name", `%${name}%`);

  if (!partErr && partRows?.length) {
    bundle.participantRowsForName = partRows.slice(0, 200);
    bundle.participantVenueCounts = countBy(partRows, (r) => r.location ?? "").slice(
      0,
      30,
    );
  } else if (partErr) {
    bundle.participantQueryError = partErr.message;
  }

  const { data: winRows, error: winErr } = await supabase
    .from("ypga_tournaments")
    .select("title, event_date, location, winner")
    .ilike("winner", `%${name}%`)
    .limit(150);

  if (!winErr && winRows?.length) {
    bundle.tournamentWinsForName = winRows;
    bundle.tournamentVenueCountsWhenWinner = countBy(winRows, (r) => r.location ?? "").slice(
      0,
      30,
    );
  } else if (winErr) {
    bundle.tournamentQueryError = winErr.message;
  }

  return bundle;
}
