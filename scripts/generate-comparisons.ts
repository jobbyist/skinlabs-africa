// Generates src/data/comparisons-part5.ts: head-to-head Shelf Showdowns built
// ONLY from fields already published in src/data/reviews.ts (scores, price,
// key ingredients, skin-type match, verdict, retailers). Nothing is invented:
// every sentence is derived from those values, sponsored reviews are excluded,
// and a pair is only written when both products share a real key ingredient
// and differ meaningfully in price (the Shelf Showdown pairing rule).
//   bun run scripts/generate-comparisons.ts [count=30] > src/data/comparisons-part5.ts
import { productReviews, overallScore, type ProductReview } from "../src/data/reviews";
import { comparisonArticlesPart1 } from "../src/data/comparisons-part1";
import { comparisonArticlesPart2 } from "../src/data/comparisons-part2";
import { comparisonArticlesPart3 } from "../src/data/comparisons-part3";
import { comparisonArticlesPart4 } from "../src/data/comparisons-part4";

// Hand-written showdowns only (parts 1-4); part 5 is this script's own output.
const comparisonArticles = [...comparisonArticlesPart1, ...comparisonArticlesPart2, ...comparisonArticlesPart3, ...comparisonArticlesPart4];

const COUNT = Number(process.argv[2] ?? 30);
const PUBLISH = process.argv[3] ?? "2026-10-03";
const CATEGORIES = ["Serum", "Moisturiser", "Cleanser", "Sunscreen", "Body"];
const CATEGORY_LABEL: Record<string, string> = {
  Serum: "Serums", Moisturiser: "Moisturisers", Cleanser: "Cleansers", Sunscreen: "Sun Protection", Body: "Body Care",
};
const THEMES: Array<[RegExp, string]> = [
  [/niacinamide/i, "niacinamide"], [/retinol|retinal|retinoid/i, "retinoid"], [/vitamin c|ascorbic/i, "vitamin C"],
  [/hyaluron/i, "hyaluronic acid"], [/ceramide/i, "ceramides"], [/salicylic/i, "salicylic acid"],
  [/zinc oxide|spf/i, "sun filters"], [/squalane/i, "squalane"], [/panthenol/i, "panthenol"],
  [/peptide|argireline/i, "peptides"], [/glycolic|lactic|aha|mandelic/i, "exfoliating acids"], [/centella/i, "centella"],
  [/shea/i, "shea butter"], [/urea/i, "urea"], [/arbutin|kojic|tranexamic/i, "brightening actives"],
];
const themesOf = (r: ProductReview) => new Set(THEMES.filter(([re]) => r.key_ingredients.some((i) => re.test(i))).map(([, t]) => t));

const existing = new Set(comparisonArticles.flatMap((a) => a.productsCompared.map((p) => p.reviewSlug).filter(Boolean) as string[]));
const existingPairs = new Set(comparisonArticles.map((a) => a.productsCompared.map((p) => p.reviewSlug ?? "").sort().join("::")));

// Real brand sites already used in published showdowns (never guessed for others).
const brandUrl = new Map<string, string>();
for (const a of comparisonArticles) for (const p of a.productsCompared) if (p.officialBrandUrl) brandUrl.set(p.brand, p.officialBrandUrl);
// Credited photos already used on published showdowns, by product category.
const reviewById = new Map(productReviews.map((r) => [r.id, r]));
const photos = new Map<string, ProductReview["id"] extends string ? (typeof comparisonArticles)[number]["thumbnail"][] : never>();
for (const a of comparisonArticles) {
  const first = a.productsCompared.map((p) => (p.reviewSlug ? reviewById.get(p.reviewSlug) : undefined)).find(Boolean);
  if (!first) continue;
  photos.set(first.category, [...(photos.get(first.category) ?? []), a.thumbnail]);
}

