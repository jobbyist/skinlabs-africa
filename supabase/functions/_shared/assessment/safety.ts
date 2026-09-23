/**
 * Deterministic safety/escalation screening (section 10 of the Advanced
 * Assessment engine brief).
 *
 * IMPORTANT: this is a general-purpose, non-clinical triage heuristic, NOT
 * dermatologist-approved diagnostic criteria — SkinLabs has not supplied
 * clinical escalation thresholds, and none are fabricated here (see
 * CLAUDE.md / section 42-43 of the engine brief). It only checks for a
 * small set of widely-recognised, common-sense red flags (a rapidly
 * changing mole, a non-healing wound, signs of infection, sudden severe
 * hair loss, a severe reaction) that any cosmetic intake form would
 * reasonably ask about, and maps them to a "see a professional" nudge —
 * never a diagnosis, never a specific condition name. This runs entirely
 * from the respondent's own `safety_red_flags` answer (see the
 * `safety_screening` section of the seeded assessment_definitions row) —
 * never from the Claude model's output, so a hallucinated observation can
 * never suppress or invent a safety flag.
 *
 * Kept in application code (not SQL) deliberately, so SkinLabs can review
 * and update the mapping without a migration once real dermatologist-
 * approved criteria are supplied — at which point this function should be
 * replaced (or its RED_FLAG_URGENCY table extended) rather than the
 * calling contract changed.
 */
import type { SafetyScreenResult, SafetyUrgency } from "./types.ts";

const RED_FLAG_URGENCY: Record<string, { urgency: SafetyUrgency; reason: string }> = {
  rapidly_changing_mole: {
    urgency: "urgent",
    reason: "A mole or spot that's rapidly changing in size, shape or colour is worth having examined by a doctor or dermatologist promptly.",
  },
  non_healing_sore_or_wound: {
    urgency: "prompt",
    reason: "A sore or wound that isn't healing is worth having assessed by a doctor.",
  },
  sudden_severe_hair_loss: {
    urgency: "prompt",
    reason: "Sudden or severe hair loss can have a range of causes best evaluated by a doctor.",
  },
  painful_swelling_or_signs_of_infection: {
    urgency: "urgent",
    reason: "Painful swelling or signs of infection (warmth, pus, fever) should be assessed by a doctor promptly.",
  },
  severe_unexplained_reaction: {
    urgency: "urgent",
    reason: "A severe, unexplained skin reaction is worth having assessed by a doctor promptly.",
  },
  // --- SKYNN AI v2 (2026.2 question library) red flags, framework §5B ---
  mole_abcde_features: {
    urgency: "urgent",
    reason: "A mole or spot with an uneven shape, ragged edge, several colours, or larger than a pencil eraser should be examined by a doctor or dermatologist promptly.",
  },
  new_dark_line_on_nail: {
    urgency: "urgent",
    reason: "A new dark line or band on a nail should be examined by a doctor or dermatologist promptly — changes like this are easy to overlook on deeper skin tones.",
  },
  spot_on_palm_or_sole: {
    urgency: "urgent",
    reason: "A new or changing dark spot on the palm of your hand or sole of your foot should be examined by a doctor or dermatologist promptly — changes like this are easy to overlook on deeper skin tones.",
  },
  bleeding_spot_or_mole: {
    urgency: "urgent",
    reason: "A spot or mole that bleeds without an obvious injury should be examined by a doctor promptly.",
  },
  spreading_redness_or_pus: {
    urgency: "urgent",
    reason: "Spreading redness, pus or rapidly worsening pain should be assessed by a doctor promptly.",
  },
  fever_with_skin_symptoms: {
    urgency: "urgent",
    reason: "Skin symptoms together with a fever should be assessed by a doctor promptly.",
  },
  deep_painful_cystic_breakouts: {
    urgency: "prompt",
    reason: "Deep, painful breakouts that leave lumps or scars are best managed with a doctor or dermatologist, who can offer treatments a cosmetic routine can't.",
  },
  widespread_rash_or_blistering: {
    urgency: "urgent",
    reason: "A widespread rash or blistering should be assessed by a doctor promptly.",
  },
  swelling_hives_or_breathing: {
    urgency: "urgent",
    reason: "Swelling of the lips or eyes, hives, or any difficulty breathing can be a serious allergic reaction — seek urgent medical care.",
  },
};

const URGENCY_RANK: Record<SafetyUrgency, number> = { routine: 0, prompt: 1, urgent: 2 };

