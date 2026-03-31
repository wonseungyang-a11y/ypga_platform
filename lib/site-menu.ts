import { readFileSync } from "node:fs";
import path from "node:path";
import { createSupabaseServerClient } from "./supabase/server";
import { isSupabaseConfigured } from "./admin";

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
      title: "회원 관리",
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
    href: "/resources",
    label: "자료실",
    card: {
      title: "자료실",
      desc: "정관·회원 행동강령",
    },
  },
  {
    href: "/ask",
    label: "AI 분석",
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
  return out.length > 0 ? out : DEFAULT_SITE_MENU;
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
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseServerClient();
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
