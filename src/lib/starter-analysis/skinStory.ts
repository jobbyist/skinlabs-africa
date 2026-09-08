/**
 * "Your Skin Story" — a deterministic interpretation layer that turns a
 * NormalisedProfile into cautious, non-diagnostic narrative copy. Language is
 * restricted to "suggests / appears consistent with / points toward / may
 * indicate" — never "you have X" or "diagnosed with". See Section 4 of the
 * Starter Analysis 2.0 spec.
 */

import type { ChangeContext, ConcernKey, NormalisedProfile, SkinStory } from "@/lib/starter-analysis/types";
import { SKIN_STORY_VERSION } from "@/lib/starter-analysis/types";
import { formulaConcernToKey } from "@/lib/starter-analysis/normalize";

const CONCERN_LABEL: Record<ConcernKey, string> = {
  breakouts: "occasional breakouts",
  dryness: "dryness",
  dehydration: "dehydration",
  uneven_tone: "uneven-looking skin tone",
  pigmentation: "visible pigmentation",
  texture: "texture concerns",
  oiliness: "excess oil",
  sensitivity: "sensitivity",
  visible_pores: "visible pores",
  barrier_support: "a stressed skin barrier",
  maintenance: "keeping your skin balanced",
};

const changeClause = (context: ChangeContext): string | null => {
  switch (context.status) {
    case "started_recently":
      return "You've also mentioned this started recently, so we've treated it as a current state rather than a fixed characteristic.";
    case "worse_recently":
      return "Since your answers point to things getting worse recently, this routine leans toward stabilising your skin before introducing anything new.";
    case "improved_recently":
      return "Since things have been improving recently, this routine is built to protect that progress rather than change course.";
    case "comes_and_goes":
      return context.detail
        ? `Because this comes and goes (${context.detail}), consistency matters more here than intensity.`
        : "Because this comes and goes, consistency matters more here than intensity.";
    case "after_new_product":
      return context.detail
        ? `You mentioned this changed after starting ${context.detail} — worth keeping in mind alongside anything below that overlaps.`
        : "You mentioned this changed after starting a new product — worth reviewing your current routine for overlap.";
    case "after_stopping_product":
      return context.detail
        ? `You mentioned this changed after stopping ${context.detail} — that's a useful clue worth discussing if you see a dermatologist.`
        : "You mentioned this changed after stopping a product — that's a useful clue worth keeping in mind.";
    case "weather_seasonal":
      return "Since this appears tied to weather or season, the climate guidance below matters more than usual for you.";
    default:
      return null;
  }
};

export const buildSkinStory = (profile: NormalisedProfile, context: ChangeContext): SkinStory => {
  const primaryConcernKey = formulaConcernToKey(profile.primaryConcern);
  const primaryLabel = CONCERN_LABEL[primaryConcernKey];
  const secondaryLabels = profile.secondaryConcerns.map((c) => CONCERN_LABEL[c]);

  const secondaryClause =
    secondaryLabels.length > 0 ? `, with secondary concerns around ${secondaryLabels.join(" and ")}` : "";

  const sensitivityClause =
    profile.sensitivityTendency === "high"
      ? "Because your answers also suggest your skin is sensitive, your routine should focus on consistency and barrier support rather than introducing several strong actives at once."
      : profile.sensitivityTendency === "moderate"
        ? "Your answers point toward moderately reactive skin, so new actives are best introduced one at a time."
        : "Your answers don't suggest heightened sensitivity, which gives you more room to layer actives if you want to.";

  const barrierClause =
    profile.barrierTendency === "needs_support"
      ? "Your skin barrier appears to need some support right now, so this comes before anything more corrective."
      : null;

  const maturityClause =
    profile.routineMaturity === "beginner"
      ? "Since you're relatively new to a structured routine, we've kept the core steps to the essentials."
      : profile.routineMaturity === "experienced"
        ? "Given how consistent your current routine already is, there's room to be more deliberate about layering actives."
        : null;

  const changeNote = changeClause(context);

  const narrative = [
    `Your answers suggest that your main priority is ${primaryLabel}${secondaryClause}.`,
    sensitivityClause,
    barrierClause,
    maturityClause,
    changeNote,
  ]
    .filter((s): s is string => Boolean(s))
    .join(" ");

  return {
    primaryConcern: primaryConcernKey,
    secondaryConcerns: profile.secondaryConcerns,
    skinBehaviour: profile.skinBehaviour,
    sensitivityTendency: profile.sensitivityTendency,
    barrierTendency: profile.barrierTendency,
    activeTolerance: profile.activeTolerance,
    routineMaturity: profile.routineMaturity,
    primaryGoal: profile.primaryGoal,
    secondaryGoal: profile.secondaryGoal,
    narrative,
    version: SKIN_STORY_VERSION,
  };
};
