-- SKYNN AI v2.1 — admin ops counts for the new features: Smart Routines built
-- or updated, and Advanced sessions that started from a Basic analysis.
-- Counts only, admin-gated, same shape as 20260928140000 plus two columns
-- (a return-type change needs DROP + CREATE).
DROP FUNCTION IF EXISTS public.skynn_ops_summary(integer);

CREATE FUNCTION public.skynn_ops_summary(p_days integer DEFAULT 7)
RETURNS TABLE(
  window_days integer,
  basic_analyses_saved bigint,
  basic_limit_hits bigint,
  skynn_starts bigint,
  skynn_results_viewed bigint,
  skynn_pdf_downloads bigint,
  skynn_errors bigint,
  advanced_submissions bigint,
  advanced_pending bigint,
  advanced_intake_pdf_failed bigint,
  advanced_intake_email_failed bigint,
  analysis_passes_consumed bigint,
  advanced_started_from_basic bigint,
  smart_routines_saved bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_days int := least(greatest(coalesce(p_days, 7), 1), 90);
  v_from timestamptz := now() - make_interval(days => least(greatest(coalesce(p_days, 7), 1), 90));
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT
    v_days,
    (SELECT count(*) FROM public.skincare_recommendations r
      WHERE r.status = 'delivered' AND r.result_payload IS NOT NULL AND r.created_at >= v_from),
    (SELECT count(*) FROM public.analytics_events e
      WHERE e.event_name = 'skynn_basic_limit_reached' AND e.created_at >= v_from),
    (SELECT count(*) FROM public.analytics_events e
      WHERE e.event_name = 'skynn_started' AND e.created_at >= v_from),
    (SELECT count(*) FROM public.analytics_events e
      WHERE e.event_name = 'skynn_results_viewed' AND e.created_at >= v_from),
    (SELECT count(*) FROM public.analytics_events e
      WHERE e.event_name = 'skynn_results_pdf_downloaded' AND e.created_at >= v_from),
    (SELECT count(*) FROM public.analytics_events e
      WHERE e.event_name = 'skynn_error' AND e.created_at >= v_from),
    (SELECT count(*) FROM public.advanced_assessment_reports a WHERE a.submitted_at >= v_from),
    (SELECT count(*) FROM public.advanced_assessment_reports a
      WHERE a.processing_mode = 'fallback' AND a.intake_status IN ('pending', 'submitted')),
    (SELECT count(*) FROM public.advanced_assessment_reports a
      WHERE a.pdf_status = 'failed' AND coalesce(a.submitted_at, a.created_at) >= v_from),
    (SELECT count(*) FROM public.advanced_assessment_reports a
      WHERE a.internal_email_status = 'failed' AND coalesce(a.submitted_at, a.created_at) >= v_from),
    (SELECT count(*) FROM public.ai_credit_transactions t
      WHERE t.delta < 0 AND t.reason LIKE 'consume:%' AND t.created_at >= v_from),
    (SELECT count(*) FROM public.advanced_assessment_sessions s
      WHERE s.basic_analysis_id IS NOT NULL AND s.created_at >= v_from),
    (SELECT count(*) FROM public.smart_routines sr WHERE sr.updated_at >= v_from);
END;
$function$;

REVOKE ALL ON FUNCTION public.skynn_ops_summary(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.skynn_ops_summary(integer) TO authenticated;
