-- Temporary promo (see CLAUDE.md for full context and the plan to revert):
-- Glow Lite and Glow Insider — the two plans actually on sale today (Glow VIP
-- stays untouched: it's still is_purchasable = false / "Coming soon", so it's
-- not part of "paid plans" a visitor can access at all right now) — become
-- free to try, via the EXISTING free-trial mechanism, through 1 November
-- 2026. Nothing about entitlement RESOLUTION changes: a trialing account
-- already resolves to full Glow Lite/Insider tier access via useMembership()
-- (see src/hooks/use-membership.ts's resolveTier — a live, unexpired trial
-- already outranks everything else). "Except ad-free browsing" needs no code
-- change either — AdSlot.tsx has never actually gated ads by membership tier
-- (it renders unconditionally today), so ads already show to every account
-- regardless of trial/paid status. "Advanced AI Analysis Passes remain a
-- once-off payment for everyone" is also already true and untouched — that's
-- the existing credit_packs purchase path (src/components/
-- AnalysisPassPurchaseModal.tsx), already available to any signed-in account
-- regardless of tier.
--
-- Deliberately NOT retroactive: existing already-trialing/already-paying
-- accounts are untouched here — this only changes what a NEW trial grants
-- going forward, matching "users can sign up ... for free" (signup-oriented,
-- not a promise to existing accounts).

-- ---------- 1. Promo end date, stored so start_free_trial() can read it ----------
ALTER TABLE public.pricing_settings
  ADD COLUMN IF NOT EXISTS promo_free_trial_until timestamptz;

COMMENT ON COLUMN public.pricing_settings.promo_free_trial_until IS
  'Temporary promo (2026-09-22): when set and in the future, start_free_trial() extends a new trial''s trial_ends_at out to this date instead of the plan''s normal trial_days. Self-reverting — once this date passes (or the column is cleared), behaviour automatically falls back to each plan''s normal trial_days with no code change needed.';

UPDATE public.pricing_settings
   SET promo_free_trial_until = '2026-11-01T00:00:00+02:00'::timestamptz
 WHERE variant_key = 'control';

-- ---------- 2. Re-enable Glow Lite's free trial ----------
-- Glow Lite currently has trial_eligible = false / trial_days = 0 live (a
-- prior live config change, not represented in any earlier migration file —
-- Glow Insider's 7-day trial was left untouched). Restore a normal 7-day
-- trial length so Glow Lite has a trial path for the promo override below to
-- extend; this is also a reasonable permanent baseline once the promo ends.
UPDATE public.pricing_plans
   SET trial_eligible = true,
       trial_days = 7
 WHERE plan_id = 'glow_lite' AND variant_key = 'control';

-- ---------- 3. start_free_trial(): honour the promo override ----------
CREATE OR REPLACE FUNCTION public.start_free_trial(p_plan text, p_variant_key text DEFAULT 'control')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
         trial_ends_at = v_trial_ends_at,
         trial_used_at = now()
   WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.start_free_trial(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_free_trial(text, text) TO authenticated;

-- ---------- 4. Reintroduce the Founding Member lifetime offer ----------
-- Was live but is_active = false (redeemed_count = 0 — nobody had claimed a
-- spot before it was switched off). Reintroduced at the new R499/100-spot
-- terms rather than as a second row, matching this table's existing
-- one-active-offer-per-variant pattern.
UPDATE public.founding_member_offers
   SET price = 499,
       member_cap = 100,
       is_active = true
 WHERE variant_key = 'control';
