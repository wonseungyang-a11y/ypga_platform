import { readFileSync } from "node:fs";
import path from "node:path";
import type { TournamentRow } from "./tournaments-types";

export type { TournamentRow } from "./tournaments-types";

/** RFC 4180 스타일: 따옴표로 감싼 필드·필드 내 쉼표 지원 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      i++;
      continue;
    }
    if (c === "," && !inQuotes) {
      result.push(field);
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  result.push(field);
  return result.map((s) => s.trim());
}

function rowToTournament(cols: string[]): TournamentRow | null {
  if (cols.length < 11) return null;
  return {
    title: cols[0] ?? "",
    date: cols[1] ?? "",
    location: cols[2] ?? "",
    type: cols[3] ?? "",
    format: cols[4] ?? "",
    participants: cols[5] ?? "",
    winner: cols[6] ?? "",
    winnerScore: cols[7] ?? "",
    medalist: cols[8] ?? "",
    medalistScore: cols[9] ?? "",
    notes: cols[10] ?? "",
  };
}

export function parseTournamentsCsv(content: string): TournamentRow[] {
  let raw = content;
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const rows: TournamentRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);
    const row = rowToTournament(cols);
    if (row) rows.push(row);
  }
  return rows;
}

export function loadTournamentsFromDataFile(): TournamentRow[] {
  const filePath = path.join(process.cwd(), "data", "tournaments.csv");
  const raw = readFileSync(filePath, "utf-8");
  return parseTournamentsCsv(raw);
}
