import { loadMembersFromDataFile } from "./members-csv";
import { loadParticipantsFromDataFile } from "./participants-csv";
import { loadTournamentsFromDataFile } from "./tournaments-csv";
import {
  normalizeYpgaMemberRow,
  normalizeYpgaMemberRows,
  type YpgaMemberRow,
} from "./ypga-member-row";
import {
  normalizeYpgaParticipantRow,
  normalizeYpgaParticipantRows,
  type YpgaParticipantRow,
} from "./ypga-participant-row";
import { fetchAllRowsFromTable } from "./ypga-supabase-fetch";
import { createSupabaseServiceClient } from "./supabase/service";
import type { NormalizedParticipant } from "./ypga-participant-row";

export type NormalizedMember = ReturnType<typeof normalizeYpgaMemberRow>;

export type AskYpgaData = {
  members: NormalizedMember[];
  participants: NormalizedParticipant[];
  tournaments: Record<string, unknown>[];
  source: "supabase" | "csv";
  loadNote?: string;
};

function membersFromCsv(): NormalizedMember[] {
  return loadMembersFromDataFile().map((m) =>
    normalizeYpgaMemberRow({
      category: m.category,
      serial_no: m.serialNo,
      cohort: m.cohort,
      name: m.name,
      nickname_ko: m.nicknameKo,
      nickname_en: m.nicknameEn,
      residence: m.residence,
    }),
  );
}

function participantsFromCsv(): NormalizedParticipant[] {
  return loadParticipantsFromDataFile().map((p) =>
    normalizeYpgaParticipantRow({
      event_title: p.eventLabel,
      event_date: p.date,
      location: p.venue,
      group_no: p.groupNo,
      name: p.name,
    }),
  );
}

function tournamentsFromCsv(): Record<string, unknown>[] {
  return loadTournamentsFromDataFile().map((t) => ({
    title: t.title,
    event_date: t.date || null,
    location: t.location,
    type: t.type,
    format: t.format,
    participants: t.participants ? parseInt(t.participants, 10) : null,
    winner: t.winner,
    winner_score: t.winnerScore,
    medalist: t.medalist,
    medalist_score: t.medalistScore,
    notes: t.notes,
  }));
}

/**
 * AI 분석용: Supabase(서비스 롤) 우선, 실패·0행이면 `data/*.csv` 폴백.
 */
export async function loadYpgaDataForAsk(): Promise<AskYpgaData> {
  const supabase = createSupabaseServiceClient();
  if (supabase) {
    try {
      const [membersRaw, participantsRaw, tournamentsRaw] = await Promise.all([
        fetchAllRowsFromTable<YpgaMemberRow>(supabase, "ypga_members"),
        fetchAllRowsFromTable<YpgaParticipantRow>(
          supabase,
          "ypga_participants",
        ),
        fetchAllRowsFromTable<Record<string, unknown>>(
          supabase,
          "ypga_tournaments",
        ),
      ]);
      const members = normalizeYpgaMemberRows(membersRaw);
      const participants = normalizeYpgaParticipantRows(participantsRaw);
      if (members.length > 0 || participants.length > 0) {
        return {
          members,
          participants,
          tournaments: tournamentsRaw,
          source: "supabase",
        };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        members: membersFromCsv(),
        participants: participantsFromCsv(),
        tournaments: tournamentsFromCsv(),
        source: "csv",
        loadNote: `Supabase 조회 실패 → CSV 폴백 (${msg})`,
      };
    }
    return {
      members: membersFromCsv(),
      participants: participantsFromCsv(),
      tournaments: tournamentsFromCsv(),
      source: "csv",
      loadNote: "Supabase 테이블이 비어 있음 → data/*.csv 폴백",
    };
  }

  return {
    members: membersFromCsv(),
    participants: participantsFromCsv(),
    tournaments: tournamentsFromCsv(),
    source: "csv",
    loadNote: "SUPABASE_SERVICE_ROLE_KEY 없음 → data/*.csv 사용",
  };
}
