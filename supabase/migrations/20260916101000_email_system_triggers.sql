-- Wires the email_events/email_outbox core (20260916100000) into every
-- existing source of truth: extends the three notify_* triggers already
-- powering the in-app notifications inbox (unchanged behaviour there) to
-- also enqueue an email, and adds new triggers on tables that had no
-- notification hook at all. Every INSERT/UPDATE here is guarded to fire
-- only on the specific column transition it cares about, so routine writes
-- (a login touching auth.users, a no-op profile save) never enqueue
-- anything.

-- ---------- Helper: paid-tier ladder rank, for upgrade detection ----------
CREATE OR REPLACE FUNCTION public.subscription_ladder_rank(p_status text)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(coalesce(p_status, ''))
    WHEN 'glow_lite' THEN 1
    WHEN 'insider' THEN 2
    WHEN 'active' THEN 2
    WHEN 'premium' THEN 2
    WHEN 'vip' THEN 3
    ELSE 0
  END
$$;

-- ---------- 1. Extend notify_new_recommendation (SKYNN analysis) ----------
-- ANALYSIS_COMPLETED on status='delivered' (the only value this trigger
-- saw before today); ANALYSIS_FAILED on status='failed', a new value the
-- skincare-ai edge function now also writes (see its own migration note).
CREATE OR REPLACE FUNCTION public.notify_new_recommendation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'delivered' THEN
    PERFORM public.create_notification(
      NEW.user_id, 'analysis', 'Your skin analysis is ready',
      'View your new ' || NEW.skin_type || ' skin recommendation.',
      '/dashboard?tab=analysis'
    );
    PERFORM public.enqueue_email(
      'ANALYSIS_COMPLETED', 'analysis_completed:' || NEW.id::text,
      'analysis_completed', 'SKYNN', NEW.user_id, (SELECT email FROM auth.users WHERE id = NEW.user_id),
      jsonb_build_object('skin_type', NEW.skin_type, 'recommendation_id', NEW.id),
      'trigger:notify_new_recommendation'
    );
  ELSIF NEW.status = 'failed' THEN
    PERFORM public.enqueue_email(
      'ANALYSIS_FAILED', 'analysis_failed:' || NEW.id::text,
      'analysis_failed', 'SKYNN', NEW.user_id, (SELECT email FROM auth.users WHERE id = NEW.user_id),
      '{}'::jsonb, 'trigger:notify_new_recommendation'
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_new_recommendation() FROM PUBLIC, anon, authenticated;

-- ---------- 2. Extend notify_subscription_change (trial + membership) ----------
-- Keeps the existing in-app notification behaviour verbatim, then adds
-- email branches for the specific transitions in the template inventory.
-- trial_plan='glow_lite' is deliberately routed to MEMBERSHIP_ACTIVATED
-- copy, never TRIAL_* copy — Glow Lite must never read as a trial, even
-- though the schema's A/B pricing-variant machinery technically allows a
-- glow_lite trial row.
CREATE OR REPLACE FUNCTION public.notify_subscription_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_old_paid boolean;
  v_new_paid boolean;
BEGIN
  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    PERFORM public.create_notification(
      NEW.user_id, 'billing', 'Membership updated',
      'Your plan is now ' || COALESCE(NEW.subscription_status, 'free') || '.',
      '/dashboard?tab=billing'
    );
  END IF;

  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.trial_plan IS DISTINCT FROM OLD.trial_plan THEN

    v_email := (SELECT email FROM auth.users WHERE id = NEW.user_id);
    v_old_paid := OLD.subscription_status IN ('glow_lite', 'insider', 'vip');
    v_new_paid := NEW.subscription_status IN ('glow_lite', 'insider', 'vip');

    IF NEW.subscription_status = 'trial' AND NEW.trial_plan = 'insider'
       AND (OLD.subscription_status IS DISTINCT FROM 'trial' OR OLD.trial_plan IS DISTINCT FROM 'insider') THEN
      PERFORM public.enqueue_email(
        'TRIAL_STARTED', 'trial_started:' || NEW.user_id::text || ':' || NEW.trial_started_at::text,
        'trial_started', 'TRIAL', NEW.user_id, v_email,
        jsonb_build_object('trial_ends_at', NEW.trial_ends_at), 'trigger:notify_subscription_change'
      );

    ELSIF OLD.subscription_status = 'trial' AND OLD.trial_plan = 'insider' AND NEW.subscription_status = 'free' THEN
      PERFORM public.enqueue_email(
        'TRIAL_ENDED', 'trial_ended:' || NEW.user_id::text || ':' || OLD.trial_ends_at::text,
        'trial_ended', 'TRIAL', NEW.user_id, v_email,
        '{}'::jsonb, 'trigger:notify_subscription_change'
      );

    ELSIF OLD.subscription_status = 'trial' AND v_new_paid THEN
      PERFORM public.enqueue_email(
        'MEMBERSHIP_ACTIVATED', 'membership_activated:' || NEW.user_id::text || ':' || NEW.subscription_started_at::text,
        'membership_activated', 'MEMBERSHIP', NEW.user_id, v_email,
        jsonb_build_object('plan', NEW.subscription_status, 'converted_from_trial', true),
        'trigger:notify_subscription_change'
      );

    ELSIF NEW.subscription_status = 'trial' AND NEW.trial_plan = 'glow_lite'
       AND (OLD.subscription_status IS DISTINCT FROM 'trial' OR OLD.trial_plan IS DISTINCT FROM 'glow_lite') THEN
      PERFORM public.enqueue_email(
        'MEMBERSHIP_ACTIVATED', 'membership_activated:' || NEW.user_id::text || ':' || NEW.trial_started_at::text,
        'membership_activated', 'MEMBERSHIP', NEW.user_id, v_email,
        jsonb_build_object('plan', 'glow_lite'), 'trigger:notify_subscription_change'
      );

    ELSIF (NOT v_old_paid) AND v_new_paid THEN
      PERFORM public.enqueue_email(
        'MEMBERSHIP_ACTIVATED', 'membership_activated:' || NEW.user_id::text || ':' || NEW.subscription_started_at::text,
        'membership_activated', 'MEMBERSHIP', NEW.user_id, v_email,
        jsonb_build_object('plan', NEW.subscription_status), 'trigger:notify_subscription_change'
      );

    ELSIF v_old_paid AND v_new_paid AND NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
       AND public.subscription_ladder_rank(NEW.subscription_status) > public.subscription_ladder_rank(OLD.subscription_status) THEN
      PERFORM public.enqueue_email(
        'MEMBERSHIP_UPGRADED', 'membership_upgraded:' || NEW.user_id::text || ':' || NEW.subscription_started_at::text,
        'membership_upgraded', 'MEMBERSHIP', NEW.user_id, v_email,
        jsonb_build_object('from_plan', OLD.subscription_status, 'to_plan', NEW.subscription_status),
        'trigger:notify_subscription_change'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_subscription_change() FROM PUBLIC, anon, authenticated;

-- ---------- 3. New trigger: payment_transactions ----------
-- Fires only on genuine INSERT — the paystack-payment webhook upserts with
-- ON CONFLICT (reference) DO NOTHING, and Postgres never fires AFTER INSERT
-- for a row skipped by a conflict, so a redelivered webhook can't re-enqueue
-- this even before the outbox layer's own idempotency_key dedup applies.
CREATE OR REPLACE FUNCTION public.notify_payment_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := (SELECT email FROM auth.users WHERE id = NEW.user_id);

  IF NEW.status IN ('success', 'needs_review') THEN
    PERFORM public.enqueue_email(
      'PAYMENT_SUCCEEDED', 'payment_succeeded:' || NEW.reference,
      'payment_succeeded', 'BILLING', NEW.user_id, v_email,
      jsonb_build_object(
        'purchase_type', NEW.purchase_type, 'description', NEW.description,
        'amount_zar', NEW.amount_zar, 'reference', NEW.reference
      ),
      'trigger:notify_payment_transaction'
    );
  END IF;

  IF NEW.status = 'needs_review' THEN
    PERFORM public.enqueue_email(
      'ADMIN_PAYMENT_NEEDS_REVIEW', 'admin_payment_review:' || NEW.reference,
      'admin_payment_needs_review', 'ADMIN', NULL, NULL,
      jsonb_build_object(
        'reference', NEW.reference, 'user_id', NEW.user_id,
        'purchase_type', NEW.purchase_type, 'amount_zar', NEW.amount_zar
      ),
      'trigger:notify_payment_transaction', false, 20,
      'admin_payment_review:' || NEW.reference
    );
  END IF;

  IF NEW.status = 'failed' THEN
    PERFORM public.enqueue_email(
      'PAYMENT_FAILED', 'payment_failed:' || NEW.reference,
      'payment_failed', 'BILLING', NEW.user_id, v_email,
      jsonb_build_object(
        'purchase_type', NEW.purchase_type, 'description', NEW.description,
        'amount_zar', NEW.amount_zar, 'reference', NEW.reference
      ),
      'trigger:notify_payment_transaction'
    );
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_payment_transaction() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_payment_transaction ON public.payment_transactions;
CREATE TRIGGER trg_notify_payment_transaction
  AFTER INSERT ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_transaction();

-- ---------- 4. New triggers: auth.users (standard Supabase pattern, same
-- precedent as this project's existing handle_new_user()) ----------
-- Never touches Supabase's own token-bearing auth emails (signup
-- confirmation link, magic link, password-reset link) — those keep
-- flowing through Supabase Auth's own delivery path. These triggers only
-- add SkinLabs-branded, non-token informational mail on top.
CREATE OR REPLACE FUNCTION public.notify_user_registered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enqueue_email(
    'USER_REGISTERED', 'user_registered:' || NEW.id::text,
    'auth_welcome', 'AUTH', NEW.id, NEW.email,
    '{}'::jsonb, 'trigger:notify_user_registered'
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_user_registered() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_user_registered ON auth.users;
CREATE TRIGGER trg_notify_user_registered
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.notify_user_registered();

CREATE OR REPLACE FUNCTION public.notify_auth_user_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM public.enqueue_email(
      'EMAIL_VERIFIED', 'email_verified:' || NEW.id::text,
      'auth_email_verified', 'AUTH', NEW.id, NEW.email,
      '{}'::jsonb, 'trigger:notify_auth_user_updated'
    );
  END IF;

  IF OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password THEN
    PERFORM public.enqueue_email(
      'PASSWORD_CHANGED', 'password_changed:' || NEW.id::text || ':' || NEW.updated_at::text,
      'auth_password_changed', 'SECURITY', NEW.id, NEW.email,
      '{}'::jsonb, 'trigger:notify_auth_user_updated', false, 20
    );
  END IF;

  IF OLD.email IS DISTINCT FROM NEW.email AND NEW.email IS NOT NULL THEN
    PERFORM public.enqueue_email(
      'EMAIL_CHANGED', 'email_changed:' || NEW.id::text || ':' || NEW.email,
      'auth_email_changed', 'SECURITY', NEW.id, NEW.email,
      jsonb_build_object('old_email', OLD.email), 'trigger:notify_auth_user_updated', false, 20
    );
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_auth_user_updated() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_auth_user_updated ON auth.users;
CREATE TRIGGER trg_notify_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.notify_auth_user_updated();

-- ---------- 5. Extend deactivate_account()/reactivate_account() ----------
CREATE OR REPLACE FUNCTION public.deactivate_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles
     SET account_status = 'deactivated',
         deactivated_at = now()
   WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);

  v_email := (SELECT email FROM auth.users WHERE id = v_uid);
  PERFORM public.enqueue_email(
    'ACCOUNT_DEACTIVATED', 'account_deactivated:' || v_uid::text || ':' || now()::date::text,
    'account_deactivated', 'ACCOUNT', v_uid, v_email,
    '{}'::jsonb, 'rpc:deactivate_account'
  );
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
  v_email text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles
     SET account_status = 'active',
         deactivated_at = NULL
   WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);

  v_email := (SELECT email FROM auth.users WHERE id = v_uid);
  PERFORM public.enqueue_email(
    'ACCOUNT_REACTIVATED', 'account_reactivated:' || v_uid::text || ':' || now()::date::text,
    'account_reactivated', 'ACCOUNT', v_uid, v_email,
    '{}'::jsonb, 'rpc:reactivate_account'
  );
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.reactivate_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reactivate_account() TO authenticated;

-- ---------- 6. Forms & Support ----------

-- 6a. contact_submissions (new — the /contact page form had no backing
-- table or onSubmit handler at all before this; same anon-insert/
-- admin-read lead-capture idiom as partner_enquiries).
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT ALL ON public.contact_submissions TO service_role;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(first_name) BETWEEN 1 AND 200
    AND char_length(last_name) BETWEEN 1 AND 200
    AND char_length(email) BETWEEN 3 AND 255
    AND email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
    AND char_length(subject) BETWEEN 1 AND 300
    AND char_length(message) BETWEEN 1 AND 4000
  );

