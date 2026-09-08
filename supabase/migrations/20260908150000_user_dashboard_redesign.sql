-- User dashboard redesign: profile address fields, account lifecycle
-- (deactivate/reactivate; permanent delete happens via the account-delete
-- edge function since only the Supabase admin API can remove an auth.users
-- row), an inbox (notifications + a "coming soon" waitlist for dermatologist
-- messaging), a real payment/transaction history log, a personal routine
-- tracker, and a single-analysis "Analysis Pass" credit pack (R25) alongside
-- the existing 3-pack (R59).

-- ---------- 1. Profile: postal address ----------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'South Africa',
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'deactivated')),
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

-- Address fields are freely editable by the owner, same footing as the
-- other profile-detail columns. account_status/deactivated_at are NOT
-- granted here — they're only ever changed by the SECURITY DEFINER
-- functions below, matching subscription_status et al.
GRANT UPDATE (address_line1, address_line2, city, province, postal_code, country)
  ON public.profiles TO authenticated;

-- Extend the existing privileged-column guard to also freeze account_status
-- and deactivated_at against direct client writes.
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
  NEW.starter_analyses_used := OLD.starter_analyses_used;
  NEW.account_status := OLD.account_status;
  NEW.deactivated_at := OLD.deactivated_at;
  RETURN NEW;
END;
$$;

-- Self-service temporary deactivation/reactivation, same pattern as
-- cancel_subscription(): a SECURITY DEFINER function is the only writer.
CREATE OR REPLACE FUNCTION public.deactivate_account()
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
     SET account_status = 'deactivated',
         deactivated_at = now()
   WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.deactivate_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deactivate_account() TO authenticated;

CREATE OR REPLACE FUNCTION public.reactivate_account()
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
     SET account_status = 'active',
         deactivated_at = NULL
   WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.reactivate_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reactivate_account() TO authenticated;

-- ---------- 2. Inbox: account/system notifications ----------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'system'
    CHECK (category IN ('system', 'billing', 'analysis', 'community', 'security')),
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark their own notifications read" ON public.notifications;
CREATE POLICY "Users can mark their own notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Internal helper — only ever called from SECURITY DEFINER triggers/functions
-- below (which run as the function owner), never exposed to clients directly.
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid, p_category text, p_title text, p_body text DEFAULT NULL, p_link text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, category, title, body, link)
  VALUES (p_user_id, p_category, p_title, p_body, p_link);
END;
$$;
REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text) TO service_role;

-- A new AI skin analysis is ready
CREATE OR REPLACE FUNCTION public.notify_new_recommendation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.user_id, 'analysis', 'Your skin analysis is ready',
    'View your new ' || NEW.skin_type || ' skin recommendation.',
    '/dashboard?tab=analysis'
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_new_recommendation ON public.skincare_recommendations;
CREATE TRIGGER trg_notify_new_recommendation
  AFTER INSERT ON public.skincare_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_recommendation();

-- AI analysis credits were granted (a purchase went through)
CREATE OR REPLACE FUNCTION public.notify_credit_grant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.delta > 0 THEN
    PERFORM public.create_notification(
      NEW.user_id, 'billing',
      NEW.delta || ' AI analysis credit' || CASE WHEN NEW.delta = 1 THEN '' ELSE 's' END || ' added',
      'Reason: ' || NEW.reason,
      '/dashboard?tab=billing'
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_credit_grant ON public.ai_credit_transactions;
CREATE TRIGGER trg_notify_credit_grant
  AFTER INSERT ON public.ai_credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_credit_grant();

-- Membership plan changed (upgrade, downgrade, cancellation, trial start)
CREATE OR REPLACE FUNCTION public.notify_subscription_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    PERFORM public.create_notification(
      NEW.user_id, 'billing', 'Membership updated',
      'Your plan is now ' || COALESCE(NEW.subscription_status, 'free') || '.',
      '/dashboard?tab=billing'
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_subscription_change ON public.profiles;
CREATE TRIGGER trg_notify_subscription_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_subscription_change();

-- ---------- 3. Coming-soon feature waitlist (dermatologist messaging, etc.) ----------
CREATE TABLE IF NOT EXISTS public.feature_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature_key)
);
ALTER TABLE public.feature_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own waitlist entries" ON public.feature_waitlist;
CREATE POLICY "Users manage their own waitlist entries"
  ON public.feature_waitlist FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.feature_waitlist TO authenticated;
GRANT ALL ON public.feature_waitlist TO service_role;

-- ---------- 4. Payment transaction history (for Billing tab + invoices) ----------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference text NOT NULL UNIQUE,
  purchase_type text NOT NULL,
  description text NOT NULL,
  amount_zar numeric NOT NULL,
  status text NOT NULL DEFAULT 'success',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_created ON public.payment_transactions(user_id, created_at DESC);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view their own transactions"
  ON public.payment_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policy for authenticated — only the paystack-payment
-- webhook (service_role) ever writes a transaction row.
GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;

-- ---------- 5. Personal routine tracker ----------
CREATE TABLE IF NOT EXISTS public.routine_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_name text NOT NULL,
  product_name text,
  time_of_day text NOT NULL DEFAULT 'both' CHECK (time_of_day IN ('am', 'pm', 'both')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_routine_steps_user ON public.routine_steps(user_id, sort_order);

ALTER TABLE public.routine_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own routine steps" ON public.routine_steps;
CREATE POLICY "Users manage their own routine steps"
  ON public.routine_steps FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routine_steps TO authenticated;
GRANT ALL ON public.routine_steps TO service_role;

CREATE TABLE IF NOT EXISTS public.routine_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES public.routine_steps(id) ON DELETE CASCADE,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  time_slot text NOT NULL CHECK (time_slot IN ('am', 'pm')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, step_id, checkin_date, time_slot)
);
CREATE INDEX IF NOT EXISTS idx_routine_checkins_user_date ON public.routine_checkins(user_id, checkin_date DESC);

ALTER TABLE public.routine_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own routine checkins" ON public.routine_checkins;
CREATE POLICY "Users manage their own routine checkins"
  ON public.routine_checkins FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, DELETE ON public.routine_checkins TO authenticated;
GRANT ALL ON public.routine_checkins TO service_role;

-- ---------- 6. "Analysis Pass" single-credit pack (R25) alongside the 3-pack (R59) ----------
INSERT INTO public.credit_packs (pack_id, variant_key, name, credits, price, expires_after_days, is_active, sort_order)
VALUES ('single_1', 'control', 'Analysis Pass', 1, 25, NULL, true, 0)
ON CONFLICT (pack_id, variant_key) DO NOTHING;

UPDATE public.credit_packs SET sort_order = 1 WHERE pack_id = 'starter_3' AND variant_key = 'control';
