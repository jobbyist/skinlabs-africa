import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AdSlot from "@/components/AdSlot";
import AdSlotAutorelaxed from "@/components/AdSlotAutorelaxed";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/** Parse FAQ section paragraphs into Q&A pairs (question ends at first '?'). */
function parseFaqItems(faqMarkdown: string): { question: string; answer: string }[] {
  const lines = faqMarkdown
    .replace(/^##\s+FAQ\s*/i, "")
    .trim()
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const items: { question: string; answer: string }[] = [];
  for (const block of lines) {
    if (/^editorial disclaimer/i.test(block)) continue;
    const qIdx = block.indexOf("?");
    if (qIdx === -1) continue;
    const question = block.slice(0, qIdx + 1).trim();
    const answer = block.slice(qIdx + 1).trim();
    if (question.length > 2 && answer.length > 0) {
      items.push({ question, answer });
    }
  }
  return items;
}

export const editorialMarkdownComponents = {
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="mt-10 mb-4 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="mt-8 mb-3 font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="mt-6 mb-2 font-heading text-lg font-semibold text-foreground" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-4 text-base leading-relaxed text-muted-foreground" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-4 list-disc space-y-2 pl-5 text-base text-muted-foreground marker:text-primary" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="my-4 list-decimal space-y-2 pl-5 text-base text-muted-foreground marker:text-foreground" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed pl-1" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-muted-foreground" {...props}>
      {children}
    </em>
  ),
  a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      className="font-medium text-primary underline underline-offset-2 hover:text-foreground"
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-6 border-l-4 border-primary/40 bg-secondary/40 py-3 pl-4 pr-3 text-base italic leading-relaxed text-muted-foreground rounded-r-xl"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="not-prose my-8 w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[28rem] border-collapse text-left text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-muted/60 text-foreground" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className="divide-y divide-border" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="transition-colors hover:bg-muted/30" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-foreground" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-3 align-top text-muted-foreground" {...props}>
      {children}
    </td>
  ),
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-10 border-border" {...props} />
  ),
};

interface BriefingBodyProps {
  body: string;
  /** When false, skip mid-body ad markers (Shelf Showdowns). Default true. */
  insertAds?: boolean;
}

/**
 * Split body into segments around <!-- ad:mid-N --> markers.
 * FAQ sections render as an accordion; all ## / ### become styled H2/H3.
 * GFM tables render as responsive comparison tables.
 */
function BriefingBody({ body, insertAds = true }: BriefingBodyProps) {
  const parts = insertAds ? body.split(/<!--\s*ad:mid-\d+\s*-->/i) : [body];

  const renderMarkdownSegment = (segment: string, key: string | number) => {
    const faqMatch = segment.match(/(^|\n)##\s+FAQ\s*\n([\s\S]*?)(?=\n##\s+|$)/i);
    if (!faqMatch) {
      return (
        <ReactMarkdown key={key} remarkPlugins={[remarkGfm]} components={editorialMarkdownComponents}>
          {segment}
        </ReactMarkdown>
      );
    }

    const faqFull = faqMatch[0].replace(/^\n/, "");
    const before = segment.slice(0, faqMatch.index! + (faqMatch[1] === "\n" ? 1 : 0));
    const afterStart = (faqMatch.index ?? 0) + faqMatch[0].length;
    const after = segment.slice(afterStart);
    const faqItems = parseFaqItems(faqFull);

    return (
      <div key={key}>
        {before.trim() ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={editorialMarkdownComponents}>
            {before}
          </ReactMarkdown>
        ) : null}

        <section className="not-prose my-10" aria-labelledby="faq-heading">
          <h2
            id="faq-heading"
            className="mb-4 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl"
          >
            Frequently asked questions
          </h2>
          {faqItems.length > 0 ? (
            <Accordion type="multiple" className="rounded-2xl border border-border bg-card px-4">
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left font-heading text-base font-semibold text-foreground hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={editorialMarkdownComponents}>
              {faqFull}
            </ReactMarkdown>
          )}
        </section>

        {after.trim() ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={editorialMarkdownComponents}>
            {after}
          </ReactMarkdown>
        ) : null}
      </div>
    );
  };

  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert">
      {parts.map((segment, i) => (
        <div key={i}>
          {segment.trim() ? renderMarkdownSegment(segment, i) : null}
          {insertAds && i < parts.length - 1 && (
            <div className="not-prose my-8">
              {i % 2 === 0 ? (
                <AdSlot placement={`briefing-mid-${i + 1}`} />
              ) : (
                <AdSlotAutorelaxed placement={`briefing-mid-${i + 1}`} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default BriefingBody;
