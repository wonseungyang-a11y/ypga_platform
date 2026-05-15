-- 잘못된 한글 컬럼 스키마·수동 CSV import 테이블을 제거하고
-- 003 영문 스키마로 재생성합니다. 적용 후: npm run db:rebuild-ypga
--
-- Supabase Dashboard → SQL Editor → 이 파일 전체 실행 (최초 1회)
-- 이후 로컬/Vercel: npm run db:rebuild-ypga (RPC + CSV 동기화)

drop table if exists public.ypga_participants cascade;
drop table if exists public.ypga_tournaments cascade;
drop table if exists public.ypga_members cascade;

create table public.ypga_members (
  id bigserial primary key,
  category text,
  serial_no text,
  cohort text,
  name text not null,
  nickname_ko text,
  nickname_en text,
  residence text
);

create table public.ypga_participants (
  id bigserial primary key,
  event_title text not null,
  event_date date,
  location text,
  group_no int,
  name text not null
);

create index idx_ypga_participants_name on public.ypga_participants (name);

create table public.ypga_tournaments (
  id bigserial primary key,
  title text not null,
  event_date date,
  location text,
  type text,
  format text,
  participants int,
  winner text,
  winner_score text,
  medalist text,
  medalist_score text,
  notes text
);

create index idx_ypga_tournaments_winner on public.ypga_tournaments (winner);

alter table public.ypga_members enable row level security;
alter table public.ypga_participants enable row level security;
alter table public.ypga_tournaments enable row level security;

drop policy if exists "ypga_members_select" on public.ypga_members;
create policy "ypga_members_select" on public.ypga_members for select using (true);

drop policy if exists "ypga_participants_select" on public.ypga_participants;
create policy "ypga_participants_select" on public.ypga_participants for select using (true);

drop policy if exists "ypga_tournaments_select" on public.ypga_tournaments;
create policy "ypga_tournaments_select" on public.ypga_tournaments for select using (true);

create or replace function public.fn_winner_count(p_name text)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.ypga_tournaments
  where winner ilike '%' || trim(p_name) || '%';
$$;

create or replace function public.fn_participant_rows(p_name text)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.ypga_participants
  where name = trim(p_name);
$$;

grant usage on schema public to anon, authenticated;
grant select on public.ypga_members, public.ypga_participants, public.ypga_tournaments to anon, authenticated;
grant execute on function public.fn_winner_count(text) to anon, authenticated;
grant execute on function public.fn_participant_rows(text) to anon, authenticated;

create or replace function public.truncate_ypga_data()
returns void
language sql
security definer
set search_path = public
as $$
  truncate public.ypga_members, public.ypga_participants, public.ypga_tournaments restart identity cascade;
$$;

revoke all on function public.truncate_ypga_data() from public;
grant execute on function public.truncate_ypga_data() to service_role;

-- 서비스 롤 스크립트: npm run db:rebuild-ypga (스키마 재생성 + CSV)
create or replace function public.rebuild_ypga_schema()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  drop table if exists public.ypga_participants cascade;
  drop table if exists public.ypga_tournaments cascade;
  drop table if exists public.ypga_members cascade;

  create table public.ypga_members (
    id bigserial primary key,
    category text,
    serial_no text,
    cohort text,
    name text not null,
    nickname_ko text,
    nickname_en text,
    residence text
  );

  create table public.ypga_participants (
    id bigserial primary key,
    event_title text not null,
    event_date date,
    location text,
    group_no int,
    name text not null
  );

  create index idx_ypga_participants_name on public.ypga_participants (name);

  create table public.ypga_tournaments (
    id bigserial primary key,
    title text not null,
    event_date date,
    location text,
    type text,
    format text,
    participants int,
    winner text,
    winner_score text,
    medalist text,
    medalist_score text,
    notes text
  );

  create index idx_ypga_tournaments_winner on public.ypga_tournaments (winner);

  alter table public.ypga_members enable row level security;
  alter table public.ypga_participants enable row level security;
  alter table public.ypga_tournaments enable row level security;

  drop policy if exists "ypga_members_select" on public.ypga_members;
  create policy "ypga_members_select" on public.ypga_members for select using (true);

  drop policy if exists "ypga_participants_select" on public.ypga_participants;
  create policy "ypga_participants_select" on public.ypga_participants for select using (true);

  drop policy if exists "ypga_tournaments_select" on public.ypga_tournaments;
  create policy "ypga_tournaments_select" on public.ypga_tournaments for select using (true);
end;
$$;

revoke all on function public.rebuild_ypga_schema() from public;
grant execute on function public.rebuild_ypga_schema() to service_role;
