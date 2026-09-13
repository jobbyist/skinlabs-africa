-- ============================================================================
-- Ingredients Intelligence Layer — schema extensions.
--
-- Extends (never duplicates) the existing skincare intelligence schema from
-- 20260907120000_skincare_intelligence_core.sql: `ingredients` gains a
-- `category` column for directory filtering; a new `ingredient_aliases` table
-- supports alias-aware search ("vit c" -> Ascorbic Acid); `ingredient_interactions`
-- (the existing table that IS the blueprint's "ingredient_relationships"
-- concept) gains user-facing explanation/guidance fields and a review-gate,
-- since these rows now drive real safety flags shown to users, plus a
-- `compatible` interaction type to allow proactively debunking common
-- combination myths with a real citation. RPC functions follow the exact
-- `search_products()` precedent in 20260907120003_..._indexes_functions.sql.
-- ============================================================================

-- ---------- ingredients: category for directory filtering ----------
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS category text;

-- ---------- ingredient_interactions: richer, review-gated fields ----------
ALTER TABLE public.ingredient_interactions ADD COLUMN IF NOT EXISTS explanation text;
ALTER TABLE public.ingredient_interactions ADD COLUMN IF NOT EXISTS usage_guidance text;
ALTER TABLE public.ingredient_interactions ADD COLUMN IF NOT EXISTS verification_status public.data_quality_status NOT NULL DEFAULT 'unverified';
ALTER TABLE public.ingredient_interactions ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.ingredient_interactions ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;

DO $$ BEGIN
  ALTER TYPE public.ingredient_interaction_type ADD VALUE IF NOT EXISTS 'compatible';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- ingredient_aliases: alias-aware search ----------
DO $$ BEGIN
  CREATE TYPE public.ingredient_alias_type AS ENUM ('common_name', 'abbreviation', 'inci_variant', 'synonym');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.ingredient_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  alias text NOT NULL,
  alias_type public.ingredient_alias_type NOT NULL DEFAULT 'synonym',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ingredient_id, alias)
);
CREATE INDEX IF NOT EXISTS idx_ingredient_aliases_alias_trgm ON public.ingredient_aliases USING gin (alias gin_trgm_ops);

ALTER TABLE public.ingredient_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.ingredient_aliases FOR SELECT USING (true);
CREATE POLICY "Admins manage ingredient_aliases" ON public.ingredient_aliases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.ingredient_aliases TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ingredient_aliases TO authenticated;
GRANT ALL ON public.ingredient_aliases TO service_role;

-- ---------- RPC: ordered-pair ingredient interaction lookup ----------
CREATE OR REPLACE FUNCTION public.get_ingredient_interaction(a uuid, b uuid)
RETURNS TABLE (
  id uuid,
  interaction_type public.ingredient_interaction_type,
  explanation text,
  usage_guidance text,
  notes text,
  confidence public.confidence_level,
  source_url text
) LANGUAGE sql STABLE AS $$
  SELECT ii.id, ii.interaction_type, ii.explanation, ii.usage_guidance, ii.notes, ii.confidence, ii.source_url
  FROM public.ingredient_interactions ii
  WHERE ii.ingredient_a_id = LEAST(a, b) AND ii.ingredient_b_id = GREATEST(a, b);
$$;

-- ---------- RPC: given a routine's full ingredient set, all pairwise flags ----------
CREATE OR REPLACE FUNCTION public.get_routine_conflicts(p_ingredient_ids uuid[])
RETURNS TABLE (
  id uuid,
  ingredient_a_id uuid,
  ingredient_b_id uuid,
  interaction_type public.ingredient_interaction_type,
  explanation text,
  usage_guidance text,
  confidence public.confidence_level,
  source_url text
) LANGUAGE sql STABLE AS $$
  SELECT ii.id, ii.ingredient_a_id, ii.ingredient_b_id, ii.interaction_type, ii.explanation, ii.usage_guidance, ii.confidence, ii.source_url
  FROM public.ingredient_interactions ii
  WHERE ii.ingredient_a_id = ANY(p_ingredient_ids) AND ii.ingredient_b_id = ANY(p_ingredient_ids);
$$;

-- ---------- RPC: paginated, filtered, alias-aware ingredient search ----------
CREATE OR REPLACE FUNCTION public.search_ingredients(
  p_search text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_concern_slug text DEFAULT NULL,
  p_evidence public.evidence_level DEFAULT NULL,
  p_page int DEFAULT 1,
  p_per_page int DEFAULT 10
) RETURNS TABLE (
  id uuid,
  slug text,
  inci_name text,
  common_name text,
  short_description text,
  category text,
  evidence_level public.evidence_level,
  irritancy_risk public.irritancy_risk,
  pregnancy_safe boolean,
  total_count bigint
) LANGUAGE sql STABLE AS $$
  WITH matched AS (
    SELECT DISTINCT i.id
    FROM public.ingredients i
    LEFT JOIN public.ingredient_aliases al ON al.ingredient_id = i.id
    LEFT JOIN public.ingredient_concerns ic ON ic.ingredient_id = i.id
    LEFT JOIN public.skin_concerns sc ON sc.id = ic.concern_id
    WHERE
      (p_search IS NULL OR p_search = '' OR
        i.inci_name ILIKE '%' || p_search || '%' OR
        i.common_name ILIKE '%' || p_search || '%' OR
        al.alias ILIKE '%' || p_search || '%')
      AND (p_category IS NULL OR i.category = p_category)
      AND (p_evidence IS NULL OR i.evidence_level = p_evidence)
      AND (p_concern_slug IS NULL OR sc.slug = p_concern_slug)
  )
  SELECT
    i.id, i.slug, i.inci_name, i.common_name, i.description AS short_description,
    i.category, i.evidence_level, i.irritancy_risk, i.pregnancy_safe,
    count(*) OVER () AS total_count
  FROM public.ingredients i
  JOIN matched m ON m.id = i.id
  ORDER BY i.inci_name
  LIMIT greatest(p_per_page, 1)
  OFFSET greatest(p_page - 1, 0) * greatest(p_per_page, 1);
$$;
