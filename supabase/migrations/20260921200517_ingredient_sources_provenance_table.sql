-- Multi-citation provenance table for ingredients (see
-- ingredient_sources_provenance_enum_values.sql for context). Follows the
-- brand_sources/product_sources log-table shape and the existing "Public
-- read USING (true) / Admins manage" RLS pattern already used on
-- ingredients and ingredient_interactions (deprecated-filtering, like
-- every sibling fact table here, is left to the query layer rather than
-- baked into the policy).

CREATE TABLE IF NOT EXISTS public.ingredient_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  source_title text,
  publisher text,
  source_type public.data_source_type NOT NULL DEFAULT 'peer_reviewed_literature',
  publication_date date,
  evidence_level public.evidence_level,
  evidence_summary text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ingredient_id, source_url)
);

CREATE INDEX IF NOT EXISTS idx_ingredient_sources_ingredient_id ON public.ingredient_sources (ingredient_id);

ALTER TABLE public.ingredient_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.ingredient_sources
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage ingredient_sources" ON public.ingredient_sources
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT ON public.ingredient_sources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ingredient_sources TO authenticated;
GRANT ALL ON public.ingredient_sources TO service_role;
