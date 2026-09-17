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
