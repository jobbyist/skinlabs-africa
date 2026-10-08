-- Rolled-back probe: Community Forum (20261008100000 / 110000 / 120000). Always raises, so nothing is kept.
-- "COMMUNITY_FORUM_PASSED n" means every assertion held.
DO $$
DECLARE
  v_a uuid := gen_random_uuid(); v_b uuid := gen_random_uuid(); v_mod uuid := gen_random_uuid(); v_nohandle uuid := gen_random_uuid();
  v_post uuid; v_post_b uuid; v_comment uuid; n int := 0; c int; v_raised boolean; v_text text; v_rows int;
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  SELECT x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cf-' || x || '@example.invalid', '', now(), now(), '{}', '{}'
    FROM unnest(ARRAY[v_a, v_b, v_mod, v_nohandle]) x;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_mod, 'moderator');
  -- profiles are created by the sign-up trigger; give A, B and the moderator real handles (v_nohandle keeps its placeholder)
  UPDATE public.profiles SET username = 'probe_alice', username_generated = false, full_name = 'Alice Probe' WHERE user_id = v_a;
  UPDATE public.profiles SET username = 'probe_bob', username_generated = false, full_name = 'Bob Probe' WHERE user_id = v_b;
  UPDATE public.profiles SET username = 'probe_mod', username_generated = false, full_name = 'Mona Moderator' WHERE user_id = v_mod;

  -- seed content is present (when the seed migration ran) and anon can read nothing
  EXECUTE 'SET LOCAL ROLE anon';
  v_raised := false;
  BEGIN PERFORM count(*) FROM public.community_posts; EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: anon can read posts'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM * FROM public.community_feed(); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: anon can call feed'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- a member without a chosen handle cannot post
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_nohandle, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_raised := false;
  BEGIN INSERT INTO public.community_posts (title, body, author_id) VALUES ('No handle post', 'This should be refused for lack of a handle.', v_nohandle);
  EXCEPTION WHEN OTHERS THEN v_raised := SQLERRM = 'handle_required'; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: post without handle allowed'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- A creates a post; cannot impersonate B, cannot set counters / pinned / status / persona
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  INSERT INTO public.community_posts (title, body, category, author_id)
  VALUES ('Probe: sunscreen and marks', 'Does anyone reapply sunscreen over the day? Asking for my routine.', 'sun-care', v_a) RETURNING id INTO v_post;
  n := n + 1;
  v_raised := false;
  BEGIN INSERT INTO public.community_posts (title, body, author_id) VALUES ('Impersonation attempt', 'Posting as somebody else should fail.', v_b);
  EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: impersonated insert allowed'; END IF; n := n + 1;
  v_raised := false;
  BEGIN INSERT INTO public.community_posts (title, body, author_id, pinned) VALUES ('Pinned attempt', 'Members cannot pin their own posts.', v_a, true);
  EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: member set pinned'; END IF; n := n + 1;
  v_raised := false;
  BEGIN INSERT INTO public.community_posts (title, body, author_id, like_count) VALUES ('Likes attempt', 'Members cannot set their own like count.', v_a, 99);
  EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: member set like_count'; END IF; n := n + 1;
  v_raised := false;
  BEGIN UPDATE public.community_posts SET like_count = 50 WHERE id = v_post; EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: member updated like_count'; END IF; n := n + 1;
  v_raised := false;
  BEGIN INSERT INTO public.community_posts (title, body, author_id) VALUES ('x', 'too short title above and a fine body here.', v_a);
  EXCEPTION WHEN check_violation THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: short title allowed'; END IF; n := n + 1;
  -- A can edit own post (edited_at stamped)
  UPDATE public.community_posts SET body = 'Edited: does anyone reapply sunscreen over the day?' WHERE id = v_post;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: own edit blocked'; END IF; n := n + 1;
  -- A likes own post: allowed, but must not notify
  INSERT INTO public.community_post_likes (post_id, user_id) VALUES (v_post, v_a);
  EXECUTE 'RESET ROLE';
  IF (SELECT edited_at FROM public.community_posts WHERE id = v_post) IS NULL THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: edited_at not stamped'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.notifications WHERE user_id = v_a;
  IF c <> 0 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: self-like notified (%)', c; END IF; n := n + 1;

  -- B likes A's post: duplicate refused, counter = 2, A is notified once with a deep link; B cannot see A's like row
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  INSERT INTO public.community_post_likes (post_id, user_id) VALUES (v_post, v_b);
  v_raised := false;
  BEGIN INSERT INTO public.community_post_likes (post_id, user_id) VALUES (v_post, v_b); EXCEPTION WHEN unique_violation THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: duplicate like allowed'; END IF; n := n + 1;
  v_raised := false;
  BEGIN INSERT INTO public.community_post_likes (post_id, user_id) VALUES (v_post, v_a); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: like as another user allowed'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.community_post_likes WHERE post_id = v_post;
  IF c <> 1 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: B can see % like rows (expected only own)', c; END IF; n := n + 1;
  -- B cannot edit or delete A's post, nor remove A's like
  UPDATE public.community_posts SET body = 'Hijacked body text that should not apply.' WHERE id = v_post;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 0 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: B edited A''s post'; END IF; n := n + 1;
  DELETE FROM public.community_post_likes WHERE post_id = v_post AND user_id = v_a;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 0 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: B removed A''s like'; END IF; n := n + 1;
  IF public.community_delete_own('post', v_post) THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: B deleted A''s post via RPC'; END IF; n := n + 1;
  -- B comments, and likes the comment of A later
  INSERT INTO public.community_comments (post_id, body, author_id) VALUES (v_post, 'I reapply at lunch with a stick format.', v_b) RETURNING id INTO v_comment;
  n := n + 1;
  EXECUTE 'RESET ROLE';
  IF (SELECT like_count FROM public.community_posts WHERE id = v_post) <> 2 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: like_count not 2'; END IF; n := n + 1;
  IF (SELECT comment_count FROM public.community_posts WHERE id = v_post) <> 1 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: comment_count not 1'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.notifications WHERE user_id = v_a AND category = 'community';
  IF c <> 2 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: A has % community notifications (expected like + comment)', c; END IF; n := n + 1;
  SELECT link INTO v_text FROM public.notifications WHERE user_id = v_a AND title LIKE 'probe_bob liked%' LIMIT 1;
  IF v_text IS DISTINCT FROM '/community-forum?post=' || v_post THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: like notification link %', v_text; END IF; n := n + 1;
  -- debounce: the comment came within 10 minutes of the like's push -> inbox only (exactly one push-wanted dispatch for the post)
  SELECT count(*) INTO c FROM public.notification_dispatches WHERE user_id = v_a AND tag = 'community_' || v_post AND push_wanted;
  IF c <> 1 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: % push dispatches for one post inside 10 min (expected 1)', c; END IF; n := n + 1;
  -- B never gets notified about their own actions
  SELECT count(*) INTO c FROM public.notifications WHERE user_id = v_b AND category = 'community';
  IF c <> 0 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: B notified about own actions'; END IF; n := n + 1;

  -- unlike + re-like does not notify twice (idempotent key)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  DELETE FROM public.community_post_likes WHERE post_id = v_post AND user_id = v_b;
  INSERT INTO public.community_post_likes (post_id, user_id) VALUES (v_post, v_b);
  EXECUTE 'RESET ROLE';
  SELECT count(*) INTO c FROM public.notifications WHERE user_id = v_a AND title LIKE 'probe_bob liked%';
  IF c <> 1 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: re-like notified again (%)', c; END IF; n := n + 1;

  -- read RPCs: feed shows A's post with the handle and member role; pagination terminates; deep link works
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO c FROM public.community_feed(5);
  IF c < 1 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: feed empty'; END IF; n := n + 1;
  SELECT author_name || '/' || author_role || '/' || liked_by_me::text INTO v_text FROM public.community_feed(p_post_id => v_post);
  IF v_text <> 'probe_alice/member/true' THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: feed row was %', v_text; END IF; n := n + 1;
  SELECT author_name INTO v_text FROM public.community_comments_page(v_post);
  IF v_text <> 'probe_bob' THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: comment author %', v_text; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- B reports the post once (duplicate refused); a member cannot moderate; reporter cannot read others' reports
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  INSERT INTO public.community_reports (reporter_id, post_id, reason) VALUES (v_b, v_post, 'spam');
  v_raised := false;
  BEGIN INSERT INTO public.community_reports (reporter_id, post_id, reason) VALUES (v_b, v_post, 'spam'); EXCEPTION WHEN unique_violation THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: duplicate report allowed'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.community_moderate('post', v_post, 'remove'); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: member could moderate'; END IF; n := n + 1;
  v_raised := false;
  BEGIN INSERT INTO public.user_roles (user_id, role) VALUES (v_b, 'admin'); EXCEPTION WHEN OTHERS THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: member escalated role'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- moderator: sees the role badge, can pin then remove; removed post disappears from B's feed and its reports close
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_mod, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF NOT public.community_moderate('post', v_post, 'pin') THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: pin failed'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.community_reports;
  IF c <> 1 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: moderator sees % reports', c; END IF; n := n + 1;
  IF NOT public.community_moderate('post', v_post, 'remove', 'probe') THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: remove failed'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';
  IF (SELECT status FROM public.community_reports WHERE post_id = v_post) <> 'actioned' THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: report not closed'; END IF; n := n + 1;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO c FROM public.community_feed(p_post_id => v_post);
  IF c <> 0 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: removed post still visible to B'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.community_comments_page(v_post);
  IF c <> 0 THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: removed post comments readable'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';
  -- the author still sees their removed post (so the UI can say it was removed)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT status INTO v_text FROM public.community_feed(p_post_id => v_post);
  IF v_text IS DISTINCT FROM 'removed' THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: author view of removed post was %', v_text; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- rate limit: the 6th post inside an hour is refused
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  FOR c IN 1..5 LOOP
    INSERT INTO public.community_posts (title, body, author_id) VALUES ('Rate limit post ' || c, 'Filling up the hourly allowance for the probe.', v_b);
  END LOOP;
  v_raised := false;
  BEGIN INSERT INTO public.community_posts (title, body, author_id) VALUES ('Rate limit post 6', 'This one should be refused as too fast.', v_b);
  EXCEPTION WHEN OTHERS THEN v_raised := SQLERRM = 'rate_limited'; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_TEST_FAILED: rate limit not enforced'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  RAISE EXCEPTION 'COMMUNITY_FORUM_PASSED %', n;
END $$;
