/**
 * Composer formatting: pure text transforms behind the toolbar. Each takes the text and the textarea selection and returns
 * the new text and selection, or the input unchanged when the result would exceed `max` (so the caret never jumps).
 * The syntax is what `markdown.tsx` renders.
 */

export type InlineFormat = "bold" | "italic" | "strike";
export type LineFormat = "h1" | "h2" | "body" | "bullet" | "ordered" | "quote";
export type AlignFormat = "left" | "center" | "right";

export interface Edit {
  text: string;
  start: number;
  end: number;
}

const MARKS: Record<InlineFormat, string> = { bold: "**", italic: "*", strike: "~~" };

const unchanged = (text: string, start: number, end: number): Edit => ({ text, start, end });
const clamp = (text: string, start: number, end: number) => {
  const s = Math.max(0, Math.min(start, text.length));
  const e = Math.max(s, Math.min(end, text.length));
  return { s, e };
};

/** Wraps the selection in a mark, or unwraps it when it is already wrapped. With no selection, inserts the pair and parks the caret between. */
export const toggleInline = (text: string, selStart: number, selEnd: number, format: InlineFormat, max: number): Edit => {
  const { s, e } = clamp(text, selStart, selEnd);
  const mark = MARKS[format];
  const n = mark.length;
  const selected = text.slice(s, e);
  // Already wrapped just outside the selection: remove the marks.
  if (text.slice(s - n, s) === mark && text.slice(e, e + n) === mark && s >= n) {
    const next = text.slice(0, s - n) + selected + text.slice(e + n);
    return { text: next, start: s - n, end: e - n };
  }
  // The selection itself includes the marks.
  if (selected.length >= n * 2 + 1 && selected.startsWith(mark) && selected.endsWith(mark)) {
    const inner = selected.slice(n, -n);
    return { text: text.slice(0, s) + inner + text.slice(e), start: s, end: s + inner.length };
  }
  const next = text.slice(0, s) + mark + selected + mark + text.slice(e);
  if (next.length > max) return unchanged(text, selStart, selEnd);
  return selected ? { text: next, start: s + n, end: e + n } : { text: next, start: s + n, end: s + n };
};

/** Start of the first and end of the last line touched by the selection. */
const lineSpan = (text: string, s: number, e: number): { from: number; to: number } => {
  const from = text.lastIndexOf("\n", s - 1) + 1;
  const nl = text.indexOf("\n", e > s ? e : s);
  return { from, to: nl === -1 ? text.length : nl };
};

const HEADING_PREFIX = /^#{1,2} +/;
const BULLET_PREFIX = /^[-*] +/;
const ORDERED_PREFIX = /^\d{1,3}[.)] +/;
const QUOTE_PREFIX = /^> ?/;
const ALIGN_WRAP = /^-> (.*) (?:<-|->)$/;
const stripBlock = (line: string) => line.replace(HEADING_PREFIX, "").replace(BULLET_PREFIX, "").replace(ORDERED_PREFIX, "").replace(QUOTE_PREFIX, "");

/** Sets (or, when every line already has it, removes) a line-level format on the lines the selection touches. */
export const applyLineFormat = (text: string, selStart: number, selEnd: number, format: LineFormat, max: number): Edit => {
  const { s, e } = clamp(text, selStart, selEnd);
  const { from, to } = lineSpan(text, s, e);
  const lines = text.slice(from, to).split("\n");
  const prefixFor = (index: number): string =>
    format === "h1" ? "# " : format === "h2" ? "## " : format === "bullet" ? "- " : format === "ordered" ? `${index + 1}. ` : format === "quote" ? "> " : "";
  const has: Record<LineFormat, RegExp | null> = { h1: /^# /, h2: /^## /, body: null, bullet: BULLET_PREFIX, ordered: ORDERED_PREFIX, quote: QUOTE_PREFIX };
  const pattern = has[format];
  const allHave = pattern !== null && lines.filter((l) => l.trim()).every((l) => pattern.test(l));
  let n = 0;
  const out = lines.map((line) => {
    if (!line.trim()) return line;
    const bare = stripBlock(line);
    if (allHave) return bare;
    const prefix = prefixFor(n);
    n++;
    return prefix + bare;
  });
  const replaced = out.join("\n");
  const next = text.slice(0, from) + replaced + text.slice(to);
  if (next.length > max && next.length > text.length) return unchanged(text, selStart, selEnd);
  return { text: next, start: from, end: from + replaced.length };
};

/** Reads the alignment of the first line touched by the selection (for the toolbar's cycling button). */
export const currentAlign = (text: string, selStart: number): AlignFormat => {
  const { from, to } = lineSpan(text, selStart, selStart);
  const line = text.slice(from, to).trim();
  const m = ALIGN_WRAP.exec(line);
  if (!m) return "left";
  return line.endsWith(" <-") ? "center" : "right";
};

/** Aligns each non-empty line of the selection. `left` removes the wrapper. */
export const applyAlign = (text: string, selStart: number, selEnd: number, align: AlignFormat, max: number): Edit => {
  const { s, e } = clamp(text, selStart, selEnd);
  const { from, to } = lineSpan(text, s, e);
  const out = text
    .slice(from, to)
    .split("\n")
    .map((line) => {
      if (!line.trim()) return line;
      const m = ALIGN_WRAP.exec(line.trim());
      const bare = m ? m[1] : line;
      // A divider or list marker can't be aligned; leave those lines alone.
      if (align === "left" || /^(?:-{3,}|\*{3,}|_{3,})$/.test(bare.trim()) || BULLET_PREFIX.test(bare) || ORDERED_PREFIX.test(bare) || QUOTE_PREFIX.test(bare)) return bare;
      return align === "center" ? `-> ${bare} <-` : `-> ${bare} ->`;
    });
  const replaced = out.join("\n");
  const next = text.slice(0, from) + replaced + text.slice(to);
  if (next.length > max && next.length > text.length) return unchanged(text, selStart, selEnd);
  return { text: next, start: from, end: from + replaced.length };
};

/** Inserts a divider on its own paragraph after the current line. */
export const insertDivider = (text: string, selStart: number, selEnd: number, max: number): Edit => {
  const { s, e } = clamp(text, selStart, selEnd);
  const { to } = lineSpan(text, s, e);
  const before = text.slice(0, to);
  const after = text.slice(to).replace(/^\n+/, "");
  const lead = before.length === 0 ? "" : before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const insert = `${lead}---\n\n`;
  const next = before + insert + after;
  if (next.length > max) return unchanged(text, selStart, selEnd);
  const caret = before.length + insert.length;
  return { text: next, start: caret, end: caret };
};

/** `[selection](https://)` with the address selected so the member can type or paste it over. A selected address becomes the link target. */
export const insertLink = (text: string, selStart: number, selEnd: number, max: number): Edit => {
  const { s, e } = clamp(text, selStart, selEnd);
  const selected = text.slice(s, e);
  const isUrl = /^https?:\/\/\S+$/i.test(selected);
  const label = isUrl ? "link" : selected || "link";
  const url = isUrl ? selected : "https://";
  const md = `[${label}](${url})`;
  const next = text.slice(0, s) + md + text.slice(e);
  if (next.length > max) return unchanged(text, selStart, selEnd);
  // Select the part the member still has to fill in: the address, or the label when nothing was selected.
  if (isUrl || selected) return { text: next, start: s + label.length + 3, end: s + label.length + 3 + url.length };
  return { text: next, start: s + 1, end: s + 1 + label.length };
};