CREATE POLICY "Admins can view contact submissions"
  ON public.contact_submissions FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_contact_submission_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT count(*) FROM public.contact_submissions
    WHERE email = NEW.email AND created_at > now() - interval '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Too many messages submitted recently. Please try again later or email support@skinlabs.co.za directly.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS contact_submissions_rate_limit ON public.contact_submissions;
CREATE TRIGGER contact_submissions_rate_limit
  BEFORE INSERT ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_contact_submission_rate_limit();

CREATE OR REPLACE FUNCTION public.notify_contact_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:contact_submissions:' || NEW.id::text,
    'form_confirmation_contact', 'FORMS', NULL, NEW.email,
    jsonb_build_object('first_name', NEW.first_name, 'subject', NEW.subject),
    'trigger:notify_contact_submission'
  );
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:contact_submissions:' || NEW.id::text,
    'admin_form_notification_contact', 'ADMIN', NULL, NULL,
    jsonb_build_object(
      'first_name', NEW.first_name, 'last_name', NEW.last_name, 'email', NEW.email,
      'subject', NEW.subject, 'message', NEW.message
    ),
    'trigger:notify_contact_submission', false, 50,
    'admin_form_notice:contact_submissions:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_contact_submission() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_contact_submission ON public.contact_submissions;
CREATE TRIGGER trg_notify_contact_submission
  AFTER INSERT ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_contact_submission();

