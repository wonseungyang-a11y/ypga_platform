import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MARKDOWN_PROSE_CLASS } from "@/lib/markdown-prose-class";
import { getPageMarkdown } from "@/lib/page-content";

const mdBoxWrap =
  "mb-6 rounded-xl border border-yonsei/15 bg-yonsei/5 px-4 py-4 dark:border-yonsei/30 dark:bg-yonsei/10 ";

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
