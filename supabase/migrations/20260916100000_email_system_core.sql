-- Premium transactional/lifecycle email system: business-event + outbox core.
--
-- Separates BUSINESS FACT (email_events — "this happened") from DELIVERY
-- MECHANICS (email_outbox — "send this template to this address"), plus a
-- delivery-observability log (email_delivery_events, fed by Resend's own
-- webhook). Neither table is a competing source of truth for app state —
-- they only ever record that a notification should fire, never write back
-- to profiles/subscriptions/etc.
--
-- Idempotency is enforced at the database level throughout: both tables
-- carry a UNIQUE idempotency_key, and every insert goes through an
-- ON CONFLICT (idempotency_key) DO NOTHING RPC below, so concurrent
-- callers, webhook retries and cron re-runs all converge on one row
-- regardless of how many times the same logical event is reported.
--
-- Templates/rendering live in code (supabase/functions/_shared/email/), not
-- in the DB — template_id here is just a lookup key into that registry.

-- ---------- 1. email_events (business fact) ----------
CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Deliberately ON DELETE SET NULL, not CASCADE: an account-deletion
-- confirmation email (and the historical record of any other email) must
-- survive the very account deletion it describes. recipient_email is
-- always snapshotted as plain text at enqueue time for the same reason.
CREATE INDEX IF NOT EXISTS idx_email_events_user ON public.email_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type_occurred ON public.email_events(event_type, occurred_at DESC);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.email_events TO service_role;
-- No anon/authenticated grants at all: only service_role (via the RPCs
-- below, called from SECURITY DEFINER triggers or edge functions) ever
-- writes a row. Admins can read for observability/debugging.
CREATE POLICY "Admins can read email events"
  ON public.email_events FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- ---------- 2. email_outbox (delivery job) ----------
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.email_events(id) ON DELETE CASCADE,
  template_id text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'AUTH','ACCOUNT','MEMBERSHIP','TRIAL','BILLING','SKYNN','ROUTINES',
    'PRODUCT','SUPPORT','FORMS','SECURITY','SYSTEM','ADMIN','MARKETING'
  )),
  transactional boolean NOT NULL DEFAULT true,
  -- Nullable only for ADMIN-category jobs, whose recipient (the configured
  -- support inbox) is resolved from a server-side secret at send time, not
  -- stored here.
  recipient_email text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','sent','failed','cancelled','suppressed')),
  priority smallint NOT NULL DEFAULT 100,
  attempt_count int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 5,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  processing_started_at timestamptz,
  processing_token uuid,
  sent_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_outbox_recipient_required
    CHECK (recipient_email IS NOT NULL OR category = 'ADMIN')
);
-- Partial index matching claim_pending_email_jobs()'s exact WHERE/ORDER BY.
CREATE INDEX IF NOT EXISTS idx_email_outbox_pending
  ON public.email_outbox(priority, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_outbox_processing
  ON public.email_outbox(processing_started_at) WHERE status = 'processing';
CREATE INDEX IF NOT EXISTS idx_email_outbox_user ON public.email_outbox(user_id);
CREATE INDEX IF NOT EXISTS idx_email_outbox_event ON public.email_outbox(event_id);

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.email_outbox TO service_role;
CREATE POLICY "Admins can read email outbox"
  ON public.email_outbox FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- ---------- 3. email_delivery_events (Resend webhook log) ----------
CREATE TABLE IF NOT EXISTS public.email_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outbox_id uuid REFERENCES public.email_outbox(id) ON DELETE CASCADE,
  resend_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  provider_message_id text,
  raw_payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_delivery_events_outbox ON public.email_delivery_events(outbox_id);

ALTER TABLE public.email_delivery_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.email_delivery_events TO service_role;
CREATE POLICY "Admins can read email delivery events"
  ON public.email_delivery_events FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- ---------- 4. RPCs ----------
-- All SECURITY DEFINER + explicitly REVOKEd from PUBLIC/anon/authenticated
-- and GRANTed to service_role only — same idiom as create_notification().
-- Callable from: SECURITY DEFINER trigger functions elsewhere in this
-- schema (which run as the function owner), and from edge functions using
-- the service-role key.

CREATE OR REPLACE FUNCTION public.enqueue_email_event(
  p_event_type text,
  p_idempotency_key text,
  p_user_id uuid,
  p_recipient_email text,
  p_payload jsonb,
  p_source text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.email_events (event_type, idempotency_key, user_id, recipient_email, payload, source)
  VALUES (p_event_type, p_idempotency_key, p_user_id, p_recipient_email, COALESCE(p_payload, '{}'::jsonb), p_source)
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.email_events WHERE idempotency_key = p_idempotency_key;
  END IF;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_email_event(text, text, uuid, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email_event(text, text, uuid, text, jsonb, text) TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_email_job(
  p_event_id uuid,
  p_template_id text,
  p_category text,
  p_transactional boolean,
  p_recipient_email text,
  p_user_id uuid,
  p_payload jsonb,
  p_idempotency_key text,
  p_priority smallint DEFAULT 100,
  p_scheduled_at timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.email_outbox (
    event_id, template_id, category, transactional, recipient_email, user_id,
    payload, idempotency_key, priority, scheduled_at
  )
  VALUES (
    p_event_id, p_template_id, p_category, COALESCE(p_transactional, true), p_recipient_email, p_user_id,
    COALESCE(p_payload, '{}'::jsonb), p_idempotency_key, COALESCE(p_priority, 100), COALESCE(p_scheduled_at, now())
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.email_outbox WHERE idempotency_key = p_idempotency_key;
  END IF;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_email_job(uuid, text, text, boolean, text, uuid, jsonb, text, smallint, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email_job(uuid, text, text, boolean, text, uuid, jsonb, text, smallint, timestamptz) TO service_role;

-- Convenience wrapper used by nearly every call site below: records the
-- business event, then enqueues exactly one delivery job for it. Both
-- inserts are independently idempotent, so a caller that fires twice for
-- the same logical event (duplicate trigger execution, a retried RPC call)
-- always converges on the same event row and the same outbox row.
CREATE OR REPLACE FUNCTION public.enqueue_email(
  p_event_type text,
  p_event_idempotency_key text,
  p_template_id text,
  p_category text,
  p_user_id uuid,
  p_recipient_email text,
  p_payload jsonb,
  p_source text,
  p_transactional boolean DEFAULT true,
  p_priority smallint DEFAULT 100,
  p_job_idempotency_key text DEFAULT NULL,
  p_scheduled_at timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  v_event_id := public.enqueue_email_event(
    p_event_type, p_event_idempotency_key, p_user_id, p_recipient_email, p_payload, p_source
  );
  RETURN public.enqueue_email_job(
    v_event_id, p_template_id, p_category, p_transactional, p_recipient_email, p_user_id,
    p_payload, COALESCE(p_job_idempotency_key, p_event_idempotency_key), p_priority, p_scheduled_at
  );
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_email(text, text, text, text, uuid, text, jsonb, text, boolean, smallint, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, text, text, text, uuid, text, jsonb, text, boolean, smallint, text, timestamptz) TO service_role;

-- Atomic claim: FOR UPDATE SKIP LOCKED inside the UPDATE means two
-- concurrent processor invocations can never claim the same row. Also
-- sweeps jobs orphaned by a crashed worker (stuck in 'processing' for
-- >5 minutes) back to 'pending' before claiming — safe to retry because
-- the processor always passes the outbox row id as Resend's own
-- Idempotency-Key header, so a genuine crash-after-accept doesn't cause a
-- real duplicate send on the eventual retry.
CREATE OR REPLACE FUNCTION public.claim_pending_email_jobs(p_limit int DEFAULT 20)
RETURNS SETOF public.email_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.email_outbox
     SET status = 'pending', updated_at = now()
   WHERE status = 'processing'
     AND processing_started_at < now() - interval '5 minutes';

  RETURN QUERY
  UPDATE public.email_outbox eo
     SET status = 'processing',
         processing_started_at = now(),
         processing_token = gen_random_uuid(),
         attempt_count = eo.attempt_count + 1,
         updated_at = now()
    FROM (
      SELECT id FROM public.email_outbox
       WHERE status = 'pending' AND scheduled_at <= now()
       ORDER BY priority ASC, scheduled_at ASC
       LIMIT p_limit
       FOR UPDATE SKIP LOCKED
    ) claimed
   WHERE eo.id = claimed.id
  RETURNING eo.*;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_pending_email_jobs(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_email_jobs(int) TO service_role;

-- Only succeeds if the row is still 'processing' under the exact token the
-- claimant was handed — guards against a reclaimed/retried job being
-- double-completed by a stale worker that eventually wakes back up.
CREATE OR REPLACE FUNCTION public.complete_email_job(
  p_job_id uuid, p_processing_token uuid, p_provider_message_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated int;
BEGIN
  UPDATE public.email_outbox
     SET status = 'sent', sent_at = now(), provider_message_id = p_provider_message_id, updated_at = now()
   WHERE id = p_job_id AND status = 'processing' AND processing_token = p_processing_token;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_email_job(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_email_job(uuid, uuid, text) TO service_role;

-- Exponential backoff (2^attempt_count minutes, capped at 60) until
-- max_attempts is exhausted, then a permanent 'failed'. A permanently
-- failed TRANSACTIONAL job also raises an admin alert (never for a
-- non-transactional/marketing job, to avoid noise) — "surface critical
-- failures to administrators" per the system's own requirements.
CREATE OR REPLACE FUNCTION public.fail_email_job(
  p_job_id uuid, p_processing_token uuid, p_error text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        10
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
REVOKE ALL ON FUNCTION public.fail_email_job(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_email_job(uuid, uuid, text) TO service_role;

-- Only cancels a job still 'pending' (or actively 'processing', to cover
-- the send-time guard rejecting a job right after it was claimed) — never
-- a job that already reached a terminal state.
CREATE OR REPLACE FUNCTION public.cancel_email_job(p_job_id uuid, p_reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated int;
BEGIN
  UPDATE public.email_outbox
     SET status = 'cancelled', cancelled_at = now(), last_error = p_reason, updated_at = now()
   WHERE id = p_job_id AND status IN ('pending', 'processing');
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_email_job(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_email_job(uuid, text) TO service_role;
