import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MARKDOWN_PROSE_CLASS } from "@/lib/markdown-prose-class";
import { getPageMarkdown } from "@/lib/page-content";

const mdBoxWrap =
  "mb-6 rounded-2xl border border-border bg-card/70 px-5 py-4 shadow-sm ring-1 ring-yonsei/10 backdrop-blur-sm dark:ring-yonsei/15";

type Props = {
  path: string;
  className?: string;
};

export async function PageMarkdownBlock({ path, className = "" }: Props) {
  const md = await getPageMarkdown(path);
  if (!md?.trim()) return null;

  return (
    <div className={`${mdBoxWrap} ${className}`.trim()}>
      <div className={MARKDOWN_PROSE_CLASS}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
      </div>
    </div>
  );
}
