-- start_free_trial() probe, one throwaway account per PURCHASABLE, trial-eligible
-- plan (onboarding overhaul 12). Plans are read from pricing_plans (control
-- variant), so a newly purchasable plan is covered automatically.
--
-- Safe on any environment, including production: everything runs in one DO
-- block that ALWAYS ends by raising, so the throwaway users, profiles and the
-- queued trial_started emails are rolled back.
--   Success  -> ERROR:  START_FREE_TRIAL_TESTS_PASSED (n assertions, plans: …)
--   Failure  -> ERROR:  START_FREE_TRIAL_TEST_FAILED: <which assertion>
-- Run with: scripts/run-sql-probes.sh (CI), psql, the SQL editor or
-- mcp__Supabase__execute_sql.
DO $$
DECLARE
  p record;
  v_uid uuid;
  v_prof record;
  v_promo timestamptz;
  v_min_end timestamptz;
  v_raised boolean;
  v_msg text;
  n int := 0;
  v_plans text := '';
BEGIN
  SELECT promo_free_trial_until INTO v_promo FROM public.pricing_settings WHERE variant_key = 'control';

  FOR p IN
    SELECT plan_id, trial_days FROM public.pricing_plans
     WHERE variant_key = 'control' AND is_purchasable AND trial_eligible AND coalesce(trial_days, 0) > 0
     ORDER BY plan_id
  LOOP
    v_uid := gen_random_uuid();
    EXECUTE 'RESET ROLE';
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at,
                            raw_app_meta_data, raw_user_meta_data)
    VALUES (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'trial-probe-' || v_uid || '@example.invalid', '', now(), now(), '{}'::jsonb, '{}'::jsonb);
    INSERT INTO public.profiles (user_id, email) VALUES (v_uid, 'trial-probe@example.invalid')
    ON CONFLICT (user_id) DO NOTHING;

    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    PERFORM set_config('request.jwt.claim.sub', v_uid::text, true);
    EXECUTE 'SET LOCAL ROLE authenticated';

    -- 1. The trial starts, as the member themself.
    IF NOT public.start_free_trial(p.plan_id, 'control') THEN
      RAISE EXCEPTION 'START_FREE_TRIAL_TEST_FAILED: % did not return true', p.plan_id;
    END IF; n := n + 1;

    SELECT subscription_status, trial_plan, trial_ends_at, trial_used_at, trial_started_at INTO v_prof
      FROM public.profiles WHERE user_id = v_uid;
    IF v_prof.subscription_status <> 'trial' OR v_prof.trial_plan <> p.plan_id
       OR v_prof.trial_used_at IS NULL OR v_prof.trial_started_at IS NULL THEN
      RAISE EXCEPTION 'START_FREE_TRIAL_TEST_FAILED: % profile not a trial (%)', p.plan_id, row_to_json(v_prof);
    END IF; n := n + 1;

    -- 2. Length: trial_days, extended to the promo date while that's later.
    v_min_end := now() + (p.trial_days || ' days')::interval - interval '1 minute';
    IF v_promo IS NOT NULL AND v_promo > v_min_end THEN v_min_end := v_promo - interval '1 minute'; END IF;
    IF v_prof.trial_ends_at < v_min_end THEN
      RAISE EXCEPTION 'START_FREE_TRIAL_TEST_FAILED: % ends too early (% < %)', p.plan_id, v_prof.trial_ends_at, v_min_end;
    END IF; n := n + 1;

    -- 3. One trial per account.
    v_raised := false;
    BEGIN
      PERFORM public.start_free_trial(p.plan_id, 'control');
    EXCEPTION WHEN others THEN
      v_raised := true; v_msg := SQLERRM;
    END;
    IF NOT v_raised OR v_msg NOT ILIKE '%already used%' THEN
      RAISE EXCEPTION 'START_FREE_TRIAL_TEST_FAILED: % second trial was not refused (%)', p.plan_id, v_msg;
    END IF; n := n + 1;

    -- 4. The member can't hand themselves a paid status directly.
    v_raised := false;
    BEGIN
      UPDATE public.profiles SET subscription_status = 'vip' WHERE user_id = v_uid;
    EXCEPTION WHEN others THEN v_raised := true;
    END;
    IF NOT v_raised THEN
      RAISE EXCEPTION 'START_FREE_TRIAL_TEST_FAILED: % member could write subscription_status', p.plan_id;
    END IF; n := n + 1;

    -- 5. The trial_started email was queued (plan-aware).
    EXECUTE 'RESET ROLE';
    IF NOT EXISTS (
      SELECT 1 FROM public.email_outbox o
       WHERE o.user_id = v_uid AND o.template_id = 'trial_started' AND o.payload->>'plan' = p.plan_id
    ) THEN
      RAISE EXCEPTION 'START_FREE_TRIAL_TEST_FAILED: % no trial_started email queued', p.plan_id;
    END IF; n := n + 1;

    v_plans := v_plans || CASE WHEN v_plans = '' THEN '' ELSE ', ' END || p.plan_id;
  END LOOP;

  IF v_plans = '' THEN
    RAISE EXCEPTION 'START_FREE_TRIAL_TEST_FAILED: no purchasable trial plan found';
  END IF;

  -- 6. A plan that isn't trial-able is refused (VIP is not purchasable today).
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_raised := false;
  BEGIN
    PERFORM public.start_free_trial('vip', 'control');
  EXCEPTION WHEN others THEN v_raised := true;
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'START_FREE_TRIAL_TEST_FAILED: vip trial was not refused'; END IF;
  n := n + 1;

  RAISE EXCEPTION 'START_FREE_TRIAL_TESTS_PASSED (% assertions, plans: %)', n, v_plans;
END $$;
