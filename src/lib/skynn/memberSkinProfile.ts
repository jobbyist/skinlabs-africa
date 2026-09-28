/**
 * One merged view of what a member has told SKYNN AI about their skin, for
 * personalising the dashboard (Smart Routines, "Picked for your skin").
 *
 * Pure. Sources are the member's own submissions only: their latest saved
 * Basic AI Skin Analysis (skincare_recommendations.result_payload) and their
 * latest Advanced AI Dermatology Analysis answers (advanced_assessment_sessions
 * .responses). Never analytics events (they're stripped of skin data by
 * design) and never anything inferred from a photo. Where both analyses
 * answer the same thing, the Advanced answer wins (more detailed, and the
 * member confirmed or changed any value suggested from the Basic analysis).
 */
import type { FormulaConcern, FormulaSkinType } from "@/data/formulaResults";

export type ProfileSource = "basic" | "advanced";
export type SensitivityBand = "low" | "moderate" | "high";

export interface MemberSkinProfile {
  /** Mapped to the four types the product matcher understands. */
  skinType: FormulaSkinType | null;
  primaryConcern: FormulaConcern | null;
  /** Advanced concern values (or Basic ConcernKeys) for display/targeting. */
  concerns: string[];
  sensitivity: SensitivityBand | null;
  climate: string | null;
  budgetConscious: boolean | null;
  sunExposure: string | null;
  spfHabit: string | null;
  activesInUse: string[];
  exfoliation: string | null;
  /** Free-text things to avoid (Advanced irritants question + profile allergies). */
  avoid: string[];
  /** Pregnant, breastfeeding or trying to conceive — retinoids are never suggested. */
  cautionPregnancy: boolean;
  mstTone: number | null;
  currentProducts: string[];
  routineComplexity: "minimal" | "moderate" | "flexible" | null;
  provenance: Partial<Record<keyof Omit<MemberSkinProfile, "provenance" | "sources">, ProfileSource>>;
  sources: {
    basicAnalysisId: string | null;
    basicAnalysisDate: string | null;
    advancedSessionId: string | null;
    advancedSubmittedAt: string | null;
  };
}

export interface BasicSource {
  id: string;
  created_at: string;
  mst_tone: number | null;
  result_payload: unknown;
}

export interface AdvancedSource {
  id: string;
  submitted_at: string | null;
  responses: Record<string, unknown> | null;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : []);

const SKIN_TYPES: FormulaSkinType[] = ["oily", "combination", "normal", "dry"];

const ADVANCED_CONCERN_TO_FORMULA: Record<string, FormulaConcern> = {
  breakouts_acne: "acne",
  uneven_tone_pigmentation: "brightening",
  dullness: "brightening",
  scarring_marks: "brightening",
  fine_lines_aging: "aging",
  redness_sensitivity: "sensitivity",
};

const PREGNANCY_CAUTION = new Set(["pregnant", "breastfeeding", "trying_to_conceive"]);

