import type { Metadata } from "next";
import Link from "next/link";
import { PageMarkdownBlock } from "@/components/page-markdown-block";
import { getSiteTournaments } from "@/lib/ypga-site-data";
import { TournamentsClient } from "./tournaments-client";

export const metadata: Metadata = {
  title: "대회 기록 | YPGA",
  description: "정기총회·스크린총회 대회 기록",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TournamentsPage() {
  let rows: Awaited<ReturnType<typeof getSiteTournaments>> = [];
  let error: string | null = null;

  try {
    rows = await getSiteTournaments();
  } catch (e) {
    error = e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-7">
      <div className="mb-4 sm:mb-5">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          대회 기록
        </h1>
        <PageMarkdownBlock path="/tournaments" className="mt-3" />
        <p className="mt-2 text-zinc-700/85 dark:text-zinc-300/75">
          정기·스크린 총회 등 대회의 일정·장소·형식·참가 인원·우승·메달리스트를
          유형별로 나누어 검색하고 표로 확인할 수 있습니다.
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link
            href="/participants"
            className="font-semibold text-yonsei underline decoration-yonsei/25 underline-offset-4 transition hover:text-yonsei-600 dark:text-yonsei-200 dark:hover:text-yonsei-100"
          >
            조편성 기록 →
          </Link>
          <Link
            href="/"
            className="font-semibold text-yonsei underline decoration-yonsei/25 underline-offset-4 transition hover:text-yonsei-600 dark:text-yonsei-200 dark:hover:text-yonsei-100"
          >
            홈으로
          </Link>
        </p>
      </div>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : (
        <TournamentsClient rows={rows} />
      )}
    </div>
  );
}
