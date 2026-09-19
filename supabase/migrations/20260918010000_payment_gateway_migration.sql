-- Paystack removal: SkinLabs now charges through PayFast (ZAR, South
-- African cards/EFT) and PayPal (USD, converted from the ZAR list price via
-- the existing marketplace_fx_rates table). payment_transactions previously
-- had no way to record which gateway or currency a charge actually went
-- through on — it implicitly assumed "Paystack, always ZAR". This adds that
-- traceability without disturbing the existing ZAR-canonical amount column
-- every receipt/invoice/admin view already reads.

ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS gateway text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'ZAR',
  ADD COLUMN IF NOT EXISTS amount_original numeric;

-- Every historical row was, in fact, a Paystack ZAR charge — backfill for
-- accuracy rather than leaving them NULL (a NULL gateway on an old,
-- perfectly real transaction would misleadingly read as "unknown provider"
-- in the admin/receipt UI once those start branching on this column).
UPDATE public.payment_transactions SET gateway = 'paystack' WHERE gateway IS NULL;

ALTER TABLE public.payment_transactions
  ALTER COLUMN gateway SET NOT NULL,
  ADD CONSTRAINT payment_transactions_gateway_check
    CHECK (gateway IN ('paystack', 'payfast', 'paypal')),
  ADD CONSTRAINT payment_transactions_currency_check
    CHECK (currency IN ('ZAR', 'USD'));

COMMENT ON COLUMN public.payment_transactions.gateway IS
  'Which payment provider processed this charge. ''paystack'' only appears on
   rows predating the PayFast/PayPal migration (2026-09-18) — no code writes
   it going forward.';
COMMENT ON COLUMN public.payment_transactions.currency IS
  'Currency actually charged to the customer. amount_zar always stays the
   ZAR list price (pricing_plans/credit_packs are ZAR-native) regardless of
   this value — it is the canonical amount every receipt/admin view reads.';
COMMENT ON COLUMN public.payment_transactions.amount_original IS
  'What was actually charged, in `currency`, when currency <> ZAR (e.g. the
   USD amount a PayPal charge settled for). NULL for ZAR charges, where
   amount_zar already is the original charged amount.';

-- ---------- Pending-checkout metadata store (PayPal) ----------
-- PayFast round-trips full purchase metadata through its own custom_str1/2
-- fields (PayFast echoes them back verbatim on the ITN), so it needs no
-- extra table. PayPal's Orders v2 API has no equivalent generic metadata
-- field with enough room for a JSON blob (custom_id is capped at 127
-- characters) — so the metadata resolved at checkout-start time (which
-- plan/pack/offer, the ZAR price it was priced at) is parked here, keyed by
-- PayPal's own order id, and read back at capture time. Never
-- anon/authenticated-readable: purely internal plumbing between this
-- function's own "initialize" and "capture" actions.
CREATE TABLE IF NOT EXISTS public.payment_checkout_intents (
  id text PRIMARY KEY, -- the gateway's own order/token id
  gateway text NOT NULL CHECK (gateway IN ('payfast', 'paypal')),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_type text NOT NULL,
  metadata jsonb NOT NULL,
  amount_zar numeric NOT NULL,
  amount_charged numeric NOT NULL,
  currency text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);
ALTER TABLE public.payment_checkout_intents ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.payment_checkout_intents TO service_role;
-- Deliberately no anon/authenticated policy at all — the capture flow's
-- authorization check (does this order's user_id match the caller's JWT?)
-- happens in the edge function itself using the service-role client, never
-- via RLS on a client-held session.

-- Abandoned checkouts (order created, never captured) accumulate here
-- indefinitely without this — same "delete stale rows" idiom as the stuck
-- email-outbox-job sweep elsewhere in this schema.
SELECT cron.schedule(
  'payment-checkout-intents-cleanup',
  '0 3 * * *',
  $$DELETE FROM public.payment_checkout_intents WHERE created_at < now() - interval '24 hours';$$
);
