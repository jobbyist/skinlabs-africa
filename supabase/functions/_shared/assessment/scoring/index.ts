/**
 * Deterministic scoring engine for SKYNN AI v2 (framework §6): every score
 * shown in an Advanced AI Dermatology Report is computed here, in plain
 * TypeScript, never by the model — reproducible, auditable, and identical
 * for identical answers. The model only ever receives these numbers as
 * inputs to reason over.
 */
import { scoreBaumannStyle, type BaumannStyleResult } from "./baumannStyle.ts";
import { scoreAcne, type AcneGradingResult } from "./acneGrading.ts";
import { scoreGlogau, type GlogauResult } from "./glogau.ts";
import { scoreMelasmaTracker, type MelasmaTrackerResult } from "./melasmaTracker.ts";
import { scoreQolImpact, type QolImpactResult } from "./qolImpact.ts";
import { scoreMst, type MstResult } from "./mst.ts";

export const SCORING_RULES_VERSION = "2026.2";

export interface DeterministicScores {
  version: string;
  baumannStyle: BaumannStyleResult;
  acne: AcneGradingResult;
  glogauStyle: GlogauResult;
  melasmaTracker: MelasmaTrackerResult;
  qolImpact: QolImpactResult;
  mst: MstResult;
}

export function computeDeterministicScores(responses: Record<string, unknown>): DeterministicScores {
  const melasmaTracker = scoreMelasmaTracker(responses);
  return {
    version: SCORING_RULES_VERSION,
    baumannStyle: scoreBaumannStyle(responses),
    acne: scoreAcne(responses),
    glogauStyle: scoreGlogau(responses),
    melasmaTracker,
    qolImpact: scoreQolImpact(responses),
    mst: scoreMst(responses, melasmaTracker.present),
  };
}

export * from "./baumannStyle.ts";
export * from "./acneGrading.ts";
export * from "./glogau.ts";
export * from "./melasmaTracker.ts";
export * from "./qolImpact.ts";
export * from "./mst.ts";
