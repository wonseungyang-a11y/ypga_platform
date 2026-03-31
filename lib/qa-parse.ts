/** 한국어 자연어 질문 → 안전한 통계 의도로 분류 (임의 SQL 생성 없음) */

export type ParsedQuery =
  | { kind: "winner_count"; name: string }
  | { kind: "participant_count"; name: string }
  | { kind: "member_lookup"; name: string }
  | { kind: "unknown"; hint: string };

function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** 키워드 앞쪽에서 이름 후보 추출 (마지막 토큰 우선) */
function extractNameBefore(input: string, keyword: string): string | null {
  const lower = input.toLowerCase();
  const k = keyword.toLowerCase();
  const idx = lower.indexOf(k);
  if (idx <= 0) return null;
  let before = input.slice(0, idx).trim();
  before = before.replace(/(?:의|은|는|이|가|을|를)$/u, "").trim();
  if (!before) return null;
  const parts = before.split(/\s+/).filter(Boolean);
  const name = parts.length ? parts[parts.length - 1] : before;
  return name.trim() || null;
}

export function parseDataQuestion(raw: string): ParsedQuery {
  const q = normalizeSpaces(raw);
  if (!q) {
    return { kind: "unknown", hint: "질문을 입력해 주세요." };
  }

  const compact = q.replace(/\s/g, "");

  // 우승 횟수 (대회 winner 컬럼 기준)
  if (/우승/.test(compact)) {
    const name =
      extractNameBefore(q, "우승") ||
      extractNameBefore(q, "우승횟수") ||
      extractNameBefore(q, "우승 횟수");
    if (name) return { kind: "winner_count", name };
  }

  // 조편성 / 참가 (participants 테이블 행 수)
  if (/조편성/.test(compact) || /참가/.test(compact)) {
    const name =
      extractNameBefore(q, "조편성") ||
      extractNameBefore(q, "참가") ||
      extractNameBefore(q, "참가횟수") ||
      extractNameBefore(q, "참가 횟수");
    if (name) return { kind: "participant_count", name };
  }

  // 회원 정보 (members)
  if (/회원/.test(compact)) {
    const name = extractNameBefore(q, "회원");
    if (name) return { kind: "member_lookup", name };
  }

  return {
    kind: "unknown",
    hint:
      "예: **양원승 우승횟수**, **김태훈 조편성 횟수**, **최정곤 회원** 처럼 물어보세요.",
  };
}
