/**
 * Smart Routines engine (SKYNN AI v2.1 — beta). Pure and deterministic.
 *
 * Turns a member's merged skin profile (src/lib/skynn/memberSkinProfile.ts —
 * their Basic AI Skin Analysis + Advanced AI Dermatology Analysis answers)
 * into an AM/PM routine, a weekly plan and a few notes. Rules:
 *   - products only ever come from SkinLabs' reviewed catalogue
 *     (src/data/reviews.ts); a slot with no good match shows the product type;
 *   - a product that contains something the member said they avoid is never
 *     picked; budget-conscious members get the best value pick;
 *   - no retinoid or hydroquinone suggestion for a member who is pregnant,
 *     breastfeeding or trying to conceive;
 *   - cosmetic wording only (a test scans every string for medical claims);
 *   - when an approved Advanced report exists, `fromReport()` uses its AM/PM
 *     steps instead (source "advanced_report").
 */
import { productReviews, overallScore, type ProductReview } from "@/data/reviews";
import type { FormulaConcern, FormulaSkinType } from "@/data/formulaResults";
import { getCurrentSeason, type Season } from "@/data/seasonals";
import type { ReportRoutineStep } from "@/lib/assessment/types";
import type { MemberSkinProfile } from "@/lib/skynn/memberSkinProfile";

export const SMART_ROUTINE_ENGINE_VERSION = "smart-routine-1.0.0";

export type SmartRoutineSource = "rule_based" | "advanced_report";
export type TimeOfDay = "am" | "pm";

export interface SmartStep {
  key: string;
  timeOfDay: TimeOfDay;
  step: string;
  productType: string;
  productSlug: string | null;
  productName: string | null;
  guidance: string;
  /** Plain-language reason tied to what the member told us. */
  why: string;
  fromShelf: boolean;
}

export interface WeeklyDay {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  pm: string[];
}

export interface SmartRoutine {
  engineVersion: string;
  source: SmartRoutineSource;
  season: Season;
  am: SmartStep[];
  pm: SmartStep[];
  weekly: WeeklyDay[];
  notes: string[];
}

const DAYS: WeeklyDay["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SKIN_TYPE_TAGS: Record<FormulaSkinType, string[]> = {
  oily: ["Oily", "Acne-prone", "Congested", "All"],
  combination: ["Combination", "Normal-Resilient", "All"],
  normal: ["Normal", "Resilient", "All"],
  dry: ["Dry", "Very Dry", "Dehydrated", "All"],
};
const SENSITIVE_TAGS = ["Sensitive", "Reactive", "Compromised", "Irritated"];

const CONCERN_KEYWORDS: Record<FormulaConcern, { am: string[]; pm: string[] }> = {
  acne: { am: ["niacinamide"], pm: ["salicylic", "bha", "azelaic"] },
  brightening: { am: ["vitamin c", "ascorbic", "niacinamide"], pm: ["azelaic", "arbutin", "tranexamic"] },
  aging: { am: ["vitamin c", "peptide", "ascorbic"], pm: ["retinol", "retinal", "retinoid", "bakuchiol", "peptide"] },
  sensitivity: { am: ["centella", "cica", "panthenol", "ceramide"], pm: ["centella", "cica", "panthenol", "ceramide"] },
};

const PREGNANCY_AVOID = ["retinol", "retinal", "retinoid", "retinyl", "tretinoin", "adapalene", "hydroquinone"];

