-- SkinLabs monetisation architecture: database-backed pricing configuration,
-- AI-analysis credits, founding-member offer, and A/B-testable variants.
--
-- Design: every pricing-relevant table carries a `variant_key` referencing
-- pricing_experiment_variants, defaulting to 'control'. A visitor is bucketed
-- into a variant client-side (deterministic, persisted) and the frontend
-- reads that variant's rows, falling back to 'control' for anything the
-- variant doesn't override. This is the whole A/B mechanism — no separate
-- "experiments engine" table is needed because every knob the brief asks to
-- test (free allowance, Lite price, Insider pricing, annual/monthly default,
-- trial duration, credit pack pricing) is just a column on one of these rows.
--
-- All pricing tables are public-readable (pricing must be visible signed
-- out) and writable only by service_role — there is no in-app admin UI for
-- editing prices in this pass; changes are made directly in Supabase.

-- ---------- Experiment variants ----------
CREATE TABLE IF NOT EXISTS public.pricing_experiment_variants (
  variant_key text PRIMARY KEY,
  traffic_weight int NOT NULL DEFAULT 0 CHECK (traffic_weight >= 0),
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.pricing_experiment_variants (variant_key, traffic_weight, is_active, description)
VALUES ('control', 100, true, 'Default pricing — the only active variant until an experiment is configured')
ON CONFLICT (variant_key) DO NOTHING;

-- ---------- Plans ----------
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  plan_id text NOT NULL,
  variant_key text NOT NULL DEFAULT 'control' REFERENCES public.pricing_experiment_variants(variant_key),
  name text NOT NULL,
  tagline text NOT NULL,
  price_monthly numeric NOT NULL,
  price_annual numeric NOT NULL,
  trial_days int NOT NULL DEFAULT 0,
  trial_eligible boolean NOT NULL DEFAULT false,
  is_purchasable boolean NOT NULL DEFAULT true,
  cta_label text NOT NULL,
  cta_override text,
  badge text,
  money_back_days int,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, variant_key)
);

INSERT INTO public.pricing_plans
  (plan_id, variant_key, name, tagline, price_monthly, price_annual, trial_days, trial_eligible, is_purchasable, cta_label, cta_override, badge, money_back_days, benefits, sort_order)
VALUES
  ('explorer', 'control', 'Glow Explorer', 'See what SkinLabs can do, free', 0, 0, 0, false, true, 'Start free', NULL, NULL, NULL,
   '["One full AI starter analysis to see your real skin profile","Public reviews, scores and Shelf Showdowns","Limited Daily Skinny briefings and comparisons","Public Spotlight rankings"]'::jsonb, 0),
  ('glow_lite', 'control', 'Glow Lite', 'For the skin-curious who aren''t ready to commit', 39, 390, 7, true, true, 'Start Glow Lite', NULL, NULL, 30,
   '["Everything in Explorer","Unlimited product comparisons and Spotlight profiles","Priority access to new Daily Skinny briefings","30-day money-back guarantee"]'::jsonb, 1),
  ('insider', 'control', 'Glow Insider', 'The full skincare intelligence toolkit', 99, 990, 7, true, true, 'Become an Insider', NULL, 'Most popular', 30,
   '["A live AI routine that re-analyses your skin every week","Full podcast library and unlimited reviews","Full Spotlight brand profiles and practitioner directory","Member-only ingredient deep dives","30-day money-back guarantee"]'::jsonb, 2),
  ('vip', 'control', 'Glow VIP', 'The most complete routine, with real practitioners', 299, 2990, 0, false, false, 'Go VIP', 'Coming soon', NULL, 30,
   '["Everything in Glow Insider","Intelligent Routine Builder on every review page","Virtual derm consultations — launching soon","Ad-free & offline browsing","VIP badge"]'::jsonb, 3)
ON CONFLICT (plan_id, variant_key) DO NOTHING;

-- ---------- Credit packs ----------
CREATE TABLE IF NOT EXISTS public.credit_packs (
  pack_id text NOT NULL,
  variant_key text NOT NULL DEFAULT 'control' REFERENCES public.pricing_experiment_variants(variant_key),
  name text NOT NULL,
  credits int NOT NULL CHECK (credits > 0),
  price numeric NOT NULL,
  expires_after_days int, -- NULL = credits never expire (the default policy)
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  PRIMARY KEY (pack_id, variant_key)
);

INSERT INTO public.credit_packs (pack_id, variant_key, name, credits, price, expires_after_days, is_active, sort_order)
VALUES ('starter_3', 'control', '3 AI Analyses', 3, 59, NULL, true, 0)
ON CONFLICT (pack_id, variant_key) DO NOTHING;

-- ---------- Founding member offer ----------
CREATE TABLE IF NOT EXISTS public.founding_member_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_key text NOT NULL DEFAULT 'control' REFERENCES public.pricing_experiment_variants(variant_key),
  name text NOT NULL DEFAULT 'Founding Member',
  price numeric NOT NULL,
  member_cap int NOT NULL CHECK (member_cap > 0),
  redeemed_count int NOT NULL DEFAULT 0,
  grants_plan text NOT NULL DEFAULT 'insider',
  duration_months int, -- NULL = lifetime
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb
);

