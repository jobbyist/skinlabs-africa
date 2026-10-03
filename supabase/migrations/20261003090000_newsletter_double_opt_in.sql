-- Newsletter double opt-in (growth engine, subscriber capture).
--
-- Before: the only anonymous email form was the dermatologist-consultation
-- early-access waitlist (public.newsletter_subscribers, direct client INSERT),
-- and the weekly digest only reached account holders with
-- profiles.marketing_consent. Visitors who just wanted the weekly digest had
-- nowhere to sign up.
--
-- This migration is ADDITIVE on newsletter_subscribers (the admin list and the
-- FORM_SUBMITTED trigger keep working):
--   * digest_* columns track the weekly-digest subscription separately from the
--     consultation waitlist (`consultation_waitlist`), so a person can be on
--     either or both;
--   * every client write goes through SECURITY DEFINER RPCs (no direct INSERT
--     grant any more), so nobody can mark themselves or someone else
--     'confirmed' without the emailed token;
--   * the digest fan-out also reaches confirmed subscribers.

-- ---------- 1. Columns ----------
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS consultation_waitlist boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS digest_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS digest_source text,
  ADD COLUMN IF NOT EXISTS digest_source_path text,
  ADD COLUMN IF NOT EXISTS digest_consent_text text,
  ADD COLUMN IF NOT EXISTS digest_consent_version text,
  ADD COLUMN IF NOT EXISTS digest_confirm_token uuid,
  ADD COLUMN IF NOT EXISTS digest_confirmation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS digest_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS digest_unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.newsletter_subscribers
  DROP CONSTRAINT IF EXISTS newsletter_subscribers_digest_status_check;
ALTER TABLE public.newsletter_subscribers
  ADD CONSTRAINT newsletter_subscribers_digest_status_check
  CHECK (digest_status IN ('none', 'pending', 'confirmed', 'unsubscribed'));

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_unsubscribe_token_key
  ON public.newsletter_subscribers (unsubscribe_token);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_digest_confirm_token_key
  ON public.newsletter_subscribers (digest_confirm_token) WHERE digest_confirm_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS newsletter_subscribers_digest_status_idx
  ON public.newsletter_subscribers (digest_status) WHERE digest_status <> 'none';

-- Existing rows are consultation-waitlist signups (the column defaults above
-- already describe them: waitlist = true, digest_status = 'none'). They are
-- NOT opted in to the digest and are never emailed it.

-- ---------- 2. No direct client writes ----------
-- All writes now go through the RPCs below. Without this, a client could
-- INSERT a row with digest_status = 'confirmed' and subscribe any address.
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
REVOKE INSERT, UPDATE, DELETE ON public.newsletter_subscribers FROM anon, authenticated;

-- The confirm / unsubscribe tokens are credentials: no client role (admins
-- included) may read them. Admins keep SELECT on every other column.
REVOKE SELECT ON public.newsletter_subscribers FROM anon, authenticated;
GRANT SELECT (
  id, email, subscribed_at, is_active, consultation_waitlist, digest_status, digest_source,
  digest_source_path, digest_consent_version, digest_confirmation_sent_at,
  digest_confirmed_at, digest_unsubscribed_at
) ON public.newsletter_subscribers TO authenticated;