-- 6b. partner_enquiries
CREATE OR REPLACE FUNCTION public.notify_partner_enquiry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:partner_enquiries:' || NEW.id::text,
    'form_confirmation_partner', 'FORMS', NULL, NEW.work_email,
    jsonb_build_object('full_name', NEW.full_name, 'business_name', NEW.business_name),
    'trigger:notify_partner_enquiry'
  );
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:partner_enquiries:' || NEW.id::text,
    'admin_form_notification_partner', 'ADMIN', NULL, NULL,
    jsonb_build_object(
      'full_name', NEW.full_name, 'work_email', NEW.work_email,
      'business_name', NEW.business_name, 'partnership_model', NEW.partnership_model
    ),
    'trigger:notify_partner_enquiry', false, 50,
    'admin_form_notice:partner_enquiries:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_partner_enquiry() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_partner_enquiry ON public.partner_enquiries;
CREATE TRIGGER trg_notify_partner_enquiry
  AFTER INSERT ON public.partner_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_partner_enquiry();

-- 6c. spotlight_brand_requests
CREATE OR REPLACE FUNCTION public.notify_spotlight_brand_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:spotlight_brand_requests:' || NEW.id::text,
    'form_confirmation_spotlight_brand', 'FORMS', NULL, NEW.contact_email,
    jsonb_build_object('contact_name', NEW.contact_name, 'brand_name', NEW.brand_name, 'request_type', NEW.request_type),
    'trigger:notify_spotlight_brand_request'
  );
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:spotlight_brand_requests:' || NEW.id::text,
    'admin_form_notification_spotlight_brand', 'ADMIN', NULL, NULL,
    jsonb_build_object(
      'contact_name', NEW.contact_name, 'contact_email', NEW.contact_email,
      'brand_name', NEW.brand_name, 'request_type', NEW.request_type
    ),
    'trigger:notify_spotlight_brand_request', false, 50,
    'admin_form_notice:spotlight_brand_requests:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_spotlight_brand_request() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_spotlight_brand_request ON public.spotlight_brand_requests;
