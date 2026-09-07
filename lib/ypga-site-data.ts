import {
  fetchMembersFromSupabase,
  fetchParticipantsFromSupabase,
  fetchTournamentsFromSupabase,
  isYpgaSupabaseReadable,
} from "./ypga-data-supabase";
import { isSupabaseServiceConfigured } from "./supabase/service";
import type { MemberCsvRow } from "./members-csv";
import { loadMembersFromDataFile } from "./members-csv";
import type { ParticipantRow } from "./participants-types";
import { loadParticipantsFromDataFile } from "./participants-csv";
import type { TournamentRow } from "./tournaments-types";
import { loadTournamentsFromDataFile } from "./tournaments-csv";

async function withSupabasePreferred<T>(
  loadFromSupabase: () => Promise<T>,
  loadFromFile: () => T,
): Promise<T> {
  if (!isYpgaSupabaseReadable()) {
    return loadFromFile();
  }

  try {
    return await loadFromSupabase();
  } catch (e) {
    // 서비스 롤이 있는 프로덕션에서는 CSV로 숨기지 않음(연동 깨짐을 가림)
    if (isSupabaseServiceConfigured()) {
      throw e instanceof Error
        ? e
        : new Error("Supabase 데이터를 불러오지 못했습니다.");
    }
    return loadFromFile();
  }
}

/** Supabase가 설정되어 있으면 `ypga_*` 테이블, 아니면 `data/*.csv` */
export async function getSiteMembers(): Promise<MemberCsvRow[]> {
  return withSupabasePreferred(fetchMembersFromSupabase, loadMembersFromDataFile);
}

export async function getSiteParticipants(): Promise<ParticipantRow[]> {
  return withSupabasePreferred(
    fetchParticipantsFromSupabase,
    loadParticipantsFromDataFile,
  );
}

export async function getSiteTournaments(): Promise<TournamentRow[]> {
  return withSupabasePreferred(
    fetchTournamentsFromSupabase,
    loadTournamentsFromDataFile,
  );
}
