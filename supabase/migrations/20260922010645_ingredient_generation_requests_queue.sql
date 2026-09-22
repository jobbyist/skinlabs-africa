-- Demand-driven queue for ingredients that appear in product content (reviews, both
-- static and AI-generated) but aren't yet published in the `ingredients` catalogue.
-- Nothing writes ingredient content here or generates it synchronously -- rows are
-- only ever consumed by the scheduled Ingredients Intelligence content pipeline (see
-- supabase/INGREDIENT_CONTENT_STATUS.md, Track B / the 6B weekly Routine), which
-- researches and publishes a real profile on its own schedule and then marks the
-- request 'researched'/'published'/'rejected'.
CREATE TYPE public.ingredient_generation_request_status AS ENUM ('pending', 'researched', 'published', 'rejected');

CREATE TABLE IF NOT EXISTS public.ingredient_generation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_name text NOT NULL,
  normalized_name text NOT NULL,
  source text NOT NULL CHECK (source IN ('product_review_static', 'product_review_generated')),
  source_ref text,
  status public.ingredient_generation_request_status NOT NULL DEFAULT 'pending',
  resolved_ingredient_id uuid REFERENCES public.ingredients(id) ON DELETE SET NULL,
  rejection_reason text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (normalized_name)
);

CREATE INDEX IF NOT EXISTS idx_ingredient_generation_requests_status
  ON public.ingredient_generation_requests (status) WHERE status = 'pending';

-- Locked down like assessment_prompt_versions/skynn_advanced_assessment_config: no
-- anon/authenticated policies at all. This table is only ever written to server-side
-- (the product-review-sync pipeline's service-role client, or an admin/editorial
-- reconciliation pass) -- never reachable from a visitor's browser.
ALTER TABLE public.ingredient_generation_requests ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.ingredient_generation_requests TO service_role;
