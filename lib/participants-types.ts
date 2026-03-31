/** 헤더: 구분,일자,장소,조,이름 */
export type ParticipantRow = {
  eventLabel: string;
  date: string;
  venue: string;
  groupNo: number;
  name: string;
};

export function rowEventKey(r: ParticipantRow): string {
  return `${r.eventLabel}\t${r.date}\t${r.venue}`;
}
