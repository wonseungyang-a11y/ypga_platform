/** 한국어 자연어 질문 → 안전한 통계 의도로 분류 (임의 SQL 생성 없음) */

export type ParsedQuery =
  | { kind: "winner_count"; name: string }
  | { kind: "participant_count"; name: string }
  | { kind: "member_lookup"; name: string }
  | { kind: "integrated_analysis" }
  | { kind: "unknown"; hint: string };

const BLOCKED_PERSON_NAMES = new Set([
  "회원",
  "회원과",
  "회원들",
  "조편",
  "조편성",
  "참가",
  "전체",
  "모든",
  "동호회",
  "데이터",
  "분석",
  "통합",
  "명단",
]);

function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function isPlausiblePersonName(name: string): boolean {
  const n = name.trim();
  if (n.length < 2 || n.length > 6) return false;
  if (BLOCKED_PERSON_NAMES.has(n)) return false;
  if (!/^[가-힣]{2,6}$/.test(n)) return false;
  return true;
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
  const candidate = name.trim();
  return isPlausiblePersonName(candidate) ? candidate : null;
}

function wantsIntegratedMembersParticipants(compact: string): boolean {
  if (/통합/.test(compact) && (/회원|조편|분석|데이터/.test(compact))) {
    return true;
  }
  if (/회원.*조편|조편.*회원/.test(compact)) return true;
  if (/전체.*회원|회원.*전체/.test(compact) && /조편/.test(compact)) {
    return true;
  }
  if (/거주지.*동일|동일.*거주/.test(compact)) return true;
  return false;
}

export function parseDataQuestion(raw: string): ParsedQuery {
  const q = normalizeSpaces(raw);
  if (!q) {
    return { kind: "unknown", hint: "질문을 입력해 주세요." };
  }

  const compact = q.replace(/\s/g, "");

  if (wantsIntegratedMembersParticipants(compact)) {
    return { kind: "integrated_analysis" };
  }

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

  // 닉네임 (members — nickname_ko / nickname_en)
  if (/닉네임/.test(compact)) {
    const name =
      extractNameBefore(q, "닉네임") ||
      extractNameBefore(q, "별명") ||
      extractNameBefore(q, "영문");
    if (name) return { kind: "member_lookup", name };
  }

  // 회원·조편 일반 질문(이름 없음) → 통합 분석
  if (
    (/회원/.test(compact) || /명단/.test(compact)) &&
    (/조편/.test(compact) || /참가/.test(compact))
  ) {
    return { kind: "integrated_analysis" };
  }

  return {
    kind: "unknown",
    hint:
      "예: **양원승 우승횟수**, **김태훈 조편성 횟수**, **회원과 조편성 통합 분석**, **거주지가 동일한 회원** 처럼 물어보세요.",
  };
}
