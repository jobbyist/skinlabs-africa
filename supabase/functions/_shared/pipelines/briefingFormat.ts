/**
 * Markdown formatting normaliser + QA for Daily Skinny briefings. Pure and
 * dependency-free so the same code runs in the Deno edge function
 * (briefings-sync), in `bun test`, and in one-off repair scripts.
 *
 * Failure mode this exists to stop (seen live, 22-25 Sept 2026): the model
 * (or a transport step) returned the whole body as ONE line —
 * `## Heading. First sentence. Second sentence. ## Next heading. 1. Item 2. Item`
 * — with no newlines at all. The page then rendered a single wall of text,
 * with literal "##" and "1." markers inline.
 *
 * House style (see BRIEFING_INSTRUCTIONS in briefings-sync): "## " headings,
 * "- " bullets and "1. " numbered items only; blank line between blocks; no
 * bold/italic; short paragraphs; headings carry no trailing full stop.
 */

/** Paragraphs longer than this (words) are split at a sentence boundary. */
export const MAX_PARAGRAPH_WORDS = 110;
/** A paragraph is closed once it reaches this many words (soft target). */
const TARGET_PARAGRAPH_WORDS = 75;

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** Splits prose into sentences, without breaking on abbreviations/decimals. */
const splitSentences = (text: string): string[] => {
  const out: string[] = [];
  let buf = "";
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z0-9“"'(])/);
  for (const part of parts) {
    buf = buf ? `${buf} ${part}` : part;
    // Don't end a sentence on a very short fragment like "e.g." / "Dr." / "No."
    if (/(?:\b(?:e\.g|i\.e|Dr|Mr|Mrs|Ms|Prof|vs|approx|No|St)\.|\b[A-Z]\.)$/.test(buf)) continue;
    out.push(buf);
    buf = "";
  }
  if (buf) out.push(buf);
  return out;
};

/** Groups sentences into paragraphs of roughly TARGET_PARAGRAPH_WORDS. */
const chunkParagraphs = (text: string): string[] => {
  const sentences = splitSentences(text.trim());
  const paragraphs: string[] = [];
  let current: string[] = [];
  let words = 0;
  for (const s of sentences) {
    current.push(s);
    words += wordCount(s);
    if (words >= TARGET_PARAGRAPH_WORDS) {
      paragraphs.push(current.join(" "));
      current = [];
      words = 0;
    }
  }
  if (current.length) {
    const tail = current.join(" ");
    // Avoid a one-sentence orphan paragraph when it can join the previous one.
    if (paragraphs.length && wordCount(tail) < 20) paragraphs[paragraphs.length - 1] += ` ${tail}`;
    else paragraphs.push(tail);
  }
  return paragraphs;
};

/** Strips bold/italic markers and stray HTML comments the house style forbids. */
const stripForbiddenMarkup = (s: string) =>
  s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/ /g, " ");

