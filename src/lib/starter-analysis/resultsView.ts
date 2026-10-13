/**
 * Pure view-model rules for the tabbed Basic AI Skin Analysis results hub.
 * Everything here is derived from the existing StarterAnalysisResult — no new
 * data, no backend. Copy stays cautious and cosmetic (never a diagnosis).
 */
import type { FormulaConcern, FormulaSkinType } from "@/data/formulaResults";
import type { StarterAnalysisResult } from "@/lib/starter-analysis/types";
import { priorityLabel } from "@/lib/starter-analysis/priorityEngine";

export type ResultsTab = "profile" | "routine" | "integrity";
export const RESULTS_TABS: ResultsTab[] = ["profile", "routine", "integrity"];

/** `#results-routine` -> "routine"; anything else -> null (caller keeps its default). */
export const tabFromHash = (hash: string): ResultsTab | null => {
  const m = /^#?results-(profile|routine|integrity)$/.exec(hash.trim());
  return m ? (m[1] as ResultsTab) : null;
};
export const hashForTab = (tab: ResultsTab) => `#results-${tab}`;

const CONCERN_TAG: Record<FormulaConcern, string> = {
  acne: "Breakout-prone",
  brightening: "Dark marks",
  aging: "Fine lines",
  sensitivity: "Sensitive",
};
const SKIN_TAG: Record<string, string> = { oily: "Oily", dry: "Dry", combination: "Combination", normal: "Balanced" };

/** "OILY & BREAKOUT-PRONE" — the large display tag. */
export const identityTag = (skinType: FormulaSkinType | string, concern: FormulaConcern): string =>
  `${SKIN_TAG[skinType] ?? "Balanced"} & ${CONCERN_TAG[concern]}`.toUpperCase();

export type HealthTone = "good" | "watch" | "unknown";
export const barrierBadge = (b: StarterAnalysisResult["profile"]["barrierTendency"]): { label: string; tone: HealthTone } =>
  b === "needs_support"
    ? { label: "Barrier recovery priority", tone: "watch" }
    : b === "supported"
      ? { label: "Barrier supported", tone: "good" }
      : { label: "Barrier status unclear", tone: "unknown" };

export interface Takeaway {
  kind: "driver" | "barrier" | "pacing";
  eyebrow: string;
  title: string;
  body: string;
}

const DRIVER_TITLE: Record<FormulaConcern, string> = {
  acne: "Breakout management",
  brightening: "Dark mark fading",
  aging: "Fine line & firmness care",
  sensitivity: "Calm & rebuild",
};
const SENSITIVITY_BODY = { low: "Low sensitivity", moderate: "Moderate sensitivity", high: "High sensitivity" } as const;
const BEHAVIOUR_BODY = { stable: "fairly stable skin", variable: "skin that's been changing", reactive: "reactive skin" } as const;

export const buildTakeaways = (r: StarterAnalysisResult): Takeaway[] => {
  const top = r.priorities.items[0];
  const { barrierTendency, sensitivityTendency, skinBehaviour, activeTolerance } = r.skinStory;
  const pacingTitle =
    activeTolerance === "tolerant" ? "Standard active cadence" : activeTolerance === "cautious" ? "Gentle active cadence" : "Beginner active cadence";
  const pacingBody =
    r.routineStrategy.activeIntensity === "none"
      ? "No actives for now — build up slowly later"
      : r.routineStrategy.activeIntensity === "gentle"
        ? "Start low and add frequency slowly"
        : "Build frequency step by step";
  return [
    {
      kind: "driver",
      eyebrow: "Primary driver",
      title: DRIVER_TITLE[r.primaryConcern],
      body: top ? `Your #1 priority: ${priorityLabel(top.key)}` : "Where your routine focuses first",
    },
    {
      kind: "barrier",
      eyebrow: "Barrier status",
      title: barrierTendency === "needs_support" ? "Barrier needs support" : barrierTendency === "supported" ? "Barrier looks supported" : "Barrier status unclear",
      body: `${SENSITIVITY_BODY[sensitivityTendency]} · ${BEHAVIOUR_BODY[skinBehaviour]}`,
    },
    { kind: "pacing", eyebrow: "Pacing rule", title: pacingTitle, body: pacingBody },
  ];
};

/* ---------- Weekly cadence ---------- */

/** 0 = Monday … 6 = Sunday. */
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const ALL = [0, 1, 2, 3, 4, 5, 6];

