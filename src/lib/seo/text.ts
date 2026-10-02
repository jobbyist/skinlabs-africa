/**
 * Shortens text for meta descriptions without cutting a word in half.
 *
 * A hard `.slice(0, 160)` was shipping descriptions that ended mid-word
 * ("...built for South African skin — edito"). Prefer ending on a sentence
 * boundary, then a word boundary plus an ellipsis, and never exceed `max`.
 */
export function clampAtWord(value: string, max = 160): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;

  const window = text.slice(0, max);

  // Prefer the last full sentence that still leaves a useful snippet.
  const sentenceEnd = Math.max(window.lastIndexOf(". "), window.lastIndexOf("! "), window.lastIndexOf("? "));
  if (sentenceEnd >= max * 0.6) return window.slice(0, sentenceEnd + 1);

  // Otherwise cut at a word boundary and add an ellipsis (counted in `max`).
  const room = text.slice(0, max - 1);
  const lastSpace = room.lastIndexOf(" ");
  const base = lastSpace >= max * 0.5 ? room.slice(0, lastSpace) : room;
  return `${base.replace(/[\s,;:\-–—(]+$/, "")}…`;
}

/** True when a stored description clearly stops mid-sentence (legacy rows cut at 160 chars). */
export function endsMidSentence(value: string | null | undefined): boolean {
  if (!value) return true;
  return !/[.!?…)"”']\s*$/.test(value.trim());
}
