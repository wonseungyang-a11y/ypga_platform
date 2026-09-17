"use client";

import { useMemo, useState } from "react";
import { SiteSearchInput } from "@/components/site-search-input";
import type { MemberStatRow } from "@/lib/member-stats";
import { matchesSearchText } from "@/lib/search-text";

type SortKey =
  | "cohort"
  | "participationCount"
  | "wins"
  | "medalists"
  | "holeInOnes"
  | "eagles";

const NUMERIC_KEYS = new Set<SortKey>([
  "participationCount",
  "wins",
  "medalists",
  "eagles",
  "holeInOnes",
]);

function compareRows(a: MemberStatRow, b: MemberStatRow, key: SortKey): number {
  if (NUMERIC_KEYS.has(key)) {
    return (a[key] as number) - (b[key] as number);
  }
  if (key === "cohort") {
    const na = parseInt(a.cohort, 10);
    const nb = parseInt(b.cohort, 10);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  }
  return String(a[key]).localeCompare(String(b[key]), "ko");
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  align = "left",
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: "asc" | "desc";
  align?: "left" | "right";
  onClick: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <th
      className={`px-3 py-2 font-semibold whitespace-nowrap ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className="inline-flex items-center gap-1 rounded-md text-inherit outline-none ring-yonsei/0 transition hover:text-yonsei focus-visible:ring-2 focus-visible:ring-yonsei/40"
        aria-pressed={active}
      >
        {label}
        <span className="text-xs text-zinc-400" aria-hidden>
          {active ? (dir === "asc" ? "▲" : "▼") : ""}
        </span>
      </button>
    </th>
  );
}

function StatCell({ value }: { value: number }) {
  return (
    <td
      className={`px-3 py-2 text-right tabular-nums ${
        value === 0 ? "text-zinc-400 dark:text-zinc-500" : "font-medium"
      }`}
    >
      {value}
    </td>
  );
}

export function MemberStatsClient({ rows }: { rows: MemberStatRow[] }) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("participationCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const list = q.trim()
      ? rows.filter((r) => {
          const hay = [r.name, r.cohort, r.category, r.nicknameKo].join(" ");
          return matchesSearchText(hay, q);
        })
      : rows;
    const sorted = [...list].sort((a, b) => {
      const c = compareRows(a, b, sortKey);
      if (c !== 0) return sortDir === "asc" ? c : -c;
      return a.name.localeCompare(b.name, "ko");
    });
    return sorted;
  }, [rows, q, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(NUMERIC_KEYS.has(key) ? "desc" : "asc");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          총 <strong>{rows.length}</strong>명 · 표시{" "}
          <strong>{filtered.length}</strong>명
        </p>
        <label className="flex max-w-md flex-1 flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          검색
          <SiteSearchInput
            onQueryChange={setQ}
            inputMode="search"
            enterKeyHint="search"
            spellCheck={false}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-yonsei/0 transition focus:ring-2 focus:ring-yonsei/40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
            placeholder="이름, 기수, 닉네임…"
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
              <SortHeader
                label="기수"
                sortKey="cohort"
                activeKey={sortKey}
                dir={sortDir}
                onClick={toggleSort}
              />
              <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                성명
              </th>
              <SortHeader
                label="참가횟수"
                sortKey="participationCount"
                activeKey={sortKey}
                dir={sortDir}
                align="right"
                onClick={toggleSort}
              />
              <SortHeader
                label="우승"
                sortKey="wins"
                activeKey={sortKey}
                dir={sortDir}
                align="right"
                onClick={toggleSort}
              />
              <SortHeader
                label="메달리스트"
                sortKey="medalists"
                activeKey={sortKey}
                dir={sortDir}
                align="right"
                onClick={toggleSort}
              />
              <SortHeader
                label="홀인원"
                sortKey="holeInOnes"
                activeKey={sortKey}
                dir={sortDir}
                align="right"
                onClick={toggleSort}
              />
              <SortHeader
                label="이글"
                sortKey="eagles"
                activeKey={sortKey}
                dir={sortDir}
                align="right"
                onClick={toggleSort}
              />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                  {rows.length === 0
                    ? "통계를 집계할 회원이 없습니다."
                    : "검색 결과가 없습니다."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={`${r.name}-${r.cohort}`}
                  className="border-b border-zinc-100 odd:bg-white even:bg-zinc-50/80 dark:border-zinc-800 dark:odd:bg-zinc-950 dark:even:bg-zinc-900/50"
                >
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                    {r.cohort}
                  </td>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    {r.name}
                    {r.nicknameKo ? (
                      <span className="ml-1.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        {r.nicknameKo}
                      </span>
                    ) : null}
                  </td>
                  <StatCell value={r.participationCount} />
                  <StatCell value={r.wins} />
                  <StatCell value={r.medalists} />
                  <StatCell value={r.holeInOnes} />
                  <StatCell value={r.eagles} />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
