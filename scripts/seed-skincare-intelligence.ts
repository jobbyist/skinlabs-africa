/**
 * ETL: transforms SkinLabs' existing, already-published editorial product
 * data (src/data/reviews.ts) into normalized SQL seed statements for the
 * skincare intelligence schema (see supabase/SCHEMA.md).
 *
 * This does NOT invent any product, brand, ingredient, price or score data —
 * every row comes from content already live on skinlabs.co.za. Everything
 * imported this way is marked verification_status = 'unverified' with
 * source_type = 'internal_editorial': it reflects the editorial team's own
 * assessment, not an independently re-verified primary source, until a human
 * confirms it via the admin verification tab.
 *
 * Run with: bun run scripts/seed-skincare-intelligence.ts > supabase/migrations/<timestamp>_skincare_intelligence_seed.sql
 * (the file is committed, reviewed, then applied like any other migration —
 * this script does not touch the database itself.)
 */

import { productReviews, type ProductReview } from "../src/data/reviews.ts";

const esc = (s: string | null | undefined): string => {
  if (s === null || s === undefined) return "NULL";
  return `'${s.replace(/'/g, "''")}'`;
};
const num = (n: number | null | undefined): string => (n === null || n === undefined || Number.isNaN(n) ? "NULL" : String(n));
const bool = (b: boolean): string => (b ? "true" : "false");

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// ---------- Known, real lookup data (not fabricated — standard taxonomy already used elsewhere in the app, e.g. formulaResults.ts's concern set) ----------
const SKIN_TYPES: { slug: string; name: string }[] = [
  { slug: "oily", name: "Oily" },
  { slug: "dry", name: "Dry" },
  { slug: "combination", name: "Combination" },
  { slug: "normal", name: "Normal" },
  { slug: "sensitive", name: "Sensitive" },
  { slug: "mature", name: "Mature" },
  { slug: "acne-prone", name: "Acne-Prone" },
  { slug: "dehydrated", name: "Dehydrated" },
];

const SKIN_CONCERNS: { slug: string; name: string }[] = [
  { slug: "acne", name: "Acne & Congestion" },
  { slug: "hyperpigmentation", name: "Hyperpigmentation & Dark Marks" },
  { slug: "aging", name: "Fine Lines & Aging" },
  { slug: "sensitivity-barrier", name: "Sensitivity & Barrier Damage" },
  { slug: "dehydration", name: "Dehydration" },
  { slug: "dullness", name: "Dullness" },
  { slug: "texture-scarring", name: "Texture & Scarring" },
];

// Mirrors the retailer list already used in src/data/reviews.ts's local retailerUrls map.
const RETAILERS: { slug: string; name: string; url: string }[] = [
  { slug: "clicks", name: "Clicks", url: "https://clicks.co.za/" },
  { slug: "dis-chem", name: "Dis-Chem", url: "https://www.dischem.co.za/" },
  { slug: "takealot", name: "Takealot", url: "https://www.takealot.com/" },
  { slug: "brand-direct", name: "Brand Direct", url: "" },
  { slug: "dermastore", name: "Dermastore", url: "https://www.dermastore.co.za/" },
  { slug: "faithful-to-nature", name: "Faithful to Nature", url: "https://www.faithful-to-nature.co.za/" },
  { slug: "superbalist", name: "Superbalist", url: "https://www.superbalist.com/" },
  { slug: "skinmiles", name: "SkinMiles", url: "https://www.skinmiles.co.za/" },
  { slug: "beautyontapp", name: "BeautyOnTapp", url: "https://www.beautyontapp.co.za/" },
  { slug: "wellness-warehouse", name: "Wellness Warehouse", url: "https://www.wellnesswarehouse.com/" },
  { slug: "retailbox", name: "Retailbox", url: "https://www.retailbox.co.za/" },
  { slug: "edgars", name: "Edgars", url: "https://www.edgars.co.za/" },
];

