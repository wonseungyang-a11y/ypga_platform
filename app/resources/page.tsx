import type { Metadata } from "next";
import Link from "next/link";
import { PageMarkdownBlock } from "@/components/page-markdown-block";

export const metadata: Metadata = {
  title: "자료실 | YPGA",
  description: "YPGA 정관·회원 행동강령 등 공개 자료",
};

const documents = [
  {
    href: "/documents/ypga-bylaws-230112.pdf",
    title: "YPGA 정관",
    meta: "개정 2023년 1월 12일",
    description: "동호회 정관 전문 PDF입니다.",
  },
  {
    href: "/documents/ypga-code-of-conduct-210706.pdf",
    title: "YPGA 회원 행동강령",
    meta: "제정 2021년 7월 6일",
    description: "회원 행동강령 전문 PDF입니다.",
  },
] as const;

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        자료실
      </h1>
      <PageMarkdownBlock path="/resources" className="mt-4" />
      <p className="mt-3 text-zinc-700/85 dark:text-zinc-300/75">
        정관·회원 행동강령 등 공개 자료를 내려받거나 새 탭에서 볼 수 있습니다.
      </p>

      <ul className="mt-8 space-y-4">
        {documents.map((doc) => (
          <li key={doc.href}>
            <a
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-yonsei/35 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-yonsei/50"
            >
              <span className="text-lg font-semibold text-zinc-900 group-hover:text-yonsei-700 dark:text-zinc-50 dark:group-hover:text-yonsei-200">
                {doc.title}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {doc.meta}
              </span>
              <span className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {doc.description}
              </span>
              <span className="mt-2 text-sm font-medium text-yonsei underline dark:text-yonsei-200">
                PDF 열기 · 다운로드
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-8">
        <Link
          href="/"
          className="text-sm font-semibold text-yonsei underline decoration-yonsei/25 underline-offset-4 transition hover:text-yonsei-600 dark:text-yonsei-200 dark:hover:text-yonsei-100"
        >
          ← 홈으로
        </Link>
      </p>
    </div>
  );
}
