-- ============================================================================
-- SkinLabs Skincare Intelligence Database — Part 1: enums, lookups, brands,
-- ingredients and ingredient relationships.
--
-- This is the foundational, normalized knowledge layer meant to eventually
-- back reviews, the AI Formulator, Shelf Showdowns, Spotlight, climate-fit
-- scoring, SEO pages, price intelligence and future B2B APIs — not just a
-- product catalogue. See supabase/SCHEMA.md for the full data model
-- documentation, the data-quality model, and example queries.
--
-- Every "fact" table carries a consistent provenance shape so any important
-- attribute can be traced back to where it came from and how sure we are of
-- it: source_url, source_type, source_date, verification_status,
-- verified_by, confidence, last_verified_at. Nothing here is fabricated —
-- rows imported from SkinLabs' existing editorial content (see the seed
-- migration) are marked verification_status = 'unverified' with
-- source_type = 'internal_editorial' until a human re-confirms them against
-- a primary source.
-- ============================================================================

-- ---------- Shared enums ----------
DO $$ BEGIN
  CREATE TYPE public.data_quality_status AS ENUM ('unverified', 'partially_verified', 'verified', 'deprecated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.data_source_type AS ENUM (
    'brand_website', 'retailer_listing', 'ingredient_database', 'manual_editorial',
    'internal_editorial', 'user_submission', 'distributor_document', 'clinical_study', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.confidence_level AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.evidence_level AS ENUM ('strong', 'moderate', 'limited', 'anecdotal', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.irritancy_risk AS ENUM ('low', 'moderate', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.skin_fit_rating AS ENUM ('excellent', 'good', 'caution', 'avoid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.claim_type AS ENUM ('marketing', 'clinical', 'regulatory');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ingredient_interaction_type AS ENUM ('avoid_combining', 'enhances', 'buffers', 'requires_spacing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ingredient_concern_relationship AS ENUM ('treats', 'may_worsen', 'preventive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Lookup tables ----------
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  parent_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skin_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS public.skin_concerns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS public.climate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  region_description text,
  humidity_level text,
  uv_index_level text,
  temperature_profile text
);

CREATE TABLE IF NOT EXISTS public.retailers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  website_url text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- Brands ----------
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  is_sa_brand boolean,
  country text,
  website_url text,
  logo_url text,
  founded_year int,
  description text,
  -- provenance
  source_url text,
  source_type public.data_source_type,
  source_date date,
  verification_status public.data_quality_status NOT NULL DEFAULT 'unverified',
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confidence public.confidence_level,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brand_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  source_url text,
  source_type public.data_source_type NOT NULL DEFAULT 'other',
  source_date date,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ---------- Ingredients ----------
CREATE TABLE IF NOT EXISTS public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  inci_name text NOT NULL,
  common_name text,
  description text,
  function_summary text,
  typical_concentration_range text,
  evidence_level public.evidence_level,
  irritancy_risk public.irritancy_risk,
  pregnancy_safe boolean,
  -- provenance
  source_url text,
  source_type public.data_source_type,
  source_date date,
  verification_status public.data_quality_status NOT NULL DEFAULT 'unverified',
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confidence public.confidence_level,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ingredients_inci_name_unique ON public.ingredients (lower(inci_name));

CREATE TABLE IF NOT EXISTS public.ingredient_concerns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  concern_id uuid NOT NULL REFERENCES public.skin_concerns(id) ON DELETE CASCADE,
  relationship public.ingredient_concern_relationship NOT NULL,
  notes text,
  source_url text,
  confidence public.confidence_level,
  UNIQUE (ingredient_id, concern_id, relationship)
);

CREATE TABLE IF NOT EXISTS public.ingredient_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_a_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  ingredient_b_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  interaction_type public.ingredient_interaction_type NOT NULL,
  notes text,
  source_url text,
  confidence public.confidence_level,
  CHECK (ingredient_a_id <> ingredient_b_id),
  UNIQUE (ingredient_a_id, ingredient_b_id, interaction_type)
);

-- ---------- RLS: all reference/knowledge data is public-readable; writes are admin-only ----------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.climate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.skin_types FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.skin_concerns FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.climate_profiles FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.retailers FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.ingredients FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.ingredient_concerns FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.ingredient_interactions FOR SELECT USING (true);
-- brand_sources is an internal provenance log, not consumer-facing — admin only.
CREATE POLICY "Admins can read brand sources" ON public.brand_sources FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage skin_types" ON public.skin_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage skin_concerns" ON public.skin_concerns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage climate_profiles" ON public.climate_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage retailers" ON public.retailers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage brands" ON public.brands FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage brand_sources" ON public.brand_sources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage ingredients" ON public.ingredients FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage ingredient_concerns" ON public.ingredient_concerns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage ingredient_interactions" ON public.ingredient_interactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.categories, public.skin_types, public.skin_concerns, public.climate_profiles,
  public.retailers, public.brands, public.ingredients, public.ingredient_concerns, public.ingredient_interactions
  TO anon, authenticated;
GRANT SELECT ON public.brand_sources TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories, public.skin_types, public.skin_concerns, public.climate_profiles,
  public.retailers, public.brands, public.brand_sources, public.ingredients, public.ingredient_concerns,
  public.ingredient_interactions TO authenticated;
GRANT ALL ON public.categories, public.skin_types, public.skin_concerns, public.climate_profiles,
  public.retailers, public.brands, public.brand_sources, public.ingredients, public.ingredient_concerns,
  public.ingredient_interactions TO service_role;
