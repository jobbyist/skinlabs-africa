-- Rolled-back probe: Community Forum quota / retention / sanctions (20261008200000). Always raises, so nothing is kept.
-- "COMMUNITY_SANCTIONS_PASSED n" means every assertion held.
DO $$
DECLARE
  v_a uuid := gen_random_uuid(); v_b uuid := gen_random_uuid(); v_mod uuid := gen_random_uuid(); v_adm uuid := gen_random_uuid();
  v_old uuid; v_pin uuid; v_new uuid; v_sid uuid; n int := 0; v_raised boolean; v_cnt int; v_json jsonb; v_res jsonb;
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  SELECT x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cs-' || x || '@example.invalid', '', now(), now(), '{}', '{}'
    FROM unnest(ARRAY[v_a, v_b, v_mod, v_adm]) x;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_mod, 'moderator'), (v_adm, 'admin');
  UPDATE public.profiles SET username = 'sprobe_a', username_generated = false WHERE user_id = v_a;
  UPDATE public.profiles SET username = 'sprobe_b', username_generated = false WHERE user_id = v_b;
  UPDATE public.profiles SET username = 'sprobe_mod', username_generated = false, full_name = 'Mona Mod' WHERE user_id = v_mod;
  UPDATE public.profiles SET username = 'sprobe_adm', username_generated = false, full_name = 'Adam Admin' WHERE user_id = v_adm;

  -- a member cannot call staff RPCs or read sanctions
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_raised := false;
  BEGIN PERFORM public.community_admin_sanction(v_b, 'mute', 1, 'nope'); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: member sanctioned someone'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM count(*) FROM public.community_sanctions; EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: member read the sanctions table'; END IF; n := n + 1;
  IF public.community_my_sanction() IS NOT NULL THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: phantom sanction'; END IF; n := n + 1;
  v_json := public.community_my_media_usage();
  IF (v_json ->> 'quota')::bigint <> 20971520 OR (v_json ->> 'used')::bigint <> 0 THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: media usage %', v_json; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- moderator mutes B for 24h: B can read/like but not post or comment; reason required; staff and self are protected
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_mod, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_raised := false;
  BEGIN PERFORM public.community_admin_sanction(v_b, 'mute', 24, ' '); EXCEPTION WHEN SQLSTATE '22023' THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: blank reason accepted'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.community_admin_sanction(v_adm, 'mute', 24, 'try admin'); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: admin sanctioned'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.community_admin_sanction(v_mod, 'mute', 24, 'self'); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: self sanction'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.community_admin_sanction(v_b, 'ban', 24, 'bad kind'); EXCEPTION WHEN SQLSTATE '22023' THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: bad kind accepted'; END IF; n := n + 1;
  SELECT count(*) INTO v_cnt FROM public.community_admin_member_search('sprobe_');
  IF v_cnt < 4 THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: member search returned %', v_cnt; END IF; n := n + 1;
  v_sid := public.community_admin_sanction(v_b, 'mute', 24, 'Probe mute');
  n := n + 1;
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF public.community_my_sanction() ->> 'kind' <> 'mute' THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: my_sanction not mute'; END IF; n := n + 1;
  v_raised := false;
  BEGIN INSERT INTO public.community_posts (title, body, author_id) VALUES ('Muted post', 'A muted member should not be able to post this.', v_b);
  EXCEPTION WHEN OTHERS THEN v_raised := SQLERRM = 'account_muted'; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: muted member posted'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- suspend replaces the mute; the suspended member cannot like either
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_adm, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_sid := public.community_admin_sanction(v_b, 'suspend', NULL, 'Probe suspend');
  SELECT count(*) INTO v_cnt FROM public.community_admin_sanctions(true) WHERE user_id = v_b;
  IF v_cnt <> 1 THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: expected one active sanction, got %', v_cnt; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';
  SELECT id INTO v_new FROM public.community_posts WHERE status = 'published' LIMIT 1;
  IF v_new IS NOT NULL THEN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    v_raised := false;
    BEGIN INSERT INTO public.community_post_likes (post_id, user_id) VALUES (v_new, v_b);
    EXCEPTION WHEN OTHERS THEN v_raised := SQLERRM = 'account_suspended'; END;
    IF NOT v_raised THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: suspended member liked'; END IF; n := n + 1;
    EXECUTE 'RESET ROLE';
  END IF;

  -- lifting restores posting; an expired sanction is not in force
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_mod, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF NOT public.community_admin_lift_sanction(v_sid) THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: lift failed'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';
  IF public.community_active_sanction(v_b) IS NOT NULL THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: sanction still active'; END IF; n := n + 1;
  INSERT INTO public.community_sanctions (user_id, kind, reason, created_by, expires_at) VALUES (v_b, 'suspend', 'expired', v_mod, now() - interval '1 hour');
  IF public.community_active_sanction(v_b) IS NOT NULL THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: expired sanction active'; END IF; n := n + 1;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  INSERT INTO public.community_posts (title, body, author_id) VALUES ('Back again', 'Posting works again once the sanction is lifted.', v_b) RETURNING id INTO v_new;
  n := n + 1;
  EXECUTE 'RESET ROLE';

  -- retention: only old, unpinned member posts are candidates; persona and pinned posts never are; clients cannot call it
  INSERT INTO public.community_posts (title, body, author_id, created_at) VALUES ('Old member post', 'This post is older than the retention window.', v_a, now() - interval '31 days') RETURNING id INTO v_old;
  INSERT INTO public.community_posts (title, body, author_id, created_at, pinned) VALUES ('Old pinned post', 'Pinned posts are never purged by retention.', v_a, now() - interval '31 days', true) RETURNING id INTO v_pin;
  IF NOT EXISTS (SELECT 1 FROM public.community_retention_candidates(500) WHERE id = v_old) THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: old post not a candidate'; END IF; n := n + 1;
  IF EXISTS (SELECT 1 FROM public.community_retention_candidates(500) WHERE id IN (v_pin, v_new)) THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: pinned/new post is a candidate'; END IF; n := n + 1;
  IF EXISTS (SELECT 1 FROM public.community_retention_candidates(500) c JOIN public.community_posts p ON p.id = c.id WHERE p.persona_id IS NOT NULL) THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: persona post is a candidate'; END IF; n := n + 1;
  v_res := public.community_retention_purge(ARRAY[v_old, v_pin, v_new]);
  IF (v_res ->> 'posts')::int <> 1 THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: purge removed % posts', v_res; END IF; n := n + 1;
  IF NOT EXISTS (SELECT 1 FROM public.community_posts WHERE id IN (v_pin)) OR EXISTS (SELECT 1 FROM public.community_posts WHERE id = v_old) THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: purge result wrong'; END IF; n := n + 1;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_raised := false;
  BEGIN PERFORM public.community_retention_purge(ARRAY[v_pin]); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: member called purge'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.community_retention_secret_matches('x'); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SANCTIONS_TEST_FAILED: member called secret check'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  RAISE EXCEPTION 'COMMUNITY_SANCTIONS_PASSED %', n;
END $$;