export interface CadenceRow {
  label: string;
  time: "am" | "pm";
  days: number[];
}
export interface CadencePhase {
  id: "tolerance" | "building" | "maintenance";
  tab: string;
  sub: string;
  rows: CadenceRow[];
  /** Shown when there is no row to light up, or as the phase's rule of thumb. */
  note: string;
}

const PHASE_META = [
  { id: "tolerance", tab: "Weeks 1–2", sub: "Tolerance" },
  { id: "building", tab: "Weeks 3–4", sub: "Building" },
  { id: "maintenance", tab: "Ongoing", sub: "Maintenance" },
] as const;

type PhaseBody = { rows: CadenceRow[]; note: string };
const phases = (a: PhaseBody, b: PhaseBody, c: PhaseBody): CadencePhase[] =>
  [a, b, c].map((p, i) => ({ ...PHASE_META[i], ...p }));

/** Mirrors `CONCERN_PROFILE[...].weeklySchedule` in formulaResults.ts, which stays the full-text source of truth. */
export const cadenceForConcern = (concern: FormulaConcern): CadencePhase[] => {
  switch (concern) {
    case "acne": {
      const bha = (days: number[]): CadenceRow[] => [{ label: "BHA (salicylic acid)", time: "pm", days }];
      return phases(
        { rows: bha([0, 2, 4]), note: "Mon / Wed / Fri evenings to build tolerance." },
        { rows: bha([0, 2, 4, 6]), note: "Every other night if there's no irritation. Nightly from week 4 if skin tolerates it." },
        { rows: bha(ALL), note: "Nightly if tolerated, always followed by moisturiser." },
      );
    }
    case "brightening": {
      const vitC: CadenceRow = { label: "Vitamin C", time: "am", days: ALL };
      const azelaic = (days: number[]): CadenceRow => ({ label: "Azelaic acid / alpha arbutin", time: "pm", days });
      return phases(
        { rows: [vitC, azelaic([0, 2, 4, 6])], note: "Azelaic acid every other night; vitamin C every morning under SPF." },
        { rows: [vitC, azelaic(ALL)], note: "Nightly from week 3 if there's no irritation." },
        { rows: [vitC, azelaic(ALL)], note: "Expect 8–12 weeks of consistent use before marks fade." },
      );
    }
    case "aging": {
      const retinol = (days: number[]): CadenceRow[] => [{ label: "Retinol", time: "pm", days }];
      return phases(
        { rows: retinol([0, 3]), note: "Twice a week (e.g. Mon / Thu), pea-sized amount, then moisturiser." },
        { rows: retinol([0, 2, 4]), note: "Three times a week if there's no irritation." },
        { rows: retinol([0, 2, 4, 6]), note: "Every other night, building toward nightly over 2–3 months." },
      );
    }
    case "sensitivity":
      return phases(
        { rows: [], note: "No actives. Cleanser, barrier-repair moisturiser and SPF only." },
        { rows: [], note: "Still no actives — let the barrier recover (weeks 1–4)." },
        { rows: [], note: "From week 5, if skin feels calm, add ONE gentle active (e.g. low-strength niacinamide) and wait 2 weeks before a second." },
      );
  }
};

/** The body of the "## Weekly Actives Schedule" section, for the full-text caption. */
export const weeklyScheduleText = (recommendationText: string): string | null => {
  const m = /##\s*Weekly Actives Schedule\s*\n([\s\S]*?)(?=\n##\s|$)/i.exec(recommendationText);
  return m ? m[1].trim() || null : null;
};

/* ---------- Routine steps ---------- */

export type StepIcon = "droplets" | "sparkles" | "shield" | "sun";
export interface StepMeta {
  verb: string;
  icon: StepIcon;
  tip: string;
}
const STEP_META: Record<string, StepMeta> = {
  Cleanser: { verb: "Cleanse", icon: "droplets", tip: "Massage for 30 seconds, rinse with lukewarm water." },
  Serum: { verb: "Treat", icon: "sparkles", tip: "Apply a thin layer to clean, dry skin before moisturiser." },
  Treatment: { verb: "Treat", icon: "sparkles", tip: "Use on clean, fully dry skin — only on your active nights." },
  Moisturiser: { verb: "Moisturise", icon: "shield", tip: "Seal everything in — it also buffers your actives." },
  SPF: { verb: "Protect", icon: "sun", tip: "Last step every morning, rain or shine — reapply if outdoors midday." },
};
export const stepMeta = (slot: string): StepMeta => STEP_META[slot] ?? { verb: slot, icon: "sparkles", tip: "Follow the order shown." };
