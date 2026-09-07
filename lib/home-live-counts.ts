import {
  createSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "./supabase/service";

export type HomeLiveCounts = {
  members: number;
  tournaments: number;
  participants: number;
  source: "supabase" | "unavailable";
};

/** 홈 카드용 — 서비스 롤로 행 수만 조회 (CSV 폴백 없음) */
export async function getHomeLiveCounts(): Promise<HomeLiveCounts> {
  if (!isSupabaseServiceConfigured()) {
    return {
      members: 0,
      tournaments: 0,
      participants: 0,
      source: "unavailable",
    };
  }
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return {
      members: 0,
      tournaments: 0,
      participants: 0,
      source: "unavailable",
    };
  }

  const tables = [
    "ypga_members",
    "ypga_tournaments",
    "ypga_participants",
  ] as const;

  const results = await Promise.all(
    tables.map(async (table) => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    }),
  );

  return {
    members: results[0],
    tournaments: results[1],
    participants: results[2],
    source: "supabase",
  };
}