const USER_MESSAGE: Record<SafetyUrgency, string> = {
  routine: "Nothing you shared suggests you need to see a professional right away — this report focuses on cosmetic skincare guidance.",
  prompt: "Based on what you shared, it's worth booking a visit with a doctor or dermatologist in the near future, alongside this cosmetic guidance.",
  urgent: "Based on what you shared, please see a doctor or dermatologist promptly — this report can't replace that evaluation.",
};

/**
 * `redFlags` is the respondent's raw `safety_red_flags` multi-select answer
 * (question ids matching RED_FLAG_URGENCY's keys, or "none_of_the_above").
 * Never throws on an unrecognised value — an unknown flag is ignored rather
 * than escalated, so a future question-library addition can't accidentally
 * over-trigger until this table is updated to match.
 */
export function computeSafetyScreen(redFlags: string[] | null | undefined): SafetyScreenResult {
  const flags = (redFlags ?? []).filter((f) => f in RED_FLAG_URGENCY);

  if (flags.length === 0) {
    return {
      requiresProfessionalReview: false,
      urgency: "routine",
      reasons: [],
      userMessage: USER_MESSAGE.routine,
    };
  }

  const reasons = flags.map((f) => RED_FLAG_URGENCY[f].reason);
  const urgency = flags.reduce<SafetyUrgency>(
    (worst, f) => (URGENCY_RANK[RED_FLAG_URGENCY[f].urgency] > URGENCY_RANK[worst] ? RED_FLAG_URGENCY[f].urgency : worst),
    "routine",
  );

  return {
    requiresProfessionalReview: true,
    urgency,
    reasons,
    userMessage: USER_MESSAGE[urgency],
  };
}

// ---------------------------------------------------------------------------
// SKYNN AI v2 deterministic triage floor (framework §5B/§11).
//
// The Haiku safety screener classifies the intake too, but the final triage
// is ALWAYS the stricter of the model's answer and this floor — so a model
// miss can never downgrade a red flag the respondent actually reported.
// Categories mirror the framework's five red-flag groups; categories 1-4
// force "escalate", category 5 (distress) forces at least "caution".
// ---------------------------------------------------------------------------

export type Triage = "clear" | "caution" | "escalate";
export type RedFlagCategory =
  | "suspected_malignancy"
  | "possible_infection"
  | "pregnancy_breastfeeding"
  | "severe_systemic"
  | "distress";

const FLAG_CATEGORY: Record<string, RedFlagCategory> = {
  rapidly_changing_mole: "suspected_malignancy",
  mole_abcde_features: "suspected_malignancy",
  new_dark_line_on_nail: "suspected_malignancy",
  spot_on_palm_or_sole: "suspected_malignancy",
  bleeding_spot_or_mole: "suspected_malignancy",
  non_healing_sore_or_wound: "suspected_malignancy",
  spreading_redness_or_pus: "possible_infection",
  painful_swelling_or_signs_of_infection: "possible_infection",
  fever_with_skin_symptoms: "possible_infection",
  deep_painful_cystic_breakouts: "severe_systemic",
  widespread_rash_or_blistering: "severe_systemic",
  swelling_hives_or_breathing: "severe_systemic",
  severe_unexplained_reaction: "severe_systemic",
  sudden_severe_hair_loss: "severe_systemic",
};

const TRIAGE_RANK: Record<Triage, number> = { clear: 0, caution: 1, escalate: 2 };

export function stricterTriage(a: Triage, b: Triage): Triage {
  return TRIAGE_RANK[a] >= TRIAGE_RANK[b] ? a : b;
}

export interface DeterministicTriage {
  triage: Triage;
  categories: RedFlagCategory[];
}

export function computeDeterministicTriage(
  responses: Record<string, unknown>,
  opts: { nodularAcneReported?: boolean } = {},
): DeterministicTriage {
  const categories = new Set<RedFlagCategory>();
  const flags = Array.isArray(responses["safety_red_flags"]) ? (responses["safety_red_flags"] as unknown[]) : [];
  for (const f of flags) {
    if (typeof f === "string" && FLAG_CATEGORY[f]) categories.add(FLAG_CATEGORY[f]);
  }
  if (opts.nodularAcneReported) categories.add("severe_systemic");

  const pregnancy = responses["pregnancy_status"];
  if (pregnancy === "pregnant" || pregnancy === "breastfeeding") categories.add("pregnancy_breastfeeding");

  const distress = responses["skin_distress"];
  if (distress === "sometimes" || distress === "often") categories.add("distress");

  const escalating = [...categories].some((c) => c !== "distress");
  const triage: Triage = escalating ? "escalate" : categories.has("distress") ? "caution" : "clear";
  return { triage, categories: [...categories] };
}
