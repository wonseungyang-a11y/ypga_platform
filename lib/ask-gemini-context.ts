import { loadYpgaDataForAsk, type AskYpgaData } from "./ask-ypga-data";
import { extractPublicPdfTextsForAsk } from "./ask-resources-text";
import { buildMembersParticipantsIntegration } from "./members-participants-integration";
import { getPageMarkdown } from "./page-content";
import type { ParsedQuery } from "./qa-parse";
import type { NormalizedParticipant } from "./ypga-participant-row";
import { normalizeYpgaMemberRow } from "./ypga-member-row";
import { createSupabaseServiceClient } from "./supabase/service";

/** 문장 앞부분의 한글 이름 후보 (예: "양원승이 가장…" → 양원승) */
function extractLeadingKoreanName(q: string): string | null {
  const t = q.trim();
  const m1 = t.match(/^([가-힣]{2,6})(?:이|가|은|는|의|을|를)(?=\s|$)/);
  if (m1?.[1]) return m1[1];
  const m2 = t.match(/^([가-힣]{2,6})\s/);
  if (m2?.[1]) return m2[1];
  const m3 = t.match(/^([가-힣]{2,6})(?=닉네임|별명)/);
  if (m3?.[1]) return m3[1];
  return null;
}

function resolveNameForContext(
  question: string,
  parsed: ParsedQuery,
): string | null {
  if (parsed.kind === "integrated_analysis") return null;
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

function filterParticipantsByName(
  participants: NormalizedParticipant[],
  name: string,
): NormalizedParticipant[] {
  return participants.filter((p) => p.name === name);
}

/**
 * Gemini에 넣을 컨텍스트: 회원·조편성 통합 뷰 + 원본 테이블 + Supabase 사실(마크다운) +
 * 자료실·PDF. 이름이 있으면 해당 인물 행을 추가합니다.
 */
export async function buildGeminiDataBundle(
  question: string,
  parsed: ParsedQuery,
  supabaseFactsMarkdown: string,
  ypgaData?: AskYpgaData,
): Promise<Record<string, unknown>> {
  const bundle: Record<string, unknown> = {
    parsed,
    supabaseFactsMarkdown,
  };

  let data: AskYpgaData | null = ypgaData ?? null;

  try {
    if (!data) data = await loadYpgaDataForAsk();
    bundle.dataSource = data.source;
    if (data.loadNote) bundle.dataLoadNote = data.loadNote;

    bundle.ypga_members = data.members;
    bundle.ypga_participants = data.participants;
    bundle.ypga_tournaments = data.tournaments;
    bundle.datasetSummary = {
      ypga_members: data.members.length,
      ypga_participants: data.participants.length,
      ypga_tournaments: data.tournaments.length,
    };

    bundle.membersParticipantsIntegrated = buildMembersParticipantsIntegration(
      data.members,
      data.participants,
    );
  } catch (e) {
    bundle.fullTableFetchError =
      e instanceof Error ? e.message : "회원·조편성 데이터 로드 실패";
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

  if (!name || !data) {
    return bundle;
  }

  const matchedMembers = data.members.filter((m) => m.name === name);
  if (matchedMembers.length) {
    bundle.memberProfileForName = matchedMembers;
  }

  const partRows = filterParticipantsByName(data.participants, name);
  if (partRows.length) {
    bundle.participantRowsForName = partRows.slice(0, 200);
    bundle.participantVenueCounts = countBy(partRows, (r) => r.location).slice(
      0,
      30,
    );
  }

  const winRows = data.tournaments.filter((t) => {
    const w = String(t.winner ?? t["우승"] ?? "").trim();
    return w.includes(name);
  });
  if (winRows.length) {
    bundle.tournamentWinsForName = winRows.slice(0, 150);
    bundle.tournamentVenueCountsWhenWinner = countBy(
      winRows as { location?: string | null; 장소?: string | null }[],
      (r) => String(r.location ?? r["장소"] ?? ""),
    ).slice(0, 30);
  }

  if (!bundle.memberProfileForName) {
    const supabase = createSupabaseServiceClient();
    if (supabase) {
      const { data: memRows, error: memErr } = await supabase
        .from("ypga_members")
        .select("*")
        .ilike("name", name)
        .limit(5);
      if (!memErr && memRows?.length) {
        bundle.memberProfileForName = memRows.map((r) =>
          normalizeYpgaMemberRow(r),
        );
      }
    }
  }

  return bundle;
}