-- ---------- 3. Consultation waitlist (same behaviour as the old direct insert) ----------
CREATE OR REPLACE FUNCTION public.join_consultation_waitlist(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_id uuid;
BEGIN
  IF char_length(v_email) NOT BETWEEN 3 AND 255 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.newsletter_subscribers (email, consultation_waitlist)
  VALUES (v_email, true)
  ON CONFLICT (email) DO UPDATE
    SET consultation_waitlist = true
    WHERE public.newsletter_subscribers.consultation_waitlist = false
  RETURNING id INTO v_id;

  RETURN CASE WHEN v_id IS NULL THEN 'already' ELSE 'joined' END;
END;
$$;
REVOKE ALL ON FUNCTION public.join_consultation_waitlist(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_consultation_waitlist(text) TO anon, authenticated, service_role;

-- The confirmation + admin notice only make sense for waitlist joins, never for
-- a digest-only signup row, and also when a digest-only row later joins the waitlist.
CREATE OR REPLACE FUNCTION public.notify_newsletter_subscriber()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT NEW.consultation_waitlist THEN RETURN NEW; END IF;
  ELSIF NOT (OLD.consultation_waitlist = false AND NEW.consultation_waitlist = true) THEN
    RETURN NEW;
  END IF;

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
REVOKE ALL ON FUNCTION public.notify_newsletter_subscriber() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_newsletter_subscriber ON public.newsletter_subscribers;
CREATE TRIGGER trg_notify_newsletter_subscriber
  AFTER INSERT OR UPDATE OF consultation_waitlist ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.notify_newsletter_subscriber();

-- ---------- 4. Weekly digest: subscribe (step 1 of double opt-in) ----------
-- Never reveals whether an address is already subscribed (always returns true
-- for a well-formed address). The consent wording is owned by the server and
-- stored with the version, so the record can't be spoofed by the client.
-- Abuse limits (this endpoint is public and sends email to third parties):
--   * a pending address is re-sent at most once an hour;
--   * at most 300 confirmation emails an hour across the whole list; beyond
--     that the row is stored as pending but no email goes out.
CREATE OR REPLACE FUNCTION public.subscribe_newsletter(
  p_email text,
  p_source text DEFAULT 'unknown',
  p_source_path text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_version CONSTANT text := 'digest-2026-10';
  c_text CONSTANT text :=
    'Email me the SkinLabs weekly digest (new briefings, reviews and ingredient guides). I can unsubscribe at any time.';
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_source text := CASE WHEN p_source ~ '^[a-z0-9_:-]{1,64}$' THEN p_source ELSE 'unknown' END;
  v_path text := CASE WHEN p_source_path LIKE '/%' THEN left(p_source_path, 200) ELSE NULL END;
  v_row public.newsletter_subscribers%ROWTYPE;
  v_token uuid := gen_random_uuid();
  v_send boolean := false;
BEGIN
  IF char_length(v_email) NOT BETWEEN 3 AND 255 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row FROM public.newsletter_subscribers WHERE email = v_email FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.newsletter_subscribers (
      email, consultation_waitlist, digest_status, digest_source, digest_source_path,
      digest_consent_text, digest_consent_version, digest_confirm_token
    ) VALUES (
      v_email, false, 'pending', v_source, v_path, c_text, c_version, v_token
    ) RETURNING * INTO v_row;
    v_send := true;
  ELSIF v_row.digest_status IN ('none', 'unsubscribed') THEN
    UPDATE public.newsletter_subscribers
       SET digest_status = 'pending', digest_source = v_source, digest_source_path = v_path,
           digest_consent_text = c_text, digest_consent_version = c_version,
           digest_confirm_token = v_token, digest_unsubscribed_at = NULL
     WHERE id = v_row.id
    RETURNING * INTO v_row;
    v_send := true;
  ELSIF v_row.digest_status = 'pending'
        AND (v_row.digest_confirmation_sent_at IS NULL
             OR v_row.digest_confirmation_sent_at < now() - interval '1 hour') THEN
    UPDATE public.newsletter_subscribers
       SET digest_confirm_token = v_token
     WHERE id = v_row.id
    RETURNING * INTO v_row;
    v_send := true;
  END IF;
  -- 'confirmed' (or a recently re-sent 'pending'): nothing to do, say nothing.

  IF v_send THEN
    -- Serialise only this short check-and-stamp so concurrent signups can't all read
    -- "299 sent" and each pass the global cap (the lock is released at commit).
    PERFORM pg_advisory_xact_lock(hashtext('newsletter_digest_confirm_cap'));
    IF (SELECT count(*) FROM public.newsletter_subscribers
         WHERE digest_confirmation_sent_at > now() - interval '1 hour') < 300 THEN
      UPDATE public.newsletter_subscribers SET digest_confirmation_sent_at = now() WHERE id = v_row.id;
      PERFORM public.enqueue_email(
        'NEWSLETTER_DIGEST_CONFIRM', 'newsletter_digest_confirm:' || v_row.id::text || ':' || v_token::text,
        'newsletter_digest_confirm', 'FORMS', NULL, v_row.email,
        jsonb_build_object(
          'subscriber_id', v_row.id,
          'confirm_url', 'https://skinlabs.co.za/newsletter/confirm?token=' || v_token::text
        ),
        'rpc:subscribe_newsletter'
      );
    END IF;
  END IF;

  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.subscribe_newsletter(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_newsletter(text, text, text) TO anon, authenticated, service_role;

-- ---------- 5. Confirm (step 2) ----------
-- The token is the credential. Valid for 7 days from the last confirmation
-- email; confirming twice is harmless ('already').
CREATE OR REPLACE FUNCTION public.confirm_newsletter(p_token uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_token IS NULL THEN RETURN 'invalid'; END IF;

  UPDATE public.newsletter_subscribers
     SET digest_status = 'confirmed', digest_confirmed_at = now()
   WHERE digest_confirm_token = p_token
     AND digest_status = 'pending'
     AND digest_confirmation_sent_at > now() - interval '7 days'
  RETURNING id INTO v_id;
  IF v_id IS NOT NULL THEN RETURN 'confirmed'; END IF;

  IF EXISTS (SELECT 1 FROM public.newsletter_subscribers
              WHERE digest_confirm_token = p_token AND digest_status = 'confirmed') THEN
    RETURN 'already';
  END IF;
  RETURN 'invalid';
END;
$$;
REVOKE ALL ON FUNCTION public.confirm_newsletter(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_newsletter(uuid) TO anon, authenticated, service_role;

-- ---------- 6. One-click unsubscribe (called by the email-unsubscribe function) ----------
CREATE OR REPLACE FUNCTION public.unsubscribe_newsletter(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.newsletter_subscribers
     SET digest_status = CASE WHEN digest_status IN ('pending', 'confirmed') THEN 'unsubscribed' ELSE digest_status END,
         digest_unsubscribed_at = CASE WHEN digest_status IN ('pending', 'confirmed') THEN now() ELSE digest_unsubscribed_at END
   WHERE unsubscribe_token = p_token;
  RETURN FOUND; -- nothing between the UPDATE and here may overwrite FOUND
END;
$$;
REVOKE ALL ON FUNCTION public.unsubscribe_newsletter(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_newsletter(uuid) TO service_role;

-- ---------- 7. Weekly digest fan-out reaches confirmed subscribers too ----------
-- Same content selection as before; the only change is a second recipient loop.
-- An address that is also a consenting member is emailed once (the member row
-- wins), and each job key is per week + recipient, so a re-run never double-sends.
CREATE OR REPLACE FUNCTION public.enqueue_weekly_newsletter_digest()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_top_stories jsonb;
  v_top_reviews jsonb;
  v_offer jsonb;
  v_week_label text := to_char(now(), 'IYYY-"W"IW');
  v_count integer := 0;
  v_rec record;
  v_payload jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object('title', title, 'slug', slug, 'excerpt', excerpt) ORDER BY coalesce(view_count, 0) DESC, publish_date DESC)
    INTO v_top_stories
    FROM (
      SELECT title, slug, excerpt, view_count, publish_date
        FROM public.news_articles
       WHERE status = 'published'
         AND publish_date >= (now() - interval '7 days')::date
       ORDER BY coalesce(view_count, 0) DESC, publish_date DESC
       LIMIT 3
    ) t;

  SELECT jsonb_agg(jsonb_build_object('brand', brand, 'product_name', product_name, 'verdict', verdict, 'id', id) ORDER BY avg_score DESC)
    INTO v_top_reviews
    FROM (
      SELECT id, brand, product_name, verdict,
             (coalesce(score_efficacy, 0) + coalesce(score_value, 0) + coalesce(score_texture, 0) + coalesce(score_climate, 0)) / 4.0 AS avg_score
        FROM public.ai_generated_product_reviews
       WHERE published_date >= (now() - interval '7 days')::date
       ORDER BY avg_score DESC
       LIMIT 3
    ) r;

  SELECT to_jsonb(o) INTO v_offer
    FROM (
      SELECT headline, description, cta_label, cta_url
        FROM public.newsletter_offers
       WHERE is_active = true
         AND (active_from IS NULL OR active_from <= now())
         AND (active_until IS NULL OR active_until >= now())
       ORDER BY created_at DESC
       LIMIT 1
    ) o;

  IF v_top_stories IS NULL AND v_top_reviews IS NULL AND v_offer IS NULL THEN
    RETURN 0;
  END IF;

  v_payload := jsonb_build_object(
    'top_stories', coalesce(v_top_stories, '[]'::jsonb),
    'top_reviews', coalesce(v_top_reviews, '[]'::jsonb),
    'offer', v_offer,
    'week_label', v_week_label
  );

  -- Members who opted in to marketing.
  FOR v_rec IN
    SELECT p.user_id, u.email, p.marketing_unsubscribe_token
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.user_id
     WHERE p.marketing_consent = true
       AND u.email IS NOT NULL
       AND u.email_confirmed_at IS NOT NULL
  LOOP
    PERFORM public.enqueue_email(
      'NEWSLETTER_WEEKLY_DIGEST', 'newsletter_weekly:' || v_week_label || ':' || v_rec.user_id::text,
      'newsletter_weekly_digest', 'MARKETING', v_rec.user_id, v_rec.email,
      v_payload || jsonb_build_object(
        'unsubscribe_url', 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/email-unsubscribe?token=' || v_rec.marketing_unsubscribe_token::text
      ),
      'cron:enqueue_weekly_newsletter_digest', false
    );
    v_count := v_count + 1;
  END LOOP;

  -- Double-opted-in subscribers who aren't already covered above.
  FOR v_rec IN
    SELECT s.id, s.email, s.unsubscribe_token
      FROM public.newsletter_subscribers s
     WHERE s.digest_status = 'confirmed'
       AND NOT EXISTS (
         SELECT 1
           FROM public.profiles p
           JOIN auth.users u ON u.id = p.user_id
          WHERE p.marketing_consent = true
            AND lower(u.email) = s.email
       )
  LOOP
    PERFORM public.enqueue_email(
      'NEWSLETTER_WEEKLY_DIGEST', 'newsletter_weekly:' || v_week_label || ':sub:' || v_rec.id::text,
      'newsletter_weekly_digest', 'MARKETING', NULL, v_rec.email,
      v_payload || jsonb_build_object(
        'subscriber_id', v_rec.id,
        'unsubscribe_url', 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/email-unsubscribe?token=' || v_rec.unsubscribe_token::text
      ),
      'cron:enqueue_weekly_newsletter_digest', false
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_weekly_newsletter_digest() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_weekly_newsletter_digest() TO service_role;
