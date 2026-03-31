"use client";

import { useMemo, useState } from "react";
import { SiteSearchInput } from "@/components/site-search-input";
import type { MemberCsvRow } from "@/lib/members-csv";
import { matchesSearchText } from "@/lib/search-text";

export function MembersClient({ members }: { members: MemberCsvRow[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return members;
    return members.filter((m) => {
      const hay = [
        m.category,
        m.serialNo,
        m.cohort,
        m.name,
        m.nicknameKo,
        m.nicknameEn,
        m.residence,
      ].join(" ");
      return matchesSearchText(hay, q);
    });
  }, [members, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          총 <strong>{members.length}</strong>명 · 표시{" "}
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
            placeholder="이름, 구분, 기수, 닉네임, 거주지…"
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
              <th className="px-3 py-2 font-semibold">구분</th>
              <th className="px-3 py-2 font-semibold">번호</th>
              <th className="px-3 py-2 font-semibold">기수</th>
              <th className="px-3 py-2 font-semibold">성명</th>
              <th className="px-3 py-2 font-semibold">닉네임</th>
              <th className="px-3 py-2 font-semibold">영문</th>
              <th className="px-3 py-2 font-semibold">거주지</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-zinc-500"
                >
                  {members.length === 0
                    ? "명단이 비어 있습니다."
                    : "검색 결과가 없습니다."}
                </td>
              </tr>
            ) : (
              filtered.map((m, i) => (
                <tr
                  key={`${m.serialNo}-${m.name}-${m.cohort}-${i}`}
                  className="border-b border-zinc-100 odd:bg-white even:bg-zinc-50/80 dark:border-zinc-800 dark:odd:bg-zinc-950 dark:even:bg-zinc-900/50"
                >
                  <td className="px-3 py-2 whitespace-nowrap">{m.category}</td>
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                    {m.serialNo}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{m.cohort}</td>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    {m.name}
                  </td>
                  <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                    {m.nicknameKo || "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                    {m.nicknameEn || "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                    {m.residence || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
