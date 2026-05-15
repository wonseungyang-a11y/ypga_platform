/** Supabase `ypga_members` 행 — 영문 스키마(003) 또는 한글 컬럼(수동 import) 혼용 */
export type YpgaMemberRow = Record<string, unknown>;

function pick(row: YpgaMemberRow, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

/** 앱·Gemini가 읽는 표준 회원 필드로 통일 */
export function normalizeYpgaMemberRow(row: YpgaMemberRow): {
  id: unknown;
  category: string;
  serial_no: string;
  cohort: string;
  name: string;
  nickname_ko: string;
  nickname_en: string;
  residence: string;
} {
  return {
    id: row.id ?? row["연번"],
    category: pick(row, "category", "구분"),
    serial_no: pick(row, "serial_no", "연번"),
    cohort: pick(row, "cohort", "기수"),
    name: pick(row, "name", "성명"),
    nickname_ko: pick(row, "nickname_ko", "닉네임"),
    nickname_en: pick(row, "nickname_en", "영문"),
    residence: pick(row, "residence", "거주지"),
  };
}

export function normalizeYpgaMemberRows(rows: YpgaMemberRow[]): ReturnType<
  typeof normalizeYpgaMemberRow
>[] {
  return rows.map(normalizeYpgaMemberRow);
}
