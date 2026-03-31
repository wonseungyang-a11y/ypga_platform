import type { SupabaseClient } from "@supabase/supabase-js";

/** 서비스 롤 등으로 테이블 전체를 id 순으로 페이지네이션 조회 */
export async function fetchAllRowsFromTable<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
): Promise<T[]> {
  const pageSize = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}
