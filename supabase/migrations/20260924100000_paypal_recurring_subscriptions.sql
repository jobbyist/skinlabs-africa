-- PayPal recurring memberships (Subscriptions API) — see CLAUDE.md
-- "PayPal recurring subscriptions" for the full flow.
--
-- A paid plan bought through PayPal is now a real PayPal subscription billed
-- automatically every month/year, instead of a one-off order. The free trial
-- (7 days, or through 1 November 2026 while the extended-trial promo runs —
-- pricing_settings.promo_free_trial_until) is implemented by giving the
-- subscription a future start_time equal to the trial end, so PayPal takes
-- the first payment exactly when the trial ends.

-- ---------- 1. payment_subscriptions: one row per gateway subscription ----------
CREATE TABLE IF NOT EXISTS public.payment_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway text NOT NULL CHECK (gateway IN ('paypal', 'payfast')),
  gateway_subscription_id text NOT NULL UNIQUE,
  plan_id text NOT NULL,
  billing_interval text NOT NULL CHECK (billing_interval IN ('monthly', 'annual')),
  -- pending: created, customer hasn't approved yet
  -- trialing: approved, first charge scheduled for first_billing_at
  -- active: at least one successful charge
  -- past_due: latest charge failed, PayPal is retrying
  -- suspended/cancelled/expired: no further charges
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'trialing', 'active', 'past_due', 'suspended', 'cancelled', 'expired')),
  -- 'new_trial' | 'existing_trial' | 'immediate' — how the start date was decided.
  start_kind text NOT NULL CHECK (start_kind IN ('new_trial', 'existing_trial', 'immediate')),
  first_billing_at timestamptz,
  next_billing_at timestamptz,
  -- Access is kept until this date after a cancellation made outside the app
  -- (e.g. from the customer's PayPal account); see expire_lapsed_subscriptions().
  current_period_end timestamptz,
  amount_zar numeric(10, 2) NOT NULL,
  amount_charged numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  fx_rate numeric(12, 6),
  fx_rate_source text,
  fx_rate_as_of timestamptz,
  payer_email text,
  cancelled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_subscriptions_user_id_idx ON public.payment_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS payment_subscriptions_status_idx ON public.payment_subscriptions (status);

ALTER TABLE public.payment_subscriptions ENABLE ROW LEVEL SECURITY;

-- Owners can read their own subscriptions (Billing tab); every write goes
-- through the paypal-payment edge function's service-role client.
DROP POLICY IF EXISTS "Users can view their own payment subscriptions" ON public.payment_subscriptions;
CREATE POLICY "Users can view their own payment subscriptions"
  ON public.payment_subscriptions FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

REVOKE ALL ON public.payment_subscriptions FROM anon, authenticated;
GRANT SELECT ON public.payment_subscriptions TO authenticated;
GRANT ALL ON public.payment_subscriptions TO service_role;

-- ---------- 2. paypal_billing_plans: lazily-created PayPal catalog ids ----------
-- Service-role only (RLS on, zero policies) — same lockdown as
-- payment_checkout_intents. plan_id = '__product__' holds the shared catalog
-- product id.
CREATE TABLE IF NOT EXISTS public.paypal_billing_plans (
  env text NOT NULL CHECK (env IN ('sandbox', 'live')),
  plan_id text NOT NULL,
  billing_interval text NOT NULL CHECK (billing_interval IN ('monthly', 'annual')),
  paypal_product_id text,
  paypal_plan_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (env, plan_id, billing_interval)
);
ALTER TABLE public.paypal_billing_plans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.paypal_billing_plans FROM anon, authenticated;
GRANT ALL ON public.paypal_billing_plans TO service_role;

-- ---------- 3. Don't expire a trial whose first PayPal charge is on its way ----------
-- PayPal bills a subscription close to (not exactly at) its start_time, and
-- the PAYMENT.SALE.COMPLETED webhook that upgrades the profile from 'trial'
-- to the paid plan can land a little later still. Give trials backed by a
-- live subscription a 3-day grace window so the member doesn't bounce to
-- Explorer in between. If the charge never succeeds, the grace window ends
-- and the trial expires exactly as before.
CREATE OR REPLACE FUNCTION public.expire_finished_trials()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles p
     SET subscription_status = 'free'
   WHERE lower(coalesce(p.subscription_status, '')) = 'trial'
     AND p.trial_ends_at IS NOT NULL
     AND p.trial_ends_at <= now()
     AND NOT (
       p.trial_ends_at > now() - interval '3 days'
       AND EXISTS (
         SELECT 1 FROM public.payment_subscriptions s
          WHERE s.user_id = p.user_id
            AND s.status IN ('trialing', 'active', 'past_due')
       )
     );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.expire_finished_trials() FROM PUBLIC, anon, authenticated;

-- ---------- 4. End paid access once a cancelled/suspended subscription's paid period is over ----------
CREATE OR REPLACE FUNCTION public.expire_lapsed_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles p
     SET subscription_status = 'free'
   WHERE lower(coalesce(p.subscription_status, '')) IN ('glow_lite', 'insider', 'vip')
     AND coalesce(p.founding_member, false) = false
     -- The member's plan came from a subscription that has ended...
     AND EXISTS (
       SELECT 1 FROM public.payment_subscriptions s
        WHERE s.user_id = p.user_id
          AND s.plan_id = lower(p.subscription_status)
          AND s.status IN ('suspended', 'cancelled', 'expired')
          AND coalesce(s.current_period_end, s.cancelled_at, s.updated_at) <= now()
          -- A plan bought some other way after this subscription ended wins.
          AND NOT EXISTS (
            SELECT 1 FROM public.payment_transactions t
             WHERE t.user_id = p.user_id
               AND t.status = 'success'
               AND t.purchase_type IN ('plan', 'founding_member')
               AND coalesce(t.metadata ->> 'subscription_id', '') <> s.gateway_subscription_id
               AND t.created_at > coalesce(s.cancelled_at, s.updated_at)
          )
     )
     -- ...and there is no other live subscription keeping them paid.
     AND NOT EXISTS (
       SELECT 1 FROM public.payment_subscriptions s2
        WHERE s2.user_id = p.user_id
          AND s2.status IN ('trialing', 'active', 'past_due')
     );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.expire_lapsed_subscriptions() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('expire-lapsed-subscriptions')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-lapsed-subscriptions');
SELECT cron.schedule('expire-lapsed-subscriptions', '17 * * * *', $$SELECT public.expire_lapsed_subscriptions();$$);
