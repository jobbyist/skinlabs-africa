-- Rolled-back probe: Advanced session column grants + the Basic → Advanced link
-- (20260928160000_skynn_v21_basic_to_advanced_link.sql). Always raises, so
-- nothing is kept. Passed live 2026-09-28 (7 assertions).
DO $$
DECLARE
  v_uid uuid; v_other_uid uuid; v_sid uuid; v_def uuid; v_other_def uuid;
  v_rec uuid; v_foreign uuid; v_cnt int; v_ok boolean; n int := 0; r record;
BEGIN
  SELECT id INTO v_uid FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_other_uid FROM auth.users WHERE id <> v_uid ORDER BY created_at LIMIT 1;
  SELECT id INTO v_def FROM public.assessment_definitions WHERE version = '2026.2';
  SELECT id INTO v_other_def FROM public.assessment_definitions WHERE version <> '2026.2' LIMIT 1;
  INSERT INTO public.advanced_assessment_sessions
    (user_id, assessment_definition_id, assessment_version, question_library_version, scoring_rules_version, status)
  VALUES (v_uid, v_def, '2026.2', '2026.2', 'probe', 'in_progress') RETURNING id INTO v_sid;
  INSERT INTO public.skincare_recommendations (user_id, skin_type, concerns, status, recommendation)
  VALUES (v_uid, 'oily', ARRAY['acne'], 'delivered', 'probe') RETURNING id INTO v_rec;
  INSERT INTO public.skincare_recommendations (user_id, skin_type, concerns, status, recommendation)
  VALUES (v_other_uid, 'dry', ARRAY['acne'], 'delivered', 'probe') RETURNING id INTO v_foreign;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  -- A member can't repoint their session at another questionnaire (the
  -- definition decides what "complete" and "consented" mean at submit).
  BEGIN
    UPDATE public.advanced_assessment_sessions SET assessment_definition_id = coalesce(v_other_def, v_def) WHERE id = v_sid;
    RAISE EXCEPTION 'ADVANCED_SESSION_TEST_FAILED: definition update allowed';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1;
  END;

  -- Autosave columns still work.
  UPDATE public.advanced_assessment_sessions
     SET responses = '{"skin_type":"oily"}', current_section_id = 'skin_basics', completeness_pct = 5
   WHERE id = v_sid;
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  IF v_cnt <> 1 THEN RAISE EXCEPTION 'ADVANCED_SESSION_TEST_FAILED: autosave refused'; END IF; n := n + 1;

  -- Linking to the member's own delivered Basic analysis works; bad ids are dropped.
  v_ok := public.link_basic_analysis_to_advanced_session(v_sid, v_rec, ARRAY['skin_type', 'climate', 'bad id!']);
  IF NOT v_ok THEN RAISE EXCEPTION 'ADVANCED_SESSION_TEST_FAILED: own link refused'; END IF; n := n + 1;

  -- Another member's Basic analysis is refused.
  BEGIN
    PERFORM public.link_basic_analysis_to_advanced_session(v_sid, v_foreign, NULL);
    RAISE EXCEPTION 'ADVANCED_SESSION_TEST_FAILED: foreign link allowed';
  EXCEPTION WHEN no_data_found THEN n := n + 1;
  END;

  -- The link columns aren't client-writable.
  BEGIN
    UPDATE public.advanced_assessment_sessions SET basic_analysis_id = v_foreign WHERE id = v_sid;
    RAISE EXCEPTION 'ADVANCED_SESSION_TEST_FAILED: link column writable';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1;
  END;

  EXECUTE 'RESET ROLE';
  SELECT basic_analysis_id, prefilled_question_ids INTO r FROM public.advanced_assessment_sessions WHERE id = v_sid;
  IF r.basic_analysis_id IS DISTINCT FROM v_rec
     OR NOT (r.prefilled_question_ids @> ARRAY['skin_type', 'climate'])
     OR 'bad id!' = ANY (r.prefilled_question_ids) THEN
    RAISE EXCEPTION 'ADVANCED_SESSION_TEST_FAILED: link not stored as expected';
  END IF; n := n + 1;

  -- A submitted session can't be relinked.
  UPDATE public.advanced_assessment_sessions SET status = 'submitted' WHERE id = v_sid;
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_ok := public.link_basic_analysis_to_advanced_session(v_sid, v_rec, NULL);
  EXECUTE 'RESET ROLE';
  IF v_ok THEN RAISE EXCEPTION 'ADVANCED_SESSION_TEST_FAILED: submitted session relinked'; END IF; n := n + 1;

  RAISE EXCEPTION 'ADVANCED_SESSION_TESTS_PASSED (% assertions)', n;
END;
$$;
