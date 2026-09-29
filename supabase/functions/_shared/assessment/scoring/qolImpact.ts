/**
 * Skin quality-of-life impact (SKYNN AI v2 framework §6).
 *
 * The framework names the DLQI (Finlay & Khan 1994), which is copyright
 * A.Y. Finlay / Cardiff University and needs a licence for commercial use.
 * SkinLabs holds no such licence, so the question library uses ten
 * SkinLabs-authored items instead (0-3 each, total 0-30) and this module
 * reuses only the published band BOUNDARIES as an indicative grouping.
 * The result is always labelled as SkinLabs' own measure — never "DLQI" —
 * because these items have not been validated against the DLQI.
 */

export const QOL_ITEM_IDS = [
  "qol_physical_discomfort",
  "qol_confidence",
  "qol_avoid_photos",
  "qol_time_energy",
  "qol_social_plans",
  "qol_clothing_makeup",
  "qol_work_study",
  "qol_sleep",
  "qol_relationships",
  "qol_worry",
] as const;

export type QolBand = "no_effect" | "small" | "moderate" | "very_large" | "extremely_large";

export function qolBand(score: number): QolBand {
  if (score <= 1) return "no_effect";
  if (score <= 5) return "small";
  if (score <= 10) return "moderate";
  if (score <= 20) return "very_large";
  return "extremely_large";
}

export interface QolImpactResult {
  score: number | null;
  band: QolBand | null;
  answered: number;
  label: "SkinLabs skin quality-of-life impact (SkinLabs-authored items, not the DLQI)";
}

export function scoreQolImpact(responses: Record<string, unknown>): QolImpactResult {
  const label = "SkinLabs skin quality-of-life impact (SkinLabs-authored items, not the DLQI)" as const;
  let score = 0;
  let answered = 0;
  for (const id of QOL_ITEM_IDS) {
    const raw = responses[id];
    const n = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
    if (Number.isInteger(n) && n >= 0 && n <= 3) {
      score += n;
      answered += 1;
    }
  }
  if (answered < QOL_ITEM_IDS.length) return { score: null, band: null, answered, label };
  return { score, band: qolBand(score), answered, label };
}
