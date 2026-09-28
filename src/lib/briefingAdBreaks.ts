/**
 * Where in-article ads go inside a briefing body.
 *
 * Hand-authored Daily Skinny manuscripts mark breaks with `<!-- ad:mid-N -->`
 * and those are always respected. Pipeline-written briefings (briefings-sync)
 * carry no markers, so they used to get no in-body ad at all; for those we
 * break before every `everyNthSection`-th "## " section — never before the
 * first section (no ad before the article really starts), never inside or
 * after the FAQ, and never more than `maxBreaks` times.
 */
const MARKER = /<!--\s*ad:mid-\d+\s*-->/i;
const FAQ_HEADING = /^##\s+(faq|frequently asked)/i;

export const splitBriefingForAds = (body: string, everyNthSection = 2, maxBreaks = 4): string[] => {
  if (MARKER.test(body)) return body.split(new RegExp(MARKER.source, "gi"));

  const lines = body.split("\n");
  const breakBefore: number[] = [];
  let sectionIndex = 0;
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i])) inFence = !inFence;
    if (inFence || !/^##\s/.test(lines[i])) continue;
    if (FAQ_HEADING.test(lines[i])) break;
    sectionIndex += 1;
    if (sectionIndex > 1 && (sectionIndex - 1) % everyNthSection === 0 && breakBefore.length < maxBreaks) breakBefore.push(i);
  }
  if (breakBefore.length === 0) return [body];

  const parts: string[] = [];
  let start = 0;
  for (const idx of breakBefore) {
    parts.push(lines.slice(start, idx).join("\n"));
    start = idx;
  }
  parts.push(lines.slice(start).join("\n"));
  return parts;
};
