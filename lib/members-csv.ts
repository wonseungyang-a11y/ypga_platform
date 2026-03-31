import { readFileSync } from "node:fs";
import path from "node:path";

/** 헤더: 구분,번호,기수,성명,닉네임,영문,거주지 */
export type MemberCsvRow = {
  category: string;
  serialNo: string;
  cohort: string;
  name: string;
  nicknameKo: string;
  nicknameEn: string;
  residence: string;
};

function parseLine(line: string): MemberCsvRow | null {
  const t = line.trim();
  if (!t) return null;
  const cols = t.split(",");
  if (cols.length < 7) return null;
  const residence = cols.slice(6).join(",").trim();
  return {
    category: (cols[0] ?? "").trim(),
    serialNo: (cols[1] ?? "").trim(),
    cohort: (cols[2] ?? "").trim(),
    name: (cols[3] ?? "").trim(),
    nicknameKo: (cols[4] ?? "").trim(),
    nicknameEn: (cols[5] ?? "").trim(),
    residence,
  };
}

export function parseMembersCsv(content: string): MemberCsvRow[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const rows: MemberCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    if (row) rows.push(row);
  }
  return rows;
}

export function loadMembersFromDataFile(): MemberCsvRow[] {
  const filePath = path.join(process.cwd(), "data", "members.csv");
  let raw = readFileSync(filePath, "utf-8");
  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1);
  }
  return parseMembersCsv(raw);
}
