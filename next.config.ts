import type { NextConfig } from "next";

/**
 * `next dev`는 기본적으로 localhost 외 출처에서의 dev 전용 요청을 막습니다.
 * ngrok 등으로 공유할 때는 여기에 터널 도메인을 허용해야 검색·클라이언트 JS가 정상 동작합니다.
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
 */
/** `https://abc.ngrok-free.app` 또는 `abc.ngrok-free.app` 형태 모두 허용 */
function normalizeDevOriginEntry(entry: string): string | null {
  const t = entry.trim();
  if (!t) return null;
  try {
    if (t.includes("://")) {
      return new URL(t).hostname.toLowerCase();
    }
  } catch {
    return null;
  }
  const host = t.split("/")[0]?.trim();
  return host ? host.toLowerCase() : null;
}

function extraAllowedDevOrigins(): string[] {
  const raw = process.env.NEXT_ALLOWED_DEV_ORIGINS?.trim();
  if (!raw) return [];
  const out: string[] = [];
  for (const part of raw.split(/[,;\s]+/)) {
    const n = normalizeDevOriginEntry(part);
    if (n) out.push(n);
  }
  return out;
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.ngrok.app",
    ...extraAllowedDevOrigins(),
  ],
};

export default nextConfig;
