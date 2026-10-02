/**
 * Where the mini SKYNN AI card goes inside a briefing body: between two prose
 * paragraphs, never inside a list, table, image block, FAQ or code fence, and
 * never before the article has really started (we wait for the 2nd prose
 * paragraph after a "## " heading, and require another prose paragraph after
 * the break so the card is never the last thing in a segment).
 */
const isHeading = (b: string) => /^#{1,6}\s/.test(b);
const isProse = (b: string) => {
  const t = b.trim();
  return t.length > 0 && !/^(#{1,6}\s|[-*]\s|\d{1,2}\.\s|!\[|\||```|<!--|>|_Photo:)/.test(t);
};
const FAQ_HEADING = /^##\s+(faq|frequently asked)/i;

/** Splits `segment` at a paragraph boundary, or returns null when it has no good spot. */
export const splitForSkynnCta = (segment: string): [string, string] | null => {
  const blocks = segment.split(/\n{2,}/);
  let seenHeading = false;
  let proseAfterHeading = 0;
  let inFence = false;

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (/^```/.test(b.trim())) inFence = !inFence;
    if (inFence) continue;
    if (FAQ_HEADING.test(b.trim())) return null; // nothing after the FAQ heading qualifies
    if (isHeading(b.trim())) {
      seenHeading = true;
      proseAfterHeading = 0;
      continue;
    }
    if (!seenHeading || !isProse(b)) continue;
    proseAfterHeading += 1;
    if (proseAfterHeading >= 2 && blocks.slice(i + 1).some(isProse)) {
      return [blocks.slice(0, i + 1).join("\n\n"), blocks.slice(i + 1).join("\n\n")];
    }
  }
  return null;
};

/** Index of the first part that can host the card, with its split; null if none. */
export const findSkynnCtaSlot = (parts: string[]): { index: number; before: string; after: string } | null => {
  for (let i = 0; i < parts.length; i++) {
    const split = splitForSkynnCta(parts[i]);
    if (split) return { index: i, before: split[0], after: split[1] };
  }
  return null;
};
