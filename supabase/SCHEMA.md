# SkinLabs Skincare Intelligence Database

This is the schema documentation for the "skincare intelligence" tables added in:

- `20260907120000_skincare_intelligence_core.sql` — enums, lookup tables, brands, ingredients, ingredient relationships
- `20260907120001_skincare_intelligence_products.sql` — products, variants, reformulation versions, product-ingredient lists, skin-type fit, claims, scores, climate fit
- `20260907120002_skincare_intelligence_commerce_reviews.sql` — retailers, retailer listings, price history, reviews, review versions, review evidence
- `20260907120003_skincare_intelligence_indexes_functions.sql` — indexes, `current_product_prices` view, `search_products()` function
- `20260907120004_skincare_intelligence_seed.sql` — real editorial data imported from `src/data/reviews.ts` (see "Seed data & provenance" below)

## Why this exists

SkinLabs is South African skincare intelligence infrastructure, not a content subscription with a product list bolted on. This schema is the knowledge layer meant to eventually power reviews, AI Skin Analysis, product recommendations, ingredient analysis, Shelf Showdowns, Spotlight, climate-fit scoring, SEO pages, price intelligence, and future B2B APIs / retailer partnerships — so it is modelled as normalized, reusable entities rather than page-specific tables.

## Entity overview

**Reference data** (public read, admin write)
- `categories` — self-referencing (has `parent_category_id`) for e.g. Cleansers → Gel Cleansers
- `skin_types`, `skin_concerns`, `climate_profiles`, `retailers`

**Brands & ingredients**
- `brands`, `brand_sources` (provenance log)
- `ingredients` (unique on `lower(inci_name)`), `ingredient_concerns`, `ingredient_interactions`

**Products**
- `products` — one row per product line
- `product_sources` (provenance log)
- `product_variants` — SKU/size variation (a 30 ml vs 50 ml of the same product); affects price/availability, not formulation
- `product_versions` — reformulation history of a product; `is_current` flags the current formulation. `product_ingredients` hangs off a **version**, not the bare product, so "what was in this in 2023 vs 2025" stays answerable instead of being overwritten
- `product_ingredients` — join of a version to an ingredient, with `concentration_percent`, `is_key_ingredient`, own provenance
- `product_skin_type_fit`, `product_concerns` — structured fit/relevance to skin types and concerns
- `product_claims` — marketing/clinical/regulatory claims, with `is_substantiated` and a substantiation source, kept separate from `product_scores` so an unsubstantiated marketing claim is never confused with SkinLabs' own scoring
- `product_scores` — SkinLabs' own methodology scores (efficacy, value, texture, climate_fit, ...); `score_type` is free text (not an enum) so a new scoring dimension doesn't need a migration, but `methodology_version` anchors comparability between scores
- `product_climate_fit` — fit against a `climate_profiles` row (e.g. humid coastal vs dry highveld)

**Commerce**
- `retailer_products` — a product variant as listed by a specific retailer (unique per variant+retailer)
- `product_prices` — **append-only** price history log against a `retailer_products` row (see below); `current_product_prices` is a view over it, not a separate "current price" column

**Reviews**
- `reviews` — SkinLabs editorial review of a product; `status` is `draft`/`published`/`archived`; public RLS only exposes `published`
- `review_versions` — edit history of a review
- `review_evidence` — citations/evidence backing a review's claims

## Provenance model

Every "fact" table (brands, ingredients, products, product_ingredients, product_claims, product_scores, product_climate_fit) carries the same provenance columns, rather than a generic polymorphic provenance table, so each is independently indexable and queryable:

| Column | Meaning |
|---|---|
| `source_url` | Where the data came from, if known |
| `source_type` | `data_source_type` enum — `brand_website`, `retailer_listing`, `ingredient_database`, `manual_editorial`, `internal_editorial`, `user_submission`, `distributor_document`, `clinical_study`, `other` |
| `source_date` | Date the source was published/valid as of |
| `verification_status` | see Data Quality Model below |
| `verified_by` | `auth.users.id` of the admin who last verified it |
| `confidence` | `confidence_level` enum — `low` / `medium` / `high` |
| `last_verified_at` | Timestamp of the last human verification |

Log-style provenance tables (`brand_sources`, `product_sources`) additionally record every source ever attached to a brand/product, rather than only the most recent one.

**Where provenance is unavailable, the row is marked `unverified` — never fabricated, and never marked `verified` without a human checking it.**

## Data quality model

`data_quality_status` enum, used on brands/ingredients/products/product_ingredients/product_claims/product_scores/product_climate_fit/product_versions:

- `unverified` — imported or entered, not yet checked against a primary source
- `partially_verified` — some fields checked, others still assumed
- `verified` — a human has confirmed this against a primary source (`verified_by` + `last_verified_at` set)
- `deprecated` — known stale/incorrect; kept for history but should not be trusted or resurfaced

Admins move rows through this queue via the **Data Quality** tab in `/admin` (`src/pages/AdminDashboard.tsx`) — a "Mark Verified" action per row, deliberately minimal rather than a full CRUD admin.

