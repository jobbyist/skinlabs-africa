/**
 * Named-diagnosis compliance guard shared by both Vercel-cron pipelines
 * (product-review-sync.ts, briefings-sync.ts). Mirrors the exact same list
 * already used by supabase/functions/skincare-ai/index.ts,
 * supabase/functions/_shared/assessment/compliance.ts and
 * src/lib/starter-analysis/scenarioValidation.ts -- kept identical rather
 * than re-derived so every AI-generated-text surface in this codebase
 * agrees on what counts as a named-diagnosis violation. Those three live in
 * the Deno edge-function runtime and the Vite client bundle respectively,
 * neither of which this Node-runtime Vercel function can import across, so
 * this is a fourth, deliberately-identical copy rather than a fifth
 * divergent one -- if this list changes, update all four together.
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
