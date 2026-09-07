import { createSupabaseServerClient } from "./supabase/server";
import {
  createSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "./supabase/service";
import { isSupabaseConfigured } from "./admin";
import { fetchAllRowsFromTable } from "./ypga-supabase-fetch";
import type { MemberCsvRow } from "./members-csv";
import type { ParticipantRow } from "./participants-types";
import type { TournamentRow } from "./tournaments-types";
import type { SupabaseClient } from "@supabase/supabase-js";

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
    seqNo: "",
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

/**
 * 공개 페이지 서버 조회: Ask API와 같이 SERVICE_ROLE 우선.
 * (Vercel에 anon 키가 없거나 SSR 클라이언트가 실패해도 CSV로 조용히 떨어지지 않게)
 */
async function getYpgaReadClient(): Promise<SupabaseClient> {
  const service = createSupabaseServiceClient();
  if (service) return service;

  if (isSupabaseConfigured()) {
    return createSupabaseServerClient();
  }

  throw new Error(
    "Supabase가 설정되지 않았습니다. SUPABASE_SERVICE_ROLE_KEY 와 NEXT_PUBLIC_SUPABASE_URL(또는 SUPABASE_URL)을 확인하세요.",
  );
}

export function isYpgaSupabaseReadable(): boolean {
  return isSupabaseServiceConfigured() || isSupabaseConfigured();
}

export async function fetchMembersFromSupabase(): Promise<MemberCsvRow[]> {
  const supabase = await getYpgaReadClient();
  const rows = await fetchAllRowsFromTable<MemberRowDb>(supabase, "ypga_members");
  return rows.map(mapMember);
}

export async function fetchParticipantsFromSupabase(): Promise<
  ParticipantRow[]
> {
  const supabase = await getYpgaReadClient();
  const rows = await fetchAllRowsFromTable<ParticipantRowDb>(
    supabase,
    "ypga_participants",
  );
  return rows.map(mapParticipant);
}

export async function fetchTournamentsFromSupabase(): Promise<TournamentRow[]> {
  const supabase = await getYpgaReadClient();
  const rows = await fetchAllRowsFromTable<TournamentRowDb>(
    supabase,
    "ypga_tournaments",
  );
  return rows.map(mapTournament);
}
