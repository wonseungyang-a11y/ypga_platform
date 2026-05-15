export type YpgaParticipantRow = Record<string, unknown>;

export type NormalizedParticipant = {
  event_title: string;
  event_date: string;
  location: string;
  group_no: number;
  name: string;
};

function pick(row: YpgaParticipantRow, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function pickInt(row: YpgaParticipantRow, ...keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (v == null || v === "") continue;
    const n = typeof v === "number" ? v : parseInt(String(v), 10);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/** Supabase 행(영문·한글 컬럼 혼용) → 앱 표준 */
export function normalizeYpgaParticipantRow(
  row: YpgaParticipantRow,
): NormalizedParticipant {
  const eventDateRaw = row.event_date ?? row["일자"];
  const eventDate =
    eventDateRaw == null || eventDateRaw === ""
      ? ""
      : String(eventDateRaw).slice(0, 10);

  return {
    event_title: pick(row, "event_title", "대회"),
    event_date: eventDate,
    location: pick(row, "location", "장소"),
    group_no: pickInt(row, "group_no", "조"),
    name: pick(row, "name", "이름"),
  };
}

export function normalizeYpgaParticipantRows(
  rows: YpgaParticipantRow[],
): NormalizedParticipant[] {
  return rows.map(normalizeYpgaParticipantRow).filter((r) => r.name !== "");
}
