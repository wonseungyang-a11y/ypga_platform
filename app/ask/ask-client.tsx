"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MARKDOWN_PROSE_CLASS } from "@/lib/markdown-prose-class";

type RowCounts = {
  members: number;
  participants: number;
  tournaments: number;
};

type Props = {
  dataReady: boolean;
  geminiReady: boolean;
  rowCounts: RowCounts | null;
  hasPdfDocuments: boolean;
  supabaseOk: boolean;
};

const PLACEHOLDER = "질문을 입력하세요";

export function AskDataClient({
  dataReady,
  geminiReady,
  rowCounts,
  hasPdfDocuments,
  supabaseOk,
}: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const readyToAsk = dataReady && geminiReady;
  const disabled = loading || !readyToAsk;

  async function runAsk() {
    const q = question.trim();
    if (!q || disabled) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ngrok 무료 티어: 브라우저 경고 HTML 대신 API JSON을 받기 위해
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json()) as {
        answer?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "요청에 실패했습니다.");
        return;
      }
      if (data.answer) {
        setAnswer(data.answer);
      } else {
        setError(data.error ?? "응답이 없습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function onFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runAsk();
  }

  function onQuestionKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && question.trim()) {
        void runAsk();
      }
    }
  }

  return (
    <div className="space-y-6">
      {!geminiReady ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          <p className="font-semibold">Gemini API 키가 필요합니다</p>
          <p className="mt-2">
            서버 환경 변수{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/80">
              GEMINI_API_KEY
            </code>{" "}
            (또는{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/80">
              GOOGLE_GENERATIVE_AI_API_KEY
            </code>
            )를{" "}
            <code className="text-xs">.env.local</code>에 넣고 개발 서버를
            다시 시작하세요.
          </p>
        </div>
      ) : null}

      {!dataReady ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          {!supabaseOk ? (
            <>
              <p className="font-semibold">Supabase에 연결할 수 없습니다</p>
              <p className="mt-2">
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/80">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>{" "}
                및{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/80">
                  SUPABASE_SERVICE_ROLE_KEY
                </code>
                를 확인하세요.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">분석할 데이터가 없습니다</p>
              <p className="mt-2">
                마이그레이션{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/80">
                  003_ypga_data_tables.sql
                </code>{" "}
                적용 후{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/80">
                  npm run sync:db
                </code>
                로 CSV를 올리거나,{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/80">
                  public/documents
                </code>
                에 PDF를 두세요.
              </p>
              <p className="mt-2 text-xs opacity-90">
                행 수 — 회원:{" "}
                {rowCounts ? `${rowCounts.members}` : "—"} · 조편성:{" "}
                {rowCounts ? `${rowCounts.participants}` : "—"} · 대회:{" "}
                {rowCounts ? `${rowCounts.tournaments}` : "—"} · 자료실 PDF:{" "}
                {hasPdfDocuments ? "있음" : "없음"}
              </p>
            </>
          )}
        </div>
      ) : null}

      <div className="rounded-lg border border-zinc-200 bg-zinc-50/90 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="font-medium text-zinc-800 dark:text-zinc-200">질문 예시</p>
        <ul className="mt-2 list-inside list-disc space-y-1.5 text-zinc-600 dark:text-zinc-400">
          <li>양원승이 가장 많이 플레이한 골프장은?</li>
          <li>총장의 권한과 책임은?</li>
          <li>거주지가 동일한 회원은?</li>
        </ul>
      </div>

      <form onSubmit={onFormSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          질문
          <textarea
            defaultValue=""
            onInput={(e) => setQuestion(e.currentTarget.value)}
            onKeyDown={onQuestionKeyDown}
            rows={4}
            placeholder={PLACEHOLDER}
            className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-yonsei/40 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:disabled:bg-zinc-900/50"
            disabled={disabled}
          />
          <span className="mt-1 block text-xs font-normal text-zinc-500 dark:text-zinc-400">
            Enter로 질문하기 · 줄바꿈은 Shift+Enter
          </span>
        </label>
        <button
          type="submit"
          disabled={disabled || !question.trim()}
          className="rounded-lg bg-yonsei px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yonsei-600 disabled:opacity-50 dark:bg-yonsei dark:hover:bg-yonsei-600"
        >
          {loading ? "Gemini 응답 생성 중…" : "질문하기"}
        </button>
      </form>

      {error ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {answer ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            결과 <span className="font-normal text-zinc-400">(Google Gemini)</span>
          </h2>
          <div className={`${MARKDOWN_PROSE_CLASS} mt-3`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
          </div>
        </div>
      ) : null}
    </div>
  );
}
