/**
 * Basic AI Skin Analysis → Advanced AI Dermatology Analysis starting point.
 *
 * Pure. Turns a member's saved Basic analysis (skincare_recommendations row:
 * `result_payload` + `mst_tone`) into suggested answers for the Advanced
 * questionnaire. Rules:
 *   - only questions with a close, honest equivalent in the Basic quiz;
 *   - every value is checked against the pinned definition's options (or
 *     scale range) and dropped if the definition doesn't accept it;
 *   - never consent, safety screening, quality of life, pregnancy, or
 *     anything the Basic quiz didn't ask;
 *   - the member sees each prefilled question marked and can change it.
 * Raw quiz answers (`result_payload.answers`) exist only for analyses saved
 * from v2.1; older results fall back to the derived profile fields.
 */

import type { AssessmentDefinitionSummary, AssessmentQuestion } from "@/lib/assessment/types";

export interface BasicAnalysisRow {
  id: string;
  created_at: string;
  mst_tone: number | null;
  result_payload: unknown;
}

export interface AdvancedPrefill {
  responses: Record<string, unknown>;
  prefilledIds: string[];
  basicAnalysisId: string;
  basicAnalysisDate: string;
}

/** Questions that must always be answered fresh, whatever the Basic analysis says. */
export const NEVER_PREFILL = new Set([
  "popia_special_info_consent",
  "popia_cross_border_consent",
  "safety_red_flags",
  "lesion_notes",
  "pregnancy_status",
  "skin_distress",
]);

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

const PRIMARY_CONCERN: Record<string, string> = {
  acne: "breakouts_acne",
  brightening: "uneven_tone_pigmentation",
  aging: "fine_lines_aging",
  sensitivity: "redness_sensitivity",
};

const CONCERN_KEY: Record<string, string> = {
  breakouts: "breakouts_acne",
  dryness: "dryness_dehydration",
  dehydration: "dryness_dehydration",
  uneven_tone: "uneven_tone_pigmentation",
  pigmentation: "uneven_tone_pigmentation",
  texture: "texture_congestion",
  oiliness: "oiliness",
  sensitivity: "redness_sensitivity",
  visible_pores: "large_pores",
};

const GOAL: Record<string, string> = {
  simplify_routine: "simplified_routine",
  maintain_skin: "general_maintenance",
  support_barrier: "calmer_less_reactive_skin",
};

const GOAL_FROM_CONCERN: Record<string, string> = {
  breakouts_acne: "clearer_skin",
  uneven_tone_pigmentation: "more_even_tone",
  dryness_dehydration: "improved_hydration",
  texture_congestion: "smoother_texture",
  fine_lines_aging: "reduced_signs_of_aging",
  redness_sensitivity: "calmer_less_reactive_skin",
};

const PROGRESSION: Record<string, string> = {
  always_like_this: "staying_the_same",
  worse_recently: "getting_worse",
  improved_recently: "getting_better",
  comes_and_goes: "fluctuates",
};

const TRIGGER: Record<string, string> = {
  after_new_product: "new_products",
  weather_seasonal: "weather_climate",
};

const SENSITIVITY_LEVEL: Record<string, number> = { low: 2, moderate: 3, high: 4 };

/** Basic quiz option index → Advanced option value, only where the wording lines up. */
const FROM_ANSWER: Record<string, { questionId: string; values: Array<string | null> }> = {
  q1: { questionId: "bt_od_midday_shine", values: ["very_shiny", "slight_shine", "matte_comfortable", "tight_flaky"] },
  q2: { questionId: "bt_od_pores", values: ["large_prominent", "noticeable", "small", "barely_visible"] },
  // "Rarely" is left for the member: it doesn't say whether breakouts are present now.
  q3: { questionId: "acne_present", values: ["yes", "yes", null, "no"] },
  q7: { questionId: "bt_sr_flush", values: ["often", "sometimes", "rarely", "never"] },
  q10: {
    questionId: "sun_response",
    values: ["usually_burns_tans_little", "sometimes_burns_tans_gradually", "rarely_burns_tans_easily", "very_rarely_burns"],
  },
  q11: { questionId: "climate", values: ["hot_humid", "hot_dry", "mild_temperate", "cold_dry"] },
};

const uniq = (xs: string[]) => [...new Set(xs)];

