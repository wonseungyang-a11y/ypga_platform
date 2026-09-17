import { readFileSync } from "node:fs";
import path from "node:path";
import { createSupabaseServerClient } from "./supabase/server";
import { isSupabaseConfigured } from "./admin";
import { createSupabaseServiceClient } from "./supabase/service";

export type SiteMenuLink = {
  href: string;
  label: string;
};

type NavDef = SiteMenuLink & {
  card?: { title: string; desc: string };
};

/** 네비 라벨·홈 카드 문구 단일 정의 (경로 불일치 방지) */
const NAV_DEFINITION: NavDef[] = [
  { href: "/", label: "홈" },
  {
    href: "/members",
    label: "회원",
    card: {
      title: "회원 명단",
      desc: "회원 목록, 검색",
    },
  },
  {
    href: "/tournaments",
    label: "대회",
    card: { title: "대회", desc: "대회 기록·결과 조회" },
  },
  {
    href: "/participants",
    label: "조편성",
    card: {
      title: "조편성 기록",
      desc: "정기총회·스크린총회 조편성",
    },
  },
  {
    href: "/member-stats",
    label: "통계",
    card: {
      title: "회원별 통계",
      desc: "참가횟수·우승·메달·이글·홀인원",
    },
  },
  {
    href: "/resources",
    label: "자료",
    card: {
      title: "자료실",
      desc: "정관·회원 행동강령",
    },
  },
  {
    href: "/ask",
    label: "AI",
    card: {
      title: "AI 분석",
      desc: "AI 데이터 통계 질문",
    },
  },
];

export const DEFAULT_SITE_MENU: SiteMenuLink[] = NAV_DEFINITION.map(
  ({ href, label }) => ({ href, label }),
);

/** 홈 그리드 카드(홈 제외) — `DEFAULT_SITE_MENU` 과 같은 순서·경로 */
export const HOME_FEATURE_CARDS = NAV_DEFINITION.filter(
  (x) => x.card != null,
).map((x) => ({
  href: x.href,
  title: x.card!.title,
  desc: x.card!.desc,
}));

function normalizeLinks(links: unknown): SiteMenuLink[] {
  if (!Array.isArray(links)) return DEFAULT_SITE_MENU;
  const out: SiteMenuLink[] = [];
  for (const item of links) {
    if (
      item &&
      typeof item === "object" &&
      "href" in item &&
      "label" in item &&
      typeof (item as SiteMenuLink).href === "string" &&
      typeof (item as SiteMenuLink).label === "string"
    ) {
      const href = (item as SiteMenuLink).href.trim();
      const label = (item as SiteMenuLink).label.trim();
      if (href.startsWith("/") && label) {
        out.push({ href, label });
      }
    }
  }
  return out.length > 0 ? applyDefaultMenuOrder(out) : DEFAULT_SITE_MENU;
}

/** 저장된 메뉴에 없는 기본 항목을 넣고, 기본 메뉴는 DEFAULT_SITE_MENU 순서를 따름 */
function applyDefaultMenuOrder(links: SiteMenuLink[]): SiteMenuLink[] {
  const merged = mergeMissingDefaultLinks(links);
  const byHref = new Map(merged.map((l) => [l.href, l]));
  const used = new Set<string>();
  const out: SiteMenuLink[] = [];
  for (const d of DEFAULT_SITE_MENU) {
    const item = byHref.get(d.href);
    if (!item) continue;
    out.push({ href: d.href, label: d.label });
    used.add(d.href);
  }
  for (const l of merged) {
    if (!used.has(l.href)) out.push(l);
  }
  return out;
}

/** 저장된 메뉴에 없는 기본 항목을 기본 순서에 맞춰 삽입 */
function mergeMissingDefaultLinks(links: SiteMenuLink[]): SiteMenuLink[] {
  const have = new Set(links.map((l) => l.href));
  const missing = DEFAULT_SITE_MENU.filter((d) => !have.has(d.href));
  if (missing.length === 0) return links;

  const out = [...links];
  for (const item of missing) {
    const defIdx = DEFAULT_SITE_MENU.findIndex((d) => d.href === item.href);
    let inserted = false;
    for (let i = defIdx - 1; i >= 0; i--) {
      const prevHref = DEFAULT_SITE_MENU[i]?.href;
      if (!prevHref) continue;
      const pos = out.findIndex((l) => l.href === prevHref);
      if (pos >= 0) {
        out.splice(pos + 1, 0, item);
        inserted = true;
        break;
      }
    }
    if (!inserted) out.push(item);
  }
  return out;
}

function readMenuFromFile(): SiteMenuLink[] {
  try {
    const p = path.join(process.cwd(), "data", "site-menu.json");
    const raw = readFileSync(p, "utf-8");
    const j = JSON.parse(raw) as { links?: unknown };
    return normalizeLinks(j.links);
  } catch {
    return DEFAULT_SITE_MENU;
  }
}

export async function getSiteMenuItems(): Promise<SiteMenuLink[]> {
  try {
    const service = createSupabaseServiceClient();
    if (service || isSupabaseConfigured()) {
      try {
        const supabase = service ?? (await createSupabaseServerClient());
        const { data, error } = await supabase
          .from("site_menu")
          .select("items")
          .eq("id", 1)
          .maybeSingle();
        if (!error && data?.items != null) {
          return normalizeLinks(data.items);
        }
      } catch {
        /* 테이블 없음 등 → 파일 */
      }
    }
    return readMenuFromFile();
  } catch {
    return DEFAULT_SITE_MENU;
  }
}
