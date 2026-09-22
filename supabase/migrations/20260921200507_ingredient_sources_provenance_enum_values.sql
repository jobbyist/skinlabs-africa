-- Adds multi-citation provenance support for ingredients. Every existing
-- fact table (ingredients, ingredient_concerns, ingredient_interactions,
-- product_ingredients) only carries a single flat source_url column, which
-- can't hold the 2-4 real citations a rich ingredient profile actually
-- needs. This mirrors the existing brand_sources/product_sources log-table
-- pattern rather than inventing a new shape.
--
-- New enum values must be committed before they can be referenced by a
-- column default, so this is applied as its own migration ahead of
-- ingredient_sources_provenance_table.sql.

DO $$ BEGIN
  ALTER TYPE public.data_source_type ADD VALUE IF NOT EXISTS 'peer_reviewed_literature';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.data_source_type ADD VALUE IF NOT EXISTS 'regulatory_database';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
