import { priorityLabel } from "@/lib/starter-analysis/priorityEngine";
import type { StarterAnalysisResult } from "@/lib/starter-analysis/types";

const SKIN_TYPE_LABEL: Record<StarterAnalysisResult["skinType"], string> = {
  oily: "Oily",
  combination: "Combination",
  normal: "Normal",
  dry: "Dry",
};

export interface StarterSummary {
  skinTypeLabel: string;
  /** The two highest-ranked concerns from the priority engine, as display labels. */
  topConcerns: string[];
}

/**
 * The free, no-sign-up slice of a starter result: skin type and top two
 * concerns. Uses the same ranked priorities the full result shows, so the
 * summary never disagrees with what the visitor sees after signing up.
 */
export const summarizeStarterResult = (result: StarterAnalysisResult): StarterSummary => {
  const ranked = [...result.priorities.items].sort((a, b) => a.rank - b.rank).map((item) => priorityLabel(item.key));
  const unique = Array.from(new Set(ranked));
  return {
    skinTypeLabel: SKIN_TYPE_LABEL[result.skinType] ?? result.skinType,
    topConcerns: unique.slice(0, 2),
  };
};

const GENERIC_GUIDANCE: Record<string, string> = {
  oily: "Keep textures light and cleanse gently — stripping oil tends to make skin produce more.",
  combination: "Treat zones differently: lighter layers where you're oily, richer care where you're dry.",
  normal: "Keep it consistent — a gentle cleanser, moisturiser and daily SPF do most of the work.",
  dry: "Layer hydration and seal it in with a richer moisturiser, especially after cleansing.",
  dehydrated: "Focus on water-binding hydrators and a barrier-friendly moisturiser.",
  sensitive: "Introduce one new product at a time and patch test before adding actives.",
};

/** First sentence of a string, clipped — for one-line dashboard guidance. */
const firstSentence = (text: string, max = 180): string => {
  const sentence = text.split(/(?<=[.!?])\s+/)[0]?.trim() ?? "";
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
};

const prettify = (value: string) =>
  value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export interface SavedAnalysisHeadline {
  skinTypeLabel: string;
  concerns: string[];
  guidance: string;
}

/**
 * Dashboard hero copy for a saved analysis row. Starter rows carry the full
 * structured result; older rows and live-AI rows only have skin type and a
 * concerns array, so those fall back to general cosmetic guidance by skin type.
 */
export const headlineForSavedAnalysis = (row: {
  skin_type: string;
  concerns: string[] | null;
  result_payload: unknown;
}): SavedAnalysisHeadline => {
  const result = row.result_payload as StarterAnalysisResult | null;
  if (result?.priorities && result.skinStory) {
    const summary = summarizeStarterResult(result);
    return {
      skinTypeLabel: summary.skinTypeLabel,
      concerns: summary.topConcerns,
      guidance: firstSentence(result.skinStory.narrative) || GENERIC_GUIDANCE[result.skinType] || GENERIC_GUIDANCE.normal,
    };
  }
  const type = (row.skin_type || "").toLowerCase();
  return {
    skinTypeLabel: type && type !== "unknown" ? prettify(type) : "Your skin profile",
    concerns: (row.concerns ?? []).filter(Boolean).slice(0, 3).map(prettify),
    guidance: GENERIC_GUIDANCE[type] ?? GENERIC_GUIDANCE.normal,
  };
};
