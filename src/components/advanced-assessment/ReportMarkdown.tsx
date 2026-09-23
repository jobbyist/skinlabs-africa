import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders the QA-approved SKYNN AI v2 report Markdown. Shared by the member
 * view and the admin review screen so the reviewer sees exactly what the
 * member will. Citation markers like [C3] become in-page links to the
 * matching source (id `cite-C3`) rendered by the caller. Raw HTML in the
 * Markdown is never rendered (react-markdown's default), so model output
 * can't inject markup.
 */
export function linkCitations(markdown: string): string {
  // [C3] or [C3, C7] — but not an existing Markdown link "[text](url)".
  return markdown.replace(/\[((?:C\d+)(?:\s*,\s*C\d+)*)\](?!\()/g, (_m, codes: string) =>
    codes
      .split(/\s*,\s*/)
      .map((c) => `[${c}](#cite-${c})`)
      .join(" "),
  );
}

const components: Components = {
  h1: ({ children }) => <h2 className="text-2xl font-heading font-semibold mt-8 mb-3">{children}</h2>,
  h2: ({ children }) => <h3 className="text-xl font-heading font-semibold mt-8 mb-3">{children}</h3>,
  h3: ({ children }) => <h4 className="text-base font-heading font-semibold mt-6 mb-2">{children}</h4>,
  p: ({ children }) => <p className="text-sm leading-relaxed text-foreground/90 my-3">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5 my-3 text-sm text-foreground/90">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5 my-3 text-sm text-foreground/90">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border pl-4 my-4 text-sm text-muted-foreground">{children}</blockquote>
  ),
  hr: () => <hr className="my-6 border-border" />,
  a: ({ href, children }) => {
    if (href?.startsWith("#cite-")) {
      return (
        <a href={href} className="align-super text-[0.7rem] font-semibold text-primary no-underline hover:underline">
          {children}
        </a>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2">
        {children}
      </a>
    );
  },
  table: ({ children }) => (
    <div className="my-4 w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="text-left font-medium p-2 border-b border-border bg-muted/40">{children}</th>,
  td: ({ children }) => <td className="p-2 border-b border-border align-top">{children}</td>,
};

const ReportMarkdown = ({ markdown }: { markdown: string }) => (
  <div className="min-w-0 break-words">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {linkCitations(markdown)}
    </ReactMarkdown>
  </div>
);

export default ReportMarkdown;
