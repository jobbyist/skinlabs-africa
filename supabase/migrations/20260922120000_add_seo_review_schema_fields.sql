-- Extend ai_generated_product_reviews table to support comprehensive SEO
-- and structured data requirements for product review pages.
-- This migration preserves all existing data and adds nullable fields
-- that can be populated gradually by the product review pipeline.

ALTER TABLE public.ai_generated_product_reviews
  -- SEO Meta Fields
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_intro TEXT,
  
  -- Extended Editorial Content
  ADD COLUMN IF NOT EXISTS review_body TEXT,
  ADD COLUMN IF NOT EXISTS review_methodology TEXT,
  
  -- Product Details (for structured data)
  ADD COLUMN IF NOT EXISTS product_size TEXT,
  ADD COLUMN IF NOT EXISTS product_format TEXT,
  ADD COLUMN IF NOT EXISTS country_of_origin TEXT,
  ADD COLUMN IF NOT EXISTS am_pm_usage TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ZAR',
  
  -- Suitability Arrays (stored as JSONB for flexibility)
  ADD COLUMN IF NOT EXISTS skin_types JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS skin_concerns JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cautions JSONB DEFAULT '[]'::jsonb,
  
  -- Structured Ingredients
  -- key_ingredients already exists as text[] but we add a structured version
  ADD COLUMN IF NOT EXISTS key_ingredients_structured JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_ingredients_slugs JSONB DEFAULT '[]'::jsonb,
  
  -- Media
  ADD COLUMN IF NOT EXISTS primary_image TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb,
  
  -- Internal Linking (for related content)
  ADD COLUMN IF NOT EXISTS related_reviews JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_knowledge_articles JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS comparison_products JSONB DEFAULT '[]'::jsonb,
  
  -- Community Ratings (separate from editorial scores)
  ADD COLUMN IF NOT EXISTS community_rating NUMERIC,
  ADD COLUMN IF NOT EXISTS community_rating_count INTEGER DEFAULT 0,
  
  -- FAQ for structured data
  ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps for structured data
  ADD COLUMN IF NOT EXISTS date_published TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS date_modified TIMESTAMPTZ DEFAULT now();

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ai_generated_product_reviews_skin_types
  ON public.ai_generated_product_reviews USING GIN (skin_types);

CREATE INDEX IF NOT EXISTS idx_ai_generated_product_reviews_skin_concerns
  ON public.ai_generated_product_reviews USING GIN (skin_concerns);

CREATE INDEX IF NOT EXISTS idx_ai_generated_product_reviews_date_published
  ON public.ai_generated_product_reviews(date_published DESC);

-- Trigger to auto-update date_modified on row updates
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modified = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ai_generated_product_reviews_modtime ON public.ai_generated_product_reviews;
CREATE TRIGGER update_ai_generated_product_reviews_modtime
  BEFORE UPDATE ON public.ai_generated_product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
