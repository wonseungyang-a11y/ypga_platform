"use client";

import { useMemo, useState } from "react";
import { SiteSearchInput } from "@/components/site-search-input";
import type { TournamentRow } from "@/lib/tournaments-types";
import { matchesSearchText } from "@/lib/search-text";

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function dash(s: string): string {
  const t = s.trim();
  return t === "" ? "—" : t;
}

function matchesSearchQuery(r: TournamentRow, q: string): boolean {
  if (!q.trim()) return true;
  const hay = [
    r.title,
    r.date,
    r.location,
    r.type,
    r.format,
    r.participants,
    r.winner,
    r.winnerScore,
    r.medalist,
    r.medalistScore,
    r.notes,
  ].join(" ");
  return matchesSearchText(hay, q);
}

function sortByDateDesc(list: TournamentRow[]): TournamentRow[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

function TournamentTableBody({ rows }: { rows: TournamentRow[] }) {
  if (rows.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={9} className="px-3 py-10 text-center text-zinc-500">
            해당 구분에 표시할 대회가 없습니다.
          </td>
        </tr>
      </tbody>
    );
  }
  return (
    <tbody>
      {rows.map((r, i) => (
        <tr
          key={`${r.date}-${r.title}-${i}`}
          className="border-b border-zinc-100 odd:bg-white even:bg-zinc-50/80 dark:border-zinc-800 dark:odd:bg-zinc-950 dark:even:bg-zinc-900/40"
        >
          <td className="px-3 py-2 font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-50">
            {r.title}
          </td>
          <td className="px-3 py-2 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
            {formatDate(r.date)}
          </td>
          <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{r.location}</td>
          <td className="px-3 py-2 whitespace-nowrap">{r.type}</td>
          <td className="px-3 py-2 whitespace-nowrap">{r.format}</td>
          <td className="px-3 py-2 text-right tabular-nums">{dash(r.participants)}</td>
          <td className="px-3 py-2">
            <span className="font-medium">{dash(r.winner)}</span>
            {r.winnerScore.trim() !== "" && (
              <span className="text-zinc-500 dark:text-zinc-400">
                {" "}
                ({r.winnerScore})
              </span>
            )}
          </td>
          <td className="px-3 py-2">
            {dash(r.medalist)}
            {r.medalistScore.trim() !== "" && (
              <span className="text-zinc-500 dark:text-zinc-400">
                {" "}
                ({r.medalistScore})
              </span>
            )}
          </td>
          <td className="min-w-[120px] px-3 py-2 text-zinc-600 dark:text-zinc-400">
            {dash(r.notes)}
          </td>
        </tr>
      ))}
    </tbody>
  );
}

function TournamentMobileList({ rows, sectionKey }: { rows: TournamentRow[]; sectionKey: string }) {
  if (rows.length === 0) {
    return (
      <li className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
        해당 구분에 표시할 대회가 없습니다.
      </li>
    );
  }
  return (
    <>
      {rows.map((r, i) => (
        <li
          key={`${sectionKey}-m-${r.date}-${r.title}-${i}`}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="font-semibold text-zinc-900 dark:text-zinc-50">{r.title}</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {formatDate(r.date)} · {r.location}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              {r.type}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              {r.format}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              참가 {dash(r.participants)}명
            </span>
          </div>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-zinc-500">우승</dt>
              <dd>
                {dash(r.winner)}
                {r.winnerScore.trim() !== "" && ` (${r.winnerScore})`}
              </dd>
            </div>
            {(r.medalist.trim() !== "" || r.medalistScore.trim() !== "") && (
              <div className="flex gap-2">
                <dt className="text-zinc-500">메달</dt>
                <dd>
                  {dash(r.medalist)}
                  {r.medalistScore.trim() !== "" && ` (${r.medalistScore})`}
                </dd>
              </div>
            )}
            {r.notes.trim() !== "" && (
              <div className="pt-1 text-zinc-600 dark:text-zinc-400">{r.notes}</div>
            )}
          </dl>
        </li>
      ))}
    </>
  );
}

function TournamentSection({
  title,
  rows,
  sectionKey,
}: {
  title: string;
  rows: TournamentRow[];
  sectionKey: string;
}) {
  return (
    <section className="space-y-4" aria-labelledby={`heading-${sectionKey}`}>
      <div className="border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <h2
          id={`heading-${sectionKey}`}
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {rows.length}건 (일자 최신순)
        </p>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 lg:block">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
              <th className="px-3 py-2 font-semibold whitespace-nowrap">대회명</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">일자</th>
              <th className="px-3 py-2 font-semibold">장소</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">구분</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">형식</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap text-right">참가</th>
              <th className="px-3 py-2 font-semibold">우승</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">메달리스트</th>
              <th className="px-3 py-2 font-semibold min-w-[120px]">비고</th>
            </tr>
          </thead>
          <TournamentTableBody rows={rows} />
        </table>
      </div>

      <ul className="space-y-3 lg:hidden">
        <TournamentMobileList rows={rows} sectionKey={sectionKey} />
      </ul>
    </section>
  );
}

export function TournamentsClient({ rows }: { rows: TournamentRow[] }) {
  const [q, setQ] = useState("");

  const { regularRows, screenRows, displayedTotal } = useMemo(() => {
    const needle = q.trim();
    const regular = sortByDateDesc(
      rows.filter(
        (r) =>
          (r.type ?? "").includes("정기") && matchesSearchQuery(r, needle),
      ),
    );
    const screen = sortByDateDesc(
      rows.filter(
        (r) =>
          (r.type ?? "").includes("스크린") && matchesSearchQuery(r, needle),
      ),
    );
    return {
      regularRows: regular,
      screenRows: screen,
      displayedTotal: regular.length + screen.length,
    };
  }, [rows, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          전체 <strong>{rows.length}</strong>건 중 표시{" "}
          <strong>{displayedTotal}</strong>건
          {q.trim() ? (
            <span className="text-zinc-500"> (검색어 적용)</span>
          ) : null}
        </p>
        <label className="ml-auto flex w-full max-w-md flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:w-72 sm:shrink-0 sm:text-right">
          <span className="text-right">검색</span>
          <SiteSearchInput
            onQueryChange={setQ}
            inputMode="search"
            enterKeyHint="search"
            spellCheck={false}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left text-zinc-900 outline-none focus:ring-2 focus:ring-yonsei/40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
            placeholder="대회명, 장소, 우승자, 비고…"
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            autoComplete="off"
          />
        </label>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
          데이터가 없습니다.
        </p>
      ) : (
        <div className="space-y-10">
          <TournamentSection
            title="정기총회"
            rows={regularRows}
            sectionKey="regular"
          />
          <TournamentSection
            title="스크린총회"
            rows={screenRows}
            sectionKey="screen"
          />
        </div>
      )}
    </div>
  );
}
