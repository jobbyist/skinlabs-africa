/**
 * "Baumann-style" four-axis skin type (SKYNN AI v2 framework §6).
 *
 * Mirrors the STRUCTURE of the Baumann Skin Type Indicator (four binary
 * axes -> 16 types, e.g. DSPW / ORNT) but NOT its questionnaire: the BSTI
 * items are proprietary, so the question library (assessment_definitions
 * 2026.2, `skin_type_axes` section) uses SkinLabs-authored items instead.
 * Output is therefore always labelled "Baumann-style", never "Baumann" or
 * "BSTI" — it has not been validated against the published instrument.
 *
 * Each axis has four items scored 0-3 (so 0-12 per axis). A score at or
 * above AXIS_THRESHOLD picks the first letter of the pair (O / S / P / W),
 * otherwise the second (D / R / N / T). Pure and Deno/Bun-portable.
 */

export type AxisKey = "oilyDry" | "sensitiveResistant" | "pigmentedNonPigmented" | "wrinkledTight";

export interface AxisDefinition {
  key: AxisKey;
  high: string;
  low: string;
  highLabel: string;
  lowLabel: string;
  /** question id -> (answer value -> points 0..3) */
  items: Record<string, Record<string, number>>;
}

const FREQ = { never: 0, rarely: 1, sometimes: 2, often: 3 } as const;

export const BAUMANN_STYLE_AXES: AxisDefinition[] = [
  {
    key: "oilyDry",
    high: "O",
    low: "D",
    highLabel: "Oily",
    lowLabel: "Dry",
    items: {
      bt_od_midday_shine: { tight_flaky: 0, matte_comfortable: 1, slight_shine: 2, very_shiny: 3 },
      bt_od_pores: { barely_visible: 0, small: 1, noticeable: 2, large_prominent: 3 },
      bt_od_afternoon_feel: { rough_tight: 0, comfortable: 1, slightly_greasy: 2, greasy_all_over: 3 },
      bt_od_dry_season: { cracks_flakes: 0, feels_dry: 1, stays_the_same: 2, still_oily: 3 },
    },
  },
  {
    key: "sensitiveResistant",
    high: "S",
    low: "R",
    highLabel: "Sensitive",
    lowLabel: "Resistant",
    items: {
      bt_sr_sting: { ...FREQ },
      bt_sr_flush: { ...FREQ },
      bt_sr_bumps: { ...FREQ },
      bt_sr_fragrance: { no: 0, not_sure: 1, once_or_twice: 2, yes_often: 3 },
    },
  },
  {
    key: "pigmentedNonPigmented",
    high: "P",
    low: "N",
    highLabel: "Pigmented",
    lowLabel: "Non-pigmented",
    items: {
      bt_pn_marks_after_spots: { nothing: 0, faint_fades_fast: 1, dark_mark_weeks: 2, dark_mark_months: 3 },
      bt_pn_sun_darkening: { ...FREQ },
      bt_pn_patches: { none: 0, faint: 1, noticeable: 2, very_noticeable: 3 },
      bt_pn_hair_removal_marks: { ...FREQ },
    },
  },
  {
    key: "wrinkledTight",
    high: "W",
    low: "T",
    highLabel: "Wrinkle-prone",
    lowLabel: "Tight",
    items: {
      bt_wt_lines_at_rest: { none: 0, only_when_moving: 1, some_at_rest: 2, many_at_rest: 3 },
      bt_wt_lifetime_sun: { very_little: 0, some: 1, a_lot: 2, most_days: 3 },
      bt_wt_smoking: { never: 0, quit_over_5_years: 1, quit_recently: 2, currently: 3 },
      bt_wt_firmness_change: { same: 0, slightly_less_firm: 1, noticeably_less_firm: 2, much_less_firm: 3 },
    },
  },
];

export const AXIS_THRESHOLD = 6;
export const AXIS_MAX = 12;

export interface AxisResult {
  score: number;
  max: number;
  answered: number;
  letter: string;
  label: string;
}

export interface BaumannStyleResult {
  /** e.g. "DSPW" — null when any axis has fewer than 3 of its 4 items answered. */
  code: string | null;
  axes: Record<AxisKey, AxisResult>;
  label: "Baumann-style skin type (SkinLabs-authored questions, not the BSTI)";
}

export function scoreBaumannStyle(responses: Record<string, unknown>): BaumannStyleResult {
  const axes = {} as Record<AxisKey, AxisResult>;
  let complete = true;

  for (const axis of BAUMANN_STYLE_AXES) {
    let score = 0;
    let answered = 0;
    for (const [questionId, map] of Object.entries(axis.items)) {
      const answer = responses[questionId];
      if (typeof answer === "string" && answer in map) {
        score += map[answer];
        answered += 1;
      }
    }
    // Scale a partially-answered axis up to the full 0-12 range so one
    // skipped item doesn't bias every respondent toward the "low" letter.
    const scaled = answered > 0 ? Math.round((score / (answered * 3)) * AXIS_MAX) : 0;
    const isHigh = scaled >= AXIS_THRESHOLD;
    if (answered < 3) complete = false;
    axes[axis.key] = {
      score: scaled,
      max: AXIS_MAX,
      answered,
      letter: isHigh ? axis.high : axis.low,
      label: isHigh ? axis.highLabel : axis.lowLabel,
    };
  }

  const code = complete
    ? BAUMANN_STYLE_AXES.map((a) => axes[a.key].letter).join("")
    : null;

  return { code, axes, label: "Baumann-style skin type (SkinLabs-authored questions, not the BSTI)" };
}
