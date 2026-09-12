/**
 * Generates the SQL to seed OpenHaus's marketplace_brands/marketplace_products/
 * marketplace_product_images tables from the real 84-product FTN catalog plus
 * the rewritten-description/tagging and verified-image passes.
 *
 * This script does NOT touch the database itself — it has no Supabase
 * credentials. It writes scripts/generated/openhaus-seed.sql, which is then
 * applied via the Supabase MCP tools (mcp__Supabase__apply_migration),
 * matching how the editorial skincare_intelligence catalogue was seeded
 * (scripts/seed-skincare-intelligence.ts + a tracked migration file).
 *
 * Product images reference the verified Faithful to Nature CDN URLs directly
 * (confirmed publicly fetchable, unlike the FTN HTML pages which sit behind
 * a Cloudflare challenge) rather than being re-hosted in the
 * openhaus-product-images bucket — re-hosting needs a service-role key this
 * environment doesn't expose to a local script. The bucket stays provisioned
 * for a future admin-upload pass.
 *
 * Run: bun run scripts/seed-openhaus-marketplace.ts
 */

import { ftnCatalog, type FtnCatalogProduct } from "../src/data/marketplace/ftn-catalog";
import { lelivStandardBeautyTags } from "../src/data/marketplace/tags/lelive-standard-beauty";
import { skoonEsseTags } from "../src/data/marketplace/tags/skoon-esse";
import { leliveStandardBeautyImages } from "../src/data/marketplace/tags/images-lelive-standard-beauty";
import { skoonEsseImages } from "../src/data/marketplace/tags/images-skoon-esse";
import { computeMarkedUpPrice } from "../src/lib/marketplace/pricing";
import { writeFileSync } from "fs";

const allTags = [...lelivStandardBeautyTags, ...skoonEsseTags];
const allImages = [...leliveStandardBeautyImages, ...skoonEsseImages];

function sqlString(value: string | null): string {
  if (value === null) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlArray(values: string[]): string {
  if (values.length === 0) return "'{}'";
  return `ARRAY[${values.map((v) => sqlString(v)).join(", ")}]::text[]`;
}

const BRAND_META: Record<
  FtnCatalogProduct["brand"],
  { name: string; origin: string; description: string; values: string[] }
> = {
  lelive: {
    name: "Lelive",
    origin: "South Africa",
    description:
      "A South African, woman-owned skincare and body-care brand built around African-sourced ingredients — baobab, marula, rooibos and African mahogany — across cruelty-free, vegan, sulphate- and paraben-free formulas.",
    values: ["Cruelty-Free", "Vegan", "SA Woman-Owned"],
  },
  esse: {
    name: "Esse",
    origin: "South Africa",
    description:
      "A South African probiotic skincare brand built on organic, ECOCERT-certified formulas, live probiotic technology and African botanicals, independently certified cruelty-free.",
    values: ["Cruelty-Free", "Vegan"],
  },
  skoon: {
    name: "SKOON.",
    origin: "South Africa",
    description:
      "A South African skincare brand focused on skin-barrier repair and hydration, built around its own NanoPillow serum technology and microbiome-supporting actives.",
    values: ["Cruelty-Free"],
  },
  "standard-beauty": {
    name: "Standard Beauty",
    origin: "South Africa",
    description:
      "A South African skincare brand offering clinically tested, dermatologically approved actives — salicylic acid, niacinamide, hyaluronic acid — at an accessible price point, formulated to be pregnancy- and breastfeeding-safe.",
    values: ["Vegan", "Pregnancy-Safe"],
  },
};

let sql = `-- OpenHaus marketplace seed data — 84 real products across 4 South African
-- brands (Lelive, Esse, SKOON, Standard Beauty), sourced from a Faithful to
-- Nature wholesale catalog (September 2026). Descriptions are rewritten
-- (not copy-pasted); category/concern/values/skin-tone tags are derived
-- only from real catalog claims. Prices are the source price marked up 4%,
-- charm-rounded to end in .99. Idempotent: safe to re-run.

`;

// ---------- Brands ----------
sql += "-- Brands\n";
for (const [slug, meta] of Object.entries(BRAND_META)) {
  sql += `insert into public.marketplace_brands (slug, name, origin, description, values, source_url)
values (${sqlString(slug)}, ${sqlString(meta.name)}, ${sqlString(meta.origin)}, ${sqlString(meta.description)}, ${sqlArray(meta.values)}, ${sqlString("https://www.faithful-to-nature.co.za")})
on conflict (slug) do update set
  name = excluded.name, origin = excluded.origin, description = excluded.description, values = excluded.values;
`;
}

// ---------- Products ----------
sql += "\n-- Products\n";
let missingTag = 0;
let missingImages = 0;

for (const product of ftnCatalog) {
  const tag = allTags.find((t) => t.name === product.name);
  if (!tag) {
    missingTag += 1;
    console.warn(`No tag entry for: ${product.name}`);
    continue;
  }
  const imageEntry = allImages.find((i) => i.name === product.name);
  if (!imageEntry || imageEntry.imageUrls.length === 0) missingImages += 1;

  const markedUp = computeMarkedUpPrice(product.originalPriceZar);
  
  // Validate brand slug to prevent SQL injection
  const validBrandSlug = ['lelive', 'esse', 'skoon', 'standard-beauty'].includes(product.brand) 
    ? product.brand 
    : null;
  
  if (!validBrandSlug) {
    console.error(`Invalid brand slug: ${product.brand} for product: ${product.name}`);
    continue;
  }

  sql += `insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = ${sqlString(validBrandSlug)}),
  ${sqlString(tag.slug)}, ${sqlString(product.name)}, ${sqlString(tag.description)},
  ${product.originalPriceZar}, ${markedUp},
  ${sqlString(product.sourceUrl)}, ${sqlString(tag.category)}, ${sqlArray(tag.concern)}, ${sqlArray(tag.values)},
  ${sqlArray(tag.skinToneClaims)}, ${sqlString(tag.size)}, ${sqlString(product.howToUse)}, ${sqlArray(tag.keyActives)}, true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
`;
}

// ---------- Images ----------
sql += "\n-- Product images (delete-then-insert per product for idempotency)\n";
for (const product of ftnCatalog) {
  const tag = allTags.find((t) => t.name === product.name);
  const imageEntry = allImages.find((i) => i.name === product.name);
  if (!tag || !imageEntry || imageEntry.imageUrls.length === 0) continue;

  sql += `delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = ${sqlString(tag.slug)});\n`;
  imageEntry.imageUrls.forEach((url, index) => {
    sql += `insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = ${sqlString(tag.slug)}), ${sqlString(url)}, ${sqlString(product.name)}, ${index}, ${index === 0 ? "true" : "false"});\n`;
  });
}

writeFileSync(new URL("./generated/openhaus-seed.sql", import.meta.url), sql);
console.log(`Wrote scripts/generated/openhaus-seed.sql`);
console.log(`Products: ${ftnCatalog.length}, missing tags: ${missingTag}, missing images: ${missingImages}`);
