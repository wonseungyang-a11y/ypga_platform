import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const DOCS_DIR = path.join(process.cwd(), "public", "documents");

export function hasPublicPdfDocuments(): boolean {
  try {
    if (!existsSync(DOCS_DIR)) return false;
    return readdirSync(DOCS_DIR).some((f) => f.toLowerCase().endsWith(".pdf"));
  } catch {
    return false;
  }
}

export type PdfExcerpt = { fileName: string; text: string; error?: string };

/**
 * 자료실 `public/documents/*.pdf`에서 텍스트를 추출해 Gemini 컨텍스트에 넣습니다.
 * 전체 길이는 `maxTotalChars`로 제한합니다.
 */
export async function extractPublicPdfTextsForAsk(
  maxTotalChars = 100_000,
): Promise<{ excerpts: PdfExcerpt[]; truncated: boolean }> {
  if (!existsSync(DOCS_DIR)) {
    return { excerpts: [], truncated: false };
  }

  const files = readdirSync(DOCS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort((a, b) => a.localeCompare(b, "ko"));

  const excerpts: PdfExcerpt[] = [];
  let used = 0;
  let truncated = false;

  const pdfParse = (await import("pdf-parse")).default;

  for (const fileName of files) {
    if (used >= maxTotalChars) {
      truncated = true;
      break;
    }
    const full = path.join(DOCS_DIR, fileName);
    try {
      const buf = readFileSync(full);
      const parsed = await pdfParse(buf);
      const raw = (parsed.text ?? "").replace(/\s+/g, " ").trim();
      const room = maxTotalChars - used;
      const slice = raw.slice(0, Math.max(0, room));
      used += slice.length;
      if (slice.length > 0) {
        excerpts.push({ fileName, text: slice });
      } else {
        excerpts.push({
          fileName,
          text: "",
          error: "추출된 본문이 없습니다(스캔 PDF 등).",
        });
      }
      if (raw.length > slice.length) truncated = true;
    } catch (e) {
      excerpts.push({
        fileName,
        text: "",
        error: e instanceof Error ? e.message : "PDF 파싱 실패",
      });
    }
  }

  return { excerpts, truncated };
}