INSERT INTO public.founding_member_offers (variant_key, name, price, member_cap, grants_plan, duration_months, is_active, benefits)
SELECT 'control', 'Founding Member', 799, 250, 'insider', NULL, true,
  '["Lifetime Glow Insider access","Founding Member badge","First access to every new SkinLabs tool","Direct line to the team for feedback"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.founding_member_offers WHERE variant_key = 'control');

-- ---------- Global pricing settings (also variant-capable) ----------
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  variant_key text PRIMARY KEY DEFAULT 'control' REFERENCES public.pricing_experiment_variants(variant_key),
  default_billing_interval text NOT NULL DEFAULT 'annual' CHECK (default_billing_interval IN ('monthly', 'annual')),
  free_ai_analysis_allowance int NOT NULL DEFAULT 1 CHECK (free_ai_analysis_allowance >= 0)
);

INSERT INTO public.pricing_settings (variant_key, default_billing_interval, free_ai_analysis_allowance)
VALUES ('control', 'annual', 1)
ON CONFLICT (variant_key) DO NOTHING;

-- Public read on all pricing config — write is service_role only (no policy needed,
-- service_role bypasses RLS; no INSERT/UPDATE/DELETE policy is granted here).
ALTER TABLE public.pricing_experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founding_member_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pricing config is publicly readable" ON public.pricing_experiment_variants;
CREATE POLICY "Pricing config is publicly readable" ON public.pricing_experiment_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Pricing config is publicly readable" ON public.pricing_plans;
CREATE POLICY "Pricing config is publicly readable" ON public.pricing_plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Pricing config is publicly readable" ON public.credit_packs;
CREATE POLICY "Pricing config is publicly readable" ON public.credit_packs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Pricing config is publicly readable" ON public.founding_member_offers;
CREATE POLICY "Pricing config is publicly readable" ON public.founding_member_offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Pricing config is publicly readable" ON public.pricing_settings;
CREATE POLICY "Pricing config is publicly readable" ON public.pricing_settings FOR SELECT USING (true);

GRANT SELECT ON public.pricing_experiment_variants, public.pricing_plans, public.credit_packs,
  public.founding_member_offers, public.pricing_settings TO anon, authenticated;
GRANT ALL ON public.pricing_experiment_variants, public.pricing_plans, public.credit_packs,
  public.founding_member_offers, public.pricing_settings TO service_role;

-- ---------- AI analysis credits ledger ----------
CREATE TABLE IF NOT EXISTS public.ai_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta int NOT NULL, -- positive = granted/purchased, negative = consumed
  reason text NOT NULL, -- e.g. 'purchase:starter_3', 'consume:analysis', 'admin_grant'
  expires_at timestamptz, -- NULL = never expires
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_user_id ON public.ai_credit_transactions(user_id);

ALTER TABLE public.ai_credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own credit transactions" ON public.ai_credit_transactions;
CREATE POLICY "Users can view their own credit transactions"
  ON public.ai_credit_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policy for authenticated — credits are only ever
-- written by the SECURITY DEFINER functions below (consume_ai_credit,
-- grant_ai_credits), matching the privileged-write pattern already used for
-- profiles.subscription_status elsewhere in this schema.
GRANT SELECT ON public.ai_credit_transactions TO authenticated;
GRANT ALL ON public.ai_credit_transactions TO service_role;

CREATE OR REPLACE FUNCTION public.available_ai_credits(_user_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(delta), 0)::int
  FROM public.ai_credit_transactions
  WHERE user_id = _user_id
    AND (expires_at IS NULL OR expires_at > now())
$$;
REVOKE ALL ON FUNCTION public.available_ai_credits(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.available_ai_credits(uuid) TO authenticated, service_role;

-- Grants credits after a verified purchase. Called only by the paystack-payment
-- webhook (service_role) — never exposed to authenticated clients directly.
CREATE OR REPLACE FUNCTION public.grant_ai_credits(p_user_id uuid, p_reason text, p_credits int, p_expires_after_days int DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_credit_transactions (user_id, delta, reason, expires_at)
  VALUES (
    p_user_id,
    p_credits,
    p_reason,
    CASE WHEN p_expires_after_days IS NULL THEN NULL ELSE now() + (p_expires_after_days || ' days')::interval END
  );
END;
$$;
REVOKE ALL ON FUNCTION public.grant_ai_credits(uuid, text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_ai_credits(uuid, text, int, int) TO service_role;

-- Atomic, race-safe redemption of a founding-member slot. Returns false once
-- member_cap is reached — the webhook must not grant founding status when
-- this returns false (and should flag the payment for a manual refund).
CREATE OR REPLACE FUNCTION public.claim_founding_member_slot(p_offer_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.founding_member_offers
     SET redeemed_count = redeemed_count + 1
   WHERE id = p_offer_id
     AND is_active = true
     AND redeemed_count < member_cap
  RETURNING true;
$$;
REVOKE ALL ON FUNCTION public.claim_founding_member_slot(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_founding_member_slot(uuid) TO service_role;

-- Self-service cancellation. There is no recurring-billing object to cancel on
-- Paystack's side in this integration (memberships are activated per purchase,
-- not auto-renewed), so "cancelling" honestly means: stop treating this
-- account as paying from now on. It does not touch founding_member (a
-- founding purchase's lifetime/duration grant is separate from the ongoing
-- ladder tier) or issue any refund.
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
     AND lower(coalesce(subscription_status, '')) IN ('active', 'insider', 'vip', 'premium', 'trial');
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_subscription() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_subscription() TO authenticated;
