-- Supabase SQL Editor에서 한 번 실행하거나, CLI로 마이그레이션 적용
create table if not exists public.site_menu (
  id int primary key check (id = 1),
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_menu enable row level security;

-- 누구나 메뉴 JSON 읽기 (공개 사이트)
create policy "site_menu_select_public"
  on public.site_menu
  for select
  using (true);

-- anon 키로는 쓰기 불가 — 서버에서 SERVICE ROLE로만 업데이트

-- 초기 시드는 최소 구성만; 최신 전체 메뉴는 004_site_menu_canonical.sql 또는 npm run sync:menu 로 맞춤
insert into public.site_menu (id, items)
values (
  1,
  '[
    {"href":"/","label":"홈"},
    {"href":"/members","label":"회원"},
    {"href":"/tournaments","label":"대회"},
    {"href":"/participants","label":"조편성"},
    {"href":"/resources","label":"자료실"},
    {"href":"/ask","label":"데이터 분석"},
    {"href":"/admin/login","label":"관리자"}
  ]'::jsonb
)
on conflict (id) do nothing;
