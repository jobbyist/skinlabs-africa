-- SKYNN AI Advanced Dermatology Report — pre-approval intake ("fallback")
-- mode (2026-09-27).
--
-- While the v2 production pipeline waits on its dermatologist sign-off
-- record and a working AI transport, pass holders can still submit the
-- 2026.2 questionnaire. A fallback submission is an ORDINARY
-- advanced_assessment_reports row (same session, same consent gate, same
-- pass consumption and idempotency key as production) that:
--   * gets a human-readable reference number (SKYNN-ADV-YYYYMMDD-XXXXXX),
--   * snapshots the exact framework versions it was answered under,
--   * is NEVER claimed by the production model worker
--     (claim_advanced_assessment_jobs now requires processing_mode =
--     'production'), and instead
--   * is picked up by the worker's intake pass, which computes the
--     deterministic scores (no AI), renders an intake PDF into the private
--     `skynn-advanced-intake` bucket and emails it to reports@skinlabs.co.za,
--     with per-step state + backoff retries so no failure loses the row.
-- Moving to production later: set report_mode = 'production', record the
-- sign-off, then admin_promote_advanced_intake_to_production() flips queued
-- rows to processing_mode = 'production' and the existing pipeline runs
-- them from the stored answers. Release stays gated by the existing
-- dermatologist sign-off check in admin_review_advanced_assessment().

-- ---------- 1. Central mode flag ----------
ALTER TABLE public.skynn_advanced_assessment_config
  ADD COLUMN IF NOT EXISTS report_mode text NOT NULL DEFAULT 'fallback'
    CHECK (report_mode IN ('disabled', 'fallback', 'production'));

COMMENT ON COLUMN public.skynn_advanced_assessment_config.report_mode IS
  'What happens to a new Advanced Report submission. fallback = pre-approval intake (PDF + email to reports@, no AI). production = the v2 model pipeline. disabled = no new submissions. rollout_stage still decides WHO may submit.';

-- ---------- 2. Report columns ----------
ALTER TABLE public.advanced_assessment_reports
  ADD COLUMN IF NOT EXISTS reference_number text,
  ADD COLUMN IF NOT EXISTS processing_mode text NOT NULL DEFAULT 'production'
    CHECK (processing_mode IN ('fallback', 'production')),
  ADD COLUMN IF NOT EXISTS intake_status text
    CHECK (intake_status IS NULL OR intake_status IN ('submitted', 'pending', 'processing', 'review_required', 'approved', 'released', 'rejected', 'failed')),
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS definition_version text,
  ADD COLUMN IF NOT EXISTS scoring_version text,
  ADD COLUMN IF NOT EXISTS consent_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS intake_scores jsonb,
  ADD COLUMN IF NOT EXISTS intake_triage jsonb,
  ADD COLUMN IF NOT EXISTS pdf_storage_path text,
  ADD COLUMN IF NOT EXISTS pdf_status text CHECK (pdf_status IS NULL OR pdf_status IN ('pending', 'generated', 'failed')),
  ADD COLUMN IF NOT EXISTS pdf_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS pdf_error text,
  ADD COLUMN IF NOT EXISTS internal_email_status text CHECK (internal_email_status IS NULL OR internal_email_status IN ('pending', 'sent', 'failed', 'retrying')),
  ADD COLUMN IF NOT EXISTS internal_email_recipient text,
  ADD COLUMN IF NOT EXISTS internal_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS internal_email_attempts smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS internal_email_last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS internal_email_error text,
  ADD COLUMN IF NOT EXISTS intake_attempts smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intake_next_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_advanced_assessment_reports_reference
  ON public.advanced_assessment_reports (reference_number) WHERE reference_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_advanced_assessment_reports_mode_intake
  ON public.advanced_assessment_reports (processing_mode, intake_status);
CREATE INDEX IF NOT EXISTS idx_advanced_assessment_reports_submitted
  ON public.advanced_assessment_reports (submitted_at DESC);

COMMENT ON COLUMN public.advanced_assessment_reports.reference_number IS 'Member-facing reference, generated server-side by generate_advanced_report_reference(). Never sequential, never the row UUID.';
COMMENT ON COLUMN public.advanced_assessment_reports.processing_mode IS 'fallback = pre-approval intake row (never claimed by the model worker). production = v2 pipeline. Flipped by admin_promote_advanced_intake_to_production().';
COMMENT ON COLUMN public.advanced_assessment_reports.intake_status IS 'Member-facing lifecycle for fallback-era submissions (submitted -> pending, later processing/review_required/approved/released or rejected/failed). generation_status/review_status stay authoritative for the production pipeline.';
COMMENT ON COLUMN public.advanced_assessment_reports.pdf_storage_path IS 'Path inside the private skynn-advanced-intake bucket. Admin/service only; never granted to the owner.';

