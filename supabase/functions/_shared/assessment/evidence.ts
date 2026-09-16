/**
 * Evidence selection/validation — section 11 ("Evidence layer"). Pure logic
 * only; the actual advanced_assessment_evidence read lives in the edge
 * function (needs a Supabase client). Keeping selection/validation here as
 * plain functions makes the "Claude can only cite what it was given" rule
 * unit-testable without a database.
 */
import type { EvidenceReference } from "./types.ts";

export interface EvidenceRow {
  id: string;
  title: string;
  publisher: string | null;
  source_type: string;
  url: string | null;
  publication_date: string | null;
  topic_tags: string[];
}

/** Picks the evidence rows relevant to this assessment's topics, capped so
 *  the prompt stays small — never the model's job to decide what's relevant. */
export function selectEvidenceForTopics(rows: EvidenceRow[], topics: string[], limit = 12): EvidenceReference[] {
  const topicSet = new Set(topics);
  return rows
    .filter((r) => r.topic_tags.some((t) => topicSet.has(t)))
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      title: r.title,
      publisher: r.publisher,
      sourceType: r.source_type,
      url: r.url,
      publicationDate: r.publication_date,
    }));
}

/**
 * The model is only ever allowed to cite evidence it was actually given.
 * Any id in the report's `evidence` array that isn't in `allowed` means the
 * model fabricated or mis-copied a citation — the caller should strip those
 * entries (or trigger a repair retry) rather than persist a fabricated
 * source, per section 11's "do not allow Claude to fabricate citations".
 */
export function validateCitedEvidence(
  reportEvidence: EvidenceReference[],
  allowed: EvidenceReference[],
): { valid: EvidenceReference[]; fabricatedIds: string[] } {
  const allowedById = new Map(allowed.map((e) => [e.id, e]));
  const valid: EvidenceReference[] = [];
  const fabricatedIds: string[] = [];

  for (const cited of reportEvidence ?? []) {
    const real = allowedById.get(cited.id);
    if (real) {
      valid.push(real); // always the server's own record, never the model's restatement of it
    } else {
      fabricatedIds.push(cited.id);
    }
  }

  return { valid, fabricatedIds };
}
