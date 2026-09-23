-- SKYNN AI v2 — Advanced AI Dermatology Report framework, first production
-- iteration (2026-09-23). Master reference: "SKYNN AI v2 – Dermatologist-
-- Approved, POPIA- and SAHPRA-Aligned Skin Assessment Framework". Builds on
-- 20260916164921_advanced_assessment_engine_core.sql rather than replacing it.
--
-- What this adds:
--   1. A multi-role prompt registry (intake / safety / fairness / reasoner /
--      writer / qa) grouped into versioned "prompt sets", still service-role
--      only, plus a dermatologist sign-off record per prompt set. Release of
--      ANY report is blocked in SQL until that sign-off carries the
--      approving dermatologist's name + HPCSA number.
--   2. Evidence catalogue citation codes (C1...), PMID/DOI columns.
--   3. Async generation: reports carry resumable pipeline state and a lease
--      (locked_at) so a pg_cron-driven worker (skynn-advanced-worker) can
--      claim, run, pause and resume jobs.
--   4. Mandatory human review: a generated report is held in
--      review_status = 'awaiting_review' and its content is NOT readable by
--      its owner (column-level grants + an RPC that only returns content
--      once approved). Admins approve/reject from the dashboard; a rejection
--      refunds the Analysis Pass.
--   5. An append-only audit log (framework §11: every state change and
--      prompt/sign-off action is logged; prompt bodies never are).
--   6. Rollout stage 'pass_holders_review': eligible iff the member holds an
--      active Analysis Pass; every submission consumes one.

-- ---------- 1. Prompt registry v2 ----------
ALTER TABLE public.assessment_prompt_versions
  ADD COLUMN IF NOT EXISTS prompt_set text,
  ADD COLUMN IF NOT EXISTS role text CHECK (role IS NULL OR role IN ('intake', 'safety', 'fairness', 'reasoner', 'writer', 'qa')),
  ADD COLUMN IF NOT EXISTS model_task text,
  ADD COLUMN IF NOT EXISTS source_reference text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_prompt_versions_set_role
  ON public.assessment_prompt_versions (prompt_set, role) WHERE prompt_set IS NOT NULL;

COMMENT ON COLUMN public.assessment_prompt_versions.prompt_set IS 'SKYNN v2: groups the six role prompts that ship together (e.g. skynn-v2.0.0). Sign-off and activation happen per set.';
COMMENT ON COLUMN public.assessment_prompt_versions.role IS 'SKYNN v2 pipeline stage this prompt drives. NULL for the v1 single-prompt rows.';

CREATE TABLE IF NOT EXISTS public.assessment_prompt_signoffs (
  prompt_set text PRIMARY KEY,
  definition_version text NOT NULL REFERENCES public.assessment_definitions (version),
  status text NOT NULL DEFAULT 'pending_details' CHECK (status IN ('pending_details', 'signed_off', 'revoked')),
  dermatologist_name text,
  hpcsa_number text,
  approved_on date,
  notes text,
  recorded_by uuid REFERENCES auth.users (id),
  recorded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT signoff_details_complete CHECK (
    status <> 'signed_off' OR (dermatologist_name IS NOT NULL AND hpcsa_number IS NOT NULL AND approved_on IS NOT NULL)
  )
);

COMMENT ON TABLE public.assessment_prompt_signoffs IS 'Dermatologist sign-off record for a SKYNN prompt set + question library (framework §12 go-live gate). admin_review_advanced_assessment refuses to release any report while the active set is not signed_off. Admin-readable via RPC only.';

ALTER TABLE public.assessment_prompt_signoffs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assessment_prompt_signoffs FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_assessment_prompt_signoffs_definition ON public.assessment_prompt_signoffs (definition_version);
CREATE INDEX IF NOT EXISTS idx_assessment_prompt_signoffs_recorded_by ON public.assessment_prompt_signoffs (recorded_by);

ALTER TABLE public.skynn_advanced_assessment_config
  ADD COLUMN IF NOT EXISTS active_prompt_set text;

ALTER TABLE public.skynn_advanced_assessment_config DROP CONSTRAINT IF EXISTS skynn_advanced_assessment_config_rollout_stage_check;
ALTER TABLE public.skynn_advanced_assessment_config
  ADD CONSTRAINT skynn_advanced_assessment_config_rollout_stage_check
  CHECK (rollout_stage IN ('disabled', 'internal', 'beta', 'pass_holders_review', 'public'));

