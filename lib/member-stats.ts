import type { MemberCsvRow } from "./members-csv";
import type { ParticipantRow } from "./participants-types";
import { rowEventKey } from "./participants-types";
import type { TournamentRow } from "./tournaments-types";

export type MemberStatRow = {
  name: string;
  cohort: string;
  category: string;
  nicknameKo: string;
  participationCount: number;
  wins: number;
  medalists: number;
  eagles: number;
  holeInOnes: number;
};

const PLACEHOLDER_NAMES = new Set(["?", "-", "—", "없음", "미정", "미확정"]);

/** 우승·메달리스트 칸의 공동 표기(`김태훈/장제우`)를 개별 이름으로 분리 */
export function splitPersonNames(raw: string): string[] {
  const t = (raw ?? "").trim();
  if (!t || PLACEHOLDER_NAMES.has(t)) return [];
  const parts = t
    .split(/[/／,，·•&]|및/)
    .map((s) => s.trim())
    .filter((s) => s && !PLACEHOLDER_NAMES.has(s));
  const names: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    const m = p.match(/^([가-힣]{2,6})/);
    const name = m?.[1] ?? "";
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}

function countNamesInField(raw: string, counts: Map<string, number>): void {
  for (const name of splitPersonNames(raw)) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
}

/** 비고에서 `이글 최희철`, `홀인원 김태훈` 형태를 집계 */
export function countNoteAwards(
  notes: string,
  keyword: "이글" | "홀인원",
): Map<string, number> {
  const out = new Map<string, number>();
  const t = notes ?? "";
  if (!t.trim()) return out;
  const re = new RegExp(`${keyword}\\s*[:：]?\\s*([가-힣]{2,6})`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    const name = m[1];
    if (!name) continue;
    out.set(name, (out.get(name) ?? 0) + 1);
  }
  return out;
}

function addMap(target: Map<string, number>, source: Map<string, number>): void {
  for (const [name, n] of source) {
    target.set(name, (target.get(name) ?? 0) + n);
  }
}

export function buildMemberStats(
  members: MemberCsvRow[],
  participants: ParticipantRow[],
  tournaments: TournamentRow[],
): MemberStatRow[] {
  const participation = new Map<string, Set<string>>();
  for (const p of participants) {
    const name = p.name.trim();
    if (!name) continue;
    const events = participation.get(name) ?? new Set<string>();
    events.add(rowEventKey(p));
    participation.set(name, events);
  }

  const wins = new Map<string, number>();
  const medalists = new Map<string, number>();
  const eagles = new Map<string, number>();
  const holeInOnes = new Map<string, number>();

  for (const t of tournaments) {
    countNamesInField(t.winner, wins);
    countNamesInField(t.medalist, medalists);
    addMap(eagles, countNoteAwards(t.notes, "이글"));
    addMap(holeInOnes, countNoteAwards(t.notes, "홀인원"));
  }

  return members
    .filter((m) => m.name.trim() !== "")
    .map((m) => {
      const name = m.name.trim();
      return {
        name,
        cohort: m.cohort,
        category: m.category,
        nicknameKo: m.nicknameKo.trim(),
        participationCount: participation.get(name)?.size ?? 0,
        wins: wins.get(name) ?? 0,
        medalists: medalists.get(name) ?? 0,
        eagles: eagles.get(name) ?? 0,
        holeInOnes: holeInOnes.get(name) ?? 0,
      };
    })
    .sort((a, b) => {
      if (b.participationCount !== a.participationCount) {
        return b.participationCount - a.participationCount;
      }
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.medalists !== a.medalists) return b.medalists - a.medalists;
      return a.name.localeCompare(b.name, "ko");
    });
}
