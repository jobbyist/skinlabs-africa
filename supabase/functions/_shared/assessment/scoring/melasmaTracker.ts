/**
 * Self-tracked, mMASI-style pigment-patch score (SKYNN AI v2 framework §6).
 *
 * mMASI structure (Pandya et al., JAAD 2011): per region, area (0-6) x
 * darkness (0-4) x region weight (forehead 0.3, each malar 0.3, chin 0.1);
 * total 0-24. Rigorous MASI/mMASI scoring is clinician/image-based — the
 * framework is explicit that a non-diagnostic tool may only use it as a
 * self-tracked severity proxy, so this is never presented as a melasma
 * assessment, only as a number a member can track over time.
 */

export const MMASI_REGIONS: Array<{ key: string; label: string; weight: number }> = [
  { key: "forehead", label: "Forehead", weight: 0.3 },
  { key: "right_cheek", label: "Right cheek", weight: 0.3 },
  { key: "left_cheek", label: "Left cheek", weight: 0.3 },
  { key: "chin", label: "Chin", weight: 0.1 },
];

export const AREA_SCORE: Record<string, number> = {
  none: 0,
  under_10: 1,
  "10_29": 2,
  "30_49": 3,
  "50_69": 4,
  "70_89": 5,
  "90_100": 6,
};

export const DARKNESS_SCORE: Record<string, number> = {
  none: 0,
  slight: 1,
  mild: 2,
  marked: 3,
  severe: 4,
};

export interface MelasmaTrackerResult {
  present: boolean;
  mmasiStyleScore: number | null;
  max: 24;
  label: "Self-tracked, mMASI-style (advisory only, not a clinical MASI)";
}

export function scoreMelasmaTracker(responses: Record<string, unknown>): MelasmaTrackerResult {
  const label = "Self-tracked, mMASI-style (advisory only, not a clinical MASI)" as const;
  if (responses["pigment_patches_present"] !== "yes") {
    return { present: false, mmasiStyleScore: null, max: 24, label };
  }
  let total = 0;
  for (const region of MMASI_REGIONS) {
    const area = responses[`patch_${region.key}_area`];
    const dark = responses[`patch_${region.key}_darkness`];
    const a = typeof area === "string" ? AREA_SCORE[area] ?? 0 : 0;
    const d = typeof dark === "string" ? DARKNESS_SCORE[dark] ?? 0 : 0;
    total += region.weight * a * d;
  }
  return { present: true, mmasiStyleScore: Math.round(total * 10) / 10, max: 24, label };
}
