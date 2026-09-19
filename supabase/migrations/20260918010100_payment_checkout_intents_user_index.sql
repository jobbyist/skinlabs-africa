-- Advisor-flagged: payment_checkout_intents.user_id (FK to auth.users) had
-- no covering index.
CREATE INDEX IF NOT EXISTS idx_payment_checkout_intents_user ON public.payment_checkout_intents(user_id);