CREATE TRIGGER trg_notify_spotlight_brand_request
  AFTER INSERT ON public.spotlight_brand_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_spotlight_brand_request();

-- 6d. custom_formula_requests
CREATE OR REPLACE FUNCTION public.notify_custom_formula_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:custom_formula_requests:' || NEW.id::text,
    'form_confirmation_custom_formula', 'FORMS', NEW.user_id, NEW.contact_email,
    jsonb_build_object('contact_name', NEW.contact_name, 'product_type', NEW.product_type),
    'trigger:notify_custom_formula_request'
  );
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:custom_formula_requests:' || NEW.id::text,
    'admin_form_notification_custom_formula', 'ADMIN', NULL, NULL,
    jsonb_build_object(
      'contact_name', NEW.contact_name, 'contact_email', NEW.contact_email, 'product_type', NEW.product_type
    ),
    'trigger:notify_custom_formula_request', false, 50,
    'admin_form_notice:custom_formula_requests:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_custom_formula_request() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_custom_formula_request ON public.custom_formula_requests;
CREATE TRIGGER trg_notify_custom_formula_request
  AFTER INSERT ON public.custom_formula_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_custom_formula_request();

-- 6e. business_enquiries
CREATE OR REPLACE FUNCTION public.notify_business_enquiry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:business_enquiries:' || NEW.id::text,
    'form_confirmation_business', 'FORMS', NULL, NEW.contact_email,
    jsonb_build_object('contact_name', NEW.contact_name, 'company_name', NEW.company_name),
    'trigger:notify_business_enquiry'
  );
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:business_enquiries:' || NEW.id::text,
    'admin_form_notification_business', 'ADMIN', NULL, NULL,
    jsonb_build_object(
      'contact_name', NEW.contact_name, 'contact_email', NEW.contact_email, 'company_name', NEW.company_name
    ),
    'trigger:notify_business_enquiry', false, 50,
    'admin_form_notice:business_enquiries:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_business_enquiry() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_business_enquiry ON public.business_enquiries;
