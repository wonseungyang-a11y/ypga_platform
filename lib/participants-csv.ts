import { readFileSync } from "node:fs";
import path from "node:path";
import type { ParticipantRow } from "./participants-types";

export type { ParticipantRow } from "./participants-types";
export { rowEventKey } from "./participants-types";

function parseLine(line: string): ParticipantRow | null {
  const t = line.trim();
  if (!t) return null;
  const cols = t.split(",");
  if (cols.length < 5) return null;

  const last = cols[cols.length - 1]?.trim() ?? "";
  const gRaw = cols[cols.length - 2]?.trim() ?? "";
  const g = parseInt(gRaw, 10);
  if (!Number.isFinite(g)) return null;

  const eventLabel = cols[0]?.trim() ?? "";
  const date = cols[1]?.trim() ?? "";
  const venue = cols.slice(2, cols.length - 2).join(",").trim();
  return {
    eventLabel,
    date,
    venue,
    groupNo: g,
    name: last,
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
