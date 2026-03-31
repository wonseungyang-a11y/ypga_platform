import type { MemberCsvRow } from "@/lib/members-csv";

/** 성명 → 기수(숫자). 회원 명단에 없으면 undefined */
export function buildCohortByName(
  members: MemberCsvRow[],
): Record<string, number> {
  const out: Record<string, number> = {};
  try {
    for (const m of members) {
      const name = m.name.trim();
      if (!name || out[name] !== undefined) continue;
      const c = parseInt(String(m.cohort).trim(), 10);
      out[name] = Number.isFinite(c) ? c : Number.MAX_SAFE_INTEGER;
    }
  } catch {
    // 명단 없으면 빈 맵
  }
  return out;
}
