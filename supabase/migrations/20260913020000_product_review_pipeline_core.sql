-- Product review generation pipeline: stores AI-generated (Gemini), Firecrawl-sourced
-- reviews so they can be merged into the site's existing static src/data/reviews.ts
-- catalogue at render time without needing a code deploy per review. Every row must
-- trace to a real source_url -- this table is never a place to fabricate a review.
CREATE TABLE IF NOT EXISTS public.ai_generated_product_reviews (
  id text PRIMARY KEY,
  product_name text NOT NULL,
  brand text NOT NULL,
  local_price_zar numeric NOT NULL CHECK (local_price_zar > 0),
  where_to_buy text NOT NULL,
  category text NOT NULL,
  skin_type_match text[] NOT NULL DEFAULT '{}',
  score_efficacy numeric NOT NULL CHECK (score_efficacy >= 0 AND score_efficacy <= 10),
  score_value numeric NOT NULL CHECK (score_value >= 0 AND score_value <= 10),
  score_texture numeric NOT NULL CHECK (score_texture >= 0 AND score_texture <= 10),
  score_climate numeric NOT NULL CHECK (score_climate >= 0 AND score_climate <= 10),
  verdict text NOT NULL,
  key_ingredients text[] NOT NULL DEFAULT '{}',
  retailers jsonb NOT NULL DEFAULT '[]',
  -- Drives the 70% South African / 30% global-available-in-SA editorial split.
  origin text NOT NULL CHECK (origin IN ('south_africa', 'global_available_in_sa')),
  source_url text NOT NULL,
  source_type text NOT NULL CHECK (
    source_type IN ('faithful_to_nature', 'brand_direct', 'sponsored', 'openhaus_marketplace')
  ),
  is_sponsored boolean NOT NULL DEFAULT false,
  generated_by text NOT NULL DEFAULT 'gemini',
  data_quality_status text NOT NULL DEFAULT 'unverified'
    CHECK (data_quality_status IN ('unverified', 'partially_verified', 'verified', 'deprecated')),
  published_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_generated_product_reviews_published_date
  ON public.ai_generated_product_reviews(published_date DESC);

ALTER TABLE public.ai_generated_product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view generated product reviews" ON public.ai_generated_product_reviews;
CREATE POLICY "Public can view generated product reviews"
  ON public.ai_generated_product_reviews FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.ai_generated_product_reviews TO anon, authenticated;
GRANT ALL ON public.ai_generated_product_reviews TO service_role;

-- Tracks Spotlight's edition/methodology-version metadata, mechanically bumped by the
-- review pipeline every 25 published reviews. The brand ranking narrative itself
-- (src/data/spotlight.ts's hand-written brandEditorial) stays human-curated -- this
-- table only automates the mechanical edition/version display and archive trail that
-- SpotlightArchive.tsx already promised ("each future edition will be added below").
CREATE TABLE IF NOT EXISTS public.spotlight_editions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_label text NOT NULL,
  methodology_version text NOT NULL,
  review_count_at_snapshot int NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_spotlight_editions_one_current
  ON public.spotlight_editions (is_current) WHERE is_current;

ALTER TABLE public.spotlight_editions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view spotlight editions" ON public.spotlight_editions;
CREATE POLICY "Public can view spotlight editions"
  ON public.spotlight_editions FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.spotlight_editions TO anon, authenticated;
GRANT ALL ON public.spotlight_editions TO service_role;

-- Seed with the current, already-live edition state (src/data/spotlight.ts:
-- SPOTLIGHT_EDITION_MONTH = "September 2026", SPOTLIGHT_METHODOLOGY_VERSION = "Spotlight
-- Methodology v1.1", 160 reviews in src/data/reviews.ts at seed time) so the archive/
-- methodology pages have a real row to read from day one, not a gap before the first
-- auto-bump.
INSERT INTO public.spotlight_editions (edition_label, methodology_version, review_count_at_snapshot, is_current)
SELECT 'September 2026', 'Spotlight Methodology v1.1', 160, true
WHERE NOT EXISTS (SELECT 1 FROM public.spotlight_editions);