CREATE OR REPLACE FUNCTION public.touch_advanced_assessment_report_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.touch_advanced_assessment_report_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_advanced_assessment_reports_updated_at ON public.advanced_assessment_reports;
CREATE TRIGGER trg_advanced_assessment_reports_updated_at
  BEFORE UPDATE ON public.advanced_assessment_reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_advanced_assessment_report_updated_at();

-- Owners see status columns only (content still only via
-- get_my_advanced_assessment_report after approval). PDF path, email state,
-- consent/score snapshots stay admin/service-only.
GRANT SELECT (reference_number, processing_mode, intake_status, submitted_at)
  ON public.advanced_assessment_reports TO authenticated;

-- ---------- 3. Reference numbers ----------
-- Crockford-style alphabet (no 0/O/1/I/L/U) so a reference read out over
-- the phone or copied by hand can't be mistaken. 6 random symbols = 31^6 ≈
-- 887M per day; the unique index + retry loop handles the rare collision.
CREATE OR REPLACE FUNCTION public.generate_advanced_report_reference()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_alphabet constant text := '23456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_bytes bytea;
  v_suffix text;
  v_ref text;
  v_try int := 0;
BEGIN
  LOOP
    v_try := v_try + 1;
    v_bytes := extensions.gen_random_bytes(6);
    v_suffix := '';
    FOR i IN 0..5 LOOP
      v_suffix := v_suffix || substr(v_alphabet, (get_byte(v_bytes, i) % length(v_alphabet)) + 1, 1);
    END LOOP;
    v_ref := 'SKYNN-ADV-' || to_char(now() AT TIME ZONE 'Africa/Johannesburg', 'YYYYMMDD') || '-' || v_suffix;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.advanced_assessment_reports WHERE reference_number = v_ref);
    IF v_try >= 10 THEN
      RAISE EXCEPTION 'reference_generation_failed';
    END IF;
  END LOOP;
  RETURN v_ref;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_advanced_report_reference() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_advanced_report_reference() TO service_role;

-- Backfill any existing rows (none on production at the time of writing).
UPDATE public.advanced_assessment_reports
   SET reference_number = public.generate_advanced_report_reference()
 WHERE reference_number IS NULL;

-- ---------- 4. Shared pass refund helper ----------
-- Same verification as fail_advanced_assessment_session(): only refunds a
-- real advanced-analysis consumption belonging to the session's owner, and
-- only once (the 'refund:<tx>' reason is the idempotency key).
CREATE OR REPLACE FUNCTION public._refund_advanced_session_pass(p_session public.advanced_assessment_sessions)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reason text;
BEGIN
  IF p_session.access_type IS DISTINCT FROM 'analysis_pass' OR p_session.pass_transaction_id IS NULL THEN
    RETURN false;
  END IF;
  v_reason := 'refund:' || p_session.pass_transaction_id::text;
  IF EXISTS (
    SELECT 1 FROM public.ai_credit_transactions
     WHERE id = p_session.pass_transaction_id AND user_id = p_session.user_id
       AND reason = 'consume:advanced_analysis' AND delta = -1
  ) AND NOT EXISTS (
    SELECT 1 FROM public.ai_credit_transactions WHERE user_id = p_session.user_id AND reason = v_reason
  ) THEN
    INSERT INTO public.ai_credit_transactions (user_id, delta, reason) VALUES (p_session.user_id, 1, v_reason);
    RETURN true;
  END IF;
  RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public._refund_advanced_session_pass(public.advanced_assessment_sessions) FROM PUBLIC, anon, authenticated;

