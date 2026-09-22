/**
 * Briefing body markdown (from the Gemini-authored pipeline and the
 * hand-authored content/daily-skinny/ manuscripts alike, see get_article_body)
 * embeds a per-article "Editorial disclaimer: ..." paragraph inline,
 * sometimes inside the "## FAQ" section and sometimes under a heading like
 * "## Honest limits". Left inline it either renders as an ordinary paragraph
 * wherever it happens to land, or — if it falls inside the FAQ section — gets
 * silently dropped by BriefingBody's FAQ-item parser (which explicitly skips
 * any block starting with "editorial disclaimer"). Extracting it here lets
 * the caller render it once, consistently, as its own block at the end of
 * the article instead.
 */
export function extractEditorialDisclaimer(markdown: string): { body: string; disclaimer: string | null } {
  const paragraphs = markdown.split(/\n{2,}/);
  const index = paragraphs.findIndex((paragraph) => /^editorial disclaimer:?/i.test(paragraph.trim()));
  if (index === -1) return { body: markdown, disclaimer: null };

  const disclaimer = paragraphs[index].trim().replace(/^editorial disclaimer:?\s*/i, "").trim();
  const body = [...paragraphs.slice(0, index), ...paragraphs.slice(index + 1)].join("\n\n");
  return { body, disclaimer: disclaimer || null };
}
