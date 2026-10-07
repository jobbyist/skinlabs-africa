-- Rolled-back probe: Academy Phase 1 foundations (20261007100000_academy_foundations.sql).
-- Always raises, so nothing is kept. "ACADEMY_FOUNDATIONS_PASSED" means every assertion held.
-- Covers: publication workflow (author != reviewer, admin-only publish, frozen content), visibility by
-- rollout stage / enrolment / membership, column + table privileges, accreditation gate, storage paths,
-- prerequisite cycles and the append-only audit log.

CREATE OR REPLACE FUNCTION pg_temp.academy_probe_make_version(p_course uuid, p_author uuid, p_summary text) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE v uuid; m uuid; l1 uuid; l2 uuid; n int;
BEGIN
  SELECT coalesce(max(version_number), 0) + 1 INTO n FROM public.academy_course_versions WHERE course_id = p_course;
  INSERT INTO public.academy_course_versions (course_id, version_number, title, summary, learning_objectives, created_by)
  VALUES (p_course, n, 'Probe course', p_summary, '["Understand the basics"]', p_author) RETURNING id INTO v;
  INSERT INTO public.academy_modules (version_id, position, title) VALUES (v, 1, 'Module 1') RETURNING id INTO m;
  INSERT INTO public.academy_lessons (module_id, version_id, slug, position, title, objectives, is_free_preview)
  VALUES (m, v, 'intro', 1, 'Intro', '["Know the terms"]', true) RETURNING id INTO l1;
  INSERT INTO public.academy_lessons (module_id, version_id, slug, position, title, objectives, is_free_preview)
  VALUES (m, v, 'deep-dive', 2, 'Deep dive', '["Apply the terms"]', false) RETURNING id INTO l2;
  INSERT INTO public.academy_lesson_content (lesson_id, body_blocks) VALUES
    (l1, '[{"type":"paragraph","text":"Free preview text"}]'), (l2, '[{"type":"paragraph","text":"Members only text"}]');
  INSERT INTO public.academy_sources (lesson_id, citation_text, verification_status) VALUES (l1, 'Source one', 'verified'), (l2, 'Source two', 'checked');
  RETURN v;
END $$;

DO $$
DECLARE
  v_admin uuid; v_instr uuid; v_rev uuid; v_learner uuid; v_other uuid; v_vip uuid;
  course_a uuid; course_b uuid; v1 uuid; vb uuid; inst uuid; l_intro uuid; l_deep uuid;
  c int; s text; r jsonb; acc uuid; asset uuid; n int := 0;
