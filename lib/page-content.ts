import { readFileSync } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured } from "./admin";
import { createSupabaseServerClient } from "./supabase/server";

type FileShape = Record<string, string>;

/** 공개 페이지 경로만 허용 (경로 조작 차단) */
export function normalizeContentPath(raw: string): string {
  let p = raw.trim();
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/+/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

export function isSafeContentPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("/admin")) return false;
  if (path.includes("..")) return false;
  if (path.length > 200) return false;
  return /^\/[\w\-./]*$/.test(path) && !/\/\//.test(path);
}

function readFileStore(): FileShape {
  try {
    const p = path.join(process.cwd(), "data", "page-contents.json");
    const raw = readFileSync(p, "utf-8");
    const j = JSON.parse(raw) as FileShape;
    return typeof j === "object" && j !== null ? j : {};
  } catch {
    return {};
  }
}

export async function getPageMarkdown(path: string): Promise<string | null> {
  try {
    const key = normalizeContentPath(path);
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
          .from("site_page_content")
          .select("body_md")
          .eq("path", key)
          .maybeSingle();
        if (!error && data && typeof data.body_md === "string") {
          return data.body_md;
        }
      } catch {
        /* 폴백 */
      }
    }
    const file = readFileStore();
    const v = file[key];
    return typeof v === "string" ? v : null;
  } catch {
    return null;
  }
}
