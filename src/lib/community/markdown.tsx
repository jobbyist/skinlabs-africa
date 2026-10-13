/* eslint-disable react-refresh/only-export-components -- the parser and the renderer deliberately live together (tested as one unit) */
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A small, safe formatter for Community text. It never produces HTML strings: text is parsed into plain data
 * (`parseMarkdown`) and rendered as React elements, so there is nothing to inject. Links are limited to http(s).
 *
 * Supported: `# H1`, `## H2`, **bold**, *italic*, ~~strike~~, `code`, `- ` / `* ` bullets, `1. ` lists, `> quote`,
 * `[text](https://…)`, `---` divider, and alignment with `-> centred <-` / `-> right ->` on a line.
 * Single line breaks are kept (posts written before formatting existed render exactly as before).
 */

export type Align = "left" | "center" | "right";

export type Inline =
  | { t: "text"; v: string }
  | { t: "bold" | "italic" | "strike"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; v: string }
  | { t: "br" };

export type Block =
  | { t: "heading"; level: 1 | 2; c: Inline[]; align: Align }
  | { t: "p"; c: Inline[]; align: Align }
  | { t: "ul"; items: Inline[][] }
  | { t: "ol"; start: number; items: Inline[][] }
  | { t: "quote"; c: Inline[] }
  | { t: "hr" };

const MAX_LINK = 300;
const ESCAPABLE = "\\`*_~[]()#>-";

