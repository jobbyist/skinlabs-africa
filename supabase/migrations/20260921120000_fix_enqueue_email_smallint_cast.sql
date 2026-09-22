-- Fix: every trigger below calls public.enqueue_email(...) and passes a bare
-- integer literal (50, 20 or 10) for its p_priority parameter, which is typed
-- `smallint`. Postgres's function-call overload resolution does not apply an
-- assignment-level int4->int2 cast when resolving which function to call, so
-- every one of these calls fails with "function public.enqueue_email(...)
-- does not exist" -- and because each PERFORM runs inside the same trigger
-- transaction as the row INSERT it's attached to, the exception rolls back
-- the whole INSERT. In practice this meant: every admin lead notification
-- (contact, partner, spotlight brand, custom formula, business, openhaus
-- waitlist, newsletter, notify-me), both SECURITY branches of
-- notify_auth_user_updated (password/email changed), the needs_review branch
-- of notify_payment_transaction, and fail_email_job's own permanent-failure
-- admin alert were all completely broken -- not just "email didn't send", the
-- underlying form submission itself hard-errored and nothing was ever saved.
-- Confirmed live via a direct anon-role INSERT test (2026-09-21) reproducing
-- the exact "function ... does not exist" error before this fix.
--
-- Fix is purely additive casts (50 -> 50::smallint etc.) at each broken call
-- site -- no behavioural change beyond making the calls actually execute.

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
    'trigger:notify_contact_submission', false, 50::smallint,
    'admin_form_notice:contact_submissions:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

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
    'trigger:notify_partner_enquiry', false, 50::smallint,
    'admin_form_notice:partner_enquiries:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

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
    'trigger:notify_spotlight_brand_request', false, 50::smallint,
    'admin_form_notice:spotlight_brand_requests:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

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
    'trigger:notify_custom_formula_request', false, 50::smallint,
    'admin_form_notice:custom_formula_requests:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

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
    'trigger:notify_business_enquiry', false, 50::smallint,
    'admin_form_notice:business_enquiries:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

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
    'trigger:notify_openhaus_waitlist_join', false, 50::smallint,
    'admin_form_notice:openhaus_waitlist:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

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
    'trigger:notify_newsletter_subscriber', false, 50::smallint,
    'admin_form_notice:newsletter_subscribers:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

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
    'trigger:notify_notify_me_request', false, 50::smallint
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_payment_transaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
      'trigger:notify_payment_transaction', false, 20::smallint,
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

CREATE OR REPLACE FUNCTION public.notify_auth_user_updated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
      '{}'::jsonb, 'trigger:notify_auth_user_updated', false, 20::smallint
    );
  END IF;

  IF OLD.email IS DISTINCT FROM NEW.email AND NEW.email IS NOT NULL THEN
    PERFORM public.enqueue_email(
      'EMAIL_CHANGED', 'email_changed:' || NEW.id::text || ':' || NEW.email,
      'auth_email_changed', 'SECURITY', NEW.id, NEW.email,
      jsonb_build_object('old_email', OLD.email), 'trigger:notify_auth_user_updated', false, 20::smallint
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_email_job(p_job_id uuid, p_processing_token uuid, p_error text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.email_outbox;
  v_retry_minutes int;
BEGIN
  SELECT * INTO v_row FROM public.email_outbox
   WHERE id = p_job_id AND status = 'processing' AND processing_token = p_processing_token;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_row.attempt_count >= v_row.max_attempts THEN
    UPDATE public.email_outbox
       SET status = 'failed', failed_at = now(), last_error = p_error, updated_at = now()
     WHERE id = p_job_id;

    IF v_row.transactional THEN
      PERFORM public.enqueue_email(
        'EMAIL_DELIVERY_FAILED_ALERT',
        'email_failed_alert:' || v_row.id::text,
        'admin_delivery_failed',
        'ADMIN',
        NULL,
        NULL,
        jsonb_build_object(
          'outbox_id', v_row.id, 'template_id', v_row.template_id,
          'recipient_email', v_row.recipient_email, 'error', p_error
        ),
        'system:fail_email_job',
        false,
        10::smallint
      );
    END IF;
  ELSE
    v_retry_minutes := LEAST(power(2, v_row.attempt_count)::int, 60);
    UPDATE public.email_outbox
       SET status = 'pending',
           scheduled_at = now() + (v_retry_minutes || ' minutes')::interval,
           last_error = p_error,
           updated_at = now()
     WHERE id = p_job_id;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_contact_submission() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_partner_enquiry() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_spotlight_brand_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_custom_formula_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_business_enquiry() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_openhaus_waitlist_join() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_newsletter_subscriber() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_notify_me_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_payment_transaction() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_auth_user_updated() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_email_job(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_email_job(uuid, uuid, text) TO service_role;
