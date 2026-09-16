-- Closes three gaps found auditing every form/submission surface on the
-- site against the email system in 20260916100000/101000:
--
-- 1. openhaus_waitlist and newsletter_subscribers are genuine public
--    lead-capture forms that predate this system and had no notification
--    hook at all — submissions landed silently, invisible to anyone.
-- 2. MaintenanceModal ("notify me when we reopen") and DermatologistCard
--    ("notify me when booking/messaging launches") were non-functional:
--    both showed a success toast and then discarded the entered email/
--    phone number without storing or sending it anywhere. This migration
--    gives them a real table; the matching component changes (in the same
--    commit) wire the actual insert.

-- ---------- 1. openhaus_waitlist ----------
CREATE OR REPLACE FUNCTION public.notify_openhaus_waitlist_join()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:openhaus_waitlist:' || NEW.id::text,
    'form_confirmation_openhaus_waitlist', 'FORMS', NULL, NEW.email,
    jsonb_build_object('first_name', NEW.first_name),
    'trigger:notify_openhaus_waitlist_join'
  );
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:openhaus_waitlist:' || NEW.id::text,
    'admin_form_notification_openhaus_waitlist', 'ADMIN', NULL, NULL,
    jsonb_build_object(
      'first_name', NEW.first_name, 'last_name', NEW.last_name, 'email', NEW.email,
      'phone', NEW.phone, 'city', NEW.city, 'country', NEW.country
    ),
    'trigger:notify_openhaus_waitlist_join', false, 50,
    'admin_form_notice:openhaus_waitlist:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_openhaus_waitlist_join() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_openhaus_waitlist_join ON public.openhaus_waitlist;
CREATE TRIGGER trg_notify_openhaus_waitlist_join
  AFTER INSERT ON public.openhaus_waitlist
  FOR EACH ROW EXECUTE FUNCTION public.notify_openhaus_waitlist_join();

-- ---------- 2. newsletter_subscribers ----------
-- email is UNIQUE on this table, so a repeat signup fails the INSERT
-- outright and never reaches this trigger — already naturally idempotent,
-- no extra dedup logic needed.
CREATE OR REPLACE FUNCTION public.notify_newsletter_subscriber()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:newsletter_subscribers:' || NEW.id::text,
    'form_confirmation_newsletter', 'FORMS', NULL, NEW.email,
    '{}'::jsonb, 'trigger:notify_newsletter_subscriber'
  );
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:newsletter_subscribers:' || NEW.id::text,
    'admin_form_notification_newsletter', 'ADMIN', NULL, NULL,
    jsonb_build_object('email', NEW.email),
    'trigger:notify_newsletter_subscriber', false, 50,
    'admin_form_notice:newsletter_subscribers:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_newsletter_subscriber() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_newsletter_subscriber ON public.newsletter_subscribers;
CREATE TRIGGER trg_notify_newsletter_subscriber
  AFTER INSERT ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.notify_newsletter_subscriber();

-- ---------- 3. notify_me_requests (new — backs the two previously-fake
-- "Notify Me" forms: site-reopen in MaintenanceModal, and dermatologist
-- booking/messaging in DermatologistCard) ----------
CREATE TABLE IF NOT EXISTS public.notify_me_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text NOT NULL,
  contact_method text NOT NULL DEFAULT 'email' CHECK (contact_method IN ('email', 'sms')),
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notify_me_requests_contact_required CHECK (
    (contact_method = 'email' AND email IS NOT NULL)
    OR (contact_method = 'sms' AND phone IS NOT NULL)
  )
);
GRANT INSERT ON public.notify_me_requests TO anon, authenticated;
GRANT ALL ON public.notify_me_requests TO service_role;
ALTER TABLE public.notify_me_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a notify-me request"
  ON public.notify_me_requests FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(feature_key) BETWEEN 1 AND 100
    AND (email IS NULL OR (char_length(email) BETWEEN 3 AND 255 AND email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'))
    AND (phone IS NULL OR char_length(phone) BETWEEN 5 AND 30)
  );

CREATE POLICY "Admins can view notify-me requests"
  ON public.notify_me_requests FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- Same rate-limit idiom as contact_submissions/partner_enquiries — anon
-- only holds INSERT here, so this needs SECURITY DEFINER to read its own
-- count past RLS.
CREATE OR REPLACE FUNCTION public.enforce_notify_me_request_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT count(*) FROM public.notify_me_requests
    WHERE coalesce(email, phone) = coalesce(NEW.email, NEW.phone)
      AND created_at > now() - interval '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Too many requests submitted recently. Please try again later.';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_notify_me_request_rate_limit() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS notify_me_requests_rate_limit ON public.notify_me_requests;
CREATE TRIGGER notify_me_requests_rate_limit
  BEFORE INSERT ON public.notify_me_requests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_notify_me_request_rate_limit();

-- Admin-only alert — these are speculative leads for a feature that
-- doesn't exist yet, not something the requester needs a receipt for
-- (both forms already show an inline confirmation), and a phone-only /
-- SMS request has no address to confirm to in the first place.
CREATE OR REPLACE FUNCTION public.notify_notify_me_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:notify_me_requests:' || NEW.id::text,
    'admin_notify_me_request', 'ADMIN', NULL, NULL,
    jsonb_build_object(
      'feature_key', NEW.feature_key, 'contact_method', NEW.contact_method,
      'email', NEW.email, 'phone', NEW.phone
    ),
    'trigger:notify_notify_me_request', false, 50
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_notify_me_request() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_notify_me_request ON public.notify_me_requests;
CREATE TRIGGER trg_notify_notify_me_request
  AFTER INSERT ON public.notify_me_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_notify_me_request();
