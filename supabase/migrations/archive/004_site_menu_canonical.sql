-- 공식 메뉴 구성을 Supabase site_menu(id=1)에 반영 (/ask → 데이터 분석)
-- 프로젝트: 모든 환경에서 실행 가능

insert into public.site_menu (id, items, updated_at)
values (
  1,
  '[
    {"href":"/","label":"홈"},
    {"href":"/members","label":"회원"},
    {"href":"/tournaments","label":"대회"},
    {"href":"/participants","label":"조편성"},
    {"href":"/resources","label":"자료실"},
    {"href":"/ask","label":"데이터 분석"}
  ]'::jsonb,
  now()
)
on conflict (id) do update set
  items = excluded.items,
  updated_at = excluded.updated_at;
