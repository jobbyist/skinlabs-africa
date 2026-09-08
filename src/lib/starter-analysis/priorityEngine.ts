/**
 * Deterministic Skin Priority Engine (Section 7 of the spec). Ranks concerns by
 * explicit weighting rules — never by the order the visitor happened to answer
 * questions in. Every rule here is grounded in the same general dermatology
 * guidance already used by `deriveMstSignal`/`deriveExtraSignals` in
 * `src/data/formulaResults.ts` (gentler-first for sensitive/compromised-barrier
 * skin, sun protection as a prerequisite for any tone-evening strategy) — no new
 * clinical claims are introduced.
 */

import type { ConcernKey, NormalisedProfile, PriorityItem, PriorityResult } from "@/lib/starter-analysis/types";
import { PRIORITY_ENGINE_VERSION } from "@/lib/starter-analysis/types";
import { formulaConcernToKey } from "@/lib/starter-analysis/normalize";

const CONCERN_LABEL: Record<ConcernKey, string> = {
  breakouts: "Breakout management",
  dryness: "Dryness",
  dehydration: "Dehydration",
  uneven_tone: "Uneven-looking tone",
  pigmentation: "Pigmentation",
  texture: "Texture",
  oiliness: "Oil control",
  sensitivity: "Sensitivity",
  visible_pores: "Visible pores",
  barrier_support: "Barrier support",
  maintenance: "Maintaining your results",
};

/** Concerns whose most direct treatment usually involves a stronger/faster-acting active. */
const ACTIVE_DRIVEN_CONCERNS = new Set<ConcernKey>(["breakouts", "uneven_tone", "pigmentation", "texture"]);

interface ScoredConcern {
  key: ConcernKey;
  score: number;
  reasons: string[];
}

export const rankPriorities = (profile: NormalisedProfile): PriorityResult => {
  const primary = formulaConcernToKey(profile.primaryConcern);
  const scored = new Map<ConcernKey, ScoredConcern>();

  const bump = (key: ConcernKey, delta: number, reason: string) => {
    const existing = scored.get(key);
    if (existing) {
      existing.score += delta;
      existing.reasons.push(reason);
    } else {
      scored.set(key, { key, score: delta, reasons: [reason] });
    }
  };

  bump(primary, 100, "This is the main priority you told us about.");
  profile.secondaryConcerns.forEach((key, idx) => {
    bump(key, 70 - idx * 15, "You flagged this as a secondary concern in your answers.");
  });

  if (profile.barrierTendency === "needs_support") {
    if (profile.sensitivityTendency === "high") {
      bump("barrier_support", 90, "Your answers suggest both sensitive skin and a stressed barrier, so rebuilding barrier function comes first.");
    } else {
      bump("barrier_support", 55, "Your answers suggest your skin barrier could use some support.");
    }
  }

  if (profile.sensitivityTendency === "high") {
    for (const key of scored.keys()) {
      if (ACTIVE_DRIVEN_CONCERNS.has(key) && key !== "barrier_support") {
        bump(key, -20, "Because your skin reads as sensitive, we've deprioritised anything that relies on stronger actives until your skin is more settled.");
      }
    }
  }

  if (primary === "uneven_tone" && profile.sensitivityTendency === "low") {
    bump("uneven_tone", 15, "With low sensitivity, an active-led tone-evening strategy is more likely to be well tolerated.");
  }

  if (profile.maintenanceOrientation === "maintenance" && scored.size <= 1) {
    bump("maintenance", 40, "Your answers don't point to a strong active concern right now, so the focus is on maintaining what's already working.");
  }

  const items: PriorityItem[] = Array.from(scored.values())
    .sort((a, b) => b.score - a.score)
    .map((s, idx) => ({
      key: s.key,
      level: s.score >= 75 ? "high" : s.score >= 45 ? "moderate" : "low",
      // The most recently applied rule is the most specific explanation for why this
      // concern landed where it did (e.g. a deprioritisation note beats the generic
      // "you flagged this" reason it was originally added with).
      reason: s.reasons[s.reasons.length - 1],
      rank: idx + 1,
    }));

  return { items, scoringVersion: PRIORITY_ENGINE_VERSION };
};

export const priorityLabel = (key: ConcernKey): string => CONCERN_LABEL[key];
