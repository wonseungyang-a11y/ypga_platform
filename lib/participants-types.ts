/** CSV: 6열(구분,대회,일자,장소,조,이름) 또는 5열(대회,일자,장소,조,이름) */
export type ParticipantRow = {
  /** CSV 첫 열(연번) — 한글 스키마 `구분` NOT NULL 대응 */
  seqNo: string;
  eventLabel: string;
  date: string;
  venue: string;
  groupNo: number;
  name: string;
};

export function rowEventKey(r: ParticipantRow): string {
  return `${r.eventLabel}\t${r.date}\t${r.venue}`;
}