export function buildAdvancedPrefill(
  row: BasicAnalysisRow,
  definition: AssessmentDefinitionSummary,
): AdvancedPrefill {
  const questions = new Map<string, AssessmentQuestion>();
  for (const section of definition.sections) for (const q of section.questions) questions.set(q.id, q);

  const payload = isObj(row.result_payload) ? row.result_payload : {};
  const profile = isObj(payload.profile) ? payload.profile : {};
  const context = isObj(payload.context) ? payload.context : {};
  const answers = isObj(payload.answers) ? payload.answers : {};

  const candidate: Record<string, unknown> = {};

  // Monk Skin Tone: the member's own earlier choice (the column is user_reported only).
  const mst = row.mst_tone ?? (typeof profile.mstTone === "number" ? profile.mstTone : null);
  if (typeof mst === "number" && Number.isInteger(mst) && mst >= 1 && mst <= 10) candidate.mst_tone = String(mst);

  if (typeof profile.skinType === "string") candidate.skin_type = profile.skinType;
  if (typeof profile.sensitivityTendency === "string" && profile.sensitivityTendency in SENSITIVITY_LEVEL) {
    candidate.sensitivity_level = SENSITIVITY_LEVEL[profile.sensitivityTendency];
  }

  const concerns: string[] = [];
  const primary = typeof payload.primaryConcern === "string" ? payload.primaryConcern : profile.primaryConcern;
  if (typeof primary === "string" && PRIMARY_CONCERN[primary]) concerns.push(PRIMARY_CONCERN[primary]);
  if (Array.isArray(profile.secondaryConcerns)) {
    for (const k of profile.secondaryConcerns) if (typeof k === "string" && CONCERN_KEY[k]) concerns.push(CONCERN_KEY[k]);
  }
  if (concerns.length) candidate.primary_concerns = uniq(concerns);

  const goals: string[] = [];
  for (const g of [profile.primaryGoal, profile.secondaryGoal]) if (typeof g === "string" && GOAL[g]) goals.push(GOAL[g]);
  if (concerns[0] && GOAL_FROM_CONCERN[concerns[0]]) goals.unshift(GOAL_FROM_CONCERN[concerns[0]]);
  if (goals.length) candidate.primary_goals = uniq(goals);

  const status = typeof context.status === "string" ? context.status : null;
  if (status && PROGRESSION[status]) candidate.concern_progression = PROGRESSION[status];
  if (status && TRIGGER[status]) candidate.concern_triggers = [TRIGGER[status]];

  for (const [qid, map] of Object.entries(FROM_ANSWER)) {
    const v = answers[qid];
    if (typeof v !== "number" || !Number.isInteger(v)) continue;
    const mapped = map.values[v];
    if (mapped) candidate[map.questionId] = mapped;
  }

  const responses: Record<string, unknown> = {};
  for (const [id, value] of Object.entries(candidate)) {
    if (NEVER_PREFILL.has(id)) continue;
    const q = questions.get(id);
    if (!q) continue;
    const accepted = acceptValue(q, value);
    if (accepted !== undefined) responses[id] = accepted;
  }

  return {
    responses,
    prefilledIds: Object.keys(responses),
    basicAnalysisId: row.id,
    basicAnalysisDate: row.created_at,
  };
}

/** Returns the value if the question accepts it (multi-select keeps only valid options), else undefined. */
function acceptValue(q: AssessmentQuestion, value: unknown): unknown {
  const allowed = new Set((q.options ?? []).map((o) => o.value));
  switch (q.type) {
    case "single_select":
    case "frequency":
      return typeof value === "string" && allowed.has(value) ? value : undefined;
    case "multi_select": {
      if (!Array.isArray(value)) return undefined;
      let kept = value.filter((v): v is string => typeof v === "string" && allowed.has(v));
      if (q.maxSelections) kept = kept.slice(0, q.maxSelections);
      return kept.length ? kept : undefined;
    }
    case "scale": {
      if (typeof value !== "number") return undefined;
      const min = q.min ?? 1;
      const max = q.max ?? 5;
      return value >= min && value <= max ? value : undefined;
    }
    default:
      return undefined;
  }
}

/** Merges a prefill under the member's own answers (their answers always win). */
export function mergePrefill(existing: Record<string, unknown>, prefill: Record<string, unknown>) {
  return { ...prefill, ...existing };
}