const CONCERN_WHY: Record<FormulaConcern, string> = {
  acne: "you told us breakouts are your main concern",
  brightening: "you told us uneven tone or marks are your main concern",
  aging: "you told us visible ageing is your main concern",
  sensitivity: "you told us your skin is easily irritated",
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const contains = (p: ProductReview, terms: string[]) =>
  terms.length > 0 && p.key_ingredients.some((ing) => terms.some((t) => norm(ing).includes(norm(t))));

interface PickOptions {
  category: string;
  profile: MemberSkinProfile;
  keywords?: string[];
  exclude?: string[];
}

function pickProduct({ category, profile, keywords, exclude = [] }: PickOptions, catalogue: ProductReview[]): ProductReview | null {
  const skinType = profile.skinType ?? "normal";
  const wanted = profile.sensitivity === "high" ? [...SENSITIVE_TAGS, ...SKIN_TYPE_TAGS[skinType]] : SKIN_TYPE_TAGS[skinType];
  const avoid = [...profile.avoid, ...exclude, ...(profile.cautionPregnancy ? PREGNANCY_AVOID : [])];
  const candidates = catalogue.filter(
    (p) => p.category === category && p.skin_type_match.some((t) => wanted.includes(t)) && !contains(p, avoid),
  );
  if (!candidates.length) return null;
  const withKeyword = keywords?.length ? candidates.filter((p) => contains(p, keywords)) : [];
  const pool = withKeyword.length ? withKeyword : keywords?.length ? [] : candidates;
  if (!pool.length) return null;
  const score = (p: ProductReview) => (profile.budgetConscious ? p.score_value * 2 + overallScore(p) : overallScore(p));
  return [...pool].sort((a, b) => score(b) - score(a) || b.score_climate - a.score_climate || a.local_price_zar - b.local_price_zar)[0];
}

/** Exact (normalised) name match of a shelf product against the reviewed catalogue. */
export function matchShelfProduct(name: string, catalogue: ProductReview[] = productReviews): ProductReview | null {
  const n = norm(name);
  if (n.length < 4) return null;
  return catalogue.find((p) => norm(`${p.brand} ${p.product_name}`) === n || norm(p.product_name) === n) ?? null;
}

function step(
  timeOfDay: TimeOfDay,
  stepName: string,
  productType: string,
  product: ProductReview | null,
  guidance: string,
  why: string,
  fromShelf = false,
): SmartStep {
  return {
    key: `${timeOfDay}-${stepName.toLowerCase().replace(/[^a-z]+/g, "-")}`,
    timeOfDay,
    step: stepName,
    productType,
    productSlug: product?.id ?? null,
    productName: product ? `${product.brand} ${product.product_name}` : null,
    guidance,
    why,
    fromShelf,
  };
}

export function buildSmartRoutine(
  profile: MemberSkinProfile,
  options: { now?: Date; catalogue?: ProductReview[] } = {},
): SmartRoutine {
  const catalogue = options.catalogue ?? productReviews;
  const season = getCurrentSeason(options.now ?? new Date());
  const concern: FormulaConcern = profile.primaryConcern ?? (profile.sensitivity === "high" ? "sensitivity" : "brightening");
  const sensitive = profile.sensitivity === "high";
  const minimal = profile.routineComplexity === "minimal";
  const kw = CONCERN_KEYWORDS[concern];
  const pmKeywords = profile.cautionPregnancy ? kw.pm.filter((k) => !PREGNANCY_AVOID.some((a) => k.includes(a) || a.includes(k))) : kw.pm;

  // The member's own shelf products win their slot when we've reviewed them.
  const shelf = new Map<string, ProductReview>();
  for (const name of profile.currentProducts) {
    const match = matchShelfProduct(name, catalogue);
    if (match && !shelf.has(match.category) && !contains(match, [...profile.avoid, ...(profile.cautionPregnancy ? PREGNANCY_AVOID : [])])) {
      shelf.set(match.category, match);
    }
  }
  const pick = (category: string, keywords?: string[]) => {
    const own = shelf.get(category);
    if (own && (!keywords?.length || contains(own, keywords))) return { product: own, fromShelf: true };
    return { product: pickProduct({ category, profile, keywords }, catalogue), fromShelf: false };
  };

  const skinWhy = profile.skinType ? `suited to ${profile.skinType} skin` : "a gentle all-round choice";
  const cleanser = pick("Cleanser");
  const moisturiser = pick("Moisturiser");
  const sunscreen = pick("Sunscreen");
  const amSerum = minimal ? null : pick("Serum", kw.am);
  const pmTreatment = pmKeywords.length ? pick("Serum", pmKeywords) : null;
  const sameSerum = amSerum?.product && pmTreatment?.product && amSerum.product.id === pmTreatment.product.id;

  const am: SmartStep[] = [
    step("am", "Cleanse", "Gentle cleanser", cleanser.product,
      sensitive ? "Lukewarm water and a small amount; pat dry." : "A quick, gentle cleanse; skip it if your skin feels dry in the morning.",
      skinWhy, cleanser.fromShelf),
  ];
  if (amSerum) {
    am.push(step("am", "Serum", "Targeted serum", amSerum.product,
      "A few drops on dry skin before moisturiser.", CONCERN_WHY[concern], amSerum.fromShelf));
  }
  am.push(step("am", "Moisturise", "Moisturiser", moisturiser.product,
    profile.climate === "hot_humid" || profile.climate === "coastal_humid" ? "A thin layer; lighter gel textures suit humid days." : "Apply while skin is still slightly damp.",
    skinWhy, moisturiser.fromShelf));
  am.push(step("am", "Protect", "Broad-spectrum sunscreen (SPF 30 or higher)", sunscreen.product,
    "Every morning, even when it's cloudy. Use about two finger-lengths for face and neck; reapply every two hours outdoors.",
    profile.spfHabit && profile.spfHabit !== "daily_rain_or_shine" ? "you said you don't use sunscreen every day yet" : "daily sun protection underpins every other step",
    sunscreen.fromShelf));

  const pm: SmartStep[] = [
    step("pm", "Cleanse", "Gentle cleanser", cleanser.product,
      "Remove sunscreen and the day; a second cleanse only if you wore make-up.", skinWhy, cleanser.fromShelf),
  ];
  if (pmTreatment && !sameSerum) {
    pm.push(step("pm", "Treatment", "Targeted serum (on treatment nights)", pmTreatment.product ?? null,
      sensitive ? "Start two nights a week and build up slowly if your skin stays comfortable." : "On the nights shown in your weekly plan; skip a night if skin feels tight or stings.",
      CONCERN_WHY[concern], pmTreatment.fromShelf));
  }
  pm.push(step("pm", "Moisturise", "Moisturiser", moisturiser.product,
    "A slightly thicker layer at night helps your skin barrier.", skinWhy, moisturiser.fromShelf));

  // ---- Weekly plan (evening only; mornings stay the same every day) ----
  const treatNights = !pm.some((s) => s.step === "Treatment") ? 0 : sensitive ? 2 : minimal ? 3 : 4;
  const treatDays = new Set<WeeklyDay["day"]>(treatNights === 2 ? ["Mon", "Thu"] : treatNights === 3 ? ["Mon", "Wed", "Fri"] : treatNights === 4 ? ["Mon", "Tue", "Thu", "Sat"] : []);
  const exfoliates = profile.exfoliation && profile.exfoliation !== "never";
  const exfoliationNights = exfoliates ? (sensitive || profile.exfoliation === "weekly" ? 1 : 2) : 0;
  const exfDays = DAYS.filter((d) => !treatDays.has(d)).slice(0, exfoliationNights);
  const weekly: WeeklyDay[] = DAYS.map((day) => ({
    day,
    pm: [
      "Cleanse",
      ...(treatDays.has(day) ? ["Treatment"] : []),
      ...(exfDays.includes(day) ? ["Exfoliate (your usual exfoliant)"] : []),
      "Moisturise",
    ],
  }));

  // ---- Notes ----
  const notes: string[] = [];
  const seasonNote: Record<Season, string> = {
    summer: "Summer: UV is at its highest, so sunscreen and reapplication matter most; lighter textures can feel more comfortable.",
    autumn: "Autumn: as the air dries out, watch for tightness and add a richer moisturiser at night if you need it.",
    winter: "Winter: cold, dry air can weaken your skin barrier; keep cleansing gentle and moisturise generously.",
    spring: "Spring: UV climbs quickly, so keep sunscreen daily even on cool days.",
  };
  notes.push(seasonNote[season]);
  if (profile.climate === "highveld_dry_winter" || profile.climate === "cold_dry") {
    notes.push("Your climate is dry: a humidifying mist or a thicker night cream can help on the driest days.");
  }
  if (profile.exfoliation === "daily") {
    notes.push("You said you exfoliate daily. Two or three times a week is usually enough; daily exfoliation can leave skin sensitive.");
  }
  if (profile.activesInUse.some((x) => x === "aha_exfoliant" || x === "bha_exfoliant") && treatNights > 0) {
    notes.push("Keep exfoliating acids and your treatment serum on different nights, as in the weekly plan.");
  }
  if (profile.cautionPregnancy) {
    notes.push("Because you told us you're pregnant, breastfeeding or trying to conceive, this routine leaves out retinoids and hydroquinone. Check any new product with your doctor or pharmacist.");
  }
  if (profile.mstTone && profile.mstTone >= 7 && (concern === "brightening" || concern === "acne")) {
    notes.push("For marks that linger on deeper skin tones, daily sunscreen is the biggest help; a tinted sunscreen can also protect against visible light.");
  }
  if (profile.avoid.length) {
    notes.push(`We left out products containing things you said you avoid (${profile.avoid.slice(0, 4).join(", ")}). Always check the full label.`);
  }
  if (shelf.size) notes.push("Steps marked 'from your shelf' use products you already own that we've reviewed.");
  notes.push("This routine is cosmetic guidance built from your answers, not medical advice. Stop any product that stings, burns or causes a rash.");

  return { engineVersion: SMART_ROUTINE_ENGINE_VERSION, source: "rule_based", season, am, pm, weekly, notes };
}

const REPORT_CATEGORY: Array<[RegExp, string]> = [
  [/cleans/i, "Cleanser"],
  [/sun|spf/i, "Sunscreen"],
  [/moistur|cream|barrier/i, "Moisturiser"],
  [/exfoli|aha|bha|acid/i, "Exfoliant"],
  [/serum|treatment|active|retin|vitamin|niacin|azela/i, "Serum"],
];

/**
 * Uses an APPROVED Advanced report's own AM/PM steps (the report only names
 * product types). Each step is matched to a reviewed product in the same
 * category, respecting the member's avoid list and pregnancy caution.
 */
export function fromReport(
  profile: MemberSkinProfile,
  routineAm: ReportRoutineStep[],
  routinePm: ReportRoutineStep[],
  options: { now?: Date; catalogue?: ProductReview[] } = {},
): SmartRoutine {
  const base = buildSmartRoutine(profile, options);
  const catalogue = options.catalogue ?? productReviews;
  const toSteps = (steps: ReportRoutineStep[], timeOfDay: TimeOfDay) =>
    steps.slice(0, 8).map((s) => {
      const category = REPORT_CATEGORY.find(([re]) => re.test(`${s.step} ${s.product_type}`))?.[1] ?? null;
      const product = category ? pickProduct({ category, profile }, catalogue) : null;
      return step(timeOfDay, s.step, s.product_type, product, s.guidance, "from your Advanced AI Dermatology Analysis report");
    });
  return { ...base, source: "advanced_report", am: toSteps(routineAm, "am"), pm: toSteps(routinePm, "pm") };
}

/** Every user-facing string, for the compliance test. */
export const routineStrings = (r: SmartRoutine) => [
  ...r.am.flatMap((s) => [s.step, s.productType, s.guidance, s.why]),
  ...r.pm.flatMap((s) => [s.step, s.productType, s.guidance, s.why]),
  ...r.weekly.flatMap((d) => d.pm),
  ...r.notes,
];
