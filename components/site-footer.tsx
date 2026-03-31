import { EmblemLockup } from "@/components/emblem-lockup";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200/80 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <EmblemLockup variant="compact" decorative className="shrink-0" />
          <div className="text-center text-sm leading-relaxed text-zinc-600 sm:text-left dark:text-zinc-400">
            <p className="font-medium text-yonsei dark:text-yonsei-200">YPGA</p>
            <p className="mt-0.5 text-[0.7rem] text-zinc-600 dark:text-zinc-400">
              Yonsei Posung Golf Academy
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
              연세대학교 · 보성고등학교 동문
            </p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              회장 김태훈, 부회장 양원승
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-zinc-400 sm:text-right dark:text-zinc-500">
          © 2021 YPGA. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
