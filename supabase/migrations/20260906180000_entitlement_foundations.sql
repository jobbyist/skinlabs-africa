-- Entitlement foundations for the SkinLabs growth architecture.
--
-- Adds two tier-orthogonal account flags used by the new frontend entitlement
-- system (src/lib/entitlements.ts):
--   - founding_member: badge/cohort flag for the planned one-time "founding
--     member" offer. Does not by itself change access — a founding purchase
--     is expected to also set subscription_status to an active paid tier;
--     this column only marks the cohort for UI/recognition purposes.
--   - is_professional: marks a B2B/professional account, an axis orthogonal
--     to the consumer explorer/insider/vip ladder.
--
-- Neither flag is settable from any live purchase flow yet — Glow Lite
-- pricing, the founding-member checkout and the professional dashboard are
-- still pending product/legal review (see the SkinLabs growth-architecture
-- audit, Sept 2026). This migration only gives the frontend a real, safe
-- place to read from ahead of that work, consistent with how
-- subscription_status/trial_* were introduced before Paystack existed.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS founding_member boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_professional boolean NOT NULL DEFAULT false;

-- Neither column is granted to `authenticated` for INSERT/UPDATE (see the
-- column-level GRANTs in 20260906165704_*.sql), so they are already
-- unwritable by clients. This trigger update is defence in depth, keeping
-- them on the same privileged-write footing as subscription_status et al.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claims', true) IS NULL
     OR coalesce((current_setting('request.jwt.claims', true)::json ->> 'role'), '') = 'service_role'
     OR coalesce(current_setting('app.privileged_write', true), '') = 'on' THEN
    RETURN NEW;
  END IF;
  NEW.subscription_status := OLD.subscription_status;
  NEW.subscription_started_at := OLD.subscription_started_at;
  NEW.billing_interval := OLD.billing_interval;
  NEW.trial_plan := OLD.trial_plan;
  NEW.trial_ends_at := OLD.trial_ends_at;
  NEW.trial_used_at := OLD.trial_used_at;
  NEW.founding_member := OLD.founding_member;
  NEW.is_professional := OLD.is_professional;
  RETURN NEW;
END;
$$;

-- Server-side helper mirroring is_member()'s shape for the professional axis,
-- for use by future RLS policies/edge functions gating B2B-only data.
CREATE OR REPLACE FUNCTION public.is_professional_account(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = _user_id AND is_professional = true
  )
$$;
REVOKE ALL ON FUNCTION public.is_professional_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_professional_account(uuid) TO authenticated, service_role;
