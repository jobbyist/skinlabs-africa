/**
 * Evidence selection + citation enforcement for SKYNN AI v2 (framework §5D,
 * §12). The reasoner only ever sees APPROVED evidence rows (bibliographically
 * verified against PubMed, seeded in advanced_assessment_evidence with a
 * short citation code like "C3"), and every code it returns is checked
 * against exactly the set it was given — an unknown code is stripped, never
 * trusted. Pure and Deno/Bun-portable.
 */

export interface EvidenceEntry {
  code: string;
  title: string;
  publisher: string | null;
  year: number | null;
  url: string | null;
  pmid: string | null;
  doi: string | null;
  summary: string;
  topic_tags: string[];
  source_type: string;
}

const ALWAYS_TOPICS = ["photoprotection", "skin_barrier"];

/** Topic tags for this respondent: their own concern/active/trait answers
 *  plus a few derived from deterministic scores — never model output. */
export function deriveTopicsV2(
  responses: Record<string, unknown>,
  derived: { mstTier: number | null; melasmaPresent: boolean; acnePresent: boolean; pigmentProne: boolean },
): string[] {
  const arr = (k: string) => (Array.isArray(responses[k]) ? (responses[k] as unknown[]).filter((v): v is string => typeof v === "string") : []);
  const topics = new Set<string>([...ALWAYS_TOPICS, ...arr("primary_concerns"), ...arr("actives_in_use"), ...arr("skin_characteristics")]);
  if (derived.mstTier !== null && derived.mstTier >= 5) topics.add("skin_of_colour");
  if (derived.mstTier !== null && derived.mstTier >= 5) topics.add("visible_light");
  if (derived.melasmaPresent) topics.add("melasma");
  if (derived.acnePresent) topics.add("breakouts_acne");
  if (derived.pigmentProne) topics.add("pih");
  if (typeof responses["pregnancy_status"] === "string" && responses["pregnancy_status"] !== "not_applicable") topics.add("pregnancy");
  return [...topics];
}

/** Most-relevant first (tag overlap count), methodology-only rows excluded —
 *  those back the deterministic scores, not efficacy claims. */
export function selectEvidenceV2(rows: EvidenceEntry[], topics: string[], limit = 14): EvidenceEntry[] {
  const topicSet = new Set(topics);
  return rows
    .filter((r) => !r.topic_tags.includes("methodology"))
    .map((r) => ({ r, overlap: r.topic_tags.filter((t) => topicSet.has(t)).length }))
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || a.r.code.localeCompare(b.r.code, undefined, { numeric: true }))
    .slice(0, limit)
    .map((x) => x.r);
}

export function formatEvidenceForPrompt(rows: EvidenceEntry[]): string {
  return rows
    .map((r) => `[${r.code}] ${r.title} (${[r.publisher, r.year].filter(Boolean).join(", ")}${r.pmid ? `; PMID ${r.pmid}` : ""})\n    ${r.summary}`)
    .join("\n");
}

/** Keeps only codes that were actually provided; returns the stripped ones. */
export function filterCitationCodes(codes: string[], allowed: Set<string>): { kept: string[]; stripped: string[] } {
  const kept: string[] = [];
  const stripped: string[] = [];
  for (const c of codes ?? []) {
    const code = String(c).trim().replace(/^\[|\]$/g, "");
    if (allowed.has(code)) {
      if (!kept.includes(code)) kept.push(code);
    } else {
      stripped.push(code);
    }
  }
  return { kept, stripped };
}