BEGIN
  SELECT user_id INTO v_admin FROM public.user_roles WHERE role = 'admin' ORDER BY user_id LIMIT 1;
  SELECT id INTO v_instr FROM auth.users WHERE id <> v_admin ORDER BY created_at LIMIT 1;
  SELECT id INTO v_rev FROM auth.users WHERE id NOT IN (v_admin, v_instr) ORDER BY created_at LIMIT 1;
  SELECT u.id INTO v_vip FROM auth.users u JOIN public.profiles p ON p.user_id = u.id
   WHERE lower(coalesce(p.subscription_status, '')) = 'vip' AND u.id NOT IN (v_admin, v_instr, v_rev) ORDER BY u.created_at LIMIT 1;
  SELECT u.id INTO v_learner FROM auth.users u JOIN public.profiles p ON p.user_id = u.id
   WHERE lower(coalesce(p.subscription_status, '')) = 'free' AND u.id NOT IN (v_admin, v_instr, v_rev, coalesce(v_vip, v_admin)) ORDER BY u.created_at LIMIT 1;
  SELECT u.id INTO v_other FROM auth.users u JOIN public.profiles p ON p.user_id = u.id
   WHERE lower(coalesce(p.subscription_status, '')) = 'free' AND u.id NOT IN (v_admin, v_instr, v_rev, coalesce(v_vip, v_admin), v_learner) ORDER BY u.created_at LIMIT 1;
  IF v_admin IS NULL OR v_instr IS NULL OR v_rev IS NULL OR v_vip IS NULL OR v_learner IS NULL OR v_other IS NULL THEN
    RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: not enough distinct users to run the probe';
  END IF;

  -- fixtures (owner)
  INSERT INTO public.academy_courses (slug, status) VALUES ('probe-course-a', 'draft') RETURNING id INTO course_a;
  INSERT INTO public.academy_courses (slug, status) VALUES ('probe-course-b', 'draft') RETURNING id INTO course_b;
  INSERT INTO public.academy_instructors (slug, display_name, is_published, credentials)
  VALUES ('probe-instructor', 'Probe Instructor', true,
          '[{"title":"MSc","verified_at":"2026-01-01T00:00:00Z","evidence_note":"private"},{"title":"Unverified claim"}]') RETURNING id INTO inst;
  INSERT INTO public.academy_course_instructors (course_id, instructor_id, role) VALUES (course_a, inst, 'lead'), (course_b, inst, 'lead');
  INSERT INTO public.academy_role_assignments (user_id, role, course_id) VALUES
    (v_instr, 'instructor', course_a), (v_instr, 'reviewer', course_a), (v_rev, 'reviewer', course_a);

  -- validator: banned wording is flagged unless it is "accreditation-ready"; a complete version has no issues
  vb := pg_temp.academy_probe_make_version(course_b, v_instr, 'A SAQA accredited course');
  r := public.academy_validate_version(vb);
  IF NOT (r ? 'unverified_accreditation_or_qualification_wording') THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: accreditation wording not flagged: %', r; END IF; n := n + 1;
  UPDATE public.academy_course_versions SET summary = 'An accreditation-ready curriculum' WHERE id = vb;
  r := public.academy_validate_version(vb);
  IF r <> '[]'::jsonb THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: complete version still has issues: %', r; END IF; n := n + 1;

  v1 := pg_temp.academy_probe_make_version(course_a, v_instr, 'Skin barrier basics');
  SELECT id INTO l_intro FROM public.academy_lessons WHERE version_id = v1 AND slug = 'intro';
  SELECT id INTO l_deep FROM public.academy_lessons WHERE version_id = v1 AND slug = 'deep-dive';
  -- an audio lesson without a transcript or audio, and a claim without a checked source, are caught
  UPDATE public.academy_lessons SET lesson_type = 'audio' WHERE id = l_deep;
  r := public.academy_validate_version(v1);
  IF NOT (r ? 'lesson_1.2_missing_audio') THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: missing audio not flagged: %', r; END IF; n := n + 1;
  UPDATE public.academy_lessons SET lesson_type = 'text' WHERE id = l_deep;
  UPDATE public.academy_sources SET verification_status = 'unverified' WHERE lesson_id = l_deep;
  r := public.academy_validate_version(v1);
  IF NOT (r ? 'lesson_1.2_needs_checked_source') THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: unsourced claim not flagged: %', r; END IF; n := n + 1;
  UPDATE public.academy_sources SET verification_status = 'checked' WHERE lesson_id = l_deep;

  ------------------------------------------------------------------ workflow
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_learner, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  BEGIN
    PERFORM public.academy_submit_version_for_review(v1);
    RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: learner submitted a version';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  BEGIN
    PERFORM public.academy_admin_set_config('public');
    RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: learner changed the rollout stage';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_instr, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM public.academy_submit_version_for_review(v1);
  SELECT status INTO s FROM public.academy_course_versions WHERE id = v1;
  IF s <> 'in_review' THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: status after submit is %', s; END IF; n := n + 1;
  BEGIN
    PERFORM public.academy_review_version(v1, 'editorial', 'approved');
    RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: author reviewed their own version';
  EXCEPTION WHEN check_violation THEN n := n + 1; END;
  BEGIN
    PERFORM public.academy_admin_assign_role(v_learner, 'instructor', course_a);
    RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: instructor assigned a role';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  r := public.academy_my_roles();
  IF jsonb_array_length(r -> 'roles') <> 2 OR (r ->> 'is_admin')::boolean THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: my_roles %', r; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_rev, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  s := public.academy_review_version(v1, 'editorial', 'approved');
  IF s <> 'in_review' THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: editorial approval alone moved status to %', s; END IF; n := n + 1;
  s := public.academy_review_version(v1, 'subject_matter', 'approved');
  IF s <> 'approved' THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: status after both approvals is %', s; END IF; n := n + 1;
  BEGIN
    PERFORM public.academy_admin_publish_version(v1);
    RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: reviewer published';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM public.academy_admin_publish_version(v1);
  EXECUTE 'RESET ROLE';
  SELECT count(*) INTO c FROM public.academy_courses WHERE id = course_a AND status = 'published' AND current_version_id = v1;
  IF c <> 1 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: course not published'; END IF;
  SELECT count(*) INTO c FROM public.academy_course_versions WHERE id = v1 AND status = 'published' AND content_hash IS NOT NULL AND published_by = v_admin;
  IF c <> 1 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: version not published with hash'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.academy_audit_log WHERE action IN ('version_submitted', 'version_reviewed', 'version_published') AND entity_id = v1;
  IF c < 4 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: audit rows missing (%)', c; END IF; n := n + 1;

  -- published content is frozen, for privileged sessions too
  BEGIN UPDATE public.academy_lessons SET title = 'Changed' WHERE id = l_deep; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: lesson edited after publish';
  EXCEPTION WHEN check_violation THEN n := n + 1; END;
  BEGIN UPDATE public.academy_course_versions SET title = 'Changed' WHERE id = v1; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: version edited after publish';
  EXCEPTION WHEN check_violation THEN n := n + 1; END;
  BEGIN DELETE FROM public.academy_lesson_content WHERE lesson_id = l_deep; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: content deleted after publish';
  EXCEPTION WHEN check_violation THEN n := n + 1; END;
  BEGIN UPDATE public.academy_course_versions SET status = 'draft' WHERE id = v1; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: published version reverted to draft';
  EXCEPTION WHEN check_violation THEN n := n + 1; END;

  ------------------------------------------------------------------ visibility: stage 'disabled' (default)
  EXECUTE 'SET LOCAL ROLE anon';
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  SELECT count(*) INTO c FROM public.academy_courses WHERE id = course_a;
  IF c <> 0 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: published course visible while stage is disabled'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.academy_lessons WHERE version_id = v1;
  IF c <> 0 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: lessons visible while stage is disabled'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_instr, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO c FROM public.academy_courses WHERE id = course_a;
  IF c <> 1 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: assigned instructor cannot see their course'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.academy_courses WHERE id = course_b;
  IF c <> 0 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: instructor sees an unassigned draft course'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- stage -> public (admin RPC)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  r := public.academy_admin_set_config('public');
  IF r ->> 'stage' <> 'public' THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: set_config did not apply'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.academy_audit_log WHERE action = 'config_changed';
  IF c < 1 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: config change not audited'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  ------------------------------------------------------------------ visibility: stage 'public'
  EXECUTE 'SET LOCAL ROLE anon';
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  SELECT count(*) INTO c FROM public.academy_courses WHERE id = course_a;
  IF c <> 1 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: published course hidden from anon'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.academy_courses WHERE id = course_b;
  IF c <> 0 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: unpublished course visible to anon'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.academy_lessons WHERE version_id = v1;
  IF c <> 2 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: anon should see the 2-lesson outline, saw %', c; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.academy_lesson_content WHERE lesson_id IN (l_intro, l_deep);
  IF c <> 1 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: anon should read only the preview body, saw %', c; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.academy_lesson_content WHERE lesson_id = l_deep;
  IF c <> 0 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: gated lesson body leaked to anon'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.academy_sources WHERE lesson_id IN (l_intro, l_deep);
  IF c <> 1 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: anon should see only the preview lesson source, saw %', c; END IF; n := n + 1;
  r := public.academy_public_instructor_credentials(inst);
  IF jsonb_array_length(r) <> 1 OR r -> 0 ? 'evidence_note' THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: credentials leak: %', r; END IF; n := n + 1;
  r := public.get_academy_public_config();
  IF r ->> 'stage' <> 'public' THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: public config'; END IF; n := n + 1;
  BEGIN PERFORM created_by FROM public.academy_courses LIMIT 1; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: internal column readable';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  BEGIN PERFORM 1 FROM public.academy_audit_log LIMIT 1; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: anon read audit log';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  BEGIN PERFORM 1 FROM public.academy_role_assignments LIMIT 1; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: anon read role assignments';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  BEGIN PERFORM 1 FROM public.academy_assets LIMIT 1; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: anon read assets';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  BEGIN PERFORM 1 FROM public.academy_accreditations LIMIT 1; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: anon read accreditations';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  BEGIN PERFORM 1 FROM public.academy_config LIMIT 1; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: anon read config table';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  EXECUTE 'RESET ROLE';

  ------------------------------------------------------------------ enrolment-based access
  INSERT INTO public.academy_enrolments (user_id, course_id, version_id, source) VALUES
    (v_learner, course_a, v1, 'purchase'), (v_other, course_a, v1, 'membership'), (v_vip, course_a, v1, 'membership');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_learner, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO c FROM public.academy_lesson_content WHERE lesson_id = l_deep;
  IF c <> 1 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: purchased learner cannot read the lesson'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.academy_enrolments;
  IF c <> 1 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: learner sees % enrolments, expected only their own', c; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.academy_audit_log;
  IF c <> 0 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: learner reads the audit log'; END IF; n := n + 1;
  BEGIN INSERT INTO public.academy_enrolments (user_id, course_id, version_id, source) VALUES (v_learner, course_a, v1, 'free');
    RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: learner inserted an enrolment';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  BEGIN UPDATE public.academy_enrolments SET status = 'completed'; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: learner updated an enrolment';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO c FROM public.academy_lesson_content WHERE lesson_id = l_deep;
  IF c <> 0 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: explorer reads a membership-only lesson'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_vip, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO c FROM public.academy_lesson_content WHERE lesson_id = l_deep;
  IF c <> 1 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: VIP member cannot read a membership-included lesson'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  ------------------------------------------------------------------ accreditation gate
  BEGIN
    INSERT INTO public.academy_accreditations (course_id, scope, scheme, status, reference_number, body_name, valid_from, verified_by, verified_at)
    VALUES (course_a, 'course', 'QCTO', 'verified', 'X', 'Body', current_date, v_admin, now());
    RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: verified accreditation inserted without evidence/guard';
  EXCEPTION WHEN check_violation OR insufficient_privilege THEN n := n + 1; END;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  acc := public.academy_admin_save_accreditation(NULL, course_a, 'course', 'QCTO', 'QCTO', NULL, NULL, NULL, 'in_preparation', NULL, NULL, NULL, 'working note');
  BEGIN PERFORM public.academy_admin_save_accreditation(acc, course_a, 'course', 'QCTO', 'QCTO', 'REF-1', NULL, NULL, 'verified', current_date, NULL, NULL, NULL);
    RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: save accepted status verified';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  BEGIN PERFORM public.academy_admin_verify_accreditation(acc); RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: verified without reference/evidence';
  EXCEPTION WHEN check_violation THEN n := n + 1; END;
  EXECUTE 'RESET ROLE';
  SELECT count(*) INTO c FROM public.academy_public_accreditation(course_a);
  IF c <> 0 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: unverified accreditation is publicly visible'; END IF; n := n + 1;

  INSERT INTO public.academy_assets (course_id, kind, bucket, storage_path, mime_type, title, rights_note)
  VALUES (NULL, 'pdf', 'academy-resources', 'shared/probe/evidence.pdf', 'application/pdf', 'Evidence letter', 'Owned') RETURNING id INTO asset;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM public.academy_admin_save_accreditation(acc, course_a, 'course', 'QCTO', 'QCTO', 'REF-1', NULL, NULL, 'submitted', current_date - 1, NULL, asset, NULL);
  PERFORM public.academy_admin_verify_accreditation(acc);
  EXECUTE 'RESET ROLE';
  EXECUTE 'SET LOCAL ROLE anon';
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  SELECT count(*) INTO c FROM public.academy_public_accreditation(course_a) WHERE reference_number = 'REF-1';
  IF c <> 1 THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: verified accreditation not exposed'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';
  BEGIN UPDATE public.academy_accreditations SET reference_number = 'REF-2' WHERE id = acc; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: verified accreditation edited';
  EXCEPTION WHEN check_violation THEN n := n + 1; END;
  -- once verified, accreditation wording is no longer flagged for that course
  -- wording is flagged for a course without a verified accreditation (B) but allowed for the one that has it (A)
  vb := pg_temp.academy_probe_make_version(course_b, v_instr, 'A SAQA accredited course');
  r := public.academy_validate_version(vb);
  IF NOT (r ? 'unverified_accreditation_or_qualification_wording') THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: wording not flagged for unaccredited course'; END IF; n := n + 1;
  vb := pg_temp.academy_probe_make_version(course_a, v_instr, 'A SAQA accredited course');
  r := public.academy_validate_version(vb);
  IF r ? 'unverified_accreditation_or_qualification_wording' THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: wording flagged despite verified accreditation'; END IF; n := n + 1;

  ------------------------------------------------------------------ storage paths
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_instr, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF NOT public.academy_can_manage_path(course_a::text || '/asset1/lesson.mp3') THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: instructor cannot manage own course path'; END IF; n := n + 1;
  IF public.academy_can_manage_path(course_b::text || '/asset1/lesson.mp3') THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: instructor manages another course path'; END IF; n := n + 1;
  IF public.academy_can_manage_path('shared/x.pdf') OR public.academy_can_manage_path('not-a-uuid/x') THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: shared/odd paths allowed'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_learner, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF public.academy_can_manage_path(course_a::text || '/a/b.mp3') OR public.academy_can_view_path(course_a::text || '/a/b.mp3') THEN RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: learner can touch private storage paths'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  ------------------------------------------------------------------ prerequisites + audit log
  INSERT INTO public.academy_course_prerequisites (course_id, requires_course_id) VALUES (course_a, course_b);
  BEGIN INSERT INTO public.academy_course_prerequisites (course_id, requires_course_id) VALUES (course_b, course_a);
    RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: prerequisite cycle accepted';
  EXCEPTION WHEN check_violation THEN n := n + 1; END;
  BEGIN UPDATE public.academy_audit_log SET action = 'tampered'; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: audit log updated';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;
  BEGIN DELETE FROM public.academy_audit_log; RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_TEST_FAILED: audit log deleted';
  EXCEPTION WHEN insufficient_privilege THEN n := n + 1; END;

  RAISE EXCEPTION 'ACADEMY_FOUNDATIONS_PASSED % assertions (rolled back)', n;
END $$;