const pool = productReviews.filter((r) => !r.is_sponsored && CATEGORIES.includes(r.category) && r.key_ingredients.length >= 2 && r.retailers?.length);
type Pair = { a: ProductReview; b: ProductReview; theme: string; gap: number };
const pairs: Pair[] = [];
for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) {
  const [x, y] = [pool[i], pool[j]];
  if (x.category !== y.category || x.brand === y.brand) continue;
  if (existingPairs.has([x.id, y.id].sort().join("::"))) continue;
  const lo = Math.min(x.local_price_zar, y.local_price_zar), hi = Math.max(x.local_price_zar, y.local_price_zar);
  if (lo <= 0 || hi / lo < 1.2) continue;
  const shared = [...themesOf(x)].filter((t) => themesOf(y).has(t));
  if (!shared.length) continue;
  if (!x.skin_type_match.some((s) => y.skin_type_match.includes(s))) continue;
  pairs.push({ a: x, b: y, theme: shared[0], gap: hi / lo });
}
// Prefer products SkinLabs already featured less, then bigger price gaps; each product at most twice, each brand pair once.
const used = new Map<string, number>();
const brandPairs = new Set<string>();
const perTheme = new Map<string, number>();
const chosen: Pair[] = [];
pairs.sort((p, q) => (existing.has(p.a.id) ? 1 : 0) + (existing.has(p.b.id) ? 1 : 0) - ((existing.has(q.a.id) ? 1 : 0) + (existing.has(q.b.id) ? 1 : 0)) || q.gap - p.gap || p.a.id.localeCompare(q.a.id));
for (const p of pairs) {
  if (chosen.length >= COUNT) break;
  const bp = [p.a.brand, p.b.brand].sort().join("::");
  if ((used.get(p.a.id) ?? 0) >= 3 || (used.get(p.b.id) ?? 0) >= 3 || brandPairs.has(bp) || (perTheme.get(p.theme) ?? 0) >= 8) continue;
  chosen.push(p);
  used.set(p.a.id, (used.get(p.a.id) ?? 0) + 1); used.set(p.b.id, (used.get(p.b.id) ?? 0) + 1); brandPairs.add(bp); perTheme.set(p.theme, (perTheme.get(p.theme) ?? 0) + 1);
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const lower = (s: string) => s.toLowerCase();
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
/** "Brand Product" without repeating the brand when the product name already starts with it. */
const full = (r: ProductReview) => (r.product_name.toLowerCase().startsWith(r.brand.toLowerCase()) ? r.product_name : `${r.brand} ${r.product_name}`);
const DIMS: Array<[keyof ProductReview, string, string]> = [
  ["score_efficacy", "efficacy", "Better efficacy score"], ["score_value", "value", "Better value score"],
  ["score_texture", "texture", "Better texture score"], ["score_climate", "SA climate fit", "Better SA climate fit"],
];
const sc = (r: ProductReview, k: keyof ProductReview) => Number(r[k]);
const f1 = (n: number) => n.toFixed(1);

const articles = chosen.map(({ a, b, theme, gap }, idx) => {
  const [cheap, dear] = a.local_price_zar <= b.local_price_zar ? [a, b] : [b, a];
  const title = `${a.brand} vs ${b.brand}: ${a.category} Showdown for ${titleCase(theme)}`;
  const shortTitle = `${a.brand} vs ${b.brand} ${a.category}`;
  const slug = `${slugify(a.brand)}-vs-${slugify(b.brand)}-${slugify(a.category)}-${slugify(theme)}`;
  const skinShared = a.skin_type_match.filter((s) => b.skin_type_match.includes(s));
  const onlyA = a.skin_type_match.filter((s) => !b.skin_type_match.includes(s));
  const onlyB = b.skin_type_match.filter((s) => !a.skin_type_match.includes(s));
  const edges = DIMS.map(([k, label, vlabel]) => ({ label, vlabel, da: sc(a, k) - sc(b, k), ra: sc(a, k), rb: sc(b, k) }));
    const ratio = (gap).toFixed(1);
  const pct = (r: ProductReview) => overallScore(r);

  const edgeSentence = (e: (typeof edges)[number]) =>
    Math.abs(e.da) < 0.4
      ? `On ${e.label} they're effectively level (${f1(e.ra)} vs ${f1(e.rb)}).`
      : `${e.da > 0 ? a.brand : b.brand} scores higher on ${e.label} (${f1(e.da > 0 ? e.ra : e.rb)} vs ${f1(e.da > 0 ? e.rb : e.ra)}).`;

  const body = `## Two ${lower(a.category)}s built around ${theme}

[${full(a)}](/reviews/${a.id}) and [${full(b)}](/reviews/${b.id}) are the kind of pair a South African shopper really does weigh up: both lean on ${theme}, they suit overlapping skin types, and one costs about ${ratio}× the other (R${cheap.local_price_zar} for ${cheap.brand}, R${dear.local_price_zar} for ${dear.brand}). That price gap is the question this showdown answers: what you get, and don't get, for the extra money.

## What's in each

| | ${esc(full(a))} | ${esc(full(b))} |
|---|---|---|
| Key ingredients | ${esc(a.key_ingredients.join(", "))} | ${esc(b.key_ingredients.join(", "))} |
| Indicative price | R${a.local_price_zar} | R${b.local_price_zar} |
| Suits | ${esc(a.skin_type_match.join(", "))} | ${esc(b.skin_type_match.join(", "))} |
| SkinLabs overall score | ${f1(pct(a))}/10 | ${f1(pct(b))}/10 |

Both formulas list ${theme}-related ingredients among their key actives (${esc(a.key_ingredients.join(", "))} for ${a.brand}; ${esc(b.key_ingredients.join(", "))} for ${b.brand}), so the real differences come from the rest of each formula and from how it behaves on skin.

## How the SkinLabs scores compare

We score every product on four things, independently: efficacy, value, texture and fit for South African conditions. Here's how this pair lines up:

| Score (out of 10) | ${a.brand} | ${b.brand} |
|---|---|---|
| Efficacy | ${f1(a.score_efficacy)} | ${f1(b.score_efficacy)} |
| Value | ${f1(a.score_value)} | ${f1(b.score_value)} |
| Texture | ${f1(a.score_texture)} | ${f1(b.score_texture)} |
| SA climate fit | ${f1(a.score_climate)} | ${f1(b.score_climate)} |

${edges.map(edgeSentence).join(" ")} These scores reflect SkinLabs' editorial assessment of publicly available ingredient and pricing information, not laboratory or clinical testing.

## Who each one suits

${skinShared.length ? `Both list ${lower(list(skinShared))} skin as a match. ` : ""}${onlyA.length ? `${a.brand} additionally lists ${lower(list(onlyA))} skin. ` : ""}${onlyB.length ? `${b.brand} additionally lists ${lower(list(onlyB))} skin. ` : ""}Our verdicts, in each review's own words: ${a.brand} — ${esc(a.verdict)} ${b.brand} — ${esc(b.verdict)}

## Price and where to buy

${cheap.brand} is the cheaper option at R${cheap.local_price_zar}; ${dear.brand} sits at R${dear.local_price_zar}. Prices are indicative and change often. ${a.brand} is listed at ${esc(a.where_to_buy)}, and ${b.brand} at ${esc(b.where_to_buy)}. ${sc(cheap, "score_value") >= sc(dear, "score_value") ? `${cheap.brand} also scores at least as well on value (${f1(sc(cheap, "score_value"))} vs ${f1(sc(dear, "score_value"))}), so the cheaper product is not a compromise on that front.` : `${dear.brand} scores higher on value (${f1(sc(dear, "score_value"))} vs ${f1(sc(cheap, "score_value"))}) despite the higher price, so the extra spend is partly reflected in what you get.`}

## Our take

There's no universal winner here. ${edges.filter((e) => Math.abs(e.da) >= 0.4).length ? `Pick ${a.brand} if ${edges.filter((e) => e.da >= 0.4).map((e) => e.label).join(" and ") || "price and simplicity"} matters most to you; pick ${b.brand} if ${edges.filter((e) => e.da <= -0.4).map((e) => e.label).join(" and ") || "price and simplicity"} does.` : `The two score within a few tenths of each other across the board, so price and skin type should decide it.`} Whichever you choose, patch-test a new product first, and remember this is cosmetic guidance, not medical advice.`;

  const verdicts = edges
    .filter((e) => Math.abs(e.da) >= 0.4)
    .map((e) => ({ label: e.vlabel, text: `${full(e.da > 0 ? a : b)} — ${f1(e.da > 0 ? e.ra : e.rb)} vs ${f1(e.da > 0 ? e.rb : e.ra)}.` }));
  verdicts.push({ label: "Better on price", text: `${full(cheap)} at R${cheap.local_price_zar}, against R${dear.local_price_zar} for ${dear.brand}.` });

  const pic = (photos.get(a.category) ?? photos.get("Serum") ?? [])[idx % Math.max(1, (photos.get(a.category) ?? photos.get("Serum") ?? []).length)];
  const retailerOf = (r: ProductReview) => {
    const withUrl = r.retailers?.filter((x) => x.url) ?? [];
    const l = withUrl.find((x) => x.in_stock) ?? withUrl[0];
    return l ? { label: `Shop at ${l.retailer}`, url: l.url } : undefined;
  };
  const prod = (r: ProductReview) => ({
    name: r.product_name, brand: r.brand, priceZar: r.local_price_zar, reviewSlug: r.id,
    ...(brandUrl.get(r.brand) ? { officialBrandUrl: brandUrl.get(r.brand) } : {}),
    ...(retailerOf(r) ? { retailer: retailerOf(r) } : {}),
  });
  return {
    slug,
    title,
    dek: `${a.brand} against ${b.brand}: two ${lower(a.category)}s built around ${theme}, R${cheap.local_price_zar} versus R${dear.local_price_zar}, compared on scores, skin-type fit and value.`,
    saContext: CATEGORY_LABEL[a.category],
    publishDate: PUBLISH,
    modifiedDate: PUBLISH,
    readingTime: "4 min read",
    thumbnail: pic,
    productsCompared: [prod(a), prod(b)],
    bodyMarkdown: body,
    verdicts,
    keyTakeaways: [
      `${full(a)} (R${a.local_price_zar}) and ${full(b)} (R${b.local_price_zar}) both centre on ${theme}.`,
      `SkinLabs overall scores: ${a.brand} ${f1(pct(a))}/10, ${b.brand} ${f1(pct(b))}/10.`,
      `${cheap.brand} is about ${ratio}× cheaper; ${dear.brand} costs more for a different formula, not a guaranteed better result.`,
      `Scores are editorial assessments of public ingredient and pricing information, not lab testing.`,
    ],
    faqs: [
      { question: `Is ${dear.brand} worth the extra money over ${cheap.brand}?`, answer: `It depends on what you value. ${dear.brand} costs R${dear.local_price_zar} against R${cheap.local_price_zar}. On SkinLabs' scores they sit at ${f1(pct(dear))}/10 and ${f1(pct(cheap))}/10 overall, and the breakdown above shows where each one leads.` },
      { question: `Which is better for ${lower(skinShared[0] ?? a.skin_type_match[0])} skin?`, answer: `${skinShared.length ? "Both list it as a match" : "Check each product's listed skin types above"}; the review pages explain the formulas in more detail.` },
      { question: `Do both products contain ${theme}?`, answer: `Yes, both list ${theme}-related ingredients among their key ingredients: ${a.key_ingredients.join(", ")} for ${a.brand} and ${b.key_ingredients.join(", ")} for ${b.brand}.` },
    ],
    seoTitle: `${shortTitle} — SA Shelf Showdown`.slice(0, 60),
    seoDescription: `${full(a)} (R${a.local_price_zar}) vs ${full(b)} (R${b.local_price_zar}): ${theme} compared on scores, skin-type fit and value.`.slice(0, 158),
  };
});

console.log(`/**
 * Shelf Showdown articles part 5 — GENERATED by scripts/generate-comparisons.ts
 * from src/data/reviews.ts (published scores, prices, ingredients, verdicts).
 * Sponsored reviews are excluded and nothing here is hand-invented. Re-run the
 * script rather than editing by hand.
 */
import type { ComparisonArticle } from "./comparisons-types";

export const comparisonArticlesPart5: ComparisonArticle[] = ${JSON.stringify(articles, null, 2)};
`);
console.error(`pairs found: ${pairs.length}, written: ${articles.length}`);
