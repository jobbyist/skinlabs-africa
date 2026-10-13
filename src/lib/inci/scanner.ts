/**
 * Full-product INCI scanner (/ingredients/checker). Pure parts: parsing a pasted list, matching a member's stated
 * allergies, grouping routine conflicts and Monk Skin Tone (MST) considerations. Network resolution lives in resolve.ts.
 *
 * Honest limits: an ingredient we can't match to our catalogue is listed as "not in our catalogue", never as safe; allergy matching is
 * textual (profiles.allergies is free text); MST is only ever the member's own self-reported value, never inferred.
 */
export const MAX_TOKENS = 120;

export interface ParsedInci {
  items: string[];
  truncated: boolean;
}

const SPLIT_OUTSIDE_PARENS = (text: string): string[] => {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of text) {
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if (depth === 0 && /[,;•·\n\r|]/.test(ch)) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
};

export const parseInci = (raw: string): ParsedInci => {
  // Drop a leading "Ingredients:" and anything after "may contain" / "+/-" (colour variants), which isn't part of this formula.
  const text = raw
    .replace(/\u00a0/g, " ")
    .replace(/^\s*(?:full\s+)?ingredients?\s*(?:list)?\s*[:\-–]\s*/i, "")
    .split(/\b(?:may contain|\+\/-)\b|±/i)[0];
  const seen = new Set<string>();
  const items: string[] = [];
  for (const piece of SPLIT_OUTSIDE_PARENS(text)) {
    const token = piece.replace(/[*†‡]+/g, "").replace(/\s+/g, " ").replace(/^[\s.\-–]+|[\s.\-–]+$/g, "").slice(0, 80);
    if (token.length < 2 || /^\d+$/.test(token)) continue;
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(token);
  }
  return { items: items.slice(0, MAX_TOKENS), truncated: items.length > MAX_TOKENS };
};

/** Words a member might write in `profiles.allergies` mapped to the label-speak that means the same thing. */
export const ALLERGY_ALIASES: Record<string, string[]> = {
  fragrance: ["parfum", "fragrance", "perfume", "linalool", "limonene", "citronellol", "geraniol", "eugenol", "coumarin", "citral", "hexyl cinnamal", "benzyl salicylate", "farnesol"],
  perfume: ["parfum", "fragrance", "perfume", "linalool", "limonene", "citronellol", "geraniol"],
  nut: ["prunus amygdalus", "almond", "macadamia", "corylus", "hazelnut", "juglans", "walnut", "pistachio", "cashew", "anacardium"],
  nuts: ["prunus amygdalus", "almond", "macadamia", "corylus", "hazelnut", "juglans", "walnut", "pistachio", "cashew", "anacardium"],
  "nut oils": ["prunus amygdalus", "almond", "macadamia", "corylus", "hazelnut", "juglans", "walnut", "argania"],
  paraben: ["methylparaben", "ethylparaben", "propylparaben", "butylparaben", "isobutylparaben"],
  parabens: ["methylparaben", "ethylparaben", "propylparaben", "butylparaben", "isobutylparaben"],
  sulphate: ["sodium lauryl sulfate", "sodium laureth sulfate", "ammonium lauryl sulfate", "sulfate"],
  sulfate: ["sodium lauryl sulfate", "sodium laureth sulfate", "ammonium lauryl sulfate", "sulfate"],
  sulphates: ["sodium lauryl sulfate", "sodium laureth sulfate", "ammonium lauryl sulfate", "sulfate"],
  sulfates: ["sodium lauryl sulfate", "sodium laureth sulfate", "ammonium lauryl sulfate", "sulfate"],
  "essential oil": ["essential oil", "lavandula", "citrus", "mentha", "melaleuca", "eucalyptus", "rosmarinus", "cymbopogon", "pelargonium", "oil"],
  "essential oils": ["essential oil", "lavandula", "citrus", "mentha", "melaleuca", "eucalyptus", "rosmarinus", "cymbopogon", "pelargonium"],
  alcohol: ["alcohol denat", "sd alcohol", "ethanol", "isopropyl alcohol"],
  lanolin: ["lanolin", "adeps lanae"],
  soy: ["glycine soja", "soy"],
  latex: ["latex"],
};

const lc = (s: string) => s.trim().toLowerCase();

export interface AllergyHit {
  ingredient: string;
  term: string;
}

/** A hit needs a 3+ character allergy term and a textual match on the label name, via the alias table where one exists. */
export const matchAllergies = (ingredients: string[], allergies: string[]): AllergyHit[] => {
  const hits: AllergyHit[] = [];
  for (const rawTerm of allergies) {
    const term = lc(rawTerm);
    if (term.length < 3) continue;
    const needles = new Set<string>([term, ...(ALLERGY_ALIASES[term] ?? [])]);
    for (const ing of ingredients) {
      const name = lc(ing);
      const hit = [...needles].some((n) => (n === "oil" ? /\bessential\b.*\boil\b/.test(name) : name.includes(n) || (name.length >= 4 && n.includes(name))));
      if (hit) hits.push({ ingredient: ing, term: rawTerm.trim() });
    }
  }
  const seen = new Set<string>();
  return hits.filter((h) => (seen.has(`${h.ingredient}|${h.term}`) ? false : (seen.add(`${h.ingredient}|${h.term}`), true)));
};

