import Link from "next/link";
import { EmblemLockup } from "@/components/emblem-lockup";
import type { SiteMenuLink } from "@/lib/site-menu";

const linkClass =
  "text-zinc-700/90 transition-colors hover:text-yonsei dark:text-zinc-300 dark:hover:text-yonsei-200";

export function SiteNav({ links }: { links: SiteMenuLink[] }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-md supports-[backdrop-filter]:bg-card/75">
      <div className="mx-auto max-w-6xl px-4 py-3.5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/"
            className="group flex min-w-0 items-start gap-3 sm:items-center sm:gap-4"
          >
            <EmblemLockup className="shrink-0" />
            <div className="min-w-0 border-l border-border pl-3 sm:pl-4">
              <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-boseong-700 dark:text-boseong-300">
                Yonsei · POSUNG
              </span>
              <span className="mt-0.5 block text-lg font-semibold tracking-tight text-yonsei group-hover:text-yonsei-600 dark:text-yonsei-200 dark:group-hover:text-yonsei-50">
                YPGA
              </span>
              <span className="mt-0.5 block text-[0.7rem] leading-snug text-zinc-700/80 dark:text-zinc-300/80">
                Yonsei Posung Golf Academy
              </span>
              <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400/80">
                연세대학교 · 보성고등학교 동문 골프 동호회
              </span>
            </div>
          </Link>

          <nav
            className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border/70 pt-3 text-sm font-medium lg:border-t-0 lg:pt-0"
            aria-label="주요 메뉴"
          >
            {links.map((l, i) => (
              <Link
                key={`${l.href}-${i}`}
                href={l.href}
                className={linkClass}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
