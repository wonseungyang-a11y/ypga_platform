import { readFileSync } from "node:fs";
import path from "node:path";
import type { ParticipantRow } from "./participants-types";

export type { ParticipantRow } from "./participants-types";
export { rowEventKey } from "./participants-types";

/** 헤더: 구분,대회,일자,장소,조,이름 */
function parseLine(line: string): ParticipantRow | null {
  const t = line.trim();
  if (!t) return null;
  const cols = t.split(",");
  if (cols.length < 6) return null;

  const name = (cols[cols.length - 1] ?? "").trim();
  const g = parseInt((cols[cols.length - 2] ?? "").trim(), 10);
  if (!name || !Number.isFinite(g)) return null;

  return {
    seqNo: (cols[0] ?? "").trim(),
    eventLabel: (cols[1] ?? "").trim(),
    date: (cols[2] ?? "").trim(),
    venue: (cols[3] ?? "").trim(),
    groupNo: g,
    name,
  };
}

export function parseParticipantsCsv(content: string): ParticipantRow[] {
  let raw = content;
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const rows: ParticipantRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    if (row) rows.push(row);
  }
  return rows;
}

export function loadParticipantsFromDataFile(): ParticipantRow[] {
  const filePath = path.join(process.cwd(), "data", "participants.csv");
  const raw = readFileSync(filePath, "utf-8");
  return parseParticipantsCsv(raw);
}
