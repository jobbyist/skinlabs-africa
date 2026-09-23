/**
 * Self-reported acne grading (SKYNN AI v2 framework §6).
 *
 * GAGS structure (Doshi et al., 1997): six regions, each weighted by a
 * location factor, graded 0-4 by the most severe lesion type present
 * (0 none, 1 comedones, 2 papules, 3 pustules, 4 nodules). Total =
 * sum(factor x grade). Bands: 0 none, 1-18 mild, 19-30 moderate,
 * 31-38 severe, >38 very severe.
 *
 * Plus an IGA-style 0-4 global grade. Both are SELF-REPORTED proxies here —
 * GAGS and IGA are clinician-assessed instruments, so every output of this
 * module is labelled "self-reported" and is a tracking aid, not a grading.
 */

export const GAGS_REGIONS: Array<{ questionId: string; label: string; factor: number }> = [
  { questionId: "acne_forehead", label: "Forehead", factor: 2 },
  { questionId: "acne_right_cheek", label: "Right cheek", factor: 2 },
  { questionId: "acne_left_cheek", label: "Left cheek", factor: 2 },
  { questionId: "acne_nose", label: "Nose", factor: 1 },
  { questionId: "acne_chin", label: "Chin", factor: 1 },
  { questionId: "acne_chest_back", label: "Chest and upper back", factor: 3 },
];

export const LESION_GRADE: Record<string, number> = {
  none: 0,
  blackheads_whiteheads: 1,
  red_bumps: 2,
  pus_bumps: 3,
  deep_painful_lumps: 4,
};

export type GagsBand = "none" | "mild" | "moderate" | "severe" | "very_severe";

export const IGA_STYLE: Record<string, { grade: number; label: string }> = {
  clear: { grade: 0, label: "Clear" },
  almost_clear: { grade: 1, label: "Almost clear" },
  mild: { grade: 2, label: "Mild" },
  moderate: { grade: 3, label: "Moderate" },
  severe: { grade: 4, label: "Severe" },
};

export function gagsBand(total: number): GagsBand {
  if (total <= 0) return "none";
  if (total <= 18) return "mild";
  if (total <= 30) return "moderate";
  if (total <= 38) return "severe";
  return "very_severe";
}

export interface AcneGradingResult {
  present: boolean;
  gagsStyleTotal: number | null;
  gagsStyleBand: GagsBand | null;
  regionGrades: Array<{ region: string; grade: number; weighted: number }>;
  igaStyleGrade: number | null;
  igaStyleLabel: string | null;
  /** True when any region reports deep, painful lumps (grade 4) — an input
   *  to the deterministic safety floor ("severe cystic/nodular acne"). */
  nodularReported: boolean;
  label: "Self-reported, GAGS/IGA-style (not a clinician grading)";
}

export function scoreAcne(responses: Record<string, unknown>): AcneGradingResult {
  const label = "Self-reported, GAGS/IGA-style (not a clinician grading)" as const;
  if (responses["acne_present"] !== "yes") {
    return {
      present: false,
      gagsStyleTotal: null,
      gagsStyleBand: null,
      regionGrades: [],
      igaStyleGrade: null,
      igaStyleLabel: null,
      nodularReported: false,
      label,
    };
  }

  let total = 0;
  let nodular = false;
  const regionGrades = GAGS_REGIONS.map(({ questionId, label: region, factor }) => {
    const answer = responses[questionId];
    const grade = typeof answer === "string" && answer in LESION_GRADE ? LESION_GRADE[answer] : 0;
    if (grade === 4) nodular = true;
    total += grade * factor;
    return { region, grade, weighted: grade * factor };
  });

  const igaAnswer = responses["acne_overall"];
  const iga = typeof igaAnswer === "string" ? IGA_STYLE[igaAnswer] : undefined;

  return {
    present: true,
    gagsStyleTotal: total,
    gagsStyleBand: gagsBand(total),
    regionGrades,
    igaStyleGrade: iga?.grade ?? null,
    igaStyleLabel: iga?.label ?? null,
    nodularReported: nodular,
    label,
  };
}
