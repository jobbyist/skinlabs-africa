-- SKYNN AI: enqueue_email() priority casts (2026-09-27).
--
-- enqueue_email()'s p_priority is smallint, and a bare integer literal (50)
-- doesn't implicitly cast to it, so these calls failed at runtime with
-- 42883 "function public.enqueue_email(...) does not exist" — the same bug
-- 20260921120000_fix_enqueue_email_smallint_cast.sql fixed for the form
-- triggers. Found by the live intake E2E (retry-exhaustion alert). Affects:
--   * record_advanced_intake_result  (intake retries-exhausted admin alert)
--   * delete_advanced_assessment_for_user (withdrawn admin alert)
--   * complete_advanced_assessment_for_review (v2 "review needed" alert —
--     never exercised live yet, so it would have failed on the first
--     production report)
-- Bodies are unchanged apart from 50 -> 50::smallint.

CREATE OR REPLACE FUNCTION public.record_advanced_intake_result(
  p_report_id uuid,
  p_scores jsonb DEFAULT NULL,
  p_triage jsonb DEFAULT NULL,
  p_pdf_path text DEFAULT NULL,
  p_pdf_error text DEFAULT NULL,
  p_email_sent boolean DEFAULT NULL,
  p_email_error text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_r public.advanced_assessment_reports;
  v_done boolean;
  v_exhausted boolean;
BEGIN
  SELECT * INTO v_r FROM public.advanced_assessment_reports WHERE id = p_report_id AND processing_mode = 'fallback' FOR UPDATE;
  IF v_r.id IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;

  IF p_scores IS NOT NULL THEN v_r.intake_scores := p_scores; END IF;
  IF p_triage IS NOT NULL THEN v_r.intake_triage := p_triage; END IF;

  IF p_pdf_path IS NOT NULL THEN
    IF v_r.pdf_status IS DISTINCT FROM 'generated' THEN
      PERFORM public.log_advanced_assessment_audit(v_r.session_id, v_r.id, 'worker', NULL, 'pdf_generated', '{}'::jsonb);
    END IF;
    v_r.pdf_status := 'generated';
    v_r.pdf_storage_path := p_pdf_path;
    v_r.pdf_generated_at := now();
    v_r.pdf_error := NULL;
  ELSIF p_pdf_error IS NOT NULL THEN
    v_r.pdf_status := 'failed';
    v_r.pdf_error := left(p_pdf_error, 500);
    PERFORM public.log_advanced_assessment_audit(v_r.session_id, v_r.id, 'worker', NULL, 'pdf_failed', jsonb_build_object('attempt', v_r.intake_attempts));
  END IF;

  IF p_email_sent IS TRUE THEN
    v_r.internal_email_status := 'sent';
    v_r.internal_email_sent_at := now();
    v_r.internal_email_attempts := v_r.internal_email_attempts + 1;
    v_r.internal_email_last_attempt_at := now();
    v_r.internal_email_error := NULL;
    PERFORM public.log_advanced_assessment_audit(v_r.session_id, v_r.id, 'worker', NULL, 'email_sent',
      jsonb_build_object('recipient', v_r.internal_email_recipient));
  ELSIF p_email_error IS NOT NULL THEN
    v_r.internal_email_status := 'retrying';
    v_r.internal_email_attempts := v_r.internal_email_attempts + 1;
    v_r.internal_email_last_attempt_at := now();
    v_r.internal_email_error := left(p_email_error, 500);
    PERFORM public.log_advanced_assessment_audit(v_r.session_id, v_r.id, 'worker', NULL, 'email_failed', jsonb_build_object('attempt', v_r.intake_attempts));
  END IF;

  v_done := v_r.pdf_status = 'generated' AND v_r.internal_email_status = 'sent';
  v_exhausted := NOT v_done AND v_r.intake_attempts >= 6;

  IF v_exhausted THEN
    IF v_r.internal_email_status IS DISTINCT FROM 'sent' THEN v_r.internal_email_status := 'failed'; END IF;
    IF v_r.pdf_status IS DISTINCT FROM 'generated' THEN v_r.pdf_status := 'failed'; END IF;
    PERFORM public.log_advanced_assessment_audit(v_r.session_id, v_r.id, 'worker', NULL, 'intake_retries_exhausted', '{}'::jsonb);
    PERFORM public.enqueue_email(
      'ADMIN_SKYNN_INTAKE_FAILED', 'admin_skynn_intake_failed:' || v_r.id::text || ':' || v_r.internal_email_attempts::text,
      'admin_skynn_intake_failed', 'ADMIN', NULL, NULL,
      jsonb_build_object('reference_number', v_r.reference_number, 'pdf_status', v_r.pdf_status, 'email_status', v_r.internal_email_status),
      'rpc:record_advanced_intake_result', false, 50::smallint
    );
  END IF;

  UPDATE public.advanced_assessment_reports
     SET intake_scores = v_r.intake_scores,
         intake_triage = v_r.intake_triage,
         pdf_status = v_r.pdf_status,
         pdf_storage_path = v_r.pdf_storage_path,
         pdf_generated_at = v_r.pdf_generated_at,
         pdf_error = v_r.pdf_error,
         internal_email_status = v_r.internal_email_status,
         internal_email_sent_at = v_r.internal_email_sent_at,
         internal_email_attempts = v_r.internal_email_attempts,
         internal_email_last_attempt_at = v_r.internal_email_last_attempt_at,
         internal_email_error = v_r.internal_email_error,
         intake_next_attempt_at = CASE
           WHEN v_done OR v_exhausted THEN NULL
           ELSE now() + (CASE least(v_r.intake_attempts, 5)
                           WHEN 1 THEN interval '1 minute' WHEN 2 THEN interval '5 minutes'
                           WHEN 3 THEN interval '15 minutes' WHEN 4 THEN interval '60 minutes'
                           ELSE interval '180 minutes' END)
         END,
         locked_at = NULL,
         locked_by = NULL
   WHERE id = p_report_id;

  RETURN jsonb_build_object('ok', true, 'done', v_done, 'exhausted', v_exhausted);
END;
$$;
REVOKE ALL ON FUNCTION public.record_advanced_intake_result(uuid, jsonb, jsonb, text, text, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_advanced_intake_result(uuid, jsonb, jsonb, text, text, boolean, text) TO service_role;

CREATE OR REPLACE FUNCTION public.delete_advanced_assessment_for_user(p_user_id uuid, p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_s public.advanced_assessment_sessions;
  v_r public.advanced_assessment_reports;
  v_refunded boolean := false;
BEGIN
  SELECT * INTO v_s FROM public.advanced_assessment_sessions WHERE id = p_session_id AND user_id = p_user_id FOR UPDATE;
  IF v_s.id IS NULL THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO v_r FROM public.advanced_assessment_reports WHERE session_id = p_session_id FOR UPDATE;

  -- A report still being worked on by the production pipeline can't be
  -- pulled out from under the worker mid-stage.
  IF v_r.id IS NOT NULL AND v_r.processing_mode = 'production' AND v_r.generation_status = 'pending'
     AND v_r.locked_at IS NOT NULL AND v_r.locked_at > now() - interval '5 minutes' THEN
    RAISE EXCEPTION 'report_in_progress' USING ERRCODE = '22023';
  END IF;

  IF v_r.id IS NOT NULL AND v_r.review_status IS DISTINCT FROM 'approved' THEN
    v_refunded := public._refund_advanced_session_pass(v_s);
  END IF;

  PERFORM public.log_advanced_assessment_audit(p_session_id, v_r.id, 'user', p_user_id, 'submission_deleted',
    jsonb_build_object('reference_number', v_r.reference_number, 'refunded', v_refunded,
      'processing_mode', v_r.processing_mode, 'intake_email_was_sent', coalesce(v_r.internal_email_status = 'sent', false)));

  IF v_r.id IS NOT NULL AND v_r.internal_email_status = 'sent' THEN
    PERFORM public.enqueue_email(
      'ADMIN_SKYNN_INTAKE_WITHDRAWN', 'admin_skynn_intake_withdrawn:' || v_r.id::text,
      'admin_skynn_intake_withdrawn', 'ADMIN', NULL, NULL,
      jsonb_build_object('reference_number', v_r.reference_number),
      'rpc:delete_advanced_assessment_for_user', false, 50::smallint
    );
  END IF;

  DELETE FROM public.advanced_assessment_sessions WHERE id = p_session_id;

  RETURN jsonb_build_object('pdf_path', v_r.pdf_storage_path, 'refunded', v_refunded, 'reference_number', v_r.reference_number);
END;
$$;
REVOKE ALL ON FUNCTION public.delete_advanced_assessment_for_user(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_advanced_assessment_for_user(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_advanced_assessment_for_review(
  p_report_id uuid,
  p_report jsonb,
  p_markdown text,
  p_email_summary text,
  p_triage text,
  p_mst_tier smallint,
  p_scores jsonb,
  p_qa_result jsonb,
  p_models jsonb,
  p_confidence text,
  p_prompt_set text,
  p_engine_version text,
  p_evidence_version text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report public.advanced_assessment_reports;
BEGIN
  SELECT * INTO v_report FROM public.advanced_assessment_reports WHERE id = p_report_id FOR UPDATE;
  IF v_report.id IS NULL OR v_report.generation_status <> 'pending' THEN
    RETURN; -- idempotent: already completed/failed
  END IF;

  UPDATE public.advanced_assessment_reports
     SET generation_status = 'completed',
         review_status = 'awaiting_review',
         generated_at = now(),
         report = p_report,
         rendered_markdown = p_markdown,
         email_summary = p_email_summary,
         triage = p_triage,
         mst_tier = p_mst_tier,
         scores = p_scores,
         qa_result = p_qa_result,
         models = p_models,
         confidence = p_confidence,
         prompt_set = p_prompt_set,
         prompt_version = p_prompt_set,
         engine_version = p_engine_version,
         evidence_version = p_evidence_version,
         safety_flags = jsonb_build_object('triage', p_triage),
         pipeline_stage = 'awaiting_review',
         locked_at = NULL,
         locked_by = NULL
   WHERE id = p_report_id;

  UPDATE public.advanced_assessment_sessions
     SET status = 'requires_review'
   WHERE id = v_report.session_id AND status IN ('submitted', 'processing');

  INSERT INTO public.advanced_assessment_events (user_id, session_id, event_type, metadata)
  VALUES (v_report.user_id, v_report.session_id, 'report_validated', jsonb_build_object('confidence', p_confidence, 'triage', p_triage));

  PERFORM public.log_advanced_assessment_audit(v_report.session_id, p_report_id, 'worker', NULL, 'held_for_review',
    jsonb_build_object('triage', p_triage, 'prompt_set', p_prompt_set, 'engine_version', p_engine_version));

  PERFORM public.enqueue_email(
    'ADMIN_SKYNN_REVIEW_NEEDED', 'admin_skynn_review:' || p_report_id::text,
    'admin_skynn_review_needed', 'ADMIN', NULL, NULL,
    jsonb_build_object('report_id', p_report_id, 'triage', p_triage,
      'mst_group', CASE WHEN p_mst_tier IS NULL THEN 'not provided' WHEN p_mst_tier <= 3 THEN '1-3' WHEN p_mst_tier <= 6 THEN '4-6' ELSE '7-10' END),
    'rpc:complete_advanced_assessment_for_review', false, 50::smallint,
    'admin_skynn_review:' || p_report_id::text
  );
END;
$$;
REVOKE ALL ON FUNCTION public.complete_advanced_assessment_for_review(uuid, jsonb, text, text, text, smallint, jsonb, jsonb, jsonb, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_advanced_assessment_for_review(uuid, jsonb, text, text, text, smallint, jsonb, jsonb, jsonb, text, text, text, text) TO service_role;