/** Only absolute http(s) links survive; everything else (javascript:, data:, relative) is shown as plain text. */
export const safeHref = (raw: string): string | null => {
  const value = raw.trim();
  if (!value || value.length > MAX_LINK || /[\s<>"]/.test(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
};

const isSpace = (ch: string | undefined) => ch === undefined || /\s/.test(ch);

/** Closing index of `mark` after `from` (never right after whitespace). A run of `**` closes on its last pair; a lone `*` ignores `**` runs. */
const findClose = (s: string, mark: string, from: number): number => {
  let i = from;
  while (i < s.length) {
    i = s.indexOf(mark, i);
    if (i === -1) return -1;
    if (mark.length === 1) {
      let j = i;
      while (s[j] === mark) j++;
      if (j - i > 1) {
        i = j;
        continue;
      }
    }
    if (i > from && !isSpace(s[i - 1])) {
      if (mark.length === 2) while (s[i + 2] === mark[0]) i++;
      return i;
    }
    i += mark.length;
  }
  return -1;
};

export const parseInline = (src: string, depth = 0): Inline[] => {
  const out: Inline[] = [];
  let text = "";
  const flush = () => {
    if (text) out.push({ t: "text", v: text });
    text = "";
  };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\" && i + 1 < src.length && ESCAPABLE.includes(src[i + 1])) {
      text += src[i + 1];
      i += 2;
      continue;
    }
    if (ch === "`") {
      const end = src.indexOf("`", i + 1);
      if (end > i + 1) {
        flush();
        out.push({ t: "code", v: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (ch === "[") {
      const mid = src.indexOf("](", i + 1);
      const end = mid === -1 ? -1 : src.indexOf(")", mid + 2);
      if (mid > i + 1 && end !== -1) {
        const href = safeHref(src.slice(mid + 2, end));
        if (href) {
          flush();
          out.push({ t: "link", href, v: src.slice(i + 1, mid) });
          i = end + 1;
          continue;
        }
      }
    }
    if (depth < 4 && (ch === "*" || ch === "~") && !isSpace(src[i + 1])) {
      const mark = src.startsWith("**", i) ? "**" : src.startsWith("~~", i) ? "~~" : ch === "*" ? "*" : "";
      if (mark) {
        const end = findClose(src, mark, i + mark.length);
        if (end !== -1) {
          flush();
          const t = mark === "**" ? "bold" : mark === "~~" ? "strike" : "italic";
          out.push({ t, c: parseInline(src.slice(i + mark.length, end), depth + 1) });
          i = end + mark.length;
          continue;
        }
      }
    }
    text += ch;
    i++;
  }
  flush();
  return out;
};

/** `-> text <-` centres, `-> text ->` right-aligns. Anything else is left. */
const matchAlign = (line: string): { align: Align; text: string } => {
  const t = line.trim();
  if (t.startsWith("-> ")) {
    if (t.endsWith(" <-") && t.length > 6) return { align: "center", text: t.slice(3, -3).trim() };
    if (t.endsWith(" ->") && t.length > 6) return { align: "right", text: t.slice(3, -3).trim() };
  }
  return { align: "left", text: line };
};

const BULLET = /^[-*] +(\S.*)$/;
const ORDERED = /^(\d{1,3})[.)] +(\S.*)$/;
const HEADING = /^(#{1,2}) +(\S.*)$/;
const QUOTE = /^>\s?(.*)$/;
const RULE = /^(?:-{3,}|\*{3,}|_{3,})$/;

const joinLines = (lines: string[]): Inline[] => {
  const out: Inline[] = [];
  lines.forEach((line, index) => {
    if (index > 0) out.push({ t: "br" });
    out.push(...parseInline(line));
  });
  return out;
};

export const parseMarkdown = (src: string): Block[] => {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let paraAlign: Align = "left";
  let list: { ordered: boolean; start: number; items: Inline[][] } | null = null;
  let quote: string[] = [];

  const endPara = () => {
    if (para.length) blocks.push({ t: "p", c: joinLines(para), align: paraAlign });
    para = [];
  };
  const endList = () => {
    if (list) blocks.push(list.ordered ? { t: "ol", start: list.start, items: list.items } : { t: "ul", items: list.items });
    list = null;
  };
  const endQuote = () => {
    if (quote.length) blocks.push({ t: "quote", c: joinLines(quote) });
    quote = [];
  };
  const endAll = () => {
    endPara();
    endList();
    endQuote();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      endAll();
      continue;
    }
    const q = QUOTE.exec(line.trimStart());
    if (q) {
      endPara();
      endList();
      quote.push(q[1]);
      continue;
    }
    endQuote();
    if (RULE.test(line.trim())) {
      endAll();
      blocks.push({ t: "hr" });
      continue;
    }
    const { align, text } = matchAlign(line);
    const h = HEADING.exec(text.trimStart());
    if (h) {
      endAll();
      blocks.push({ t: "heading", level: h[1].length as 1 | 2, c: parseInline(h[2].trim()), align });
      continue;
    }
    const b = BULLET.exec(line.trimStart());
    const o = b ? null : ORDERED.exec(line.trimStart());
    if (b || o) {
      endPara();
      const ordered = Boolean(o);
      if (list && list.ordered !== ordered) endList();
      if (!list) list = { ordered, start: o ? Number(o[1]) : 1, items: [] };
      list.items.push(parseInline((b ?? o)![b ? 1 : 2]));
      continue;
    }
    endList();
    if (para.length && align !== paraAlign) endPara();
    paraAlign = align;
    para.push(text);
  }
  endAll();
  return blocks;
};

const inlineLength = (nodes: Inline[]): number =>
  nodes.reduce((n, node) => n + (node.t === "text" || node.t === "code" || node.t === "link" ? node.v.length : node.t === "br" ? 1 : inlineLength(node.c)), 0);

const blockLength = (b: Block): number =>
  b.t === "hr" ? 0 : b.t === "ul" || b.t === "ol" ? b.items.reduce((n, item) => n + inlineLength(item), 0) : inlineLength(b.c);

/** Feed preview: whole blocks until roughly `max` characters of text, then stop. The thread shows everything. */
export const previewBlocks = (blocks: Block[], max = 320): { blocks: Block[]; truncated: boolean } => {
  const kept: Block[] = [];
  let used = 0;
  for (const block of blocks) {
    if (kept.length > 0 && used >= max) return { blocks: kept, truncated: true };
    kept.push(block);
    used += blockLength(block);
  }
  return { blocks: kept, truncated: false };
};

/** Plain text of a post (search snippets, share text, aria labels). */
export const markdownToPlainText = (src: string): string => {
  const flat = (nodes: Inline[]): string =>
    nodes.map((n) => (n.t === "text" || n.t === "code" || n.t === "link" ? n.v : n.t === "br" ? " " : flat(n.c))).join("");
  return parseMarkdown(src)
    .map((b) => (b.t === "hr" ? "" : b.t === "ul" || b.t === "ol" ? b.items.map(flat).join(" ") : flat(b.c)))
    .filter(Boolean)
    .join(" ");
};

const ALIGN_CLASS: Record<Align, string> = { left: "", center: "text-center", right: "text-right" };

const renderInline = (nodes: Inline[], keyPrefix = ""): ReactNode =>
  nodes.map((n, i) => {
    const key = `${keyPrefix}${i}`;
    switch (n.t) {
      case "text":
        return <Fragment key={key}>{n.v}</Fragment>;
      case "br":
        return <br key={key} />;
      case "bold":
        return <strong key={key} className="font-semibold text-foreground">{renderInline(n.c, `${key}.`)}</strong>;
      case "italic":
        return <em key={key}>{renderInline(n.c, `${key}.`)}</em>;
      case "strike":
        return <s key={key} className="text-foreground/60">{renderInline(n.c, `${key}.`)}</s>;
      case "code":
        return <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">{n.v}</code>;
      case "link":
        return (
          <a
            key={key}
            href={n.href}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="break-all rounded font-medium text-foreground underline underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary"
          >
            {n.v}
          </a>
        );
    }
  });

interface MarkdownProps {
  source: string;
  /** Feed card: a few blocks, clipped and faded, instead of the whole post. */
  preview?: boolean;
  className?: string;
}

/**
 * Renders Community text. Typographic rhythm: tight headings, relaxed body, one gap between blocks.
 * Headings sit below the page's own h2 (the post title): `# ` renders as h3, `## ` as h4.
 */
export const Markdown = ({ source, preview = false, className }: MarkdownProps) => {
  const parsed = parseMarkdown(source);
  const { blocks, truncated } = preview ? previewBlocks(parsed) : { blocks: parsed, truncated: false };
  const clipped = preview && (truncated || parsed.reduce((n, b) => n + blockLength(b), 0) > 240);
  return (
    <div
      className={cn(
        "break-words text-[15px] leading-relaxed text-foreground/85 [text-wrap:pretty] [&>*+*]:mt-2.5",
        preview && "max-h-44 overflow-hidden",
        clipped && "[mask-image:linear-gradient(to_bottom,black_70%,transparent)]",
        className,
      )}
    >
      {blocks.map((block, i) => {
        switch (block.t) {
          case "heading":
            return block.level === 1 ? (
              <h3 key={i} className={cn("pt-1 font-heading text-xl font-bold leading-snug tracking-tight text-foreground", ALIGN_CLASS[block.align])}>
                {renderInline(block.c)}
              </h3>
            ) : (
              <h4 key={i} className={cn("pt-0.5 font-heading text-lg font-semibold leading-snug tracking-tight text-foreground", ALIGN_CLASS[block.align])}>
                {renderInline(block.c)}
              </h4>
            );
          case "p":
            return (
              <p key={i} className={ALIGN_CLASS[block.align]}>
                {renderInline(block.c)}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} start={block.start} className="list-decimal space-y-1 pl-6 marker:text-muted-foreground">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote key={i} className="border-l-2 border-border pl-3 text-foreground/70">
                {renderInline(block.c)}
              </blockquote>
            );
          case "hr":
            return <hr key={i} className="border-border" />;
        }
      })}
    </div>
  );
};

export default Markdown;
