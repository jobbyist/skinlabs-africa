-- Onboarding overhaul 06: "Keep my membership" on PayFast (ZAR recurring).
--
-- payment_subscriptions already has gateway ('paypal' | 'payfast', CHECK
-- constraint from 20260924100000). PayFast subscriptions key the row by our
-- own m_payment_id (gateway_subscription_id, e.g. "sub_<uuid>") and capture
-- PayFast's subscription token from the first ITN; the token is what the
-- cancel/fetch API needs. Clients never write this table (owner SELECT only;
-- the edge functions write with the service role), and the token is not a
-- card number: it only lets SkinLabs' own merchant credentials act on the
-- subscription.
ALTER TABLE public.payment_subscriptions
  ADD COLUMN IF NOT EXISTS payfast_token text;

COMMENT ON COLUMN public.payment_subscriptions.payfast_token IS
  'PayFast subscription token from the first ITN (gateway = payfast). Needed to cancel or fetch the subscription via the PayFast API.';

CREATE UNIQUE INDEX IF NOT EXISTS payment_subscriptions_payfast_token_key
  ON public.payment_subscriptions (payfast_token)
  WHERE payfast_token IS NOT NULL;

-- Members read their own rows (RLS: owner SELECT). The token stays
-- server-side: a column-level REVOKE can't override a table-level GRANT, so
-- the table grant is swapped for an explicit column list without it.
REVOKE SELECT ON public.payment_subscriptions FROM anon, authenticated;
GRANT SELECT (
  id, user_id, gateway, gateway_subscription_id, plan_id, billing_interval, status, start_kind,
  first_billing_at, next_billing_at, current_period_end, amount_zar, amount_charged, currency,
  fx_rate, fx_rate_source, fx_rate_as_of, payer_email, cancelled_at, metadata, created_at, updated_at
) ON public.payment_subscriptions TO authenticated;
