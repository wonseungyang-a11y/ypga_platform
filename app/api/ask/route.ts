import { NextResponse } from "next/server";
import { hasPublicPdfDocuments } from "@/lib/ask-resources-text";
import { buildGeminiDataBundle } from "@/lib/ask-gemini-context";
import { analyzeWithGemini, isGeminiConfigured } from "@/lib/gemini";
import { parseDataQuestion } from "@/lib/qa-parse";
import { getYpgaDataRowCounts, runDataQuery } from "@/lib/qa-supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { question?: string };
  try {
    body = (await request.json()) as { question?: string };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) {
    return NextResponse.json(
      { error: "질문을 입력해 주세요." },
      { status: 400 },
    );
  }
  if (question.length > 2000) {
    return NextResponse.json(
      { error: "질문이 너무 깁니다." },
      { status: 400 },
    );
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      {
        error:
          "Gemini API를 사용할 수 없습니다. 서버 환경 변수 GEMINI_API_KEY(또는 GOOGLE_GENERATIVE_AI_API_KEY)를 설정한 뒤 다시 시도하세요.",
      },
      { status: 503 },
    );
  }

  const counts = await getYpgaDataRowCounts();
  if (counts === null) {
    return NextResponse.json(
      {
        error:
          "Supabase에 연결할 수 없습니다. 서버 환경 변수 SUPABASE_SERVICE_ROLE_KEY 및 (SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_URL)을 확인하고 마이그레이션(003)을 적용하세요.",
      },
      { status: 503 },
    );
  }

  const hasPdf = hasPublicPdfDocuments();
  const totalRows =
    counts.members + counts.participants + counts.tournaments;
  if (totalRows === 0 && !hasPdf) {
    return NextResponse.json(
      {
        error:
          "분석할 데이터가 없습니다. `npm run sync:db`로 회원·조편성·대회 데이터를 넣거나, `public/documents/`에 PDF를 두세요.",
      },
      { status: 503 },
    );
  }

  const parsed = parseDataQuestion(question);
  const result = await runDataQuery(parsed);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const dbPayload = await buildGeminiDataBundle(
    question,
    parsed,
    result.markdown,
  );

  const gemini = await analyzeWithGemini(question, dbPayload);
  if (!gemini.ok) {
    return NextResponse.json({ error: gemini.message }, { status: 502 });
  }

  return NextResponse.json({
    answer: gemini.text,
    source: "gemini" as const,
  });
}