-- ---------- 2. Evidence catalogue citation codes ----------
ALTER TABLE public.advanced_assessment_evidence
  ADD COLUMN IF NOT EXISTS citation_code text,
  ADD COLUMN IF NOT EXISTS pmid text,
  ADD COLUMN IF NOT EXISTS doi text,
  ADD COLUMN IF NOT EXISTS publication_year int,
  ADD COLUMN IF NOT EXISTS verification_note text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_advanced_assessment_evidence_code ON public.advanced_assessment_evidence (citation_code) WHERE citation_code IS NOT NULL;

-- ---------- 3/4. Reports: async pipeline + human review ----------
ALTER TABLE public.advanced_assessment_reports
  ADD COLUMN IF NOT EXISTS review_status text CHECK (review_status IS NULL OR review_status IN ('awaiting_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users (id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS released_at timestamptz,
  ADD COLUMN IF NOT EXISTS triage text CHECK (triage IS NULL OR triage IN ('clear', 'caution', 'escalate')),
  ADD COLUMN IF NOT EXISTS mst_tier smallint CHECK (mst_tier IS NULL OR mst_tier BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS scores jsonb,
  ADD COLUMN IF NOT EXISTS rendered_markdown text,
  ADD COLUMN IF NOT EXISTS email_summary text,
  ADD COLUMN IF NOT EXISTS qa_result jsonb,
  ADD COLUMN IF NOT EXISTS models jsonb,
  ADD COLUMN IF NOT EXISTS prompt_set text,
  ADD COLUMN IF NOT EXISTS pipeline_state jsonb,
  ADD COLUMN IF NOT EXISTS pipeline_stage text,
  ADD COLUMN IF NOT EXISTS attempts smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by text;

CREATE INDEX IF NOT EXISTS idx_advanced_assessment_reports_pending ON public.advanced_assessment_reports (created_at) WHERE generation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_advanced_assessment_reports_review ON public.advanced_assessment_reports (review_status, generated_at);
CREATE INDEX IF NOT EXISTS idx_advanced_assessment_reports_reviewed_by ON public.advanced_assessment_reports (reviewed_by);

COMMENT ON COLUMN public.advanced_assessment_reports.pipeline_state IS 'Resumable SKYNN v2 stage outputs (incl. the per-session salt). Service-role/admin only — never granted to the owner.';
COMMENT ON COLUMN public.advanced_assessment_reports.review_status IS 'SKYNN v2 mandatory human review. Content is only returned to the owner once approved (get_my_advanced_assessment_report).';

-- Owners may see STATUS columns directly, never content: content is only
-- served by get_my_advanced_assessment_report() after approval. Admins read
-- full rows through their own RPCs below (and the existing admin RLS policy
-- still applies to the granted columns).
REVOKE SELECT ON public.advanced_assessment_reports FROM authenticated;
GRANT SELECT (id, session_id, user_id, created_at, generated_at, generation_status, error_message, review_status, released_at, triage)
  ON public.advanced_assessment_reports TO authenticated;

-- ---------- 5. Audit log ----------
CREATE TABLE IF NOT EXISTS public.advanced_assessment_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  session_id uuid REFERENCES public.advanced_assessment_sessions (id) ON DELETE SET NULL,
  report_id uuid REFERENCES public.advanced_assessment_reports (id) ON DELETE SET NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('system', 'worker', 'admin', 'user')),
  actor_id uuid,
  action text NOT NULL,
  -- Sanitised metadata only: stage names, statuses, counts, versions. Never
  -- responses, prompts, report text or provider payloads.
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.advanced_assessment_audit_log IS 'SKYNN v2 append-only audit trail (framework §11): session state changes, pipeline stages, reviews, prompt sign-offs. No content, no prompt bodies. Admin-readable; writes only via SECURITY DEFINER functions / service role.';

CREATE INDEX IF NOT EXISTS idx_advanced_assessment_audit_session ON public.advanced_assessment_audit_log (session_id, at);
CREATE INDEX IF NOT EXISTS idx_advanced_assessment_audit_report ON public.advanced_assessment_audit_log (report_id, at);

ALTER TABLE public.advanced_assessment_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.advanced_assessment_audit_log FROM anon, authenticated;
GRANT SELECT ON public.advanced_assessment_audit_log TO authenticated;
CREATE POLICY "Admins can read the assessment audit log"
  ON public.advanced_assessment_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

CREATE OR REPLACE FUNCTION public.log_advanced_assessment_audit(
  p_session_id uuid, p_report_id uuid, p_actor_type text, p_actor_id uuid, p_action text, p_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.advanced_assessment_audit_log (session_id, report_id, actor_type, actor_id, action, meta)
  VALUES (p_session_id, p_report_id, p_actor_type, p_actor_id, p_action, coalesce(p_meta, '{}'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.log_advanced_assessment_audit(uuid, uuid, text, uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_advanced_assessment_audit(uuid, uuid, text, uuid, text, jsonb) TO service_role;

-- ---------- 6. Access: pass holders ----------
CREATE OR REPLACE FUNCTION public.get_advanced_assessment_access()
RETURNS TABLE (eligible boolean, access_type text, membership_tier text, passes_available int, rollout_stage text)
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
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT c.rollout_stage INTO v_stage FROM public.skynn_advanced_assessment_config c WHERE c.id = true;
  v_stage := coalesce(v_stage, 'disabled');

  v_is_member := public.is_member(v_uid);
  SELECT lower(coalesce(p.subscription_status, '')) INTO v_status FROM public.profiles p WHERE p.user_id = v_uid;
  v_balance := public.available_ai_credits(v_uid);

  IF v_stage = 'disabled' THEN
    RETURN QUERY SELECT false, 'none', v_status, v_balance, v_stage;
  ELSIF v_stage = 'pass_holders_review' THEN
    -- Human-reviewed beta: an active Analysis Pass is the only way in, and
    -- every submission consumes one (membership alone does not qualify).
    IF v_balance > 0 THEN
      RETURN QUERY SELECT true, 'analysis_pass', v_status, v_balance, v_stage;
    ELSE
      RETURN QUERY SELECT false, 'none', v_status, v_balance, v_stage;
    END IF;
  ELSIF v_is_member THEN
    RETURN QUERY SELECT true, 'membership', v_status, v_balance, v_stage;
  ELSIF v_balance > 0 THEN
    RETURN QUERY SELECT true, 'analysis_pass', v_status, v_balance, v_stage;
  ELSE
    RETURN QUERY SELECT false, 'none', v_status, v_balance, v_stage;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.get_advanced_assessment_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_advanced_assessment_access() TO authenticated;

-- ---------- Submission: consent gate + audit ----------
-- Same as 20260916164921's version plus the POPIA consent check and an
-- audit row; everything else (idempotency, pass consumption at submit time)
-- is unchanged.
CREATE OR REPLACE FUNCTION public.submit_advanced_assessment_session(p_session_id uuid, p_safety_screen jsonb DEFAULT NULL)
RETURNS TABLE (report_id uuid, session_status text, access_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_session public.advanced_assessment_sessions;
  v_sections jsonb;
  v_real_completeness smallint;
  v_existing_report_id uuid;
  v_key text;
  v_access record;
  v_pass record;
  v_report_id uuid;
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
    SELECT id INTO v_existing_report_id FROM public.advanced_assessment_reports WHERE session_id = p_session_id;
    RETURN QUERY SELECT v_existing_report_id, v_session.status, v_session.access_type;
    RETURN;
  END IF;

  -- Recomputed from the session's own pinned definition + actual responses —
  -- the stored completeness_pct column is a client-writable UX cache and is
  -- never trusted for this gate (see compute_assessment_completeness()).
  SELECT sections INTO v_sections FROM public.assessment_definitions WHERE id = v_session.assessment_definition_id;
  v_real_completeness := public.compute_assessment_completeness(v_sections, v_session.responses);
  IF v_real_completeness < 100 THEN
    RAISE EXCEPTION 'assessment_incomplete' USING ERRCODE = '22023';
  END IF;

  -- SKYNN v2: explicit POPIA consent (s26/s27 special personal information,
  -- s72 cross-border) must be recorded BEFORE a pass is consumed. Only
  -- enforced for definitions that ask for it (2026.2+).
  IF jsonb_path_exists(v_sections, '$[*].questions[*] ? (@.id == "popia_special_info_consent")')
     AND (coalesce(v_session.responses ->> 'popia_special_info_consent', '') <> 'agree'
          OR coalesce(v_session.responses ->> 'popia_cross_border_consent', '') <> 'agree') THEN
    RAISE EXCEPTION 'consent_required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_access FROM public.get_advanced_assessment_access();
  IF NOT v_access.eligible THEN
    RAISE EXCEPTION 'not_eligible' USING ERRCODE = '42501';
  END IF;

  v_key := p_session_id::text || ':' || v_session.submission_version::text;

  -- Consume exactly at submission (never at session creation), per section 19.
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

  INSERT INTO public.advanced_assessment_reports (session_id, user_id, generation_status)
  VALUES (p_session_id, v_uid, 'pending')
  RETURNING id INTO v_report_id;

  INSERT INTO public.advanced_assessment_events (user_id, session_id, event_type, metadata)
  VALUES (v_uid, p_session_id, 'assessment_submitted', jsonb_build_object('access_type', v_access.access_type));

  PERFORM public.log_advanced_assessment_audit(p_session_id, v_report_id, 'user', v_uid, 'submitted',
    jsonb_build_object('access_type', v_access.access_type, 'assessment_version', v_session.assessment_version));

  RETURN QUERY SELECT v_report_id, 'submitted'::text, v_access.access_type;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_advanced_assessment_session(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_advanced_assessment_session(uuid, jsonb) TO authenticated;

-- ---------- Worker RPCs (service_role only) ----------

-- Constant-time-ish comparison against the Vault secret the pg_cron job
-- sends, so the worker needs no separately-set Edge Function secret (the
-- documented MARKETPLACE_CRON_SECRET-style gap doesn't recur here).
CREATE OR REPLACE FUNCTION public.verify_skynn_worker_secret(p_secret text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected text;
BEGIN
  SELECT decrypted_secret INTO v_expected FROM vault.decrypted_secrets WHERE name = 'skynn_worker_cron_secret';
  IF v_expected IS NULL OR p_secret IS NULL OR length(p_secret) <> length(v_expected) THEN
    RETURN false;
  END IF;
  RETURN extensions.digest(p_secret, 'sha256') = extensions.digest(v_expected, 'sha256');
END;
$$;
REVOKE ALL ON FUNCTION public.verify_skynn_worker_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_skynn_worker_secret(text) TO service_role;

-- Claims up to p_limit pending reports with a 5-minute lease. A report that
-- has burned 6 attempts is failed (and its pass refunded) instead of being
-- retried forever.
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
     WHERE r.generation_status = 'pending' AND r.attempts >= 6
       AND (r.locked_at IS NULL OR r.locked_at < now() - interval '5 minutes')
  LOOP
    PERFORM public.fail_advanced_assessment_session(v_dead.session_id, 'We couldn''t generate your report this time. Your Analysis Pass has been refunded.');
  END LOOP;

  RETURN QUERY
  WITH picked AS (
    SELECT r.id FROM public.advanced_assessment_reports r
     WHERE r.generation_status = 'pending' AND r.attempts < 6
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
     AND s.id IN (SELECT r.session_id FROM public.advanced_assessment_reports r WHERE r.locked_by = p_worker AND r.locked_at > now() - interval '1 minute');
END;
$$;
REVOKE ALL ON FUNCTION public.claim_advanced_assessment_jobs(int, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_advanced_assessment_jobs(int, text) TO service_role;

CREATE OR REPLACE FUNCTION public.save_advanced_assessment_pipeline_state(p_report_id uuid, p_state jsonb, p_stage text, p_release boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session uuid;
BEGIN
  UPDATE public.advanced_assessment_reports
     SET pipeline_state = p_state,
         pipeline_stage = p_stage,
         locked_at = CASE WHEN p_release THEN NULL ELSE now() END,
         locked_by = CASE WHEN p_release THEN NULL ELSE locked_by END
   WHERE id = p_report_id AND generation_status = 'pending'
  RETURNING session_id INTO v_session;

  IF v_session IS NOT NULL AND NOT p_release THEN
    PERFORM public.log_advanced_assessment_audit(v_session, p_report_id, 'worker', NULL, 'stage_completed', jsonb_build_object('stage', p_stage));
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.save_advanced_assessment_pipeline_state(uuid, jsonb, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_advanced_assessment_pipeline_state(uuid, jsonb, text, boolean) TO service_role;

-- Persists a QA-approved report and HOLDS it for human review. The owner
-- cannot read its content until admin_review_advanced_assessment approves.
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
    'rpc:complete_advanced_assessment_for_review', false, 50,
    'admin_skynn_review:' || p_report_id::text
  );
END;
$$;
REVOKE ALL ON FUNCTION public.complete_advanced_assessment_for_review(uuid, jsonb, text, text, text, smallint, jsonb, jsonb, jsonb, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_advanced_assessment_for_review(uuid, jsonb, text, text, text, smallint, jsonb, jsonb, jsonb, text, text, text, text) TO service_role;

-- Existing failure path, extended: audit + a "we refunded your pass" email.
CREATE OR REPLACE FUNCTION public.fail_advanced_assessment_session(p_session_id uuid, p_error_message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.advanced_assessment_sessions;
  v_refund_reason text;
  v_refunded boolean := false;
  v_email text;
BEGIN
  SELECT * INTO v_session FROM public.advanced_assessment_sessions WHERE id = p_session_id FOR UPDATE;
  IF v_session.id IS NULL THEN RETURN; END IF;
  IF v_session.status NOT IN ('submitted', 'processing') THEN RETURN; END IF;

  IF v_session.access_type = 'analysis_pass' AND v_session.pass_transaction_id IS NOT NULL THEN
    v_refund_reason := 'refund:' || v_session.pass_transaction_id::text;
    IF EXISTS (
      SELECT 1 FROM public.ai_credit_transactions
       WHERE id = v_session.pass_transaction_id AND user_id = v_session.user_id
         AND reason = 'consume:advanced_analysis' AND delta = -1
    ) AND NOT EXISTS (
      SELECT 1 FROM public.ai_credit_transactions WHERE user_id = v_session.user_id AND reason = v_refund_reason
    ) THEN
      INSERT INTO public.ai_credit_transactions (user_id, delta, reason)
      VALUES (v_session.user_id, 1, v_refund_reason);
      v_refunded := true;
    END IF;
  END IF;

  UPDATE public.advanced_assessment_sessions
     SET status = 'failed', failure_reason = left(coalesce(p_error_message, 'unknown_error'), 500)
   WHERE id = p_session_id;

  UPDATE public.advanced_assessment_reports
     SET generation_status = 'failed',
         error_message = left(coalesce(p_error_message, 'Something went wrong generating your report.'), 500),
         locked_at = NULL, locked_by = NULL
   WHERE session_id = p_session_id;

  INSERT INTO public.advanced_assessment_events (user_id, session_id, event_type, metadata)
  VALUES (v_session.user_id, p_session_id, 'generation_failed', '{}'::jsonb);

  PERFORM public.log_advanced_assessment_audit(p_session_id, NULL, 'worker', NULL, 'generation_failed', jsonb_build_object('refunded', v_refunded));

  SELECT email INTO v_email FROM auth.users WHERE id = v_session.user_id;
  IF v_email IS NOT NULL THEN
    PERFORM public.enqueue_email(
      'ADVANCED_ASSESSMENT_FAILED', 'advanced_assessment_failed:' || p_session_id::text,
      'analysis_failed', 'SKYNN', v_session.user_id, v_email, '{}'::jsonb,
      'rpc:fail_advanced_assessment_session'
    );
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.fail_advanced_assessment_session(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_advanced_assessment_session(uuid, text) TO service_role;

-- ---------- Owner read path ----------
-- Status for any of the caller's reports; content only once approved.
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

-- ---------- Admin review RPCs ----------
CREATE OR REPLACE FUNCTION public.admin_list_advanced_assessment_reviews(p_status text DEFAULT 'awaiting_review')
RETURNS TABLE (
  report_id uuid, session_id uuid, created_at timestamptz, generated_at timestamptz, review_status text,
  triage text, mst_tier smallint, confidence text, prompt_set text, qa_attempts int,
  regulatory_flags jsonb, reviewed_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT r.id, r.session_id, r.created_at, r.generated_at, r.review_status, r.triage, r.mst_tier, r.confidence,
         r.prompt_set,
         coalesce((r.report -> 'review' ->> 'qaAttempts')::int, 0),
         coalesce(r.report -> 'review' -> 'regulatoryFlags', '[]'::jsonb),
         r.reviewed_at
    FROM public.advanced_assessment_reports r
   WHERE (p_status IS NULL AND r.review_status IS NOT NULL) OR r.review_status = p_status
   ORDER BY coalesce(r.generated_at, r.created_at) ASC
   LIMIT 200;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_advanced_assessment_reviews(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_advanced_assessment_reviews(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_advanced_assessment_review(p_report_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_r public.advanced_assessment_reports;
  v_s public.advanced_assessment_sessions;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_r FROM public.advanced_assessment_reports WHERE id = p_report_id;
  IF v_r.id IS NULL THEN RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_s FROM public.advanced_assessment_sessions WHERE id = v_r.session_id;

  PERFORM public.log_advanced_assessment_audit(v_r.session_id, v_r.id, 'admin', auth.uid(), 'review_opened', '{}'::jsonb);

  RETURN jsonb_build_object(
    'report_id', v_r.id,
    'session_id', v_r.session_id,
    'review_status', v_r.review_status,
    'generation_status', v_r.generation_status,
    'triage', v_r.triage,
    'mst_tier', v_r.mst_tier,
    'confidence', v_r.confidence,
    'report', v_r.report,
    'rendered_markdown', v_r.rendered_markdown,
    'email_summary', v_r.email_summary,
    'qa_result', v_r.qa_result,
    'scores', v_r.scores,
    'models', v_r.models,
    'prompt_set', v_r.prompt_set,
    'engine_version', v_r.engine_version,
    'generated_at', v_r.generated_at,
    'review_notes', v_r.review_notes,
    'reviewed_at', v_r.reviewed_at,
    -- The member's own answers, so the reviewer can check the report
    -- against what was actually said. Admin-only, audited above.
    'responses', v_s.responses
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_get_advanced_assessment_review(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_advanced_assessment_review(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_review_advanced_assessment(p_report_id uuid, p_decision text, p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_r public.advanced_assessment_reports;
  v_s public.advanced_assessment_sessions;
  v_signoff public.assessment_prompt_signoffs;
  v_email text;
  v_refund_reason text;
  v_refunded boolean := false;
BEGIN
  IF NOT public.has_role(v_admin, 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_decision NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'invalid_decision' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_r FROM public.advanced_assessment_reports WHERE id = p_report_id FOR UPDATE;
  IF v_r.id IS NULL THEN RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0002'; END IF;
  IF v_r.review_status IS DISTINCT FROM 'awaiting_review' THEN
    RAISE EXCEPTION 'not_awaiting_review' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_s FROM public.advanced_assessment_sessions WHERE id = v_r.session_id FOR UPDATE;
  SELECT email INTO v_email FROM auth.users WHERE id = v_r.user_id;

  IF p_decision = 'approve' THEN
    -- Go-live gate (framework §12): no report is released while the prompt
    -- set that produced it lacks a completed dermatologist sign-off record.
    SELECT * INTO v_signoff FROM public.assessment_prompt_signoffs WHERE prompt_set = v_r.prompt_set;
    IF v_signoff.prompt_set IS NULL OR v_signoff.status <> 'signed_off' THEN
      RAISE EXCEPTION 'signoff_incomplete' USING ERRCODE = '42501';
    END IF;

    UPDATE public.advanced_assessment_reports
       SET review_status = 'approved', reviewed_by = v_admin, reviewed_at = now(), released_at = now(),
           review_notes = p_notes
     WHERE id = p_report_id;
    UPDATE public.advanced_assessment_sessions SET status = 'completed', completed_at = now() WHERE id = v_r.session_id;

    INSERT INTO public.advanced_assessment_events (user_id, session_id, event_type, metadata)
    VALUES (v_r.user_id, v_r.session_id, 'generation_completed', jsonb_build_object('released', true));

    IF v_email IS NOT NULL THEN
      PERFORM public.enqueue_email(
        'ADVANCED_REPORT_READY', 'advanced_report_ready:' || p_report_id::text,
        'advanced_report_ready', 'SKYNN', v_r.user_id, v_email,
        jsonb_build_object('session_id', v_r.session_id),
        'rpc:admin_review_advanced_assessment'
      );
    END IF;
  ELSE
    IF v_s.access_type = 'analysis_pass' AND v_s.pass_transaction_id IS NOT NULL THEN
      v_refund_reason := 'refund:' || v_s.pass_transaction_id::text;
      IF NOT EXISTS (SELECT 1 FROM public.ai_credit_transactions WHERE user_id = v_s.user_id AND reason = v_refund_reason) THEN
        INSERT INTO public.ai_credit_transactions (user_id, delta, reason) VALUES (v_s.user_id, 1, v_refund_reason);
        v_refunded := true;
      END IF;
    END IF;

    UPDATE public.advanced_assessment_reports
       SET review_status = 'rejected', reviewed_by = v_admin, reviewed_at = now(), review_notes = p_notes,
           error_message = 'Our review team couldn''t release this report. Your Analysis Pass has been refunded.'
     WHERE id = p_report_id;
    UPDATE public.advanced_assessment_sessions
       SET status = 'failed', failure_reason = 'rejected_in_review'
     WHERE id = v_r.session_id;

    IF v_email IS NOT NULL THEN
      PERFORM public.enqueue_email(
        'ADVANCED_REPORT_NOT_RELEASED', 'advanced_report_not_released:' || p_report_id::text,
        'advanced_report_not_released', 'SKYNN', v_r.user_id, v_email,
        jsonb_build_object('refunded', v_refunded),
        'rpc:admin_review_advanced_assessment'
      );
    END IF;
  END IF;

  PERFORM public.log_advanced_assessment_audit(v_r.session_id, p_report_id, 'admin', v_admin,
    CASE WHEN p_decision = 'approve' THEN 'report_approved' ELSE 'report_rejected' END,
    jsonb_build_object('refunded', v_refunded, 'has_notes', p_notes IS NOT NULL));

  RETURN jsonb_build_object('report_id', p_report_id, 'review_status', CASE WHEN p_decision = 'approve' THEN 'approved' ELSE 'rejected' END, 'refunded', v_refunded);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_review_advanced_assessment(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_advanced_assessment(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_prompt_signoffs()
RETURNS TABLE (prompt_set text, definition_version text, status text, dermatologist_name text, hpcsa_number text, approved_on date, recorded_at timestamptz, is_active boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT s.prompt_set, s.definition_version, s.status, s.dermatologist_name, s.hpcsa_number, s.approved_on, s.recorded_at,
         (s.prompt_set = c.active_prompt_set)
    FROM public.assessment_prompt_signoffs s
    CROSS JOIN public.skynn_advanced_assessment_config c
   ORDER BY s.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_get_prompt_signoffs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_prompt_signoffs() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_record_prompt_signoff(
  p_prompt_set text, p_dermatologist_name text, p_hpcsa_number text, p_approved_on date, p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_hpcsa text := upper(regexp_replace(coalesce(p_hpcsa_number, ''), '\s', '', 'g'));
BEGIN
  IF NOT public.has_role(v_admin, 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF length(trim(coalesce(p_dermatologist_name, ''))) < 3 THEN
    RAISE EXCEPTION 'invalid_signoff_name' USING ERRCODE = '22023';
  END IF;
  -- HPCSA registration numbers are a two-letter register prefix (MP for
  -- medical practitioners) followed by digits.
  IF v_hpcsa !~ '^[A-Z]{2}[0-9]{5,8}$' THEN
    RAISE EXCEPTION 'invalid_hpcsa_number' USING ERRCODE = '22023';
  END IF;
  IF p_approved_on IS NULL OR p_approved_on > current_date THEN
    RAISE EXCEPTION 'invalid_signoff_date' USING ERRCODE = '22023';
  END IF;

  UPDATE public.assessment_prompt_signoffs
     SET status = 'signed_off',
         dermatologist_name = trim(p_dermatologist_name),
         hpcsa_number = v_hpcsa,
         approved_on = p_approved_on,
         notes = p_notes,
         recorded_by = v_admin,
         recorded_at = now()
   WHERE prompt_set = p_prompt_set;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public.log_advanced_assessment_audit(NULL, NULL, 'admin', v_admin, 'prompt_set_signed_off',
    jsonb_build_object('prompt_set', p_prompt_set, 'approved_on', p_approved_on));
END;
$$;
REVOKE ALL ON FUNCTION public.admin_record_prompt_signoff(text, text, text, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_record_prompt_signoff(text, text, text, date, text) TO authenticated;

-- ---------- pg_cron: worker every minute ----------
-- x-cron-secret is looked up live from Vault by NAME (never a literal in
-- this file). The Vault entry 'skynn_worker_cron_secret' is created once,
-- server-side, via vault.create_secret(encode(gen_random_bytes(32),'hex'),
-- 'skynn_worker_cron_secret', ...) — not part of this migration, so the
-- value never appears in git. The worker verifies it through
-- verify_skynn_worker_secret() using its auto-injected service-role key.
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
     WHERE generation_status = 'pending'
       AND (locked_at IS NULL OR locked_at < now() - interval '5 minutes')
  );
  $$
);
