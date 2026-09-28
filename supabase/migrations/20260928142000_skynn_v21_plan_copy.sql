-- SKYNN AI v2.1 — beta: plan benefit copy (pricing_plans.benefits, rendered by
-- /pricing and the dashboard) reflects the v2.1 product:
--   * Explorer: one Basic AI Skin Analysis every 7 days (was "One full AI starter analysis").
--   * Insider: unlimited Basic AI Skin Analysis. The "live AI routine that
--     re-analyses your skin every week" was the legacy skincare-ai path, retired
--     in v2.1 — advertising it would present a retired feature as operational.
-- Element-wise replacement, so any other edits to the arrays are preserved.
UPDATE public.pricing_plans
   SET benefits = (
     SELECT jsonb_agg(
       CASE elem #>> '{}'
         WHEN 'One full AI starter analysis to see your real skin profile'
           THEN to_jsonb('One Basic AI Skin Analysis every 7 days to see your real skin profile'::text)
         WHEN 'A live AI routine that re-analyses your skin every week'
           THEN to_jsonb('Unlimited Basic AI Skin Analysis — re-analyse whenever your skin changes'::text)
         ELSE elem
       END ORDER BY ord)
     FROM jsonb_array_elements(benefits) WITH ORDINALITY AS t(elem, ord)
   )
 WHERE jsonb_typeof(benefits) = 'array'
   AND (benefits ? 'One full AI starter analysis to see your real skin profile'
        OR benefits ? 'A live AI routine that re-analyses your skin every week');
