import type { Metadata } from "next";
import Link from "next/link";
import { PageMarkdownBlock } from "@/components/page-markdown-block";
import { buildCohortByName } from "@/lib/member-cohort-lookup";
import { getSiteMembers, getSiteParticipants } from "@/lib/ypga-site-data";
import { ParticipantsClient } from "./participants-client";

export const metadata: Metadata = {
  title: "조편성 기록 | YPGA",
  description: "정기총회·스크린총회 조편성 기록",
};

/** CSV→Supabase 동기화 직후에도 최신 조편성이 보이도록 캐시 비활성 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ParticipantsPage() {
  let rows: Awaited<ReturnType<typeof getSiteParticipants>> = [];
  let error: string | null = null;

  let cohortByName: Record<string, number> = {};
  try {
    const [members, participants] = await Promise.all([
      getSiteMembers(),
      getSiteParticipants(),
    ]);
    rows = participants;
    cohortByName = buildCohortByName(members);
  } catch (e) {
    error = e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          조편성 기록
        </h1>
        <PageMarkdownBlock path="/participants" className="mt-4" />
        <p className="mt-3 text-zinc-700/85 dark:text-zinc-300/75">
          정기·스크린 총회 등 행사별 조 편성을 보고, 이름으로 검색하면 해당
          인원이 속한 조 전원이 함께 표시됩니다.
        </p>
        <p className="mt-4">
          <Link
            href="/"
            className="text-sm font-semibold text-yonsei underline decoration-yonsei/25 underline-offset-4 transition hover:text-yonsei-600 dark:text-yonsei-200 dark:hover:text-yonsei-100"
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
        <ParticipantsClient rows={rows} cohortByName={cohortByName} />
      )}
    </div>
  );
}
