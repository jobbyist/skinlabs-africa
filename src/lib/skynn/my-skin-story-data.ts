/**
 * Maps a Basic AI Skin Analysis result onto the privacy-safe input of the
 * "My Skin Story" card. Only cosmetic, already-displayed fields are copied; there
 * is deliberately no route for identifiers, contact details or the skin photo.
 */
import { FOCUS_ACTIVES, type FormulaSkinType } from "@/data/formulaResults";
import { MST_SCALE } from "@/data/mstScale";
import { priorityLabel } from "@/lib/starter-analysis/priorityEngine";
import type { BarrierTendency, StarterAnalysisResult } from "@/lib/starter-analysis/types";
import { SKYNN_FEATURE_VERSION } from "@/lib/skynn/terminology";
import type { MySkinStoryData } from "@/lib/skynn/my-skin-story";

/** "2.2.0-beta" -> "SKYNN AI v2.2 · BETA", from the single version source. */
export const storyVersionBadge = (featureVersion: string = SKYNN_FEATURE_VERSION): string => {
  const [numeric, stage] = featureVersion.split("-");
  const [major, minor] = numeric.split(".");
  const version = minor !== undefined ? `v${major}.${minor}` : `v${major}`;
  return `SKYNN AI ${version}${stage ? ` · ${stage.toUpperCase()}` : ""}`;
};

const BARRIER_SECONDARY: Partial<Record<BarrierTendency, string>> = {
  needs_support: "Barrier needs support",
  supported: "Barrier looks supported",
};

export interface StoryInput {
  skinType: FormulaSkinType;
  result: StarterAnalysisResult | null;
  /** The member's own, optional MST pick (1-10). Never inferred. */
  mstTone: number | null;
}

export const buildMySkinStoryData = ({ skinType, result, mstTone }: StoryInput): MySkinStoryData => {
  const swatch = mstTone !== null ? MST_SCALE.find((s) => s.level === mstTone) : undefined;
  const concerns = result
    ? [...result.priorities.items].sort((a, b) => a.rank - b.rank).map((item) => priorityLabel(item.key))
    : [];
  const slots = (picks: { slot: string }[] | undefined) =>
    picks?.length ? picks.map((p) => p.slot).join(" · ") : undefined;
  const am = slots(result?.groundedRoutine.am);
  const pm = slots(result?.groundedRoutine.pm);

  return {
    skinType,
    secondary: result ? BARRIER_SECONDARY[result.skinStory.barrierTendency] : undefined,
    skinTone: swatch ? { level: swatch.level, hex: swatch.hex } : undefined,
    concerns,
    ingredients: result ? FOCUS_ACTIVES[result.primaryConcern] ?? [] : [],
    routineFocus: am || pm ? { am, pm } : undefined,
    assessmentDate: result?.generatedAt ?? new Date(),
    aiVersion: storyVersionBadge(),
  };
};
