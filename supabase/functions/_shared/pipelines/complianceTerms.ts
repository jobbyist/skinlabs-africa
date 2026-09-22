/**
 * Named-diagnosis compliance guard shared by the Supabase-cron content
 * pipelines (product-review-sync, briefings-sync). Mirrors the exact same
 * list already used by supabase/functions/skincare-ai/index.ts and
 * supabase/functions/_shared/assessment/compliance.ts -- kept identical
 * rather than re-derived so every AI-generated-text surface in this
 * codebase agrees on what counts as a named-diagnosis violation. If this
 * list changes, update all copies together.
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
