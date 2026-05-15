import type { NormalizedMember } from "./ask-ypga-data";
import type { NormalizedParticipant } from "./ypga-participant-row";

export type MemberWithParticipation = NormalizedMember & {
  participant_row_count: number;
  participant_rows: NormalizedParticipant[];
  venues_played: { location: string; count: number }[];
};

/** 회원(`ypga_members`)과 조편성(`ypga_participants`)을 이름으로 조인한 통합 뷰 */
export function buildMembersParticipantsIntegration(
  members: NormalizedMember[],
  participants: NormalizedParticipant[],
): Record<string, unknown> {
  const byName = new Map<string, NormalizedParticipant[]>();
  for (const p of participants) {
    const list = byName.get(p.name) ?? [];
    list.push(p);
    byName.set(p.name, list);
  }

  const memberNames = new Set(members.map((m) => m.name).filter(Boolean));

  const membersWithParticipation: MemberWithParticipation[] = members.map(
    (m) => {
      const rows = byName.get(m.name) ?? [];
      const venueMap = new Map<string, number>();
      for (const r of rows) {
        if (!r.location) continue;
        venueMap.set(r.location, (venueMap.get(r.location) ?? 0) + 1);
      }
      const venues_played = [...venueMap.entries()]
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count);

      return {
        ...m,
        participant_row_count: rows.length,
        participant_rows: rows,
        venues_played,
      };
    },
  );

  const participantNamesNotInMembers = [...byName.keys()].filter(
    (n) => !memberNames.has(n),
  );

  const topByParticipation = [...membersWithParticipation]
    .sort((a, b) => b.participant_row_count - a.participant_row_count)
    .slice(0, 15)
    .map((m) => ({
      name: m.name,
      nickname_ko: m.nickname_ko,
      cohort: m.cohort,
      participant_row_count: m.participant_row_count,
      top_venue: m.venues_played[0]?.location ?? "",
    }));

  return {
    description:
      "회원 명단과 조편성 행을 name(성명)으로 연결한 통합 데이터입니다. 회원 질문·조편 질문·통합 분석에 우선 사용하세요.",
    summary: {
      member_count: members.length,
      participant_row_count: participants.length,
      distinct_participant_names: byName.size,
      members_with_participation_rows: membersWithParticipation.filter(
        (m) => m.participant_row_count > 0,
      ).length,
      participant_names_not_in_member_table:
        participantNamesNotInMembers.length,
    },
    topByParticipation,
    participantNamesNotInMembers: participantNamesNotInMembers.slice(0, 30),
    membersWithParticipation,
  };
}

export function buildIntegrationFactsMarkdown(
  integration: Record<string, unknown>,
  source: string,
): string {
  const summary = integration.summary as Record<string, number> | undefined;
  if (!summary) {
    return "### 회원·조편성 통합\n\n통합 데이터를 생성하지 못했습니다.";
  }
  return (
    `### 회원·조편성 통합 요약 (출처: ${source})\n\n` +
    `| 항목 | 값 |\n| --- | ---: |\n` +
    `| 회원 수 | ${summary.member_count} |\n` +
    `| 조편성 행 수 | ${summary.participant_row_count} |\n` +
    `| 조편에 등장한 서로 다른 이름 수 | ${summary.distinct_participant_names} |\n` +
    `| 조편 기록이 있는 회원 수 | ${summary.members_with_participation_rows} |\n` +
    `| 회원 명단에 없는 조편 이름 수 | ${summary.participant_names_not_in_member_table} |\n\n` +
    `상세는 [데이터]의 \`membersParticipantsIntegrated\`를 참고하세요.`
  );
}
