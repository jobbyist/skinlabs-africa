/**
 * Predetermined "starter analysis" results for free-tier AI Formulator users.
 *
 * These are NOT live AI output — they're a curated 4×4 matrix (skin type ×
 * primary concern, both already derived from the quiz answers) written in
 * the same markdown-ish shape `formatRecommendation`/`splitRecommendation`
 * in AIFormulator.tsx expect, so the exact same rendering + advanced-section
 * gating (GatedOverlay) works for both this and the real `skincare-ai`
 * output. Keeps free-tier results genuinely useful (not a teaser fake-out)
 * while reserving the live, dermatology-grounded, weekly-refreshed report
 * for paying members — the honest upsell.
 */

export type FormulaSkinType = "oily" | "combination" | "normal" | "dry";
export type FormulaConcern = "acne" | "brightening" | "aging" | "sensitivity";

/** Maps quiz question q9's option value directly to a concern — no fuzzy guessing needed. */
export const CONCERN_BY_Q9_VALUE: Record<number, FormulaConcern> = {
  0: "acne",
  1: "brightening",
  2: "aging",
  3: "sensitivity",
};

const SKIN_PROFILE: Record<
  FormulaSkinType,
  { label: string; cleanser: string; moisturizer: string; texture: string; caution: string }
> = {
  oily: {
    label: "oily",
    cleanser: "a gel or foaming cleanser (skip anything creamy or oil-based)",
    moisturizer: "a lightweight, oil-free gel moisturizer — yes, you still need one, even if it feels counterintuitive",
    texture: "shine control and keeping pores clear without over-stripping your barrier",
    caution: "avoid heavy, occlusive balms and thick creams — they'll sit on top rather than sink in",
  },
  combination: {
    label: "combination",
    cleanser: "a gentle gel or low-foam cleanser that won't over-dry your cheeks while clearing your T-zone",
    moisturizer: "a lightweight lotion, applied a little heavier on the cheeks than the T-zone",
    texture: "balancing an oily T-zone against drier cheeks — most combination routines fail by treating the whole face the same",
    caution: "don't layer the same richness everywhere — zone your routine",
  },
  normal: {
    label: "normal/balanced",
    cleanser: "a gentle, hydrating cleanser — your skin doesn't need anything aggressive",
    moisturizer: "a lightweight lotion or cream, adjusted seasonally",
    texture: "maintaining what's already working and building in a little prevention",
    caution: "resist the urge to over-treat — a balanced routine done consistently beats a complicated one done sporadically",
  },
  dry: {
    label: "dry",
    cleanser: "a cream or hydrating cleanser with no sulfates — foaming cleansers will make dryness worse",
    moisturizer: "a rich, ceramide-based cream, layered over a hydrating serum while skin is still damp",
    texture: "rebuilding barrier function and locking in hydration in layers, not one heavy product",
    caution: "avoid alcohol-heavy toners and long hot showers/washes — both strip what little oil your skin retains",
  },
};

const CONCERN_PROFILE: Record<
  FormulaConcern,
  {
    label: string;
    amFocus: string;
    pmFocus: string;
    keyActives: string;
    weeklySchedule: string;
    productTypes: string;
    ingredientStrategy: string;
  }
