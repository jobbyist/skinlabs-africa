/**
 * Starter Analysis 2.0's two new questions — deliberately minimal (Section 5/6 of
 * the spec). Everything else (routine complexity, budget) is derived from the
 * existing 20-question quiz in src/data/quiz.ts rather than asked again — see
 * normalize.ts. Routine complexity is *initially* read from q13, but a visitor
 * can still tighten it later via Result Refinement.
 */

import type { PriorityPreference, SkinChangeStatus } from "@/lib/starter-analysis/types";

export interface ChangeOption {
  value: SkinChangeStatus;
  label: string;
  /** Only a handful of statuses warrant a follow-up — most don't get one. */
  followUp?: {
    prompt: string;
    placeholder: string;
  };
}

export const CHANGE_QUESTION: { id: "skin_change_status"; title: string; options: readonly ChangeOption[] } = {
  id: "skin_change_status",
  title: "What's happening with your skin right now?",
  options: [
    { value: "always_like_this", label: "My skin has always been like this" },
    { value: "started_recently", label: "It started recently" },
    { value: "worse_recently", label: "It became worse recently" },
    { value: "improved_recently", label: "It improved recently" },
    { value: "comes_and_goes", label: "It comes and goes", followUp: { prompt: "How often does it happen?", placeholder: "e.g. once a month, around my period, every winter" } },
    {
      value: "after_new_product",
      label: "It changed after starting a new product",
      followUp: { prompt: "What changed?", placeholder: "e.g. started a new cleanser, a retinol, a new SPF" },
    },
    {
      value: "after_stopping_product",
      label: "It changed after stopping a product",
      followUp: { prompt: "What changed?", placeholder: "e.g. stopped my moisturiser, stopped an active" },
    },
    {
      value: "weather_seasonal",
      label: "It changed with the weather or season",
      followUp: { prompt: "When did you notice the change?", placeholder: "e.g. since winter started, during the humid months" },
    },
    { value: "unsure", label: "I'm not sure" },
  ],
};

export interface PriorityPreferenceOption {
  value: PriorityPreference;
  label: string;
  description: string;
}

export const PRIORITY_PREFERENCE_QUESTION = {
  id: "priority_preference" as const,
  title: "What matters most to you in a routine?",
  options: [
    { value: "simplest", label: "Simplest routine", description: "Fewest steps that still work" },
    { value: "best_value", label: "Best value", description: "Effective without overspending" },
    { value: "fastest", label: "Fastest visible improvement", description: "Willing to do more for quicker results" },
    { value: "gentlest", label: "Gentlest approach", description: "Prioritise comfort over speed" },
    { value: "comprehensive", label: "Most comprehensive", description: "Cover every angle, complexity is fine" },
  ] as const satisfies readonly PriorityPreferenceOption[],
};