CREATE TRIGGER trg_notify_business_enquiry
  AFTER INSERT ON public.business_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_business_enquiry();

-- 6f. feature_waitlist (dermatologist messaging, etc. — no email column on
-- the table itself, so resolve it via the user's auth row).
CREATE OR REPLACE FUNCTION public.notify_feature_waitlist_join()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
BEGIN
  v_email := (SELECT email FROM auth.users WHERE id = NEW.user_id);
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:feature_waitlist:' || NEW.id::text,
    'form_confirmation_feature_waitlist', 'FORMS', NEW.user_id, v_email,
    jsonb_build_object('feature_key', NEW.feature_key),
    'trigger:notify_feature_waitlist_join'
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_feature_waitlist_join() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_feature_waitlist_join ON public.feature_waitlist;
CREATE TRIGGER trg_notify_feature_waitlist_join
  AFTER INSERT ON public.feature_waitlist
  FOR EACH ROW EXECUTE FUNCTION public.notify_feature_waitlist_join();

-- ---------- 7. Trial-expiring reminder scan (hourly cron) ----------
-- Idempotency key embeds the reminder DATE, not a timestamp, so an hourly
-- re-run of this scan produces the same key all day for a given user/trial
-- and only the first run's insert wins — no repeated "ending tomorrow"
-- emails from a cron that fires more than once in the reminder window.
CREATE OR REPLACE FUNCTION public.enqueue_trial_expiring_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_rec record;
BEGIN
  FOR v_rec IN
    SELECT p.user_id, p.trial_ends_at, u.email
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.user_id
     WHERE lower(coalesce(p.subscription_status, '')) = 'trial'
       AND p.trial_plan = 'insider'
       AND p.trial_ends_at IS NOT NULL
       AND p.trial_ends_at BETWEEN now() AND now() + interval '24 hours'
  LOOP
    PERFORM public.enqueue_email(
      'TRIAL_EXPIRING',
      'trial_expiring:' || v_rec.user_id::text || ':' || v_rec.trial_ends_at::date::text,
      'trial_expiring', 'TRIAL', v_rec.user_id, v_rec.email,
      jsonb_build_object('trial_ends_at', v_rec.trial_ends_at),
      'cron:enqueue_trial_expiring_events'
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_trial_expiring_events() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_trial_expiring_events() TO service_role;

SELECT cron.schedule(
  'trial-expiring-scan',
  '0 * * * *',
  $$SELECT public.enqueue_trial_expiring_events();$$
);

-- ---------- 8. Email outbox processor (every minute) ----------
-- Calls the email-processor edge function, authenticated with the same
-- hardcoded x-cron-secret idiom already used by the daily-skinny-sync /
-- openhaus-* cron jobs in this schema. The literal value below MUST also
-- be set as the EMAIL_CRON_SECRET Supabase Edge Function secret (no tool
-- available in this environment can set that secret itself — same
-- documented gap as MARKETPLACE_CRON_SECRET) so email-processor's own
-- check accepts it.
SELECT cron.schedule(
  'email-outbox-processor',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/email-processor',
    headers := '{"Content-Type":"application/json","x-cron-secret":"e740d1f305b4d57588b089585cc241edc2c0ea4ff55ddb61121ae78ee2a7279a"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
