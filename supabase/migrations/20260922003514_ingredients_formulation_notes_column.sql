-- Pre-existing bug found while wiring up multi-source citations: both
-- IngredientDetail.tsx and ingredients.$slug.tsx have always referenced
-- ingredient.formulation_notes in the "How to use" section, but this column
-- never actually existed on the ingredients table -- it silently evaluated
-- to undefined at runtime (no crash, just permanently-empty content). The
-- content-population pipeline (Phase 3) relies on this field, so the real
-- fix is adding the column, not removing the reference.
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS formulation_notes text;
