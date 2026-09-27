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

/**
 * SKYNN AI v2 regulatory guard list (framework §5F/§10). South Africa
 * prohibits cosmetics that claim to bleach, lighten or whiten skin
 * (GN R1227), restricts hydroquinone, and SKYNN AI must never recommend a
 * prescription-only medicine. These are deterministic, context-free term
 * matches — "avoid skin-lightening creams" and "use this to lighten your
 * skin" both match — so they are handed to the Opus QA reviewer (and shown
 * to the human admin reviewer) as findings to judge in context, never
 * silently auto-corrected or used to auto-publish.
 */
export const REGULATORY_WATCH_TERMS: Array<{ term: RegExp; flag: string }> = [
  { term: /\b(skin[- ]?)?(lighten|lightening|lightener|whiten|whitening|bleach|bleaching)\b/i, flag: "skin_lightening_language" },
  { term: /\bhydroquinone\b/i, flag: "hydroquinone_mentioned" },
  { term: /\bmercury\b/i, flag: "mercury_mentioned" },
  { term: /\b(tretinoin|isotretinoin|clindamycin|doxycycline|minocycline|sarecycline|spironolactone|clascoterone|clobetasol|betamethasone)\b/i, flag: "prescription_medicine_named" },
  { term: /\b(diagnos(e|is|ed)|you have (acne|melasma|eczema|rosacea|psoriasis))\b/i, flag: "diagnostic_language" },
  { term: /\b(guaranteed?|cure[sd]?|100%|clinically proven to)\b/i, flag: "overstated_claim" },
];

export function scanRegulatoryFlags(text: string): string[] {
  const flags = new Set<string>(scanComplianceFlags(text));
  for (const { term, flag } of REGULATORY_WATCH_TERMS) {
    if (term.test(text)) flags.add(flag);
  }
  return [...flags];
}
