/**
 * 클라이언트 검색: 한글·라틴 혼합, NFC 정규화, 연속 공백 축소.
 * null/undefined·비정상 유니코드에서도 예외 없이 동작하도록 문자열로만 처리합니다.
 */
export function normalizeSearchText(s: string): string {
  const raw = String(s ?? "");
  let t = raw;
  try {
    t = raw.normalize("NFC");
  } catch {
    /* 잘못된 서로게이트 등은 normalize 생략 */
  }
  return t.replace(/\s+/g, " ").trim().toLowerCase();
}

export function matchesSearchText(haystack: string, needle: string): boolean {
  const n = normalizeSearchText(needle);
  if (!n) return true;
  return normalizeSearchText(haystack).includes(n);
}
