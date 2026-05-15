# Supabase 마이그레이션

## 신규 프로젝트

SQL Editor에서 순서대로 실행:

1. `migrations/001_site_menu.sql`
2. `migrations/002_site_page_content.sql`
3. `migrations/003_ypga_data_tables.sql`

로컬 데이터 적재:

```bash
npm run sync:db
```

## 스키마가 깨진 경우 (한글 컬럼·수동 CSV import)

SQL Editor에서 `migrations/007_rebuild_ypga_tables.sql` 실행 후:

```bash
npm run db:rebuild-ypga
```

## 레거시

`migrations/archive/` — 이미 적용된 DB용·참고용 (신규 설치 시 실행 불필요)
