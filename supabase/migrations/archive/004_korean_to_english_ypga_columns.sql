-- Supabase Table Editor / CSV 가져오기로 한글 헤더가 그대로 컬럼명이 된 경우,
-- 앱·RPC가 기대하는 영문 컬럼명(003 마이그레이션)으로 맞춥니다.
-- 조건: 대상 영문 컬럼이 아직 없을 때만 rename (데이터 덮어쓰기 방지)

-- ===== ypga_tournaments =====
DO $$
BEGIN
  -- title
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = '대회명')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = 'title')
  THEN
    ALTER TABLE public.ypga_tournaments RENAME COLUMN "대회명" TO title;
  END IF;

  -- event_date
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = '일자')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = 'event_date')
  THEN
    ALTER TABLE public.ypga_tournaments RENAME COLUMN "일자" TO event_date;
  END IF;

  -- location
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = '장소')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = 'location')
  THEN
    ALTER TABLE public.ypga_tournaments RENAME COLUMN "장소" TO location;
  END IF;

  -- type
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = '구분')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = 'type')
  THEN
    ALTER TABLE public.ypga_tournaments RENAME COLUMN "구분" TO type;
  END IF;

  -- format
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = '형식')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = 'format')
  THEN
    ALTER TABLE public.ypga_tournaments RENAME COLUMN "형식" TO format;
  END IF;

  -- participants (참가 수)
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = '참가수')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = 'participants')
  THEN
    ALTER TABLE public.ypga_tournaments RENAME COLUMN "참가수" TO participants;
  END IF;

  -- winner ★ 우승 횟수 RPC(fn_winner_count)에 필요
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = '우승')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = 'winner')
  THEN
    ALTER TABLE public.ypga_tournaments RENAME COLUMN "우승" TO winner;
  END IF;

  -- winner_score
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = '우승_타수')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = 'winner_score')
  THEN
    ALTER TABLE public.ypga_tournaments RENAME COLUMN "우승_타수" TO winner_score;
  END IF;

  -- medalist
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = '메달리스트')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = 'medalist')
  THEN
    ALTER TABLE public.ypga_tournaments RENAME COLUMN "메달리스트" TO medalist;
  END IF;

  -- medalist_score
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = '메달리스트_타수')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = 'medalist_score')
  THEN
    ALTER TABLE public.ypga_tournaments RENAME COLUMN "메달리스트_타수" TO medalist_score;
  END IF;

  -- notes
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = '비고')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_tournaments'
        AND column_name = 'notes')
  THEN
    ALTER TABLE public.ypga_tournaments RENAME COLUMN "비고" TO notes;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ypga_tournaments_winner ON public.ypga_tournaments (winner);

-- ===== ypga_participants =====
DO $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_participants'
        AND column_name = '대회')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_participants'
        AND column_name = 'event_title')
  THEN
    ALTER TABLE public.ypga_participants RENAME COLUMN "대회" TO event_title;
  END IF;

  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_participants'
        AND column_name = '일자')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_participants'
        AND column_name = 'event_date')
  THEN
    ALTER TABLE public.ypga_participants RENAME COLUMN "일자" TO event_date;
  END IF;

  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_participants'
        AND column_name = '장소')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_participants'
        AND column_name = 'location')
  THEN
    ALTER TABLE public.ypga_participants RENAME COLUMN "장소" TO location;
  END IF;

  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_participants'
        AND column_name = '조')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_participants'
        AND column_name = 'group_no')
  THEN
    ALTER TABLE public.ypga_participants RENAME COLUMN "조" TO group_no;
  END IF;

  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_participants'
        AND column_name = '이름')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_participants'
        AND column_name = 'name')
  THEN
    ALTER TABLE public.ypga_participants RENAME COLUMN "이름" TO name;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ypga_participants_name ON public.ypga_participants (name);

-- ===== ypga_members =====
DO $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = '구분')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = 'category')
  THEN
    ALTER TABLE public.ypga_members RENAME COLUMN "구분" TO category;
  END IF;

  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = '연번')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = 'serial_no')
  THEN
    ALTER TABLE public.ypga_members RENAME COLUMN "연번" TO serial_no;
  END IF;

  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = '기수')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = 'cohort')
  THEN
    ALTER TABLE public.ypga_members RENAME COLUMN "기수" TO cohort;
  END IF;

  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = '성명')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = 'name')
  THEN
    ALTER TABLE public.ypga_members RENAME COLUMN "성명" TO name;
  END IF;

  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = '닉네임')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = 'nickname_ko')
  THEN
    ALTER TABLE public.ypga_members RENAME COLUMN "닉네임" TO nickname_ko;
  END IF;

  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = '영문')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = 'nickname_en')
  THEN
    ALTER TABLE public.ypga_members RENAME COLUMN "영문" TO nickname_en;
  END IF;

  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = '거주지')
     AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ypga_members'
        AND column_name = 'residence')
  THEN
    ALTER TABLE public.ypga_members RENAME COLUMN "거주지" TO residence;
  END IF;
END $$;

-- RPC가 영문 컬럼을 참조하므로, 003 이후에 테이블만 수동 생성·가져온 경우를 위해 함수 정의를 다시 맞춥니다.
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

grant execute on function public.fn_winner_count(text) to anon, authenticated;
grant execute on function public.fn_participant_rows(text) to anon, authenticated;
