import Link from "next/link";
import { PageMarkdownBlock } from "@/components/page-markdown-block";
import { HOME_FEATURE_CARDS } from "@/lib/site-menu";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(0,56,118,0.09),transparent_55%),radial-gradient(ellipse_90%_50%_at_100%_50%,rgba(26,77,58,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(0,56,118,0.2),transparent_55%),radial-gradient(ellipse_90%_50%_at_100%_50%,rgba(26,77,58,0.12),transparent_50%)]"
        aria-hidden
      />

      <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-6xl flex-col px-4 py-14 sm:py-16">
        <header className="mb-12 max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-boseong dark:text-boseong-300">
            연세대학교 · 보성고등학교 동문
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-yonsei sm:text-4xl dark:text-yonsei-100">
            YPGA
          </h1>
          <p className="mt-2 text-sm font-medium tracking-tight text-zinc-700 dark:text-zinc-300">
            Yonsei Posung Golf Academy
          </p>
          <PageMarkdownBlock path="/" className="mt-4" />
          <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            동문 골프 모임을 위한 공간입니다. 아래 메뉴에서 회원·대회·조편성·자료·
            데이터 분석을 확인하세요.
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_FEATURE_CARDS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="group relative block overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/90 p-6 shadow-sm ring-1 ring-yonsei/0 transition hover:border-yonsei/25 hover:shadow-md hover:ring-yonsei/15 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-yonsei/35"
              >
                <span
                  className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-yonsei to-boseong opacity-90 transition group-hover:opacity-100"
                  aria-hidden
                />
                <h2 className="pl-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {s.title}
                </h2>
                <p className="mt-2 pl-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {s.desc}
                </p>
                <span className="mt-5 inline-block pl-2 text-sm font-medium text-yonsei transition group-hover:text-yonsei-600 dark:text-yonsei-200 dark:group-hover:text-yonsei-100">
                  이동 →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
