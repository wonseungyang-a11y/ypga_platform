import { isSupabaseConfigured } from "./admin";
import {
  fetchMembersFromSupabase,
  fetchParticipantsFromSupabase,
  fetchTournamentsFromSupabase,
} from "./ypga-data-supabase";
import type { MemberCsvRow } from "./members-csv";
import { loadMembersFromDataFile } from "./members-csv";
import type { ParticipantRow } from "./participants-types";
import { loadParticipantsFromDataFile } from "./participants-csv";
import type { TournamentRow } from "./tournaments-types";
import { loadTournamentsFromDataFile } from "./tournaments-csv";

async function withFileFallback<T>(
  loadFromSupabase: () => Promise<T>,
  loadFromFile: () => T,
): Promise<T> {
  if (!isSupabaseConfigured()) {
    return loadFromFile();
  }
  try {
    return await loadFromSupabase();
  } catch {
    return loadFromFile();
  }
}

/** Supabase가 설정되어 있으면 `ypga_*` 테이블, 아니면 `data/*.csv` */
export async function getSiteMembers(): Promise<MemberCsvRow[]> {
  return withFileFallback(fetchMembersFromSupabase, loadMembersFromDataFile);
}

export async function getSiteParticipants(): Promise<ParticipantRow[]> {
  return withFileFallback(
    fetchParticipantsFromSupabase,
    loadParticipantsFromDataFile,
  );
}

export async function getSiteTournaments(): Promise<TournamentRow[]> {
  return withFileFallback(
    fetchTournamentsFromSupabase,
    loadTournamentsFromDataFile,
  );
}
