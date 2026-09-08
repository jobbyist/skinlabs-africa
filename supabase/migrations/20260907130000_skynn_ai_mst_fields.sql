-- SKYNN AI (beta): adds the Monk Skin Tone (MST) self-report field and an input-
-- completeness score to skincare_recommendations. Per the SKYNN AI fairness
-- blueprint, MST is a self-reported, OPTIONAL evaluation/fairness dimension only —
-- never a diagnostic input, never inferred, and never required to complete an
-- analysis. mst_source is always 'user_reported' for now (the only path the app
-- writes); the column exists so a future model-estimated source is distinguishable
-- and never silently conflated with a real self-report.
ALTER TABLE public.skincare_recommendations
  ADD COLUMN IF NOT EXISTS mst_tone smallint CHECK (mst_tone IS NULL OR (mst_tone BETWEEN 1 AND 10)),
  ADD COLUMN IF NOT EXISTS mst_source text CHECK (mst_source IS NULL OR mst_source IN ('user_reported', 'model_estimated')),
  ADD COLUMN IF NOT EXISTS analysis_completeness numeric CHECK (analysis_completeness IS NULL OR (analysis_completeness BETWEEN 0 AND 100));

COMMENT ON COLUMN public.skincare_recommendations.mst_tone IS 'Self-reported Monk Skin Tone (1-10), optional. Fairness/evaluation signal only — never diagnostic.';
COMMENT ON COLUMN public.skincare_recommendations.mst_source IS 'Provenance of mst_tone. Always user_reported today; reserved for future model_estimated use, never used interchangeably.';
COMMENT ON COLUMN public.skincare_recommendations.analysis_completeness IS 'Deterministic 0-100 input-completeness score shown as "Analysis completeness" — not a clinical accuracy or bias metric.';