const cleanHeading = (raw: string) =>
  raw
    .replace(/^#{1,6}\s*/, "")
    .replace(/[\s.:;,]+$/, "") // "Understanding the landscape." -> "Understanding the landscape"
    .trim();

/** Matches a list-item start inside flattened prose: "1. Foo" or "- Foo". */
const NUMBERED_ITEM = /(?:^|\s)(\d{1,2})\.\s+(?=[A-Z“"'(])/g;

/**
 * Returns well-formed markdown for a body that may be flattened onto one
 * line, partially formatted, or already fine. Idempotent: running it on its
 * own output returns the same string.
 */
export function normaliseBriefingMarkdown(input: string, opts: { stripMarkup?: boolean } = {}): string {
  // Repairs of already-published, hand-authored rows keep their markup
  // (ad-slot comments, bold); only freshly generated bodies are stripped.
  const base = (input ?? "").replace(/\u00a0/g, " ");
  let text = (opts.stripMarkup === false ? base : stripForbiddenMarkup(base)).replace(/\r\n?/g, "\n");

  // 1. Any "## " that is not at the start of a line starts a new line.
  //    (Only H2: "###"+ are not part of the house style and are demoted.)
  text = text.replace(/(^|[^\n#])\s*#{3,6}\s+/g, "$1\n## ");
  text = text.replace(/([^\n#])[ \t]+##[ \t]+(?=\S)/g, "$1\n\n## ");
  text = text.replace(/([.!?:])##[ \t]+/g, "$1\n\n## ");

  // 2. Walk the lines. Each line is a heading, a list line or prose.
  const blocks: string[] = [];
  let listOpen: "ul" | "ol" | null = null;
  const pushBlock = (b: string) => {
    if (b.trim()) blocks.push(b.trim());
  };
  const flushList = () => {
    listOpen = null;
  };

  const lines = text.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    if (/^##\s+/.test(line)) {
      flushList();
      // A flattened heading is "## Title. Body text…" — the title ends at the
      // first sentence end, unless the line is just the heading.
      const afterMarks = line.replace(/^##\s+/, "");
      const m = afterMarks.match(/^(.{3,120}?[.!?])\s+(?=[A-Z0-9“"'(])(.+)$/s);
      const isLong = wordCount(afterMarks) > 14;
      if (m && isLong) {
        pushBlock(`## ${cleanHeading(m[1])}`);
        for (const p of expandProse(m[2])) pushBlock(p);
      } else {
        pushBlock(`## ${cleanHeading(afterMarks)}`);
      }
      continue;
    }

    // Already-formatted single list lines stay as they are, grouped tightly.
    if (/^(?:-|\*|•)\s+\S/.test(line) || /^\d{1,2}\.\s+\S/.test(line)) {
      const isOl = /^\d/.test(line);
      const item = line.replace(/^(?:-|\*|•)\s+/, "- ");
      const kind = isOl ? "ol" : "ul";
      if (listOpen === kind && blocks.length) blocks[blocks.length - 1] += `\n${item}`;
      else pushBlock(item);
      listOpen = kind;
      continue;
    }

    flushList();
    for (const p of expandProse(line)) pushBlock(p);
  }

  return blocks.join("\n\n").trim();
}

/**
 * Turns one long prose line into paragraphs and lists. Handles flattened
 * numbered lists ("… 1. A: x. 2. B: y. 3. C: z. Back to prose …").
 */
function expandProse(line: string): string[] {
  const result: string[] = [];

  // Find a flattened numbered list: sequential 1., 2., 3. ... markers.
  const markers: { n: number; index: number; len: number }[] = [];
  NUMBERED_ITEM.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = NUMBERED_ITEM.exec(line))) {
    const n = Number(m[1]);
    const expected = markers.length + 1;
    if (n === expected) markers.push({ n, index: m.index + (m[0].startsWith(" ") ? 1 : 0), len: m[0].trimStart().length });
  }

  if (markers.length >= 2 && markers[0].n === 1) {
    const lead = line.slice(0, markers[0].index).trim();
    if (lead) result.push(...splitProse(lead));
    const items: string[] = [];
    markers.forEach((mk, i) => {
      const end = i + 1 < markers.length ? markers[i + 1].index : line.length;
      let body = line.slice(mk.index + mk.len, end).trim();
      if (i === markers.length - 1) {
        // The last item runs into the following prose: keep the first
        // sentence (or two, if the first is a short "Label:" lead-in) only.
        const sentences = splitSentences(body);
        let take = 1;
        if (sentences.length > 1 && wordCount(sentences[0]) < 8 && /:$/.test(sentences[0].trim())) take = 2;
        const itemText = sentences.slice(0, take).join(" ");
        const rest = sentences.slice(take).join(" ");
        items.push(`${mk.n}. ${itemText}`);
        result.push(items.join("\n"));
        if (rest) result.push(...splitProse(rest));
        return;
      }
      items.push(`${mk.n}. ${body}`);
    });
    return result.length ? result : [line];
  }

  return splitProse(line);
}

const splitProse = (text: string): string[] => {
  const t = text.trim();
  if (!t) return [];
  return wordCount(t) <= MAX_PARAGRAPH_WORDS ? [t] : chunkParagraphs(t);
};

export interface FormatCheck {
  ok: boolean;
  reasons: string[];
}

/**
 * Formatting QA. A briefing that fails after normalisation is rejected (never
 * published). Checks structure, not editorial quality.
 */
export function checkBriefingFormat(body: string, opts: { requireLists?: boolean } = {}): FormatCheck {
  const requireLists = opts.requireLists ?? true;
  const reasons: string[] = [];
  const text = body ?? "";
  const lines = text.split("\n");

  if (!/\n/.test(text.trim())) reasons.push("body is a single line (no line breaks)");
  if (/(?<=\S)[ \t]+##[ \t]+\S/.test(text)) reasons.push("a '## ' heading appears mid-line");

  const headings = lines.filter((l) => /^##\s+/.test(l));
  if (headings.length < 4) reasons.push(`only ${headings.length} '## ' section headings (need at least 4)`);
  if (/^#{1}\s|^#{3,6}\s/m.test(text)) reasons.push("uses heading levels other than '## '");
  for (const h of headings) {
    const title = h.replace(/^##\s+/, "");
    if (/[.:;,]$/.test(title)) reasons.push(`heading ends with punctuation: "${title.slice(0, 50)}"`);
    if (wordCount(title) > 14) reasons.push(`heading is too long (looks like merged prose): "${title.slice(0, 50)}…"`);
  }

  // Heading and following block must be separated by blank lines.
  lines.forEach((l, i) => {
    if (/^##\s+/.test(l)) {
      if (i > 0 && lines[i - 1].trim() !== "") reasons.push(`no blank line before heading "${l.slice(3, 40)}"`);
      if (i + 1 < lines.length && lines[i + 1].trim() !== "") reasons.push(`no blank line after heading "${l.slice(3, 40)}"`);
    }
  });

  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !/^##\s/.test(p) && !/^(?:-|\d{1,2}\.)\s/.test(p) && !/^!\[/.test(p));
  const long = paragraphs.filter((p) => wordCount(p) > MAX_PARAGRAPH_WORDS * 1.6);
  if (long.length) reasons.push(`${long.length} paragraph(s) exceed ${Math.round(MAX_PARAGRAPH_WORDS * 1.6)} words`);

  if (/\*\*|__/.test(text)) reasons.push("contains bold/italic markers");
  if (/<!--|-->/.test(text)) reasons.push("contains HTML comment markers");
  if (/(?<=\S)[ \t]+\d{1,2}\.[ \t]+[A-Z][^\n]{0,80}[ \t]+\d{1,2}\.[ \t]+[A-Z]/.test(text)) {
    reasons.push("a numbered list is flattened onto one line");
  }
  if (requireLists) {
    if (!/^- .+/m.test(text)) reasons.push("no bulleted list");
    if (!/^1\. .+/m.test(text)) reasons.push("no numbered list");
  }

  return { ok: reasons.length === 0, reasons };
}

/** True for the "whole body on one line / headings run inline" defect. */
export const isFlattenedBody = (body: string): boolean =>
  !/\n/.test((body ?? "").trim()) || /(?<=\S)[ \t]+##[ \t]+\S/.test(body ?? "");
