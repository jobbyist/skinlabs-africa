-- Onboarding overhaul 01: trial emails name the right plan and only promise
-- "no charge" when no payment method is on file.
--
-- Before this, every trial email was Insider-only:
--   * notify_subscription_change() sent trial_started / trial_ended only for
--     trial_plan = 'insider'; a Glow Lite trial start was sent as
--     membership_activated ("Your Glow Lite membership is now active"), and a
--     Glow Lite trial got no expiring or ended email at all.
--   * enqueue_trial_expiring_events() only picked up insider trials.
--   * The templates said "Glow Insider" and "you won't be charged" to everyone,
--     including trialists with a PayPal auto-renew subscription.
-- Now both functions pass `plan` (the trial_plan) and `has_payment_method`
-- (a live payment_subscriptions row) to the templates in
-- supabase/functions/_shared/email/templates/membership.ts. Trial logic and
-- pricing data are unchanged.
--
-- Ordering: deploy email-processor with the new templates BEFORE applying this,
-- otherwise the old deployed template would render a Glow Lite trial as
-- "Glow Insider".

CREATE OR REPLACE FUNCTION public.has_live_payment_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.payment_subscriptions s
     WHERE s.user_id = _user_id
       AND s.status IN ('trialing', 'active', 'past_due')
  );
$$;

REVOKE ALL ON FUNCTION public.has_live_payment_subscription(uuid) FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.has_live_payment_subscription(uuid) IS
  'True when the user has a live auto-renew subscription (trialing/active/past_due). Internal: feeds has_payment_method into trial emails.';

CREATE OR REPLACE FUNCTION public.notify_subscription_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_old_paid boolean;
  v_new_paid boolean;
  v_trial_key text := coalesce(NEW.trial_started_at, NEW.trial_used_at, now())::text;
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

    -- Trial started, any plan.
    IF NEW.subscription_status = 'trial' AND NEW.trial_plan IS NOT NULL
       AND (OLD.subscription_status IS DISTINCT FROM 'trial' OR OLD.trial_plan IS DISTINCT FROM NEW.trial_plan) THEN
      PERFORM public.enqueue_email(
        'TRIAL_STARTED', 'trial_started:' || NEW.user_id::text || ':' || v_trial_key,
        'trial_started', 'TRIAL', NEW.user_id, v_email,
        jsonb_build_object(
          'trial_ends_at', NEW.trial_ends_at,
          'plan', NEW.trial_plan,
          'has_payment_method', public.has_live_payment_subscription(NEW.user_id)
        ),
        'trigger:notify_subscription_change'
      );

    -- Trial ended back to free, any plan.
    ELSIF OLD.subscription_status = 'trial' AND NEW.subscription_status = 'free' THEN
      PERFORM public.enqueue_email(
        'TRIAL_ENDED', 'trial_ended:' || NEW.user_id::text || ':' || coalesce(OLD.trial_ends_at, now())::text,
        'trial_ended', 'TRIAL', NEW.user_id, v_email,
        jsonb_build_object(
          'plan', OLD.trial_plan,
          'has_payment_method', public.has_live_payment_subscription(NEW.user_id)
        ),
        'trigger:notify_subscription_change'
      );

    ELSIF OLD.subscription_status = 'trial' AND v_new_paid THEN
      PERFORM public.enqueue_email(
        'MEMBERSHIP_ACTIVATED', 'membership_activated:' || NEW.user_id::text || ':' || coalesce(NEW.subscription_started_at, now())::text,
        'membership_activated', 'MEMBERSHIP', NEW.user_id, v_email,
        jsonb_build_object('plan', NEW.subscription_status, 'converted_from_trial', true),
        'trigger:notify_subscription_change'
      );

    ELSIF (NOT v_old_paid) AND v_new_paid THEN
      PERFORM public.enqueue_email(
        'MEMBERSHIP_ACTIVATED', 'membership_activated:' || NEW.user_id::text || ':' || coalesce(NEW.subscription_started_at, now())::text,
        'membership_activated', 'MEMBERSHIP', NEW.user_id, v_email,
        jsonb_build_object('plan', NEW.subscription_status), 'trigger:notify_subscription_change'
      );

    ELSIF v_old_paid AND v_new_paid AND NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
       AND public.subscription_ladder_rank(NEW.subscription_status) > public.subscription_ladder_rank(OLD.subscription_status) THEN
      PERFORM public.enqueue_email(
        'MEMBERSHIP_UPGRADED', 'membership_upgraded:' || NEW.user_id::text || ':' || coalesce(NEW.subscription_started_at, now())::text,
        'membership_upgraded', 'MEMBERSHIP', NEW.user_id, v_email,
        jsonb_build_object('from_plan', OLD.subscription_status, 'to_plan', NEW.subscription_status),
        'trigger:notify_subscription_change'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_subscription_change() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enqueue_trial_expiring_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
  v_rec record;
BEGIN
  FOR v_rec IN
    SELECT p.user_id, p.trial_ends_at, p.trial_plan, u.email
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.user_id
     WHERE lower(coalesce(p.subscription_status, '')) = 'trial'
       AND p.trial_plan IS NOT NULL
       AND p.trial_ends_at IS NOT NULL
       AND p.trial_ends_at BETWEEN now() AND now() + interval '24 hours'
  LOOP
    PERFORM public.enqueue_email(
      'TRIAL_EXPIRING',
      'trial_expiring:' || v_rec.user_id::text || ':' || v_rec.trial_ends_at::date::text,
      'trial_expiring', 'TRIAL', v_rec.user_id, v_rec.email,
      jsonb_build_object(
        'trial_ends_at', v_rec.trial_ends_at,
        'plan', v_rec.trial_plan,
        'has_payment_method', public.has_live_payment_subscription(v_rec.user_id)
      ),
      'cron:enqueue_trial_expiring_events'
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.enqueue_trial_expiring_events() FROM PUBLIC, anon, authenticated;
