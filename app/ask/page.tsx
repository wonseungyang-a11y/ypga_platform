import type { Metadata } from "next";
import Link from "next/link";
import { PageMarkdownBlock } from "@/components/page-markdown-block";
import { hasPublicPdfDocuments } from "@/lib/ask-resources-text";
import { isGeminiConfigured } from "@/lib/gemini";
import { getYpgaDataRowCounts } from "@/lib/qa-supabase";
import { AskDataClient } from "./ask-client";

export const metadata: Metadata = {
  title: "AI 분석 | YPGA",
  description:
    "Google Gemini가 Supabase에 동기화된 회원·대회·조편성 데이터를 바탕으로 답변합니다.",
};

export default async function AskPage() {
  const rowCounts = await getYpgaDataRowCounts();
  const hasPdfDocuments = hasPublicPdfDocuments();
  const supabaseOk = rowCounts !== null;
  const totalRows = rowCounts
    ? rowCounts.members + rowCounts.participants + rowCounts.tournaments
    : 0;
  const dataReady =
    supabaseOk && (totalRows > 0 || hasPdfDocuments);
  const geminiReady = isGeminiConfigured();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        AI 분석
      </h1>
      <PageMarkdownBlock path="/ask" className="mt-4" />
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        동호회에 쌓인 회원·조편성·대회 기록과 자료실 문서를 바탕으로 질문을
        입력하면 <strong>Google Gemini</strong>가 맥락을 읽고 답변합니다.
      </p>

      <div className="mt-8">
        <AskDataClient
          dataReady={dataReady}
          geminiReady={geminiReady}
          rowCounts={rowCounts}
          hasPdfDocuments={hasPdfDocuments}
          supabaseOk={supabaseOk}
        />
      </div>

      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-medium text-yonsei underline dark:text-yonsei-200"
        >
          ← 홈으로
        </Link>
      </p>
    </div>
  );
}
