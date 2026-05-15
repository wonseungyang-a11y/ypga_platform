-- 기존 DB에 004 적용 후 메뉴 라벨만 갱신할 때 실행 (또는 npm run sync:menu)
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
