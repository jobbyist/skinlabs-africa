-- Server-side enforcement of the free tier's "one meaningful full AI analysis"
-- allowance (configurable via pricing_settings, so it's A/B-testable), plus
-- widening start_free_trial() to support Glow Lite's 7-day trial with a
-- variant-driven trial length instead of a hardcoded 7 days.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS starter_analyses_used int NOT NULL DEFAULT 0;

-- Extend the existing privileged-column trigger (defence in depth alongside
-- the column-level GRANTs — this column is not granted to `authenticated`
-- for UPDATE, so it is already unwritable by clients; the RPC below is the
-- only path that increments it).
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claims', true) IS NULL
     OR coalesce((current_setting('request.jwt.claims', true)::json ->> 'role'), '') = 'service_role'
     OR coalesce(current_setting('app.privileged_write', true), '') = 'on' THEN
    RETURN NEW;
  END IF;
  NEW.subscription_status := OLD.subscription_status;
  NEW.subscription_started_at := OLD.subscription_started_at;
  NEW.billing_interval := OLD.billing_interval;
  NEW.trial_plan := OLD.trial_plan;
  NEW.trial_ends_at := OLD.trial_ends_at;
  NEW.trial_used_at := OLD.trial_used_at;
  NEW.founding_member := OLD.founding_member;
  NEW.is_professional := OLD.is_professional;
  NEW.starter_analyses_used := OLD.starter_analyses_used;
  RETURN NEW;
END;
$$;

-- Single gate for "can this signed-in free account get another AI analysis
-- right now": checks the account's configured free allowance first, then
-- falls back to spending a purchased credit. Anonymous visitors never call
-- this (there is no account to meter against — they always get the client-
-- side starter analysis, by design, to keep the top of funnel frictionless).
-- Paying members don't call this either — they use the separate
-- register_ai_analysis_use()/skincare-ai live-AI path.
CREATE OR REPLACE FUNCTION public.claim_starter_analysis(p_variant_key text DEFAULT 'control')
RETURNS TABLE (allowed boolean, source text, remaining_free int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_allowance int;
  v_used int;
  v_credits int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT free_ai_analysis_allowance INTO v_allowance
    FROM public.pricing_settings WHERE variant_key = coalesce(p_variant_key, 'control');
  IF NOT FOUND THEN
    SELECT free_ai_analysis_allowance INTO v_allowance FROM public.pricing_settings WHERE variant_key = 'control';
  END IF;
  v_allowance := COALESCE(v_allowance, 1);

  SELECT starter_analyses_used INTO v_used FROM public.profiles WHERE user_id = v_uid;
  v_used := COALESCE(v_used, 0);

  IF v_used < v_allowance THEN
    PERFORM set_config('app.privileged_write', 'on', true);
    UPDATE public.profiles SET starter_analyses_used = starter_analyses_used + 1 WHERE user_id = v_uid;
    PERFORM set_config('app.privileged_write', 'off', true);
    RETURN QUERY SELECT true, 'free_allowance', GREATEST(v_allowance - v_used - 1, 0);
    RETURN;
  END IF;

  v_credits := public.available_ai_credits(v_uid);
  IF v_credits > 0 THEN
    INSERT INTO public.ai_credit_transactions (user_id, delta, reason)
    VALUES (v_uid, -1, 'consume:starter_analysis');
    RETURN QUERY SELECT true, 'credit', 0;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 'none', 0;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_starter_analysis(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_starter_analysis(text) TO authenticated;

-- start_free_trial(): widened to cover Glow Lite alongside Insider, with the
-- trial length read from pricing_plans (variant-aware) instead of a hardcoded
-- 7 days, so trial duration is one of the A/B-testable knobs.
--
-- The old single-argument signature is dropped first: a default parameter on
-- the new definition would otherwise make a one-argument call ambiguous
-- between the two overloads.
DROP FUNCTION IF EXISTS public.start_free_trial(text);

CREATE OR REPLACE FUNCTION public.start_free_trial(p_plan text, p_variant_key text DEFAULT 'control')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_used timestamptz;
  v_trial_days int;
  v_trial_eligible boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_plan NOT IN ('insider', 'glow_lite') THEN RAISE EXCEPTION 'Invalid trial plan'; END IF;

  SELECT trial_days, trial_eligible INTO v_trial_days, v_trial_eligible
    FROM public.pricing_plans WHERE plan_id = p_plan AND variant_key = coalesce(p_variant_key, 'control');
  IF NOT FOUND THEN
    SELECT trial_days, trial_eligible INTO v_trial_days, v_trial_eligible
      FROM public.pricing_plans WHERE plan_id = p_plan AND variant_key = 'control';
  END IF;
  IF NOT COALESCE(v_trial_eligible, false) OR COALESCE(v_trial_days, 0) <= 0 THEN
    RAISE EXCEPTION 'This plan has no free trial';
  END IF;

  SELECT trial_used_at INTO v_used FROM public.profiles WHERE user_id = v_uid;
  IF v_used IS NOT NULL THEN RAISE EXCEPTION 'Free trial already used'; END IF;

  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles
     SET subscription_status = 'trial',
         subscription_started_at = COALESCE(subscription_started_at, now()),
         trial_plan = p_plan,
         trial_ends_at = now() + (v_trial_days || ' days')::interval,
         trial_used_at = now()
   WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.start_free_trial(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_free_trial(text, text) TO authenticated;