export function buildMemberSkinProfile(input: {
  basic?: BasicSource | null;
  advanced?: AdvancedSource | null;
  profileAllergies?: string[] | null;
}): MemberSkinProfile {
  const p: MemberSkinProfile = {
    skinType: null,
    primaryConcern: null,
    concerns: [],
    sensitivity: null,
    climate: null,
    budgetConscious: null,
    sunExposure: null,
    spfHabit: null,
    activesInUse: [],
    exfoliation: null,
    avoid: [],
    cautionPregnancy: false,
    mstTone: null,
    currentProducts: [],
    routineComplexity: null,
    provenance: {},
    sources: {
      basicAnalysisId: input.basic?.id ?? null,
      basicAnalysisDate: input.basic?.created_at ?? null,
      advancedSessionId: input.advanced?.id ?? null,
      advancedSubmittedAt: input.advanced?.submitted_at ?? null,
    },
  };
  const set = <K extends keyof MemberSkinProfile["provenance"]>(key: K, value: MemberSkinProfile[K], source: ProfileSource) => {
    (p as unknown as Record<string, unknown>)[key] = value;
    p.provenance[key] = source;
  };

  // ---- Basic AI Skin Analysis ----
  const payload = isObj(input.basic?.result_payload) ? input.basic!.result_payload as Obj : null;
  if (payload) {
    const profile = isObj(payload.profile) ? payload.profile : {};
    const prefs = isObj(payload.preferences) ? payload.preferences : {};
    const answers = isObj(payload.answers) ? payload.answers : {};
    const skinType = str(payload.skinType) ?? str(profile.skinType);
    if (skinType && (SKIN_TYPES as string[]).includes(skinType)) set("skinType", skinType as FormulaSkinType, "basic");
    const concern = str(payload.primaryConcern) ?? str(profile.primaryConcern);
    if (concern && ["acne", "brightening", "aging", "sensitivity"].includes(concern)) set("primaryConcern", concern as FormulaConcern, "basic");
    const concerns = [concern, ...strs(profile.secondaryConcerns)].filter((c): c is string => Boolean(c));
    if (concerns.length) set("concerns", concerns, "basic");
    const sens = str(profile.sensitivityTendency);
    if (sens === "low" || sens === "moderate" || sens === "high") set("sensitivity", sens, "basic");
    if (typeof prefs.budgetConscious === "boolean") set("budgetConscious", prefs.budgetConscious, "basic");
    const complexity = str(prefs.complexity);
    if (complexity === "minimal" || complexity === "moderate" || complexity === "flexible") set("routineComplexity", complexity, "basic");
    const q11 = answers.q11;
    if (typeof q11 === "number") {
      const climate = ["hot_humid", "hot_dry", "mild_temperate", "cold_dry"][q11];
      if (climate) set("climate", climate, "basic");
    }
    const mst = input.basic?.mst_tone ?? (typeof profile.mstTone === "number" ? profile.mstTone : null);
    if (typeof mst === "number" && mst >= 1 && mst <= 10) set("mstTone", mst, "basic");
  }

  // ---- Advanced AI Dermatology Analysis (wins where both answer) ----
  const a = input.advanced?.responses;
  if (isObj(a)) {
    const skinType = str(a.skin_type);
    if (skinType) {
      const mapped: FormulaSkinType | null =
        skinType === "dehydrated" ? "dry" : skinType === "sensitive" ? p.skinType ?? "normal" : (SKIN_TYPES as string[]).includes(skinType) ? (skinType as FormulaSkinType) : null;
      if (mapped) set("skinType", mapped, "advanced");
      if (skinType === "sensitive") set("sensitivity", "high", "advanced");
    }
    const concerns = strs(a.primary_concerns);
    if (concerns.length) {
      set("concerns", concerns, "advanced");
      const primary = concerns.map((c) => ADVANCED_CONCERN_TO_FORMULA[c]).find(Boolean);
      if (primary) set("primaryConcern", primary, "advanced");
    }
    if (typeof a.sensitivity_level === "number") {
      const n = a.sensitivity_level;
      set("sensitivity", n <= 2 ? "low" : n === 3 ? "moderate" : "high", "advanced");
    }
    const climate = str(a.climate);
    if (climate) set("climate", climate, "advanced");
    const sun = str(a.daily_sun_exposure);
    if (sun) set("sunExposure", sun, "advanced");
    const spf = str(a.spf_habit);
    if (spf) set("spfHabit", spf, "advanced");
    const actives = strs(a.actives_in_use).filter((x) => x !== "none_currently");
    if (actives.length || Array.isArray(a.actives_in_use)) set("activesInUse", actives, "advanced");
    const exf = str(a.exfoliation_frequency);
    if (exf) set("exfoliation", exf, "advanced");
    const irritants = str(a.known_irritating_ingredients);
    if (irritants) set("avoid", splitList(irritants), "advanced");
    const preg = str(a.pregnancy_status);
    if (preg) set("cautionPregnancy", PREGNANCY_CAUTION.has(preg), "advanced");
    const mst = str(a.mst_tone);
    if (mst && /^(10|[1-9])$/.test(mst)) set("mstTone", Number(mst), "advanced");
    if (Array.isArray(a.current_products)) {
      const names = a.current_products
        .map((e) => (typeof e === "string" ? e : isObj(e) ? str(e.productName) : null))
        .filter((s): s is string => Boolean(s));
      if (names.length) set("currentProducts", names.slice(0, 30), "advanced");
    }
  }

  const allergies = (input.profileAllergies ?? []).flatMap(splitList);
  if (allergies.length) p.avoid = [...new Set([...p.avoid, ...allergies])];
  return p;
}

const splitList = (s: string) =>
  s
    .split(/[,;\n]| and /i)
    .map((x) => x.trim().toLowerCase())
    .filter((x) => x.length >= 3 && x.length <= 60)
    .slice(0, 20);

/** True when at least one analysis has been merged in. */
export const hasSkinProfile = (p: MemberSkinProfile | null | undefined) =>
  Boolean(p && (p.sources.basicAnalysisId || p.sources.advancedSessionId));
