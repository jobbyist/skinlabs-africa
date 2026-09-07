-- ============================================================================
-- Founding member webhook idempotency.
--
-- Paystack redelivers a webhook whenever it doesn't get a 2xx response, and
-- can occasionally redeliver an already-succeeded event anyway. The
-- paystack-payment webhook now returns non-2xx when a database write fails
-- (so a transient failure gets retried automatically instead of silently
-- leaving a paid user ungranted) — but claim_founding_member_slot() is NOT
-- safe to call twice for the same payment: it unconditionally increments a
-- capped, shared counter, so a naive retry would burn a second slot for one
-- purchase. This table records which payment reference has already claimed
-- a slot, so the webhook can check it first and only ever call
-- claim_founding_member_slot() once per payment, while still safely retrying
-- the (idempotent) profile UPDATE that grants access if that part fails.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.founding_member_claims (
  reference text PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES public.founding_member_offers(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_founding_member_claims_user ON public.founding_member_claims (user_id);

ALTER TABLE public.founding_member_claims ENABLE ROW LEVEL SECURITY;
-- Internal webhook bookkeeping only — no client reads or writes this directly.
GRANT ALL ON public.founding_member_claims TO service_role;
