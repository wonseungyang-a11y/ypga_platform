import type { Metadata } from "next";
import { PageMarkdownBlock } from "@/components/page-markdown-block";
import { buildMemberStats } from "@/lib/member-stats";
import {
  getSiteMembers,
  getSiteParticipants,
  getSiteTournaments,
} from "@/lib/ypga-site-data";
import { MemberStatsClient } from "./member-stats-client";

export const metadata: Metadata = {
  title: "회원별 통계 | YPGA",
  description: "정기총회 기준 회원별 참가횟수·우승·메달리스트·홀인원·이글",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MemberStatsPage() {
  let rows: ReturnType<typeof buildMemberStats> = [];
  let error: string | null = null;

  try {
    const [members, participants, tournaments] = await Promise.all([
      getSiteMembers(),
      getSiteParticipants(),
      getSiteTournaments(),
    ]);
    rows = buildMemberStats(members, participants, tournaments);
  } catch (e) {
    error = e instanceof Error ? e.message : "통계를 불러오지 못했습니다.";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          회원별 통계
        </h1>
        <PageMarkdownBlock path="/member-stats" className="mt-4" />
        <p className="mt-3 text-zinc-700/85 dark:text-zinc-300/75">
          정기총회 조편성·대회 기록만 집계합니다. 공동 우승·공동 메달리스트는 각각 1회로 집계합니다.
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          기록 누락이나 표기 차이 등으로 통계에 오류가 있을 수 있습니다.
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
        <MemberStatsClient rows={rows} />
      )}
    </div>
  );
}
