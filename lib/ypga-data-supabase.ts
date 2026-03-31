import { createSupabaseServerClient } from "./supabase/server";
import type { MemberCsvRow } from "./members-csv";
import type { ParticipantRow } from "./participants-types";
import type { TournamentRow } from "./tournaments-types";

type MemberRowDb = {
  category: string | null;
  serial_no: string | null;
  cohort: string | null;
  name: string;
  nickname_ko: string | null;
  nickname_en: string | null;
  residence: string | null;
};

type ParticipantRowDb = {
  event_title: string;
  event_date: string | null;
  location: string | null;
  group_no: number | null;
  name: string;
};

type TournamentRowDb = {
  title: string;
  event_date: string | null;
  location: string | null;
  type: string | null;
  format: string | null;
  participants: number | null;
  winner: string | null;
  winner_score: string | null;
  medalist: string | null;
  medalist_score: string | null;
  notes: string | null;
};

function mapMember(r: MemberRowDb): MemberCsvRow {
  return {
    category: r.category ?? "",
    serialNo: r.serial_no ?? "",
    cohort: r.cohort ?? "",
    name: r.name ?? "",
    nicknameKo: r.nickname_ko ?? "",
    nicknameEn: r.nickname_en ?? "",
    residence: r.residence ?? "",
  };
}

function mapParticipant(r: ParticipantRowDb): ParticipantRow {
  const date =
    r.event_date == null || r.event_date === ""
      ? ""
      : String(r.event_date).slice(0, 10);
  return {
    eventLabel: r.event_title ?? "",
    date,
    venue: r.location ?? "",
    groupNo: typeof r.group_no === "number" ? r.group_no : 0,
    name: r.name ?? "",
  };
}

function mapTournament(r: TournamentRowDb): TournamentRow {
  const date =
    r.event_date == null || r.event_date === ""
      ? ""
      : String(r.event_date).slice(0, 10);
  const p = r.participants;
  return {
    title: r.title ?? "",
    date,
    location: r.location ?? "",
    type: r.type ?? "",
    format: r.format ?? "",
    participants:
      p != null && Number.isFinite(p) ? String(p) : "",
    winner: r.winner ?? "",
    winnerScore: r.winner_score ?? "",
    medalist: r.medalist ?? "",
    medalistScore: r.medalist_score ?? "",
    notes: r.notes ?? "",
  };
}

async function fetchAllRows<T>(table: string): Promise<T[]> {
  const supabase = await createSupabaseServerClient();
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

export async function fetchMembersFromSupabase(): Promise<MemberCsvRow[]> {
  const rows = await fetchAllRows<MemberRowDb>("ypga_members");
  return rows.map(mapMember);
}

export async function fetchParticipantsFromSupabase(): Promise<
  ParticipantRow[]
> {
  const rows = await fetchAllRows<ParticipantRowDb>("ypga_participants");
  return rows.map(mapParticipant);
}

export async function fetchTournamentsFromSupabase(): Promise<TournamentRow[]> {
  const rows = await fetchAllRows<TournamentRowDb>("ypga_tournaments");
  return rows.map(mapTournament);
}
