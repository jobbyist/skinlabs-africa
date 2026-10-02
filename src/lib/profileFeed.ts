/**
 * "For your profile" ranking. Pure and explainable: every item carries the
 * reason it was picked, drawn only from what the member told SKYNN AI.
 */
import type { MemberSkinProfile } from "@/lib/skynn/memberSkinProfile";
import type { ProductReview } from "@/data/reviews";

export interface FeedSignal { label: string; terms: string[] }

const CONCERN_TERMS: Record<string, FeedSignal> = {
  acne: { label: "breakouts", terms: ["acne", "breakout", "blemish", "salicylic", "pore", "oil control"] },
  breakouts_acne: { label: "breakouts", terms: ["acne", "breakout", "blemish", "salicylic", "pore"] },
  brightening: { label: "uneven tone", terms: ["pigment", "melasma", "dark spot", "brighten", "vitamin c", "niacinamide", "pih", "tranexamic"] },
  uneven_tone_pigmentation: { label: "pigmentation", terms: ["pigment", "melasma", "dark spot", "pih", "tranexamic", "azelaic"] },
  dullness: { label: "dullness", terms: ["dull", "glow", "radian", "exfoli"] },
  scarring_marks: { label: "marks", terms: ["scar", "mark", "pih", "keloid"] },
  aging: { label: "fine lines", terms: ["retin", "ageing", "aging", "wrinkle", "collagen", "peptide"] },
  fine_lines_aging: { label: "fine lines", terms: ["retin", "ageing", "aging", "wrinkle", "collagen", "peptide"] },
  sensitivity: { label: "sensitivity", terms: ["sensitiv", "barrier", "redness", "fragrance", "ceramide", "calm"] },
  redness_sensitivity: { label: "redness", terms: ["sensitiv", "barrier", "redness", "ceramide", "calm"] },
  dryness_dehydration: { label: "dryness", terms: ["dry", "dehydrat", "hyaluronic", "barrier", "winter"] },
};

const SKIN_TYPE_TERMS: Record<string, string[]> = {
  oily: ["oily", "oil control", "humid", "mattif"],
  dry: ["dry", "winter", "barrier", "hard water"],
  combination: ["combination", "t-zone"],
  normal: [],
};

export function profileSignals(p: MemberSkinProfile): FeedSignal[] {
  const out: FeedSignal[] = [];
  const seen = new Set<string>();
  for (const c of [p.primaryConcern, ...p.concerns]) {
    const s = c ? CONCERN_TERMS[c] : undefined;
    if (s && !seen.has(s.label)) { seen.add(s.label); out.push(s); }
  }
  if (p.skinType && SKIN_TYPE_TERMS[p.skinType]?.length) out.push({ label: `${p.skinType} skin`, terms: SKIN_TYPE_TERMS[p.skinType] });
  if (p.sunExposure && /high|outdoor|often/i.test(p.sunExposure)) out.push({ label: "time in the sun", terms: ["spf", "sunscreen", "uv"] });
  return out;
}

export interface Scored<T> { item: T; score: number; reason: string }

function score(text: string, signals: FeedSignal[]) {
  const t = text.toLowerCase();
  let total = 0; const hits: string[] = [];
  for (const s of signals) {
    const n = s.terms.filter((term) => t.includes(term)).length;
    if (n) { total += n; hits.push(s.label); }
  }
  return { total, hits };
}

export function rankItems<T>(items: T[], toText: (x: T) => string, signals: FeedSignal[], limit: number): Scored<T>[] {
  return items
    .map((item) => { const { total, hits } = score(toText(item), signals); return { item, score: total, reason: hits.slice(0, 2).join(" and ") }; })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function rankReviews(reviews: ProductReview[], p: MemberSkinProfile, signals: FeedSignal[], limit = 3) {
  const avoid = p.avoid.map((a) => a.toLowerCase()).filter(Boolean);
  const pool = reviews.filter((r) => {
    if (p.skinType && r.skin_type_match.length && !r.skin_type_match.some((s) => s.toLowerCase().includes(p.skinType!) || /all/i.test(s))) return false;
    const ing = r.key_ingredients.join(" ").toLowerCase();
    return !avoid.some((a) => ing.includes(a));
  });
  return rankItems(pool, (r) => `${r.product_name} ${r.category} ${r.verdict} ${r.key_ingredients.join(" ")}`, signals, limit);
}
