-- SKYNN AI v2.1 — Advanced AI Dermatology Analysis: Analysis Pass gate + fallback
-- intake probe (submit_advanced_assessment_session / consume_analysis_pass /
-- get_my_advanced_assessment_report / claim_advanced_assessment_jobs).
--
-- Safe on production: one DO block that ALWAYS ends by raising, so the whole
-- transaction (throwaway users, sessions, reports, queued emails, credits) is
-- rolled back. Assumes the live config: report_mode = 'fallback' and
-- rollout_stage = 'pass_holders_review' (asserted first).
--   Success -> ERROR:  ADVANCED_GATE_TESTS_PASSED (n assertions)
--   Failure -> ERROR:  ADVANCED_GATE_TEST_FAILED: <which assertion>
DO $$
DECLARE
  v_a uuid := gen_random_uuid();
  v_b uuid := gen_random_uuid();
  v_all jsonb;
  s1 public.advanced_assessment_sessions;
  s2 public.advanced_assessment_sessions;
  r record;
  r2 record;
  n int := 0;
  v_raised boolean;
  v_msg text;
  v_cnt int;
  v_json jsonb;
  v_tx uuid;
BEGIN
  SELECT * INTO r FROM public.skynn_advanced_assessment_config WHERE id;
  IF r.report_mode <> 'fallback' OR r.rollout_stage <> 'pass_holders_review' THEN
    RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: expected fallback / pass_holders_review, got % / %', r.report_mode, r.rollout_stage;
  END IF; n := n + 1;

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adv-a-' || v_a || '@example.invalid', '', now(), now(), '{}', '{}'),
         (v_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adv-b-' || v_b || '@example.invalid', '', now(), now(), '{}', '{}');
  INSERT INTO public.profiles (user_id, email) VALUES (v_a, 'adv-a@example.invalid'), (v_b, 'adv-b@example.invalid')
  ON CONFLICT (user_id) DO NOTHING;

  -- Every question of the active definition answered with "agree" (non-empty
  -- answers satisfy compute_assessment_completeness; "agree" also satisfies
  -- both POPIA consent questions).
  SELECT jsonb_object_agg(q ->> 'id', 'agree') INTO v_all
    FROM public.assessment_definitions d,
         jsonb_array_elements(d.sections) sec,
         jsonb_array_elements(sec -> 'questions') q
   WHERE d.version = (SELECT active_definition_version FROM public.skynn_advanced_assessment_config WHERE id);

  -- ---------- A (Explorer, no Pass) ----------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_a::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  SELECT * INTO r FROM public.get_advanced_assessment_access();
  IF r.eligible THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: no Pass should not be eligible'; END IF; n := n + 1;

  v_raised := false;
  BEGIN
    PERFORM public.start_advanced_assessment_session();
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    v_raised := v_msg = 'not_eligible';
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: starting without a Pass must be refused (%)', v_msg; END IF; n := n + 1;

  -- A cannot mint a Pass for itself.
  v_raised := false;
  BEGIN
    INSERT INTO public.ai_credit_transactions (user_id, delta, reason) VALUES (v_a, 1, 'forged');
  EXCEPTION WHEN insufficient_privilege THEN v_raised := true;
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: client inserted its own credit'; END IF; n := n + 1;

  -- ---------- A with one Pass ----------
  EXECUTE 'RESET ROLE';
  INSERT INTO public.ai_credit_transactions (user_id, delta, reason) VALUES (v_a, 1, 'test:grant');
  EXECUTE 'SET LOCAL ROLE authenticated';

  SELECT * INTO s1 FROM public.start_advanced_assessment_session();
  PERFORM public.save_advanced_assessment_progress(s1.id, v_all, NULL, NULL);
  SELECT * INTO r FROM public.submit_advanced_assessment_session(s1.id, NULL);
  IF r.processing_mode <> 'fallback' OR r.access_type <> 'analysis_pass'
     OR r.reference_number !~ '^SKYNN-ADV-[0-9]{8}-[0-9A-Z]{6}$' THEN
    RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: unexpected submit result (%)', row_to_json(r);
  END IF; n := n + 1;
  IF public.available_ai_credits(v_a) <> 0 THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: Pass not consumed'; END IF; n := n + 1;

  -- Replay → same reference, no second charge.
  SELECT * INTO r2 FROM public.submit_advanced_assessment_session(s1.id, NULL);
  IF r2.reference_number IS DISTINCT FROM r.reference_number OR r2.report_id IS DISTINCT FROM r.report_id THEN
    RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: replay returned a different submission';
  END IF; n := n + 1;
  IF public.available_ai_credits(v_a) <> 0 THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: replay charged again'; END IF; n := n + 1;

  -- The member cannot hand the Pass spent on a submission back to themselves.
  SELECT pass_transaction_id INTO v_tx FROM public.advanced_assessment_sessions WHERE id = s1.id;
  IF public.refund_analysis_pass(v_tx) THEN
    RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: member refunded the Pass spent on their submission';
  END IF; n := n + 1;
  IF public.available_ai_credits(v_a) <> 0 THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: Pass balance changed after refund attempt'; END IF; n := n + 1;

  -- The member sees a pending status, never a report.
  v_json := public.get_my_advanced_assessment_report(NULL, s1.id);
  IF v_json ? 'report' AND v_json -> 'report' IS NOT NULL AND jsonb_typeof(v_json -> 'report') <> 'null' THEN
    RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: fallback submission exposed report content (%)', v_json;
  END IF; n := n + 1;

  -- Second open submission → duplicate_pending, and the new Pass is NOT spent.
  EXECUTE 'RESET ROLE';
  INSERT INTO public.ai_credit_transactions (user_id, delta, reason) VALUES (v_a, 1, 'test:grant2');
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT * INTO s2 FROM public.start_advanced_assessment_session();
  PERFORM public.save_advanced_assessment_progress(s2.id, v_all, NULL, NULL);
  v_raised := false;
  BEGIN
    PERFORM public.submit_advanced_assessment_session(s2.id, NULL);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    v_raised := v_msg = 'duplicate_pending';
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: second open submission not refused (%)', v_msg; END IF; n := n + 1;
  IF public.available_ai_credits(v_a) <> 1 THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: duplicate_pending charged a Pass'; END IF; n := n + 1;

  -- ---------- B: a Glow Insider member with no Pass ----------
  EXECUTE 'RESET ROLE';
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles SET subscription_status = 'insider', subscription_started_at = now() WHERE user_id = v_b;
  PERFORM set_config('app.privileged_write', 'off', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_b::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  SELECT * INTO r FROM public.get_advanced_assessment_access();
  IF r.eligible THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: membership alone must not grant Advanced access'; END IF; n := n + 1;

  -- B cannot see A's session or submission.
  SELECT count(*) INTO v_cnt FROM public.advanced_assessment_sessions WHERE id = s1.id;
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: B can read A''s session'; END IF; n := n + 1;
  SELECT count(*) INTO v_cnt FROM public.advanced_assessment_reports WHERE session_id = s1.id;
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: B can read A''s submission'; END IF; n := n + 1;
  v_raised := false;
  BEGIN
    v_json := public.get_my_advanced_assessment_report(NULL, s1.id);
    v_raised := v_json IS NULL OR v_json = 'null'::jsonb OR NOT (v_json ? 'reference_number') OR v_json ->> 'reference_number' IS NULL;
  EXCEPTION WHEN OTHERS THEN v_raised := true;
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: B read A''s submission via RPC'; END IF; n := n + 1;
  v_raised := false;
  BEGIN
    PERFORM public.submit_advanced_assessment_session(s2.id, NULL);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    v_raised := v_msg = 'session_not_found';
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: B submitted A''s session (%)', v_msg; END IF; n := n + 1;

  -- B cannot call the admin intake RPCs.
  v_raised := false;
  BEGIN
    PERFORM * FROM public.skynn_ops_summary(7);
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_raised := v_cnt = 0;
  EXCEPTION WHEN insufficient_privilege THEN v_raised := true;
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: non-admin read skynn_ops_summary'; END IF; n := n + 1;

  -- ---------- the fallback row never reaches a model ----------
  EXECUTE 'RESET ROLE';
  SELECT count(*) INTO v_cnt FROM public.advanced_assessment_reports
   WHERE session_id = s1.id AND processing_mode = 'fallback' AND intake_status = 'pending'
     AND internal_email_recipient = 'reports@skinlabs.co.za';
  IF v_cnt <> 1 THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: fallback row not pending for reports@'; END IF; n := n + 1;
  SELECT count(*) INTO v_cnt FROM public.claim_advanced_assessment_jobs(50, 'probe') c WHERE c.session_id = s1.id;
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: production worker claimed a fallback row'; END IF; n := n + 1;
  SELECT count(*) INTO v_cnt FROM public.email_outbox
   WHERE idempotency_key LIKE 'advanced_intake_received:' || r2.report_id::text || '%';
  IF v_cnt <> 1 THEN RAISE EXCEPTION 'ADVANCED_GATE_TEST_FAILED: member confirmation email not queued exactly once (%)', v_cnt; END IF; n := n + 1;

  RAISE EXCEPTION 'ADVANCED_GATE_TESTS_PASSED (% assertions)', n;
END;
$$;