> = {
  acne: {
    label: "acne & congestion control",
    amFocus: "a niacinamide serum to calm inflammation and regulate oil, then SPF — never skip this, most acne actives increase sun sensitivity",
    pmFocus: "your acne-targeting active on clean, fully dry skin, followed by your moisturizer",
    keyActives: "salicylic acid (BHA) 2%, and — if breakouts are frequent — a spot treatment with benzoyl peroxide",
    weeklySchedule:
      "Weeks 1–2: BHA 3x/week (Mon/Wed/Fri PM) to build tolerance. Week 3: increase to every other night if no irritation. Week 4+: nightly if skin tolerates it well, always followed by moisturizer to buffer.",
    productTypes: "gel cleanser with salicylic acid, oil-free niacinamide serum, lightweight gel moisturizer, mineral SPF (won't clog pores)",
    ingredientStrategy:
      "Salicylic acid gets into the pore itself to clear congestion; niacinamide reduces the redness and oil production that keep breakouts cycling. Avoid combining BHA with benzoyl peroxide in the same session — alternate them instead.",
  },
  brightening: {
    label: "fading dark marks & brightening",
    amFocus: "a vitamin C serum (antioxidant protection + gradual brightening), then SPF — brightening actives do nothing without daily sun protection, this is non-negotiable",
    pmFocus: "azelaic acid or alpha arbutin to fade existing marks without further irritating your skin",
    keyActives: "vitamin C (AM), azelaic acid or alpha arbutin (PM), niacinamide as a gentler daily option",
    weeklySchedule:
      "Weeks 1–2: azelaic acid every other night to build tolerance. Week 3+: nightly if no irritation. Vitamin C every morning from day one, always under SPF.",
    productTypes: "vitamin C serum (stored away from light/heat), azelaic acid 10% or alpha arbutin serum, broad-spectrum SPF 30+, gentle exfoliating toner (2–3x/week only)",
    ingredientStrategy:
      "Fading dark marks is slow — expect 8–12 weeks of consistent use before you see real change, and sun protection matters more than any single serum. Skipping SPF undoes the whole routine.",
  },
  aging: {
    label: "anti-aging (fine lines & firmness)",
    amFocus: "a vitamin C or peptide serum for antioxidant protection and collagen support, then SPF — the single highest-impact anti-aging step, full stop",
    pmFocus: "a retinoid, introduced slowly, on clean dry skin followed by a rich moisturizer to buffer",
    keyActives: "retinol/retinoid (PM), peptides, vitamin C (AM), a proper broad-spectrum SPF worn daily without exception",
    weeklySchedule:
      "Weeks 1–2: retinol 2x/week (e.g. Mon/Thu), pea-sized amount, always followed by moisturizer. Weeks 3–4: increase to 3x/week if no irritation. Month 2+: every other night, building toward nightly over 2–3 months.",
    productTypes: "peptide or vitamin C serum, an encapsulated/gentle retinol to start (0.25–0.3%), rich moisturizer with ceramides, SPF 30+ daily — reapplied if outdoors midday",
    ingredientStrategy:
      "Retinoids are the best-evidenced anti-aging ingredient available over the counter, but irritation from going too fast is the #1 reason people quit — 'slow and steady' outperforms 'strong and inconsistent' every time.",
  },
  sensitivity: {
    label: "soothing sensitivity & repairing your barrier",
    amFocus: "a fragrance-free, ceramide-rich moisturizer and mineral SPF — the priority right now is calming, not treating",
    pmFocus: "a barrier-repair cream with centella asiatica or panthenol — hold off on actives until your barrier has recovered",
    keyActives: "centella asiatica (cica), ceramides, panthenol, colloidal oatmeal — deliberately no exfoliating acids or retinoids for now",
    weeklySchedule:
      "Weeks 1–4: strip your routine back to cleanser, barrier-repair moisturizer and SPF only — no actives. From week 5, if skin feels calm and resilient, reintroduce ONE gentle active (start with a low-strength niacinamide) and wait 2 full weeks before considering a second.",
    productTypes: "fragrance-free cream cleanser, centella/ceramide barrier repair cream, mineral (zinc oxide) SPF, colloidal oatmeal mask for flare-ups",
    ingredientStrategy:
      "Sensitive, reactive skin usually means a compromised barrier — the fix is rebuilding it first, not layering on more active ingredients. Fewer products, applied consistently, beats a complicated routine every time here.",
  },
};

/**
 * Builds a full markdown-shaped recommendation for the given skin type +
 * primary concern — the free-tier "starter analysis" equivalent of the
 * live `skincare-ai` edge function's output. Deterministic: same inputs
 * always produce the same result.
 */
export const buildPredeterminedRecommendation = (skinType: FormulaSkinType, concern: FormulaConcern): string => {
  const skin = SKIN_PROFILE[skinType];
  const c = CONCERN_PROFILE[concern];

  return `## Your Skin Profile
Based on your answers, your skin reads as **${skin.label}**, with your main priority being **${c.label}**. This starter analysis focuses on ${skin.texture}.

## AM Routine
1. Cleanse with ${skin.cleanser}.
2. Treat: ${c.amFocus}.
3. Moisturize with ${skin.moisturizer}.
4. SPF — every single morning, rain or shine.

## PM Routine
1. Cleanse with ${skin.cleanser}.
2. Treat: ${c.pmFocus}.
3. Moisturize with ${skin.moisturizer}.

Note: ${skin.caution}.

## Weekly Actives Schedule
${c.weeklySchedule}

## Product-Type Recommendations
Look for: ${c.productTypes}.

## Ingredient Strategy
Key actives for your priority: ${c.keyActives}. ${c.ingredientStrategy}

---
This is your free Starter Analysis — a general match based on your quiz answers. SkinLabs Insider and VIP members get a live, dermatology-grounded AI report built specifically around your exact answers (and photo, if provided), re-analysed weekly as your skin changes.`;
};
