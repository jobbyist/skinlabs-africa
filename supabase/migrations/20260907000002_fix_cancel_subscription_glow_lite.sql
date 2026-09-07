-- Fix cancel_subscription(): the paying-status list it matched against
-- omitted 'glow_lite', so a real Glow Lite subscriber's cancellation request
-- silently matched zero rows (RETURN FOUND = false) — the dashboard's
-- "cancel any time" action would fail for exactly one of the three paid
-- tiers it claims to support. Align the list with
-- entitlements.ts's PAID_SUBSCRIPTION_STATUSES.

CREATE OR REPLACE FUNCTION public.cancel_subscription()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles
     SET subscription_status = 'free',
         trial_plan = NULL,
         trial_ends_at = NULL
   WHERE user_id = v_uid
     AND lower(coalesce(subscription_status, '')) IN ('active', 'glow_lite', 'insider', 'vip', 'premium', 'trial');
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN FOUND;
END;
$$;
