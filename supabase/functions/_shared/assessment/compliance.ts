/**
 * Post-generation compliance scan — the same "never let the model name a
 * medical diagnosis" rule already enforced for the live skincare-ai path
 * (see supabase/functions/skincare-ai/index.ts's FORBIDDEN_DIAGNOSIS_TERMS),
 * reused here rather than redefined so the two AI paths can't quietly drift
 * apart on what counts as a violation. Logged, never auto-corrected or
 * hidden — a flagged report still reaches the user, but is recorded for
 * human review via advanced_assessment_events.
 */

export const FORBIDDEN_DIAGNOSIS_TERMS = ["eczema", "rosacea", "psoriasis", "fungal acne", "pcos"];

export function scanComplianceFlags(text: string): string[] {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  for (const term of FORBIDDEN_DIAGNOSIS_TERMS) {
    if (lower.includes(term)) flags.push(`named_diagnosis:${term.replace(/\s+/g, "_")}`);
  }
  return flags;
}

/** Flattens every string field of a report likely to contain prose, for scanning. */
export function extractReportText(report: Record<string, unknown>): string {
  const parts: string[] = [];
  const walk = (value: unknown) => {
    if (typeof value === "string") {
      parts.push(value);
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === "object") {
      Object.values(value as Record<string, unknown>).forEach(walk);
    }
  };
  walk(report);
  return parts.join("\n");
}
