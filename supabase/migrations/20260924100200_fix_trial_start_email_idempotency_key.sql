-- FIX: free trials cannot be started (found 2026-09-24 while testing the
-- formulator allowance). Applied live 2026-09-24 at the user's request.
--
-- notify_subscription_change() (20260916101000_email_system_triggers.sql)
-- builds the TRIAL_STARTED / Glow Lite MEMBERSHIP_ACTIVATED email idempotency
-- key from NEW.trial_started_at, but start_free_trial() never sets that column
-- (it sets trial_used_at). NULL || text = NULL, so enqueue_email() inserts a
-- NULL idempotency_key, violates email_events' NOT NULL constraint, and the
-- exception aborts the whole start_free_trial() transaction.
--
-- Verified live (rolled-back probe as a throwaway user): both
-- start_free_trial('insider') and start_free_trial('glow_lite') fail with
-- "null value in column idempotency_key of relation email_events", and no
-- profile has ever recorded trial_used_at.
--
-- Fix at the source: start_free_trial() now stamps trial_started_at, and the
-- trigger falls back to trial_used_at/now() so a future writer can't re-break it.

CREATE OR REPLACE FUNCTION public.start_free_trial(p_plan text, p_variant_key text DEFAULT 'control'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_used timestamptz;
  v_trial_days int;
  v_trial_eligible boolean;
  v_promo_until timestamptz;
  v_trial_ends_at timestamptz;
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

  SELECT promo_free_trial_until INTO v_promo_until
    FROM public.pricing_settings WHERE variant_key = coalesce(p_variant_key, 'control');
  IF NOT FOUND THEN
    SELECT promo_free_trial_until INTO v_promo_until FROM public.pricing_settings WHERE variant_key = 'control';
  END IF;

  v_trial_ends_at := now() + (v_trial_days || ' days')::interval;
  IF v_promo_until IS NOT NULL AND v_promo_until > v_trial_ends_at THEN
    v_trial_ends_at := v_promo_until;
  END IF;

  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles
     SET subscription_status = 'trial',
         subscription_started_at = COALESCE(subscription_started_at, now()),
         trial_plan = p_plan,
         trial_started_at = now(),
         trial_ends_at = v_trial_ends_at,
         trial_used_at = now()
   WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN true;
END;
$function$;
REVOKE ALL ON FUNCTION public.start_free_trial(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_free_trial(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_subscription_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_old_paid boolean;
  v_new_paid boolean;
  v_trial_key text := coalesce(NEW.trial_started_at, NEW.trial_used_at, now())::text;
BEGIN
  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    PERFORM public.create_notification(
      NEW.user_id, 'billing', 'Membership updated',
      'Your plan is now ' || COALESCE(NEW.subscription_status, 'free') || '.',
      '/dashboard?tab=billing'
    );
  END IF;

  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.trial_plan IS DISTINCT FROM OLD.trial_plan THEN

    v_email := (SELECT email FROM auth.users WHERE id = NEW.user_id);
    v_old_paid := OLD.subscription_status IN ('glow_lite', 'insider', 'vip');
    v_new_paid := NEW.subscription_status IN ('glow_lite', 'insider', 'vip');

    IF NEW.subscription_status = 'trial' AND NEW.trial_plan = 'insider'
       AND (OLD.subscription_status IS DISTINCT FROM 'trial' OR OLD.trial_plan IS DISTINCT FROM 'insider') THEN
      PERFORM public.enqueue_email(
        'TRIAL_STARTED', 'trial_started:' || NEW.user_id::text || ':' || v_trial_key,
        'trial_started', 'TRIAL', NEW.user_id, v_email,
        jsonb_build_object('trial_ends_at', NEW.trial_ends_at), 'trigger:notify_subscription_change'
      );

    ELSIF OLD.subscription_status = 'trial' AND OLD.trial_plan = 'insider' AND NEW.subscription_status = 'free' THEN
      PERFORM public.enqueue_email(
        'TRIAL_ENDED', 'trial_ended:' || NEW.user_id::text || ':' || coalesce(OLD.trial_ends_at, now())::text,
        'trial_ended', 'TRIAL', NEW.user_id, v_email,
        '{}'::jsonb, 'trigger:notify_subscription_change'
      );

    ELSIF OLD.subscription_status = 'trial' AND v_new_paid THEN
      PERFORM public.enqueue_email(
        'MEMBERSHIP_ACTIVATED', 'membership_activated:' || NEW.user_id::text || ':' || coalesce(NEW.subscription_started_at, now())::text,
        'membership_activated', 'MEMBERSHIP', NEW.user_id, v_email,
        jsonb_build_object('plan', NEW.subscription_status, 'converted_from_trial', true),
        'trigger:notify_subscription_change'
      );

    ELSIF NEW.subscription_status = 'trial' AND NEW.trial_plan = 'glow_lite'
       AND (OLD.subscription_status IS DISTINCT FROM 'trial' OR OLD.trial_plan IS DISTINCT FROM 'glow_lite') THEN
      PERFORM public.enqueue_email(
        'MEMBERSHIP_ACTIVATED', 'membership_activated:' || NEW.user_id::text || ':' || v_trial_key,
        'membership_activated', 'MEMBERSHIP', NEW.user_id, v_email,
        jsonb_build_object('plan', 'glow_lite'), 'trigger:notify_subscription_change'
      );

    ELSIF (NOT v_old_paid) AND v_new_paid THEN
      PERFORM public.enqueue_email(
        'MEMBERSHIP_ACTIVATED', 'membership_activated:' || NEW.user_id::text || ':' || coalesce(NEW.subscription_started_at, now())::text,
        'membership_activated', 'MEMBERSHIP', NEW.user_id, v_email,
        jsonb_build_object('plan', NEW.subscription_status), 'trigger:notify_subscription_change'
      );

    ELSIF v_old_paid AND v_new_paid AND NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
       AND public.subscription_ladder_rank(NEW.subscription_status) > public.subscription_ladder_rank(OLD.subscription_status) THEN
      PERFORM public.enqueue_email(
        'MEMBERSHIP_UPGRADED', 'membership_upgraded:' || NEW.user_id::text || ':' || coalesce(NEW.subscription_started_at, now())::text,
        'membership_upgraded', 'MEMBERSHIP', NEW.user_id, v_email,
        jsonb_build_object('from_plan', OLD.subscription_status, 'to_plan', NEW.subscription_status),
        'trigger:notify_subscription_change'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.notify_subscription_change() FROM PUBLIC, anon, authenticated;