## Price history

`product_prices` is append-only: every observed price is a new row against a `retailer_products` row, never an update-in-place. There is no `is_current` boolean — "the current price" is defined as the row with the latest `recorded_at` for that listing, which is exactly what the `current_product_prices` view computes (`DISTINCT ON (rp.id) ... ORDER BY rp.id, pp.recorded_at DESC`). This means price trends and price-drop history are answerable without any extra modelling later.

## Versioning: variants vs. reformulations

These are deliberately two different tables because they vary independently:

- **`product_variants`** — same formulation, different SKU (size, shade). Affects `retailer_products` / price / availability.
- **`product_versions`** — same product line, different formulation over time (`reformulation_notes`, `effective_from`/`effective_to`, `is_current`). Affects `product_ingredients`.

A product can be reformulated without changing its variants, and can gain a new size variant without being reformulated.

## Example queries

**"Show products available in South Africa containing niacinamide, suitable for oily skin, under R300"**

This is exactly what `search_products()` (defined in `20260907120003_skincare_intelligence_indexes_functions.sql`) answers:

```sql
select * from public.search_products(
  p_ingredient_slug => 'niacinamide',
  p_skin_type_slug  => 'oily',
  p_max_price_zar   => 300
);
```

It only considers non-discontinued products with at least one in-stock retailer listing, and only counts a skin-type match as `excellent` or `good` fit.

**"Compare these two products based on ingredients, price, climate fit, evidence and SkinLabs methodology"**

There's no dedicated `compare_products()` function — a comparison is a fan-out of joins per product, better expressed as parallel application queries than one SQL function:

```sql
-- Ingredients (current formulation) for product A
select i.inci_name, i.common_name, pi.concentration_percent, pi.is_key_ingredient
from public.product_ingredients pi
join public.product_versions pv on pv.id = pi.product_version_id and pv.is_current
join public.ingredients i on i.id = pi.ingredient_id
where pv.product_id = :product_a_id
order by pi.position;

-- Current lowest price per product
select * from public.current_product_prices cpp
join public.product_variants pvar on pvar.id = cpp.product_variant_id
where pvar.product_id in (:product_a_id, :product_b_id) and cpp.is_available;

-- Climate fit
select * from public.product_climate_fit where product_id in (:product_a_id, :product_b_id);

-- SkinLabs methodology scores
select * from public.product_scores where product_id in (:product_a_id, :product_b_id);

-- Evidence backing published reviews of either product
select r.product_id, re.*
from public.reviews r
join public.review_evidence re on re.review_id = r.id
where r.product_id in (:product_a_id, :product_b_id) and r.status = 'published';
```

An application layer combines these per-entity queries into a single comparison view; keeping them separate keeps each query index-friendly and lets a caller ask for only what it needs (e.g. skip evidence when a review doesn't exist yet).

## Row-Level Security

- All reference/knowledge tables (brands, ingredients, products, categories, skin_types, skin_concerns, climate_profiles, retailers, and all join/fact tables) are **public SELECT**, so the app, SEO pages and future public APIs can read them without auth.
- All writes require `public.has_role(auth.uid(), 'admin')`.
- `brand_sources` and `product_sources` (internal provenance logs) are **not** public-readable — `SELECT` requires the admin role, since they can contain internal notes.
- `reviews` is the one table with content-based RLS: public `SELECT` is restricted to `status = 'published'`; admins can see `draft`/`archived` too.

## Indexes

Indexes target the query patterns this schema exists to serve (full list in `20260907120003_skincare_intelligence_indexes_functions.sql`):

- Trigram (`pg_trgm`) GIN indexes on `products.name`, `brands.name`, `ingredients.inci_name`/`common_name` for fuzzy search/autocomplete
- `product_ingredients (ingredient_id)` and a partial index on key ingredients, for "products containing X"
- `product_skin_type_fit (skin_type_id, fit_rating)` for "products suitable for oily skin"
- `product_prices (retailer_product_id, recorded_at desc)` — the exact access pattern `current_product_prices` needs, turning "latest price for this listing" into a top-1 index lookup
- Partial index `products (id) where not is_discontinued` for the common "active catalogue" filter

## Seed data & provenance

`scripts/seed-skincare-intelligence.ts` (run once via `bun run scripts/seed-skincare-intelligence.ts`, output committed as `20260907120004_skincare_intelligence_seed.sql`) imports SkinLabs' own already-published editorial data from `src/data/reviews.ts` — 160 products, 50 brands, ~128 distinct ingredients — and inserts it with:

- `verification_status = 'unverified'`
- `source_type = 'internal_editorial'`

No data was fabricated or scraped. A handful of source `skin_type_match` labels that don't cleanly map to a skin type or a skin concern (e.g. "Baby-Safe", "Deep Tones", "Pregnancy-Safe") were deliberately left unmapped rather than force-fit into the wrong category; see `SKIN_TYPE_MATCH_MAP` in the seed script for the full classification and what was skipped.

All inserts are idempotent (`ON CONFLICT DO NOTHING` against real unique constraints), so re-running the seed script is safe.