-- ---------- 5. Access: expose report_mode ----------
-- Return type changes (new column), so the old signature must be dropped.
DROP FUNCTION IF EXISTS public.get_advanced_assessment_access();
CREATE FUNCTION public.get_advanced_assessment_access()
RETURNS TABLE (eligible boolean, access_type text, membership_tier text, passes_available int, rollout_stage text, report_mode text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_member boolean;
  v_status text;
  v_balance int;
  v_stage text;
  v_mode text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT c.rollout_stage, c.report_mode INTO v_stage, v_mode FROM public.skynn_advanced_assessment_config c WHERE c.id = true;
  v_stage := coalesce(v_stage, 'disabled');
  v_mode := coalesce(v_mode, 'disabled');

  v_is_member := public.is_member(v_uid);
  SELECT lower(coalesce(p.subscription_status, '')) INTO v_status FROM public.profiles p WHERE p.user_id = v_uid;
  v_balance := public.available_ai_credits(v_uid);

  IF v_stage = 'disabled' OR v_mode = 'disabled' THEN
    RETURN QUERY SELECT false, 'none', v_status, v_balance, v_stage, v_mode;
  ELSIF v_stage = 'pass_holders_review' THEN
    -- An active Analysis Pass is the only way in, and every submission
    -- consumes one (membership alone does not qualify).
    IF v_balance > 0 THEN
      RETURN QUERY SELECT true, 'analysis_pass', v_status, v_balance, v_stage, v_mode;
    ELSE
      RETURN QUERY SELECT false, 'none', v_status, v_balance, v_stage, v_mode;
    END IF;
  ELSIF v_is_member THEN
    RETURN QUERY SELECT true, 'membership', v_status, v_balance, v_stage, v_mode;
  ELSIF v_balance > 0 THEN
    RETURN QUERY SELECT true, 'analysis_pass', v_status, v_balance, v_stage, v_mode;
  ELSE
    RETURN QUERY SELECT false, 'none', v_status, v_balance, v_stage, v_mode;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.get_advanced_assessment_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_advanced_assessment_access() TO authenticated;

-- ---------- 6. Submission ----------
-- Unchanged from 20260923100000 (consent gate, completeness recomputed
-- server-side, pass consumed exactly once, idempotent on retry) plus:
-- report_mode handling, a one-open-fallback-submission guard, the version /
-- consent snapshot, the server-generated reference and, in fallback mode,
-- the member's "request received" email. Return type gains
-- reference_number + processing_mode, so the old signature is dropped.
DROP FUNCTION IF EXISTS public.submit_advanced_assessment_session(uuid, jsonb);
CREATE FUNCTION public.submit_advanced_assessment_session(p_session_id uuid, p_safety_screen jsonb DEFAULT NULL)
RETURNS TABLE (report_id uuid, session_status text, access_type text, reference_number text, processing_mode text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_session public.advanced_assessment_sessions;
  v_definition public.assessment_definitions;
  v_real_completeness smallint;
  v_existing public.advanced_assessment_reports;
  v_key text;
  v_access record;
  v_pass record;
  v_report_id uuid;
  v_mode text;
  v_prompt_set text;
  v_ref text;
  v_email text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_session
    FROM public.advanced_assessment_sessions
   WHERE id = p_session_id AND user_id = v_uid
   FOR UPDATE;
  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotency: already submitted (retry, double-click, network replay) —
  -- return the existing report rather than resubmitting/re-charging.
  IF v_session.status NOT IN ('created', 'in_progress', 'review') THEN
    SELECT * INTO v_existing FROM public.advanced_assessment_reports WHERE session_id = p_session_id;
    RETURN QUERY SELECT v_existing.id, v_session.status, v_session.access_type, v_existing.reference_number, v_existing.processing_mode;
    RETURN;
  END IF;

  SELECT c.report_mode, c.active_prompt_set INTO v_mode, v_prompt_set
    FROM public.skynn_advanced_assessment_config c WHERE c.id = true;
  v_mode := coalesce(v_mode, 'disabled');
  IF v_mode = 'disabled' THEN
    RAISE EXCEPTION 'submissions_paused' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_definition FROM public.assessment_definitions WHERE id = v_session.assessment_definition_id;
  -- Recomputed from the session's own pinned definition + actual responses —
  -- the stored completeness_pct column is a client-writable UX cache and is
  -- never trusted for this gate.
  v_real_completeness := public.compute_assessment_completeness(v_definition.sections, v_session.responses);
  IF v_real_completeness < 100 THEN
    RAISE EXCEPTION 'assessment_incomplete' USING ERRCODE = '22023';
  END IF;

  -- Explicit POPIA consent (special personal information + cross-border)
  -- must be recorded BEFORE a pass is consumed.
  IF jsonb_path_exists(v_definition.sections, '$[*].questions[*] ? (@.id == "popia_special_info_consent")')
     AND (coalesce(v_session.responses ->> 'popia_special_info_consent', '') <> 'agree'
          OR coalesce(v_session.responses ->> 'popia_cross_border_consent', '') <> 'agree') THEN
    RAISE EXCEPTION 'consent_required' USING ERRCODE = '22023';
  END IF;

  -- One open pre-approval submission per member: a second one would charge
  -- another pass for a report that can't be produced any sooner.
  IF v_mode = 'fallback' AND EXISTS (
    SELECT 1 FROM public.advanced_assessment_reports r
     WHERE r.user_id = v_uid AND r.processing_mode = 'fallback' AND r.intake_status IN ('submitted', 'pending')
  ) THEN
    RAISE EXCEPTION 'duplicate_pending' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_access FROM public.get_advanced_assessment_access();
  IF NOT v_access.eligible THEN
    RAISE EXCEPTION 'not_eligible' USING ERRCODE = '42501';
  END IF;

  v_key := p_session_id::text || ':' || v_session.submission_version::text;

  IF v_access.access_type = 'analysis_pass' THEN
    SELECT * INTO v_pass FROM public.consume_analysis_pass();
    IF NOT v_pass.allowed THEN
      RAISE EXCEPTION 'insufficient_passes' USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.advanced_assessment_sessions
     SET status = 'submitted',
         submitted_at = now(),
         access_type = v_access.access_type,
         pass_transaction_id = CASE WHEN v_access.access_type = 'analysis_pass' THEN v_pass.transaction_id ELSE NULL END,
         idempotency_key = v_key,
         safety_screen = coalesce(p_safety_screen, safety_screen)
   WHERE id = p_session_id;

  v_ref := public.generate_advanced_report_reference();

  INSERT INTO public.advanced_assessment_reports (
    session_id, user_id, generation_status, reference_number, processing_mode, intake_status, submitted_at,
    prompt_set, definition_version, scoring_version, evidence_version, consent_snapshot,
    pdf_status, internal_email_status, internal_email_recipient
  )
  VALUES (
    p_session_id, v_uid, 'pending', v_ref, v_mode, CASE WHEN v_mode = 'fallback' THEN 'pending' END, now(),
    v_prompt_set, v_definition.version, v_definition.scoring_rules_version, v_definition.evidence_version,
    jsonb_build_object(
      'popia_special_info_consent', v_session.responses ->> 'popia_special_info_consent',
      'popia_cross_border_consent', v_session.responses ->> 'popia_cross_border_consent',
      'recorded_at', now()
    ),
    CASE WHEN v_mode = 'fallback' THEN 'pending' END,
    CASE WHEN v_mode = 'fallback' THEN 'pending' END,
    CASE WHEN v_mode = 'fallback' THEN 'reports@skinlabs.co.za' END
  )
  RETURNING id INTO v_report_id;

  INSERT INTO public.advanced_assessment_events (user_id, session_id, event_type, metadata)
  VALUES (v_uid, p_session_id, 'assessment_submitted', jsonb_build_object('access_type', v_access.access_type, 'processing_mode', v_mode));

  PERFORM public.log_advanced_assessment_audit(p_session_id, v_report_id, 'user', v_uid, 'submission_created',
    jsonb_build_object('access_type', v_access.access_type, 'processing_mode', v_mode,
      'definition_version', v_definition.version, 'prompt_set', v_prompt_set));

  IF v_mode = 'fallback' THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
    IF v_email IS NOT NULL THEN
      PERFORM public.enqueue_email(
        'ADVANCED_INTAKE_RECEIVED', 'advanced_intake_received:' || v_report_id::text,
        'advanced_intake_received', 'SKYNN', v_uid, v_email,
        jsonb_build_object('reference_number', v_ref, 'session_id', p_session_id),
        'rpc:submit_advanced_assessment_session'
      );
    END IF;
  END IF;

  RETURN QUERY SELECT v_report_id, 'submitted'::text, v_access.access_type, v_ref, v_mode;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_advanced_assessment_session(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_advanced_assessment_session(uuid, jsonb) TO authenticated;

-- ---------- 7. Production worker never touches fallback rows ----------
CREATE OR REPLACE FUNCTION public.claim_advanced_assessment_jobs(p_limit int, p_worker text)
RETURNS TABLE (report_id uuid, session_id uuid, user_id uuid, attempts smallint, pipeline_state jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dead record;
BEGIN
  FOR v_dead IN
    SELECT r.session_id FROM public.advanced_assessment_reports r
     WHERE r.generation_status = 'pending' AND r.processing_mode = 'production' AND r.attempts >= 6
       AND (r.locked_at IS NULL OR r.locked_at < now() - interval '5 minutes')
  LOOP
    PERFORM public.fail_advanced_assessment_session(v_dead.session_id, 'We couldn''t generate your report this time. Your Analysis Pass has been refunded.');
  END LOOP;

  RETURN QUERY
  WITH picked AS (
    SELECT r.id FROM public.advanced_assessment_reports r
     WHERE r.generation_status = 'pending' AND r.processing_mode = 'production' AND r.attempts < 6
       AND (r.locked_at IS NULL OR r.locked_at < now() - interval '5 minutes')
     ORDER BY r.created_at
     LIMIT greatest(1, least(p_limit, 5))
     FOR UPDATE SKIP LOCKED
  )
  UPDATE public.advanced_assessment_reports r
     SET locked_at = now(), locked_by = p_worker, attempts = r.attempts + 1
    FROM picked
   WHERE r.id = picked.id
  RETURNING r.id, r.session_id, r.user_id, r.attempts, r.pipeline_state;

  UPDATE public.advanced_assessment_sessions s
     SET status = 'processing'
   WHERE s.status = 'submitted'
     AND s.id IN (SELECT r.session_id FROM public.advanced_assessment_reports r
                   WHERE r.locked_by = p_worker AND r.processing_mode = 'production' AND r.locked_at > now() - interval '1 minute');
END;
$$;
REVOKE ALL ON FUNCTION public.claim_advanced_assessment_jobs(int, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_advanced_assessment_jobs(int, text) TO service_role;

-- ---------- 8. Intake worker RPCs (service_role only) ----------
-- Claims fallback rows that still need their PDF and/or internal email,
-- respecting the retry backoff, with the same 5-minute lease as the
-- production claim. Every claim counts as one intake attempt (max 6).
CREATE OR REPLACE FUNCTION public.claim_advanced_intake_jobs(p_limit int, p_worker text)
RETURNS TABLE (
  report_id uuid, session_id uuid, user_id uuid, reference_number text, submitted_at timestamptz,
  pdf_status text, pdf_storage_path text, internal_email_status text, intake_attempts smallint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH picked AS (
    SELECT r.id FROM public.advanced_assessment_reports r
     WHERE r.processing_mode = 'fallback'
       AND r.intake_status = 'pending'
       AND r.intake_attempts < 6
       AND (r.pdf_status IS DISTINCT FROM 'generated' OR r.internal_email_status IS DISTINCT FROM 'sent')
       AND (r.intake_next_attempt_at IS NULL OR r.intake_next_attempt_at <= now())
       AND (r.locked_at IS NULL OR r.locked_at < now() - interval '5 minutes')
     ORDER BY r.submitted_at
     LIMIT greatest(1, least(p_limit, 5))
     FOR UPDATE SKIP LOCKED
  )
  UPDATE public.advanced_assessment_reports r
     SET locked_at = now(), locked_by = p_worker, intake_attempts = r.intake_attempts + 1
    FROM picked
   WHERE r.id = picked.id
  RETURNING r.id, r.session_id, r.user_id, r.reference_number, r.submitted_at,
            r.pdf_status, r.pdf_storage_path, r.internal_email_status, r.intake_attempts;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_advanced_intake_jobs(int, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_advanced_intake_jobs(int, text) TO service_role;

-- Records one intake attempt's outcome. Anything not finished is retried
-- with backoff (1, 5, 15, 60, 180 min); after the 6th attempt the admin is
-- alerted once and the row stays pending (the submission itself is never
-- lost — an admin can retry from the dashboard).
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
      'rpc:record_advanced_intake_result', false, 50
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

-- ---------- 9. Member delete (withdraw) ----------
-- Called by skynn-advanced-assessment with the service client AFTER it has
-- verified the caller's JWT (p_user_id is that verified id, never client
-- input), so the stored PDF can be removed in the same request. Deletes the
-- session, which cascades to the report and its events. A submission that
-- hasn't been released is refunded first. The audit row keeps only the
-- reference and flags, no content. If the intake email had already gone to
-- reports@, the team is told to delete that mailbox copy too.
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
      'rpc:delete_advanced_assessment_for_user', false, 50
    );
  END IF;

  DELETE FROM public.advanced_assessment_sessions WHERE id = p_session_id;

  RETURN jsonb_build_object('pdf_path', v_r.pdf_storage_path, 'refunded', v_refunded, 'reference_number', v_r.reference_number);
END;
$$;
REVOKE ALL ON FUNCTION public.delete_advanced_assessment_for_user(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_advanced_assessment_for_user(uuid, uuid) TO service_role;

-- ---------- 10. Owner read path: add intake status fields ----------
CREATE OR REPLACE FUNCTION public.get_my_advanced_assessment_report(p_report_id uuid DEFAULT NULL, p_session_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_r public.advanced_assessment_reports;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_r FROM public.advanced_assessment_reports r
   WHERE r.user_id = v_uid
     AND ((p_report_id IS NOT NULL AND r.id = p_report_id) OR (p_report_id IS NULL AND r.session_id = p_session_id));
  IF v_r.id IS NULL THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'id', v_r.id,
    'session_id', v_r.session_id,
    'created_at', v_r.created_at,
    'generated_at', v_r.generated_at,
    'generation_status', v_r.generation_status,
    'review_status', v_r.review_status,
    'released_at', v_r.released_at,
    'error_message', v_r.error_message,
    'reference_number', v_r.reference_number,
    'processing_mode', v_r.processing_mode,
    'intake_status', v_r.intake_status,
    'submitted_at', v_r.submitted_at,
    'triage', CASE WHEN v_r.review_status = 'approved' THEN v_r.triage END,
    'confidence', CASE WHEN v_r.review_status = 'approved' THEN v_r.confidence END,
    'report', CASE WHEN v_r.review_status = 'approved' THEN v_r.report END,
    'rendered_markdown', CASE WHEN v_r.review_status = 'approved' THEN v_r.rendered_markdown END,
    'engine_version', v_r.engine_version,
    'prompt_version', CASE WHEN v_r.review_status = 'approved' THEN v_r.prompt_set END
  );
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_advanced_assessment_report(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_advanced_assessment_report(uuid, uuid) TO authenticated;

-- ---------- 11. Admin RPCs ----------
CREATE OR REPLACE FUNCTION public.admin_list_advanced_intake(
  p_status text DEFAULT NULL,
  p_mode text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  report_id uuid, session_id uuid, reference_number text, user_id uuid, user_email text,
  submitted_at timestamptz, status text, processing_mode text, definition_version text,
  access_type text, pass_consumed boolean, pdf_status text, internal_email_status text,
  internal_email_attempts smallint, updated_at timestamptz, total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_search text := nullif(trim(coalesce(p_search, '')), '');
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT r.id, r.session_id, r.reference_number, r.user_id, u.email::text,
         coalesce(r.submitted_at, r.created_at),
         CASE
           WHEN r.processing_mode = 'fallback' THEN r.intake_status
           WHEN r.review_status = 'approved' THEN 'released'
           WHEN r.review_status = 'rejected' THEN 'rejected'
           WHEN r.review_status = 'awaiting_review' THEN 'review_required'
           WHEN r.generation_status = 'failed' THEN 'failed'
           ELSE 'processing'
         END,
         r.processing_mode, r.definition_version, s.access_type,
         s.pass_transaction_id IS NOT NULL,
         r.pdf_status, r.internal_email_status, r.internal_email_attempts, r.updated_at,
         count(*) OVER ()
    FROM public.advanced_assessment_reports r
    JOIN public.advanced_assessment_sessions s ON s.id = r.session_id
    LEFT JOIN auth.users u ON u.id = r.user_id
   WHERE (p_mode IS NULL OR r.processing_mode = p_mode)
     AND (p_from IS NULL OR coalesce(r.submitted_at, r.created_at) >= p_from)
     AND (p_to IS NULL OR coalesce(r.submitted_at, r.created_at) < p_to)
     AND (v_search IS NULL
          OR r.reference_number ILIKE '%' || v_search || '%'
          OR u.email ILIKE '%' || v_search || '%'
          OR r.user_id::text = v_search)
     AND (p_status IS NULL OR p_status = CASE
           WHEN r.processing_mode = 'fallback' THEN r.intake_status
           WHEN r.review_status = 'approved' THEN 'released'
           WHEN r.review_status = 'rejected' THEN 'rejected'
           WHEN r.review_status = 'awaiting_review' THEN 'review_required'
           WHEN r.generation_status = 'failed' THEN 'failed'
           ELSE 'processing'
         END)
   ORDER BY coalesce(r.submitted_at, r.created_at) DESC
   LIMIT least(greatest(coalesce(p_limit, 50), 1), 200)
   OFFSET greatest(coalesce(p_offset, 0), 0);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_advanced_intake(text, text, text, timestamptz, timestamptz, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_advanced_intake(text, text, text, timestamptz, timestamptz, int, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_advanced_intake(p_report_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_r public.advanced_assessment_reports;
  v_s public.advanced_assessment_sessions;
  v_email text;
  v_sections jsonb;
  v_cfg public.skynn_advanced_assessment_config;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_r FROM public.advanced_assessment_reports WHERE id = p_report_id;
  IF v_r.id IS NULL THEN RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_s FROM public.advanced_assessment_sessions WHERE id = v_r.session_id;
  SELECT email INTO v_email FROM auth.users WHERE id = v_r.user_id;
  SELECT sections INTO v_sections FROM public.assessment_definitions WHERE id = v_s.assessment_definition_id;
  SELECT * INTO v_cfg FROM public.skynn_advanced_assessment_config WHERE id = true;

  PERFORM public.log_advanced_assessment_audit(v_r.session_id, v_r.id, 'admin', auth.uid(), 'admin_viewed', '{}'::jsonb);

  RETURN jsonb_build_object(
    'report_id', v_r.id,
    'session_id', v_r.session_id,
    'reference_number', v_r.reference_number,
    'user_id', v_r.user_id,
    'user_email', v_email,
    'submitted_at', coalesce(v_r.submitted_at, v_r.created_at),
    'updated_at', v_r.updated_at,
    'processing_mode', v_r.processing_mode,
    'intake_status', v_r.intake_status,
    'generation_status', v_r.generation_status,
    'review_status', v_r.review_status,
    'versions', jsonb_build_object(
      'prompt_set', v_r.prompt_set, 'definition_version', coalesce(v_r.definition_version, v_s.assessment_version),
      'scoring_version', coalesce(v_r.scoring_version, v_s.scoring_rules_version), 'evidence_version', v_r.evidence_version,
      'engine_version', v_s.engine_version),
    'consent', v_r.consent_snapshot,
    'access', jsonb_build_object('access_type', v_s.access_type, 'pass_consumed', v_s.pass_transaction_id IS NOT NULL),
    'scores', v_r.intake_scores,
    'triage', v_r.intake_triage,
    'safety_screen', v_s.safety_screen,
    'pdf', jsonb_build_object('status', v_r.pdf_status, 'available', v_r.pdf_storage_path IS NOT NULL AND v_r.pdf_status = 'generated',
      'generated_at', v_r.pdf_generated_at, 'error', v_r.pdf_error),
    'email', jsonb_build_object('status', v_r.internal_email_status, 'recipient', v_r.internal_email_recipient,
      'sent_at', v_r.internal_email_sent_at, 'attempts', v_r.internal_email_attempts,
      'last_attempt_at', v_r.internal_email_last_attempt_at, 'error', v_r.internal_email_error),
    'intake_attempts', v_r.intake_attempts,
    'review_notes', v_r.review_notes,
    'report_mode', v_cfg.report_mode,
    'responses', v_s.responses,
    'sections', v_sections
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_get_advanced_intake(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_advanced_intake(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_retry_advanced_intake(p_report_id uuid, p_what text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_r public.advanced_assessment_reports;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_what NOT IN ('pdf', 'email', 'all') THEN
    RAISE EXCEPTION 'invalid_decision' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_r FROM public.advanced_assessment_reports WHERE id = p_report_id FOR UPDATE;
  IF v_r.id IS NULL OR v_r.processing_mode <> 'fallback' OR v_r.intake_status <> 'pending' THEN
    RAISE EXCEPTION 'not_retryable' USING ERRCODE = '22023';
  END IF;

  UPDATE public.advanced_assessment_reports
     SET pdf_status = CASE WHEN p_what IN ('pdf', 'all') THEN 'pending' ELSE pdf_status END,
         internal_email_status = CASE WHEN p_what IN ('email', 'all') THEN 'retrying' ELSE internal_email_status END,
         intake_attempts = 0,
         intake_next_attempt_at = now(),
         locked_at = NULL,
         locked_by = NULL
   WHERE id = p_report_id;

  PERFORM public.log_advanced_assessment_audit(v_r.session_id, v_r.id, 'admin', auth.uid(), 'admin_retry', jsonb_build_object('what', p_what));
END;
$$;
REVOKE ALL ON FUNCTION public.admin_retry_advanced_intake(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_retry_advanced_intake(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reject_advanced_intake(p_report_id uuid, p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_r public.advanced_assessment_reports;
  v_s public.advanced_assessment_sessions;
  v_refunded boolean;
  v_email text;
BEGIN
  IF NOT public.has_role(v_admin, 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_r FROM public.advanced_assessment_reports WHERE id = p_report_id FOR UPDATE;
  IF v_r.id IS NULL OR v_r.processing_mode <> 'fallback' OR v_r.intake_status <> 'pending' THEN
    RAISE EXCEPTION 'not_retryable' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_s FROM public.advanced_assessment_sessions WHERE id = v_r.session_id FOR UPDATE;

  v_refunded := public._refund_advanced_session_pass(v_s);

  UPDATE public.advanced_assessment_reports
     SET intake_status = 'rejected', generation_status = 'failed',
         reviewed_by = v_admin, reviewed_at = now(), review_notes = p_notes,
         error_message = 'We couldn''t take this request forward. Your Analysis Pass has been refunded.',
         locked_at = NULL, locked_by = NULL, intake_next_attempt_at = NULL
   WHERE id = p_report_id;
  UPDATE public.advanced_assessment_sessions SET status = 'failed', failure_reason = 'rejected_in_intake' WHERE id = v_r.session_id;

  SELECT email INTO v_email FROM auth.users WHERE id = v_r.user_id;
  IF v_email IS NOT NULL THEN
    PERFORM public.enqueue_email(
      'ADVANCED_REPORT_NOT_RELEASED', 'advanced_report_not_released:' || p_report_id::text,
      'advanced_report_not_released', 'SKYNN', v_r.user_id, v_email,
      jsonb_build_object('refunded', v_refunded),
      'rpc:admin_reject_advanced_intake'
    );
  END IF;

  PERFORM public.log_advanced_assessment_audit(v_r.session_id, p_report_id, 'admin', v_admin, 'report_rejected',
    jsonb_build_object('refunded', v_refunded, 'has_notes', p_notes IS NOT NULL, 'processing_mode', 'fallback'));

  RETURN jsonb_build_object('refunded', v_refunded);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reject_advanced_intake(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_advanced_intake(uuid, text) TO authenticated;

-- Hands queued pre-approval submissions to the production pipeline. Only
-- allowed once report_mode = 'production'; the pipeline still holds every
-- generated report for human review, and admin_review_advanced_assessment
-- still refuses release until the dermatologist sign-off is recorded.
CREATE OR REPLACE FUNCTION public.admin_promote_advanced_intake_to_production(p_report_ids uuid[] DEFAULT NULL)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_mode text;
  v_count int;
BEGIN
  IF NOT public.has_role(v_admin, 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT report_mode INTO v_mode FROM public.skynn_advanced_assessment_config WHERE id = true;
  IF v_mode IS DISTINCT FROM 'production' THEN
    RAISE EXCEPTION 'production_mode_required' USING ERRCODE = '22023';
  END IF;

  WITH moved AS (
    UPDATE public.advanced_assessment_reports r
       SET processing_mode = 'production', intake_status = 'processing', generation_status = 'pending',
           attempts = 0, locked_at = NULL, locked_by = NULL, intake_next_attempt_at = NULL
     WHERE r.processing_mode = 'fallback' AND r.intake_status = 'pending'
       AND (p_report_ids IS NULL OR r.id = ANY (p_report_ids))
    RETURNING r.id, r.session_id
  ), audited AS (
    INSERT INTO public.advanced_assessment_audit_log (session_id, report_id, actor_type, actor_id, action, meta)
    SELECT m.session_id, m.id, 'admin', v_admin, 'production_processing_initiated', '{}'::jsonb FROM moved m
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM audited;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_promote_advanced_intake_to_production(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_promote_advanced_intake_to_production(uuid[]) TO authenticated;

-- ---------- 12. Private storage for intake PDFs ----------
-- No storage policies at all: only the service role (the worker, and the
-- API function after an admin check) can read or write. Admins open a file
-- through a 60-second signed URL minted server-side.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('skynn-advanced-intake', 'skynn-advanced-intake', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 10485760, allowed_mime_types = ARRAY['application/pdf'];

-- ---------- 13. Worker cron: also fire for pending intake work ----------
SELECT cron.schedule(
  'skynn-advanced-worker',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/skynn-advanced-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'skynn_worker_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  )
  WHERE EXISTS (
    SELECT 1 FROM public.advanced_assessment_reports
     WHERE (locked_at IS NULL OR locked_at < now() - interval '5 minutes')
       AND (
         (processing_mode = 'production' AND generation_status = 'pending')
         OR (processing_mode = 'fallback' AND intake_status = 'pending' AND intake_attempts < 6
             AND (pdf_status IS DISTINCT FROM 'generated' OR internal_email_status IS DISTINCT FROM 'sent')
             AND (intake_next_attempt_at IS NULL OR intake_next_attempt_at <= now()))
       )
  );
  $$
);
