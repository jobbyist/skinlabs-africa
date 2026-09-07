-- SKYNN AI (beta) fairness-benchmarking pipeline.
--
-- Scope, deliberately kept "basic": this logs the inputs/outputs that are actually
-- measurable today (input completeness, whether the recommendation was genuinely
-- grounded in SkinLabs' reviewed catalogue, and — for the live AI path only — whether
-- the model's own output violated its no-diagnosis instruction) segmented by Monk
-- Skin Tone band. It does NOT attempt to compute clinical accuracy, precision/recall,
-- or "bias scores" — SkinLabs has no dermatologist-labelled ground truth to validate
-- against, and fabricating one would violate the product's standing instruction never
-- to fabricate performance claims. What this pipeline can honestly answer is: "are we
-- finding real product recommendations, and following our own safety rules, equally
-- often across every MST band?" — exactly the kind of representation/compliance gap
-- the fairness blueprint (section 7) asks to flag for human review, not an automated
-- bias verdict.
--
-- No PII: this table stores no user_id and no contact info, only aggregate,
-- pseudonymous metrics, so it can log every completed analysis including anonymous
-- (non-signed-in) starter analyses.

CREATE TABLE public.skynn_fairness_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (source IN ('starter', 'live_ai')),
  result_tier text NOT NULL CHECK (result_tier IN ('free', 'premium')),
  skin_type text,
  mst_tone smallint CHECK (mst_tone IS NULL OR (mst_tone BETWEEN 1 AND 10)),
  mst_band text NOT NULL CHECK (mst_band IN ('light', 'medium', 'deep', 'unknown')),
  had_photo boolean NOT NULL DEFAULT false,
  completeness_score numeric CHECK (completeness_score IS NULL OR (completeness_score BETWEEN 0 AND 100)),
  grounded_match_count smallint,
  grounded_match_attempted smallint,
  compliance_flags text[] NOT NULL DEFAULT '{}',
  model_version text
);

COMMENT ON TABLE public.skynn_fairness_events IS 'Append-only fairness/evaluation log for SKYNN AI (beta) — see migration header for exactly what this does and does not measure.';
COMMENT ON COLUMN public.skynn_fairness_events.mst_band IS 'Bucketed per src/data/mstScale.ts mstBand(): light=1-3, medium=4-7, deep=8-10, unknown=not shared.';
COMMENT ON COLUMN public.skynn_fairness_events.grounded_match_count IS 'How many of grounded_match_attempted product-catalogue lookups found a real SkinLabs-reviewed product, out of 4 (Cleanser/Moisturiser/Sunscreen/Serum). Never fabricated when null.';
COMMENT ON COLUMN public.skynn_fairness_events.compliance_flags IS 'live_ai only: automated scan results, e.g. {"named_diagnosis"} if the model violated its instruction never to name a medical diagnosis. Empty for the deterministic starter path, which cannot violate this.';

CREATE INDEX idx_skynn_fairness_events_band ON public.skynn_fairness_events (mst_band, source);
CREATE INDEX idx_skynn_fairness_events_created_at ON public.skynn_fairness_events (created_at DESC);

ALTER TABLE public.skynn_fairness_events ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.skynn_fairness_events TO anon, authenticated;
GRANT SELECT ON public.skynn_fairness_events TO authenticated;

-- Write-only from the client/edge function — every visitor (anonymous included) can
-- log an event for their own completed analysis, but never read the aggregate log.
CREATE POLICY "Anyone can log a fairness event"
  ON public.skynn_fairness_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read fairness events"
  ON public.skynn_fairness_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Aggregation view admins use to check parity across MST bands (blueprint section 7:
-- "evaluate individual tones and aggregate groups... never allowing aggregated results
-- to hide a poor-performing individual category" — hence grouping by the band AND
-- exposing per-band counts, not a single blended average).
CREATE VIEW public.skynn_fairness_summary
  WITH (security_invoker = true) AS
SELECT
  source,
  mst_band,
  result_tier,
  count(*) AS event_count,
  round(avg(completeness_score), 1) AS avg_completeness,
  round(
    avg(grounded_match_count::numeric / NULLIF(grounded_match_attempted, 0)) * 100,
    1
  ) AS avg_grounded_match_rate_pct,
  count(*) FILTER (WHERE array_length(compliance_flags, 1) > 0) AS compliance_flag_count
FROM public.skynn_fairness_events
GROUP BY source, mst_band, result_tier
ORDER BY source, mst_band, result_tier;

COMMENT ON VIEW public.skynn_fairness_summary IS 'Admin-only (inherits skynn_fairness_events RLS via security_invoker): per-MST-band completeness/grounding/compliance parity check for SKYNN AI. A gap here (e.g. lower avg_grounded_match_rate_pct for "deep" than "light") means SkinLabs'' own product catalogue under-serves that band — the fix is adding reviewed products, not touching this pipeline.';

GRANT SELECT ON public.skynn_fairness_summary TO authenticated;
