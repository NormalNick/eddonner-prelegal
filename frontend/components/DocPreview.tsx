"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocPreviewProps {
  markdown: string;
}

export function DocPreview({ markdown }: DocPreviewProps) {
  return (
    <article className="legal-document">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </article>
  );
}