// skin_type_match strings from reviews.ts -> curated skin_type / concern slugs.
// Anything not in this map is intentionally skipped and logged (see UNMAPPED
// below) rather than force-fit — we do not invent a taxonomy match.
const SKIN_TYPE_MATCH_MAP: Record<string, { kind: "type" | "concern"; slug: string }[]> = {
  "Oily": [{ kind: "type", slug: "oily" }],
  "Dry": [{ kind: "type", slug: "dry" }],
  "Combination": [{ kind: "type", slug: "combination" }],
  "Normal": [{ kind: "type", slug: "normal" }],
  "Sensitive": [{ kind: "type", slug: "sensitive" }],
  "Mature": [{ kind: "type", slug: "mature" }],
  "Acne-prone": [{ kind: "type", slug: "acne-prone" }],
  "Dehydrated": [{ kind: "type", slug: "dehydrated" }],
  "Very Dry": [{ kind: "type", slug: "dry" }],
  "Very Dry Body": [{ kind: "type", slug: "dry" }],
  "Dry Body": [{ kind: "type", slug: "dry" }],
  "Normal-Resilient": [{ kind: "type", slug: "normal" }],
  "Sensitive-Mature": [{ kind: "type", slug: "sensitive" }, { kind: "type", slug: "mature" }],
  "Congested": [{ kind: "concern", slug: "acne" }],
  "Pigmentation": [{ kind: "concern", slug: "hyperpigmentation" }],
  "Pigmented": [{ kind: "concern", slug: "hyperpigmentation" }],
  "Dark Marks": [{ kind: "concern", slug: "hyperpigmentation" }],
  "Melasma": [{ kind: "concern", slug: "hyperpigmentation" }],
  "Uneven": [{ kind: "concern", slug: "hyperpigmentation" }],
  "Scars": [{ kind: "concern", slug: "texture-scarring" }],
  "Scarred": [{ kind: "concern", slug: "texture-scarring" }],
  "Stretch Marks": [{ kind: "concern", slug: "texture-scarring" }],
  "Eczema": [{ kind: "concern", slug: "sensitivity-barrier" }],
  "Eczema-prone": [{ kind: "concern", slug: "sensitivity-barrier" }],
  "Compromised": [{ kind: "concern", slug: "sensitivity-barrier" }],
  "Irritated": [{ kind: "concern", slug: "sensitivity-barrier" }],
  "Reactive": [{ kind: "concern", slug: "sensitivity-barrier" }],
  "Dull": [{ kind: "concern", slug: "dullness" }],
  "Sun-damaged": [{ kind: "concern", slug: "aging" }],
  "Photo-exposed": [{ kind: "concern", slug: "aging" }],
};
// "All", "Baby-Safe", "Pregnancy-Safe", "Deep Tones", "Resilient",
// "All Except Very Oily" are deliberately left unmapped (see script output).

const CATEGORY_NAMES = ["Body", "Cleanser", "Exfoliant", "Eye Cream", "Mist", "Moisturiser", "Serum", "Sunscreen"];

// ---------- Ingredient string parsing ----------
// "Niacinamide 10%" -> { name: "Niacinamide", pct: 10 }
// "Argireline (Acetyl Hexapeptide-8)" -> { commonName: "Argireline", inciName: "Acetyl Hexapeptide-8" }
// Anything else -> inciName = commonName = the string as given.
interface ParsedIngredient {
  inciName: string;
  commonName: string | null;
  concentrationPercent: number | null;
}
const parseIngredient = (raw: string): ParsedIngredient => {
  let s = raw.trim();
  let concentrationPercent: number | null = null;
  const pctMatch = s.match(/^(.*?)\s+(\d+(?:\.\d+)?)%$/);
  if (pctMatch) {
    s = pctMatch[1].trim();
    concentrationPercent = Number(pctMatch[2]);
  }
  const parenMatch = s.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    return { commonName: parenMatch[1].trim(), inciName: parenMatch[2].trim(), concentrationPercent };
  }
  return { commonName: null, inciName: s, concentrationPercent };
};

// ---------- Build normalized maps from the source data ----------
const brandSlugs = new Map<string, string>(); // name -> slug
const ingredientMap = new Map<string, { inciName: string; commonName: string | null }>(); // key: lower(inciName)
const unmappedSkinTerms = new Set<string>();

for (const p of productReviews as ProductReview[]) {
  if (!brandSlugs.has(p.brand)) brandSlugs.set(p.brand, slugify(p.brand));
  for (const raw of p.key_ingredients) {
    const parsed = parseIngredient(raw);
    const key = parsed.inciName.toLowerCase();
    if (!ingredientMap.has(key)) ingredientMap.set(key, { inciName: parsed.inciName, commonName: parsed.commonName });
  }
  for (const term of p.skin_type_match) {
    if (!SKIN_TYPE_MATCH_MAP[term]) unmappedSkinTerms.add(term);
  }
}

// ---------- Emit SQL ----------
const out: string[] = [];
out.push(`-- Generated by scripts/seed-skincare-intelligence.ts — do not hand-edit the data rows below.`);
out.push(`-- Source: src/data/reviews.ts (${productReviews.length} products, ${brandSlugs.size} brands, ${ingredientMap.size} distinct ingredient strings), as published on skinlabs.co.za.`);
out.push(`-- All rows are inserted verification_status = 'unverified', source_type = 'internal_editorial'.`);
out.push("");

