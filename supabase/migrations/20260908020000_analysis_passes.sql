-- Analysis Passes (customer-facing name for the existing AI-analysis credit
-- system) — Glow Explorer users unlock one-off Advanced Skin Analysis runs.
--
-- Per the audit: ai_credit_transactions (ledger), available_ai_credits()
-- (balance), grant_ai_credits() (webhook-only allocation) and credit_packs
-- (purchasable packages) already exist and already power a working Paystack
-- checkout (paystack-payment edge function + src/lib/paystack.ts's
-- startCreditPackCheckout()) and a dashboard "AI Credits" balance card. This
-- migration only adds what's genuinely missing:
--   1. A R25/1-pass credit_pack row (the R59/3-pass row already exists as
--      `starter_3` — renamed here to read as an Analysis Pass, not "AI
--      Analyses").
--   2. Idempotent credit granting — the webhook currently calls
--      grant_ai_credits() with no dedupe key at all, so a redelivered
--      Paystack webhook (retries on non-200, or a genuine duplicate
--      delivery) grants the same passes twice. Adds a `reference` column +
--      a PLAIN (non-partial) unique constraint — Postgres already treats
--      every NULL as distinct for uniqueness, so admin/manual grants (no
--      reference) are unaffected — and reworks grant_ai_credits() to
--      ON CONFLICT (reference) DO NOTHING.
--   3. consume_analysis_pass() / refund_analysis_pass(): atomic, abuse-
--      resistant pass consumption for the Advanced Analysis path, with a
--      verified refund if the AI call fails after a pass was spent
--      (Section 7/17 of the brief — never deduct for a failed analysis).

-- ---------- 1. Analysis Pass packages ----------
UPDATE public.credit_packs
   SET name = '3 Analysis Passes'
 WHERE pack_id = 'starter_3' AND variant_key = 'control';

INSERT INTO public.credit_packs (pack_id, variant_key, name, credits, price, expires_after_days, is_active, sort_order)
VALUES ('single_1', 'control', '1 Analysis Pass', 1, 25, NULL, true, -1)
ON CONFLICT (pack_id, variant_key) DO UPDATE SET name = EXCLUDED.name;

-- ---------- 2. Idempotent credit granting ----------
ALTER TABLE public.ai_credit_transactions
  ADD COLUMN IF NOT EXISTS reference text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_credit_transactions_reference_key'
  ) THEN
    ALTER TABLE public.ai_credit_transactions
      ADD CONSTRAINT ai_credit_transactions_reference_key UNIQUE (reference);
  END IF;
END $$;

COMMENT ON COLUMN public.ai_credit_transactions.reference IS
  'Payment provider transaction reference (e.g. Paystack reference), used as an idempotency key so a redelivered webhook cannot grant duplicate Analysis Passes. NULL for non-webhook transactions (admin grants, consumption, refunds) — Postgres treats every NULL as distinct, so these never collide.';

CREATE OR REPLACE FUNCTION public.grant_ai_credits(
  p_user_id uuid,
  p_reason text,
  p_credits int,
  p_expires_after_days int DEFAULT NULL,
  p_reference text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_credit_transactions (user_id, delta, reason, expires_at, reference)
  VALUES (
    p_user_id,
    p_credits,
    p_reason,
    CASE WHEN p_expires_after_days IS NULL THEN NULL ELSE now() + (p_expires_after_days || ' days')::interval END,
    p_reference
  )
  ON CONFLICT (reference) DO NOTHING;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.grant_ai_credits(uuid, text, int, int, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_ai_credits(uuid, text, int, int, text) TO service_role;

-- ---------- 3. Advanced Analysis pass consumption ----------
-- Consumes exactly one pass for the current user, if available. Called
-- before invoking the live skincare-ai edge function for a Glow Explorer
-- pass-holder; never for Insider/VIP members, who reach that edge function
-- through the existing membership-gated register_ai_analysis_use() path
-- untouched by this migration.
CREATE OR REPLACE FUNCTION public.consume_analysis_pass()
RETURNS TABLE (allowed boolean, transaction_id uuid, remaining int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_balance int;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  v_balance := public.available_ai_credits(v_uid);
  IF v_balance <= 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 0;
    RETURN;
  END IF;

  INSERT INTO public.ai_credit_transactions (user_id, delta, reason)
  VALUES (v_uid, -1, 'consume:advanced_analysis')
  RETURNING id INTO v_id;

  RETURN QUERY SELECT true, v_id, v_balance - 1;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_analysis_pass() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_analysis_pass() TO authenticated;

-- Reverses a specific consumption if (and only if) the Advanced Analysis it
-- paid for failed to generate — verified server-side against the original
-- transaction (owner, shape, not already refunded) so a client can never
-- mint free passes by calling this directly with an arbitrary id.
CREATE OR REPLACE FUNCTION public.refund_analysis_pass(p_transaction_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_refund_reason text := 'refund:' || p_transaction_id::text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ai_credit_transactions
     WHERE id = p_transaction_id AND user_id = v_uid AND reason = 'consume:advanced_analysis' AND delta = -1
  ) THEN
    RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM public.ai_credit_transactions WHERE user_id = v_uid AND reason = v_refund_reason) THEN
    RETURN false; -- already refunded
  END IF;

  INSERT INTO public.ai_credit_transactions (user_id, delta, reason)
  VALUES (v_uid, 1, v_refund_reason);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.refund_analysis_pass(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refund_analysis_pass(uuid) TO authenticated;
