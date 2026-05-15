import https from "node:https";

/** Supabase REST 엔드포인트까지 TCP/TLS가 되는지(응답 코드는 무시) 확인 */
export function probeSupabaseRestHead(apiOrigin: string): Promise<string> {
  const origin = apiOrigin.replace(/\/+$/, "");
  const url = new URL(`${origin}/rest/v1/`);

  return new Promise((resolve) => {
    const req = https.request(
      {
        method: "HEAD",
        hostname: url.hostname,
        port: 443,
        path: `${url.pathname}${url.search}`,
        timeout: 8_000,
      },
      (res) => {
        res.resume();
        resolve(
          `연결 프로브: HTTPS까지 도달함 (HTTP ${res.statusCode}). DNS·TLS 자체는 대체로 정상입니다.`,
        );
      },
    );

    req.on("timeout", () => {
      req.destroy();
      resolve("연결 프로브: 8초 내 응답 없음(타임아웃). 일시 장애·네트워크 차단 가능성을 의심하세요.");
    });

    req.on("error", (err: NodeJS.ErrnoException) => {
      const code = err.code ? `${err.code} ` : "";
      resolve(`연결 프로브: HTTPS 실패 — ${code}${err.message}`.trim());
    });

    req.end();
  });
}