out.push("-- ---------- Lookups ----------");
for (const c of CATEGORY_NAMES) {
  out.push(`INSERT INTO public.categories (slug, name) VALUES (${esc(slugify(c))}, ${esc(c)}) ON CONFLICT (slug) DO NOTHING;`);
}
for (const st of SKIN_TYPES) {
  out.push(`INSERT INTO public.skin_types (slug, name) VALUES (${esc(st.slug)}, ${esc(st.name)}) ON CONFLICT (slug) DO NOTHING;`);
}
for (const sc of SKIN_CONCERNS) {
  out.push(`INSERT INTO public.skin_concerns (slug, name) VALUES (${esc(sc.slug)}, ${esc(sc.name)}) ON CONFLICT (slug) DO NOTHING;`);
}
for (const r of RETAILERS) {
  out.push(`INSERT INTO public.retailers (slug, name, website_url) VALUES (${esc(r.slug)}, ${esc(r.name)}, ${r.url ? esc(r.url) : "NULL"}) ON CONFLICT (slug) DO NOTHING;`);
}
out.push("");

out.push("-- ---------- Brands ----------");
for (const [name, slug] of brandSlugs) {
  out.push(
    `INSERT INTO public.brands (slug, name, source_type, verification_status) VALUES (${esc(slug)}, ${esc(name)}, 'internal_editorial', 'unverified') ON CONFLICT (slug) DO NOTHING;`,
  );
}
out.push("");

out.push("-- ---------- Ingredients ----------");
for (const { inciName, commonName } of ingredientMap.values()) {
  out.push(
    `INSERT INTO public.ingredients (slug, inci_name, common_name, source_type, verification_status) VALUES (${esc(slugify(inciName))}, ${esc(inciName)}, ${esc(commonName)}, 'internal_editorial', 'unverified') ON CONFLICT ((lower(inci_name))) DO NOTHING;`,
  );
}
out.push("");

out.push("-- ---------- Products, versions, ingredients, skin-type fit, concerns, scores, variants, retailer listings, prices ----------");
for (const p of productReviews as ProductReview[]) {
  const slug = p.id;
  const brandSlug = brandSlugs.get(p.brand)!;
  out.push(`
DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT ${esc(slug)}, b.id, c.id, ${esc(p.product_name)}, 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = ${esc(brandSlug)} AND c.slug = ${esc(slugify(p.category))}
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = ${esc(slug)};
  END IF;

  INSERT INTO public.product_versions (product_id, version_label, is_current, source_type, verification_status)
  VALUES (v_product_id, 'Initial import', true, 'internal_editorial', 'unverified')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_version_id;

  IF v_version_id IS NULL THEN
    SELECT id INTO v_version_id FROM public.product_versions WHERE product_id = v_product_id AND is_current LIMIT 1;
  END IF;

  INSERT INTO public.product_variants (product_id, variant_label, is_default)
  VALUES (v_product_id, 'Standard', true)
  ON CONFLICT (product_id, variant_label) DO NOTHING
  RETURNING id INTO v_variant_id;

  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id FROM public.product_variants WHERE product_id = v_product_id AND variant_label = 'Standard';
  END IF;
${p.key_ingredients
  .map((raw) => {
    const parsed = parseIngredient(raw);
    const isKey = "true"; // reviews.ts's key_ingredients list is already the "highlighted" subset
    return `  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, ${num(parsed.concentrationPercent)}, ${isKey}, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = ${esc(parsed.inciName.toLowerCase())}
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;`;
  })
  .join("\n")}
${p.skin_type_match
  .flatMap((term) => SKIN_TYPE_MATCH_MAP[term] ?? [])
  .filter((v, i, arr) => arr.findIndex((x) => x.kind === v.kind && x.slug === v.slug) === i)
  .map((m) =>
    m.kind === "type"
      ? `  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = ${esc(m.slug)}
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;`
      : `  INSERT INTO public.product_concerns (product_id, concern_id)
  SELECT v_product_id, sc.id FROM public.skin_concerns sc WHERE sc.slug = ${esc(m.slug)}
  ON CONFLICT (product_id, concern_id) DO NOTHING;`,
  )
  .join("\n")}
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', ${num(p.score_efficacy)}, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', ${num(p.score_value)}, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', ${num(p.score_texture)}, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', ${num(p.score_climate)}, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, ${esc(slug)}, ${esc(p.verdict)}, 'published', now())
  ON CONFLICT (slug) DO NOTHING;
${p.retailers
  .map(
    (r) => `
  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, ${esc(r.url)}, ${bool(r.in_stock)}, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = ${esc(slugify(r.retailer))}
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = ${esc(slugify(r.retailer))};
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, ${num(r.price_zar)}, 'internal_editorial', 'unverified');`,
  )
  .join("\n")}
END $product$;`);
}

console.log(out.join("\n"));
console.error(`\n-- Unmapped skin_type_match terms (skipped, not fabricated): ${[...unmappedSkinTerms].sort().join(", ")}`);
console.error(`-- ${productReviews.length} products, ${brandSlugs.size} brands, ${ingredientMap.size} distinct ingredients emitted.`);