export interface ScannedIngredient {
  token: string;
  /** Resolved catalogue row, or null when we couldn't match it with confidence. */
  match: { id: string; slug: string; name: string; category: string | null; irritancy: "low" | "moderate" | "high" | null } | null;
}

export type InteractionType = "avoid_combining" | "requires_spacing" | "enhances" | "buffers" | "compatible" | string;

export interface RoutineSource {
  /** Routine step names (and slot) this ingredient comes from. */
  steps: { name: string; slot: "am" | "pm" | "both" }[];
}

export interface RawConflict {
  ingredientAId: string;
  ingredientBId: string;
  type: InteractionType;
  explanation: string | null;
  guidance: string | null;
}

export interface ConflictFinding {
  type: InteractionType;
  scope: "within_product" | "with_routine";
  scanned: string;
  other: string;
  /** Routine step(s) the other ingredient is in, for with_routine. */
  routine: RoutineSource["steps"];
  explanation: string | null;
  guidance: string | null;
}

const CAUTION_TYPES = new Set(["avoid_combining", "requires_spacing"]);
export const isCaution = (type: InteractionType) => CAUTION_TYPES.has(type);

/** Keeps pairs that involve at least one scanned ingredient; labels each as inside the product or against the routine. */
export const groupConflicts = (
  raw: RawConflict[],
  scanned: Map<string, string>,
  routine: Map<string, { name: string; source: RoutineSource }>,
): ConflictFinding[] => {
  const out: ConflictFinding[] = [];
  for (const c of raw) {
    const aScan = scanned.get(c.ingredientAId);
    const bScan = scanned.get(c.ingredientBId);
    if (aScan && bScan) {
      out.push({ type: c.type, scope: "within_product", scanned: aScan, other: bScan, routine: [], explanation: c.explanation, guidance: c.guidance });
    } else if (aScan || bScan) {
      const otherId = aScan ? c.ingredientBId : c.ingredientAId;
      const other = routine.get(otherId);
      if (!other) continue;
      out.push({ type: c.type, scope: "with_routine", scanned: (aScan ?? bScan) as string, other: other.name, routine: other.source.steps, explanation: c.explanation, guidance: c.guidance });
    }
  }
  const order = (t: InteractionType) => (t === "avoid_combining" ? 0 : t === "requires_spacing" ? 1 : 2);
  return out.sort((a, b) => order(a.type) - order(b.type));
};

const PIH_CATEGORIES = new Set(["retinoid", "exfoliant-aha", "exfoliant-bha"]);
const PIH_KEYWORDS = /\b(parfum|fragrance|limonene|linalool|citral|geraniol|eugenol|essential oil|alcohol denat|sd alcohol|menthol|peppermint|camphor|benzoyl peroxide|sodium lauryl sulfate)\b/i;

export interface MstConsideration {
  ingredient: string;
  reason: string;
}

export interface MstReport {
  tone: number;
  considerations: MstConsideration[];
  general: string;
}

/**
 * Considerations for a member who SELF-REPORTED a Monk Skin Tone of 4 or deeper (never inferred). Irritation can leave
 * marks that linger longer on deeper tones, so the ingredients most often linked to irritation are named. Cosmetic guidance only.
 */
export const mstConsiderations = (tone: number | null | undefined, items: ScannedIngredient[]): MstReport | null => {
  if (!tone || tone < 4 || tone > 10) return null;
  const considerations: MstConsideration[] = [];
  for (const it of items) {
    const name = it.match?.name ?? it.token;
    if (it.match?.category && PIH_CATEGORIES.has(it.match.category)) {
      considerations.push({ ingredient: name, reason: `${categoryLabel(it.match.category)}: effective but can irritate, and irritation can leave marks that fade slowly on deeper skin tones.` });
    } else if (PIH_KEYWORDS.test(it.token) || (it.match?.irritancy === "high")) {
      considerations.push({ ingredient: name, reason: "Commonly linked to irritation or sensitivity, which can trigger lingering dark marks (post-inflammatory hyperpigmentation)." });
    }
  }
  return {
    tone,
    considerations,
    general: "Introduce new products one at a time, patch test behind the ear or on the inner arm first, and pair them with daily broad-spectrum SPF. If a product stings or reddens skin, stop using it.",
  };
};

const categoryLabel = (c: string) => (c === "retinoid" ? "Retinoid" : c === "exfoliant-aha" ? "AHA exfoliant" : "BHA exfoliant");

/** Higher-irritancy ingredients in the list, from our catalogue (general guidance, shown to everyone). */
export const higherIrritancy = (items: ScannedIngredient[]): ScannedIngredient[] => items.filter((i) => i.match?.irritancy === "high");
