create table if not exists public.site_page_content (
  path text primary key,
  body_md text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_page_content enable row level security;

create policy "site_page_content_select_public"
  on public.site_page_content
  for select
  using (true);
