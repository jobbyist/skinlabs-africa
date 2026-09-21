-- Bug fix: `PERFORM set_config(...)` executed after an UPDATE silently
-- overwrites Postgres's FOUND variable, because set_config() always
-- returns exactly one row — so `PERFORM set_config(..., 'off', true);
-- RETURN FOUND;` (or `IF FOUND THEN`) always evaluates true, regardless of
-- whether the preceding UPDATE actually matched any rows. Confirmed live:
-- unsubscribe_marketing() with a well-formed but non-existent token
-- incorrectly reported success. This bug predates this migration series —
-- cancel_subscription() already had the identical pattern before today's
-- changes (harmless there previously, since no caller checked its return
-- value) — fixed here since enqueue_email() below now depends on it being
-- correct. Both functions now capture FOUND into a local variable
-- immediately after the UPDATE, before any other statement can run.

CREATE OR REPLACE FUNCTION public.unsubscribe_marketing(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated boolean;
BEGIN
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles
     SET marketing_consent = false,
         marketing_consent_at = now()
   WHERE marketing_unsubscribe_token = p_token;
  v_updated := FOUND;
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN v_updated;
END;
$$;
REVOKE ALL ON FUNCTION public.unsubscribe_marketing(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_marketing(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.cancel_subscription()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_previous_status text;
  v_previous_trial_plan text;
  v_plan_for_email text;
  v_updated boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT subscription_status, trial_plan INTO v_previous_status, v_previous_trial_plan
    FROM public.profiles WHERE user_id = v_uid;

  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles
     SET subscription_status = 'free',
         trial_plan = NULL,
         trial_ends_at = NULL
   WHERE user_id = v_uid
     AND lower(coalesce(subscription_status, '')) IN ('active', 'glow_lite', 'insider', 'vip', 'premium', 'trial');
  v_updated := FOUND;
  PERFORM set_config('app.privileged_write', 'off', true);

  IF v_updated THEN
    v_plan_for_email := coalesce(v_previous_trial_plan, v_previous_status);
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
    PERFORM public.enqueue_email(
      'MEMBERSHIP_CANCELLED', 'membership_cancelled:' || v_uid::text || ':' || now()::date::text,
      'membership_cancelled', 'MEMBERSHIP', v_uid, v_email,
      jsonb_build_object('plan', v_plan_for_email),
      'rpc:cancel_subscription'
    );
  END IF;

  RETURN v_updated;
END;
$$;
