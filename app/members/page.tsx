import type { Metadata } from "next";
import Link from "next/link";
import { PageMarkdownBlock } from "@/components/page-markdown-block";
import { getSiteMembers } from "@/lib/ypga-site-data";
import { MembersClient } from "./members-client";

export const metadata: Metadata = {
  title: "회원 명단 | YPGA",
  description: "YPGA 회원 명단",
};

export default async function MembersPage() {
  let members: Awaited<ReturnType<typeof getSiteMembers>> = [];
  let error: string | null = null;

  try {
    members = await getSiteMembers();
  } catch (e) {
    error = e instanceof Error ? e.message : "명단을 불러오지 못했습니다.";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          회원 명단
        </h1>
        <PageMarkdownBlock path="/members" className="mt-4" />
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          연합회 회원의 구분·번호·기수·성명·닉네임·거주지를 한눈에 보고,
          검색으로 원하는 회원을 빠르게 찾을 수 있습니다.
        </p>
        <p className="mt-4">
          <Link
            href="/"
            className="text-sm font-medium text-yonsei underline dark:text-yonsei-200"
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
        <MembersClient members={members} />
      )}
    </div>
  );
}
