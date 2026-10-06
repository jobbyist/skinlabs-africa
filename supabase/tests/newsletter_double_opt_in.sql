-- Newsletter double opt-in probe (growth engine). Safe on any environment,
-- including production: everything runs in one DO block that ALWAYS ends by
-- raising, so the throwaway subscribers, outbox rows and profile are rolled back.
--   Success  -> ERROR:  NEWSLETTER_DOUBLE_OPT_IN_TESTS_PASSED (n assertions)
--   Failure  -> ERROR:  NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: <which assertion>
-- Run with: scripts/run-sql-probes.sh (CI), psql or the SQL editor.
DO $$
DECLARE
  n int := 0;
  v_email text := 'nl-probe-' || gen_random_uuid() || '@example.invalid';
  v_email2 text := 'nl-probe-' || gen_random_uuid() || '@example.invalid';
  v_member_email text := 'nl-probe-' || gen_random_uuid() || '@example.invalid';
  v_row public.newsletter_subscribers%ROWTYPE;
  v_token uuid;
  v_old_token uuid;
  v_ok boolean;
  v_text text;
  v_count int;
  v_sent int;
  v_uid uuid := gen_random_uuid();
  v_before int;
BEGIN
  -- Helper-free assertions: each block raises TEST_FAILED with a label.

  -- 1. anon has no direct table access (can't mark anyone 'confirmed', can't read tokens).
  EXECUTE 'SET LOCAL ROLE anon';
  v_ok := false;
  BEGIN
    INSERT INTO public.newsletter_subscribers (email, digest_status) VALUES (v_email, 'confirmed');
  EXCEPTION WHEN insufficient_privilege THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: anon could INSERT directly'; END IF;
  v_ok := false;
  BEGIN
    PERFORM unsubscribe_token FROM public.newsletter_subscribers LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: anon could read tokens'; END IF;
  v_ok := false;
  BEGIN
    PERFORM public.unsubscribe_newsletter(gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: anon could call unsubscribe_newsletter'; END IF;
  n := n + 3;

  -- 2. Subscribing as anon creates a PENDING row, stores server-owned consent, queues ONE confirm email.
  v_ok := public.subscribe_newsletter(upper(v_email), 'probe-source', '/briefings/x');
  EXECUTE 'RESET ROLE';
  IF v_ok IS NOT TRUE THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: subscribe did not return true'; END IF;
  SELECT * INTO v_row FROM public.newsletter_subscribers WHERE email = v_email;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: email was not lower-cased/stored'; END IF;
  IF v_row.digest_status <> 'pending' OR v_row.consultation_waitlist OR v_row.digest_source <> 'probe-source'
     OR v_row.digest_source_path <> '/briefings/x' OR v_row.digest_consent_version IS NULL OR v_row.digest_consent_text IS NULL THEN
    RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: pending row has wrong fields (%)', row_to_json(v_row);
  END IF;
  SELECT count(*) INTO v_count FROM public.email_outbox WHERE recipient_email = v_email AND template_id = 'newsletter_digest_confirm';
  IF v_count <> 1 THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: expected 1 confirm email, got %', v_count; END IF;
  SELECT count(*) INTO v_count FROM public.email_outbox WHERE recipient_email = v_email AND template_id = 'form_confirmation_newsletter';
  IF v_count <> 0 THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: digest signup sent the consultation-waitlist email'; END IF;
  n := n + 4;

  -- 3. A repeat within the hour sends nothing more, and still looks identical to the caller.
  v_ok := public.subscribe_newsletter(v_email, 'probe-source', NULL);
  SELECT count(*) INTO v_count FROM public.email_outbox WHERE recipient_email = v_email AND template_id = 'newsletter_digest_confirm';
  IF v_ok IS NOT TRUE OR v_count <> 1 THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: repeat signup re-sent or behaved differently'; END IF;
  n := n + 1;

  -- 4. Invalid addresses are rejected; an unknown source is stored as 'unknown'.
  v_ok := false;
  BEGIN PERFORM public.subscribe_newsletter('not-an-email', 'x', NULL);
  EXCEPTION WHEN SQLSTATE '22023' THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: invalid email accepted'; END IF;
  PERFORM public.subscribe_newsletter(v_email2, 'Bad Source!', 'no-leading-slash');
  SELECT * INTO v_row FROM public.newsletter_subscribers WHERE email = v_email2;
  IF v_row.digest_source <> 'unknown' OR v_row.digest_source_path IS NOT NULL THEN
    RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: source/path not sanitised';
  END IF;
  n := n + 2;

  -- 5. Not delivered to the digest until confirmed.
  -- 6. Confirm: bad token invalid, good token confirmed, repeat 'already'.
  SELECT digest_confirm_token INTO v_token FROM public.newsletter_subscribers WHERE email = v_email;
  IF public.confirm_newsletter(gen_random_uuid()) <> 'invalid' THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: bad token not invalid'; END IF;
  IF public.confirm_newsletter(NULL) <> 'invalid' THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: null token not invalid'; END IF;
  PERFORM public.enqueue_weekly_newsletter_digest();
  SELECT count(*) INTO v_count FROM public.email_outbox WHERE recipient_email = v_email AND template_id = 'newsletter_weekly_digest';
  IF v_count <> 0 THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: digest sent to an UNCONFIRMED subscriber'; END IF;
  IF public.confirm_newsletter(v_token) <> 'confirmed' THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: confirm failed'; END IF;
  IF public.confirm_newsletter(v_token) <> 'already' THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: second confirm not already'; END IF;
  SELECT * INTO v_row FROM public.newsletter_subscribers WHERE email = v_email;
  IF v_row.digest_status <> 'confirmed' OR v_row.digest_confirmed_at IS NULL THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: row not confirmed'; END IF;
  n := n + 5;

  -- 7. A token older than 7 days no longer confirms.
  SELECT digest_confirm_token INTO v_old_token FROM public.newsletter_subscribers WHERE email = v_email2;
  UPDATE public.newsletter_subscribers SET digest_confirmation_sent_at = now() - interval '8 days' WHERE email = v_email2;
  IF public.confirm_newsletter(v_old_token) <> 'invalid' THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: expired token confirmed'; END IF;
  -- ...and asking again issues a fresh token and a new email (the previous was > 1h ago).
  PERFORM public.subscribe_newsletter(v_email2, 'probe-source', NULL);
  IF (SELECT digest_confirm_token FROM public.newsletter_subscribers WHERE email = v_email2) = v_old_token THEN
    RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: resend reused the old token';
  END IF;
  n := n + 2;

  -- 8. Weekly digest reaches the confirmed subscriber exactly once, never the legacy waitlist-only
  --    row, and never twice for an address that is also an opted-in member.
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data)
  VALUES (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_member_email, '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.profiles (user_id, email, marketing_consent) VALUES (v_uid, v_member_email, true)
  ON CONFLICT (user_id) DO UPDATE SET marketing_consent = true;
  PERFORM public.subscribe_newsletter(v_member_email, 'probe-source', NULL);
  UPDATE public.newsletter_subscribers SET digest_status = 'confirmed' WHERE email = v_member_email;
  INSERT INTO public.newsletter_subscribers (email) VALUES ('legacy-' || v_email) ON CONFLICT DO NOTHING;

  v_sent := public.enqueue_weekly_newsletter_digest();
  IF v_sent > 0 THEN  -- 0 only when there is no content this week (function skips the send by design)
    SELECT count(*) INTO v_count FROM public.email_outbox WHERE recipient_email = v_email AND template_id = 'newsletter_weekly_digest';
    IF v_count <> 1 THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: confirmed subscriber got % digests', v_count; END IF;
    SELECT payload->>'unsubscribe_url' INTO v_text FROM public.email_outbox WHERE recipient_email = v_email AND template_id = 'newsletter_weekly_digest';
    IF v_text NOT LIKE '%/email-unsubscribe?token=' || (SELECT unsubscribe_token FROM public.newsletter_subscribers WHERE email = v_email)::text THEN
      RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: wrong unsubscribe_url (%)', v_text;
    END IF;
    SELECT count(*) INTO v_count FROM public.email_outbox WHERE recipient_email = 'legacy-' || v_email AND template_id = 'newsletter_weekly_digest';
    IF v_count <> 0 THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: waitlist-only row received the digest'; END IF;
    SELECT count(*) INTO v_count FROM public.email_outbox WHERE recipient_email = v_member_email AND template_id = 'newsletter_weekly_digest';
    IF v_count <> 1 THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: member+subscriber got % digests', v_count; END IF;
    SELECT count(*) INTO v_before FROM public.email_outbox WHERE template_id = 'newsletter_weekly_digest';
    PERFORM public.enqueue_weekly_newsletter_digest();
    IF (SELECT count(*) FROM public.email_outbox WHERE template_id = 'newsletter_weekly_digest') <> v_before THEN
      RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: a second run in the same week double-sent';
    END IF;
    n := n + 5;
  END IF;

  -- 9. Unsubscribe (service role only) stops delivery; unknown token reports false; re-subscribing needs a new confirmation.
  IF public.unsubscribe_newsletter((SELECT unsubscribe_token FROM public.newsletter_subscribers WHERE email = v_email)) IS NOT TRUE THEN
    RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: unsubscribe returned false for a real token';
  END IF;
  IF public.unsubscribe_newsletter(gen_random_uuid()) IS NOT FALSE THEN
    RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: unsubscribe returned true for an unknown token';
  END IF;
  SELECT * INTO v_row FROM public.newsletter_subscribers WHERE email = v_email;
  IF v_row.digest_status <> 'unsubscribed' OR v_row.digest_unsubscribed_at IS NULL THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: not unsubscribed'; END IF;
  IF public.confirm_newsletter(v_token) <> 'invalid' THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: old confirm link re-subscribed an unsubscribed address'; END IF;
  PERFORM public.subscribe_newsletter(v_email, 'probe-source', NULL);
  SELECT * INTO v_row FROM public.newsletter_subscribers WHERE email = v_email;
  IF v_row.digest_status <> 'pending' OR v_row.digest_confirm_token = v_token THEN
    RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: re-subscribe did not restart double opt-in';
  END IF;
  n := n + 5;

  -- 10. Consultation waitlist keeps working: new join queues its confirmation; an existing digest-only
  --     row can join; a repeat is 'already'.
  IF public.join_consultation_waitlist(v_email2) <> 'joined' THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: digest-only row could not join the waitlist'; END IF;
  IF public.join_consultation_waitlist(v_email2) <> 'already' THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: repeat waitlist join not already'; END IF;
  SELECT count(*) INTO v_count FROM public.email_outbox WHERE recipient_email = v_email2 AND template_id = 'form_confirmation_newsletter';
  IF v_count <> 1 THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: waitlist confirmation count %', v_count; END IF;
  v_ok := false;
  BEGIN PERFORM public.join_consultation_waitlist('nope'); EXCEPTION WHEN SQLSTATE '22023' THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TEST_FAILED: invalid waitlist email accepted'; END IF;
  n := n + 4;

  RAISE EXCEPTION 'NEWSLETTER_DOUBLE_OPT_IN_TESTS_PASSED (% assertions)', n;
END
$$;
