import { describe, expect, test } from "bun:test";
import { buildAdvancedPrefill, mergePrefill, NEVER_PREFILL } from "@/lib/skynn/basicToAdvancedPrefill";
import type { AssessmentDefinitionSummary, AssessmentQuestion } from "@/lib/assessment/types";

// Option values copied from the live 2026.2 definition (assessment_definitions).
const single = (id: string, values: string[]): AssessmentQuestion => ({
  id, type: "single_select", required: true, prompt: id, options: values.map((v) => ({ value: v, label: v })),
});
const multi = (id: string, values: string[]): AssessmentQuestion => ({ ...single(id, values), type: "multi_select" });

const DEFINITION: AssessmentDefinitionSummary = {
  version: "2026.2",
  title: "test",
  sections: [
    {
      id: "consent",
      title: "Consent",
      questions: [single("popia_special_info_consent", ["agree", "decline"]), single("popia_cross_border_consent", ["agree", "decline"])],
    },
    {
      id: "basics",
      title: "Basics",
      questions: [
        single("mst_tone", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]),
        single("sun_response", ["always_burns_never_tans", "usually_burns_tans_little", "sometimes_burns_tans_gradually", "rarely_burns_tans_easily", "very_rarely_burns", "never_burns"]),
        single("skin_type", ["oily", "dry", "combination", "sensitive", "normal", "dehydrated"]),
        { id: "sensitivity_level", type: "scale", required: true, prompt: "s", min: 1, max: 5 },
        single("bt_od_midday_shine", ["tight_flaky", "matte_comfortable", "slight_shine", "very_shiny"]),
        single("bt_od_pores", ["barely_visible", "small", "noticeable", "large_prominent"]),
        single("bt_sr_flush", ["never", "rarely", "sometimes", "often"]),
        single("acne_present", ["yes", "no"]),
        multi("primary_concerns", ["breakouts_acne", "oiliness", "dryness_dehydration", "redness_sensitivity", "uneven_tone_pigmentation", "fine_lines_aging", "texture_congestion", "dullness", "large_pores", "scarring_marks", "razor_bumps"]),
        multi("concern_triggers", ["stress", "diet", "hormonal_cycle", "weather_climate", "new_products", "sun_exposure", "shaving_hair_removal", "unsure_no_clear_trigger"]),
        single("concern_progression", ["getting_better", "staying_the_same", "getting_worse", "fluctuates"]),
        single("climate", ["hot_humid", "hot_dry", "mild_temperate", "cold_dry", "coastal_humid", "highveld_dry_winter"]),
        single("pregnancy_status", ["not_applicable", "trying_to_conceive", "pregnant", "breastfeeding", "prefer_not_to_say"]),
        multi("primary_goals", ["clearer_skin", "more_even_tone", "improved_hydration", "smoother_texture", "reduced_signs_of_aging", "calmer_less_reactive_skin", "simplified_routine", "general_maintenance"]),
        multi("safety_red_flags", ["none", "bleeding_mole"]),
      ],
    },
  ],
};

const row = (payload: unknown, mst: number | null = 6) => ({
  id: "rec-1",
  created_at: "2026-09-20T08:00:00Z",
  mst_tone: mst,
  result_payload: payload,
});

const V21_PAYLOAD = {
  primaryConcern: "acne",
  profile: {
    skinType: "combination",
    primaryConcern: "acne",
    secondaryConcerns: ["oiliness", "visible_pores", "barrier_support"],
    sensitivityTendency: "moderate",
    primaryGoal: "simplify_routine",
    secondaryGoal: null,
    mstTone: 6,
  },
  context: { status: "after_new_product", detail: null },
  answers: { q1: 1, q2: 0, q3: 0, q7: 2, q10: 1, q11: 0, q18: 0 },
};

describe("Basic → Advanced prefill", () => {
  test("maps a v2.1 Basic result onto valid Advanced answers", () => {
    const p = buildAdvancedPrefill(row(V21_PAYLOAD), DEFINITION);
    expect(p.responses).toEqual({
      mst_tone: "6",
      skin_type: "combination",
      sensitivity_level: 3,
      primary_concerns: ["breakouts_acne", "oiliness", "large_pores"],
      primary_goals: ["clearer_skin", "simplified_routine"],
      concern_triggers: ["new_products"],
      bt_od_midday_shine: "slight_shine",
      bt_od_pores: "large_prominent",
      acne_present: "yes",
      bt_sr_flush: "rarely",
      sun_response: "sometimes_burns_tans_gradually",
      climate: "hot_humid",
    });
    expect(p.prefilledIds.sort()).toEqual(Object.keys(p.responses).sort());
    expect(p.basicAnalysisId).toBe("rec-1");
  });

  test("never prefills consent, safety or pregnancy", () => {
    const p = buildAdvancedPrefill(row(V21_PAYLOAD), DEFINITION);
    for (const id of NEVER_PREFILL) expect(p.responses[id]).toBeUndefined();
  });

  test("a pre-v2.1 result (no raw answers) still prefills the profile-derived answers", () => {
    const { answers: _a, ...old } = V21_PAYLOAD;
    const p = buildAdvancedPrefill(row(old), DEFINITION);
    expect(p.responses.skin_type).toBe("combination");
    expect(p.responses.climate).toBeUndefined();
    expect(p.responses.sun_response).toBeUndefined();
  });

  test("values the definition doesn't accept are dropped", () => {
    const narrow: AssessmentDefinitionSummary = {
      ...DEFINITION,
      sections: [{ id: "x", title: "x", questions: [single("skin_type", ["oily", "dry"]), multi("primary_concerns", ["oiliness"])] }],
    };
    const p = buildAdvancedPrefill(row(V21_PAYLOAD), narrow);
    expect(p.responses).toEqual({ primary_concerns: ["oiliness"] });
  });

  test("no MST chosen → no MST prefilled; an out-of-range tone is ignored", () => {
    expect(buildAdvancedPrefill(row({ ...V21_PAYLOAD, profile: { ...V21_PAYLOAD.profile, mstTone: null } }, null), DEFINITION).responses.mst_tone).toBeUndefined();
    expect(buildAdvancedPrefill(row({}, 11), DEFINITION).responses.mst_tone).toBeUndefined();
  });

  test("'rarely' breakouts leaves acne_present for the member", () => {
    const p = buildAdvancedPrefill(row({ ...V21_PAYLOAD, answers: { q3: 2 } }), DEFINITION);
    expect(p.responses.acne_present).toBeUndefined();
  });

  test("garbage payloads never throw", () => {
    for (const bad of [null, "x", 3, [], { profile: "x", answers: [1] }]) {
      expect(() => buildAdvancedPrefill(row(bad, null), DEFINITION)).not.toThrow();
    }
  });

  test("the member's own answers always win over the prefill", () => {
    expect(mergePrefill({ skin_type: "dry" }, { skin_type: "oily", climate: "hot_dry" })).toEqual({
      skin_type: "dry",
      climate: "hot_dry",
    });
  });
});
