"use client";

import { useMemo, useState } from "react";
import { SiteSearchInput } from "@/components/site-search-input";
import type { ParticipantRow } from "@/lib/participants-types";
import { rowEventKey } from "@/lib/participants-types";
import { matchesSearchText } from "@/lib/search-text";

type EventOption = { key: string; label: string; sortDate: string };

function buildEventOptions(rows: ParticipantRow[]): EventOption[] {
  const map = new Map<string, Pick<EventOption, "key" | "label" | "sortDate">>();
  for (const r of rows) {
    const k = rowEventKey(r);
    if (!map.has(k)) {
      map.set(k, {
        key: k,
        label: `${r.eventLabel} · ${r.date} · ${r.venue}`,
        sortDate: r.date,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}

function cohortSortValue(
  name: string,
  cohortByName: Record<string, number>
): number {
  const c = cohortByName[name.trim()];
  return c !== undefined ? c : Number.MAX_SAFE_INTEGER;
}

function sortGroupMembers(
  list: ParticipantRow[],
  cohortByName: Record<string, number>
): void {
  list.sort((a, b) => {
    const ca = cohortSortValue(a.name, cohortByName);
    const cb = cohortSortValue(b.name, cohortByName);
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name, "ko");
  });
}

/** 한 행사에 대해 조 번호 → 참가자 목록 (정렬됨) */
function buildGroupsForRows(
  list: ParticipantRow[],
  cohortByName: Record<string, number>
): [number, ParticipantRow[]][] {
  const map = new Map<number, ParticipantRow[]>();
  for (const r of list) {
    const g = r.groupNo;
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(r);
  }
  for (const gList of map.values()) {
    sortGroupMembers(gList, cohortByName);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

type GlobalSearchSection = {
  eventKey: string;
  sectionTitle: string;
  groups: [number, ParticipantRow[]][];
};

/** 이름 검색에 걸린 행이 속한 (행사, 조)마다 해당 조 전원을 포함 */
function expandMatchedRowsToFullGroups(
  allRows: ParticipantRow[],
  matched: ParticipantRow[],
): ParticipantRow[] {
  const eventToGroups = new Map<string, Set<number>>();
  for (const r of matched) {
    const ek = rowEventKey(r);
    if (!eventToGroups.has(ek)) eventToGroups.set(ek, new Set());
    eventToGroups.get(ek)!.add(r.groupNo);
  }
  const out: ParticipantRow[] = [];
  for (const r of allRows) {
    const ek = rowEventKey(r);
    const gs = eventToGroups.get(ek);
    if (gs?.has(r.groupNo)) out.push(r);
  }
  return out;
}

export function ParticipantsClient({
  rows,
  cohortByName,
}: {
  rows: ParticipantRow[];
  cohortByName: Record<string, number>;
}) {
  const events = useMemo(() => buildEventOptions(rows), [rows]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const resolvedEventKey = useMemo(() => {
    if (!events.length) return "";
    if (selectedKey && events.some((e) => e.key === selectedKey)) {
      return selectedKey;
    }
    return events[0]!.key;
  }, [events, selectedKey]);

  const forEvent = useMemo(() => {
    if (!resolvedEventKey) return [];
    return rows.filter((r) => rowEventKey(r) === resolvedEventKey);
  }, [rows, resolvedEventKey]);

  const byGroup = useMemo(
    () => buildGroupsForRows(forEvent, cohortByName),
    [forEvent, cohortByName],
  );

  /** 이름 검색: 매칭된 사람이 속한 조 전원을 포함해 행사(일자 내림차순) → 조 순으로 표시 */
  const globalSearchSections = useMemo((): GlobalSearchSection[] | null => {
    const needle = q.trim();
    if (!needle) return null;

    const matched = rows.filter((r) => matchesSearchText(r.name, q));
    if (matched.length === 0) return [];

    const expanded = expandMatchedRowsToFullGroups(rows, matched);

    const byEvent = new Map<string, ParticipantRow[]>();
    for (const r of expanded) {
      const k = rowEventKey(r);
      if (!byEvent.has(k)) byEvent.set(k, []);
      byEvent.get(k)!.push(r);
    }

    const eventKeys = [...byEvent.keys()].sort((a, b) => {
      const da = byEvent.get(a)![0]!.date;
      const db = byEvent.get(b)![0]!.date;
      return db.localeCompare(da);
    });

    return eventKeys.map((eventKey) => {
      const list = byEvent.get(eventKey)!;
      const first = list[0]!;
      const sectionTitle = `${first.eventLabel} · ${first.date} · ${first.venue}`;
      return {
        eventKey,
        sectionTitle,
        groups: buildGroupsForRows(list, cohortByName),
      };
    });
  }, [rows, q, cohortByName]);

  const searchActive = globalSearchSections !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 text-sm">
        <label className="flex max-w-3xl flex-col gap-1 font-medium text-zinc-700 dark:text-zinc-300">
          행사 선택
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-yonsei/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
            value={resolvedEventKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            disabled={searchActive}
          >
            {events.map((e) => (
              <option key={e.key} value={e.key}>
                {e.label}
              </option>
            ))}
          </select>
          {searchActive ? (
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
              이름 검색 중에는 행사를 바꿀 수 없습니다. 검색어를 지우면 다시
              선택할 수 있습니다.
            </span>
          ) : null}
        </label>
        <label className="flex max-w-md flex-col gap-1 font-medium text-zinc-700 dark:text-zinc-300">
          이름 검색 (전체 행사 기준)
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            검색에 걸린 사람이 속한 조는 해당 조 인원 전체가 함께 표시됩니다.
          </span>
          <SiteSearchInput
            onQueryChange={setQ}
            inputMode="search"
            enterKeyHint="search"
            spellCheck={false}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-yonsei/40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
            placeholder="이름 일부 — 모든 행사에서 검색"
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            autoComplete="off"
          />
        </label>
      </div>

      {globalSearchSections !== null ? (
        globalSearchSections.length === 0 ? (
          <p className="text-zinc-500">검색 결과가 없습니다.</p>
        ) : (
          <div className="space-y-10">
            {globalSearchSections.map((sec) => (
              <section key={sec.eventKey} className="space-y-4">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {sec.sectionTitle}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sec.groups.map(([groupNo, members]) => (
                    <div
                      key={`${sec.eventKey}-${groupNo}`}
                      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <h3 className="border-b border-zinc-100 pb-2 text-base font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
                        {groupNo}조
                      </h3>
                      <ul className="mt-3 space-y-1.5 text-sm text-zinc-800 dark:text-zinc-200">
                        {members.map((m, i) => {
                          const cohort = cohortByName[m.name.trim()];
                          return (
                            <li
                              key={`${m.name}-${i}`}
                              className="flex flex-wrap items-baseline gap-x-1"
                            >
                              <span>{m.name}</span>
                              {cohort !== undefined &&
                                cohort !== Number.MAX_SAFE_INTEGER && (
                                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                    ({cohort}기)
                                  </span>
                                )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      ) : forEvent.length === 0 ? (
        <p className="text-zinc-500">선택한 행사에 참가자 데이터가 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {byGroup.map(([groupNo, members]) => (
            <div
              key={groupNo}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <h3 className="border-b border-zinc-100 pb-2 text-base font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
                {groupNo}조
              </h3>
              <ul className="mt-3 space-y-1.5 text-sm text-zinc-800 dark:text-zinc-200">
                {members.map((m, i) => {
                  const cohort = cohortByName[m.name.trim()];
                  return (
                    <li
                      key={`${m.name}-${i}`}
                      className="flex flex-wrap items-baseline gap-x-1"
                    >
                      <span>{m.name}</span>
                      {cohort !== undefined &&
                        cohort !== Number.MAX_SAFE_INTEGER && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            ({cohort}기)
                          </span>
                        )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
