-- Marketing consent + broadcast infrastructure, and wiring the previously-
-- dormant MEMBERSHIP_CANCELLED email into the real (and already-shipped)
-- cancel_subscription() RPC. See docs/email-automation-system.md section 9
-- for the full design rationale.

-- ---------- 1. Marketing consent columns on profiles ----------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_marketing_unsubscribe_token
  ON public.profiles(marketing_unsubscribe_token);

COMMENT ON COLUMN public.profiles.marketing_consent IS
  'Explicit opt-in captured at signup (never pre-checked) or revoked via the
   one-click unsubscribe link in a marketing email. Distinct from
   cookie_consent (GDPR/POPIA cookie-banner flag, unrelated to email) and
   from newsletter_subscribers (a separate dermatologist-consultation
   early-access waitlist, not general marketing).';
COMMENT ON COLUMN public.profiles.marketing_unsubscribe_token IS
  'Stable per-user capability token embedded in every marketing email''s
   unsubscribe link/List-Unsubscribe header. Low blast radius if guessed —
   it can only opt a user OUT of marketing, nothing else.';

-- Both auth.users triggers below are SECURITY DEFINER and already exist;
-- CREATE OR REPLACE to extend them, not create a second competing trigger.

-- 1a. handle_new_user(): carry marketing_consent from signup metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT := nullif(trim(NEW.raw_user_meta_data ->> 'username'), '');
  v_marketing_consent boolean := coalesce((NEW.raw_user_meta_data ->> 'marketing_consent')::boolean, false);
BEGIN
  IF v_username IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(v_username)
  ) THEN
    v_username := v_username || floor(random() * 9000 + 1000)::text;
  END IF;

  INSERT INTO public.profiles (user_id, email, username, full_name, marketing_consent, marketing_consent_at)
  VALUES (
    NEW.id, NEW.email, v_username, nullif(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    v_marketing_consent, CASE WHEN v_marketing_consent THEN now() ELSE NULL END
  );
  RETURN NEW;
END;
$$;

-- 1b. protect_profile_privileged_columns(): lock marketing_consent* the same
-- way trial/billing fields are locked — only service_role (the
-- email-unsubscribe function) or the app.privileged_write escape hatch
-- (handle_new_user's own INSERT, which this UPDATE-only trigger doesn't even
-- apply to) can change it, never a bare client .update() call.
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
  NEW.marketing_consent := OLD.marketing_consent;
  NEW.marketing_consent_at := OLD.marketing_consent_at;
  RETURN NEW;
END;
$$;

-- ---------- 2. Public one-click unsubscribe ----------
-- Called by the email-unsubscribe edge function using the service-role
-- client — the token itself is the credential, no login required (same
-- security model as a password-reset link).
CREATE OR REPLACE FUNCTION public.unsubscribe_marketing(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles
     SET marketing_consent = false,
         marketing_consent_at = now()
   WHERE marketing_unsubscribe_token = p_token;
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.unsubscribe_marketing(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_marketing(uuid) TO service_role;

-- ---------- 3. Membership cancellation email ----------
-- cancel_subscription() already exists and is already wired to a real
-- "Cancel membership" button in BillingTab.tsx — it just never told anyone.
-- Captures the plan being cancelled BEFORE the UPDATE wipes it, so the email
-- can say what they had (handles a trial cancelled early: previous_status is
-- 'trial', so trial_plan is used instead — trial_plan isn't itself in
-- PLAN_LABELS, membership.ts maps 'insider'/'vip' either way).
CREATE OR REPLACE FUNCTION public.cancel_subscription()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_previous_status text;
  v_previous_trial_plan text;
  v_plan_for_email text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT subscription_status, trial_plan INTO v_previous_status, v_previous_trial_plan
    FROM public.profiles WHERE user_id = v_uid;

  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles
     SET subscription_status = 'free',
         trial_plan = NULL,
         trial_ends_at = NULL
   WHERE user_id = v_uid
     AND lower(coalesce(subscription_status, '')) IN ('active', 'glow_lite', 'insider', 'vip', 'premium', 'trial');
  PERFORM set_config('app.privileged_write', 'off', true);

  IF FOUND THEN
    v_plan_for_email := coalesce(v_previous_trial_plan, v_previous_status);
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
    PERFORM public.enqueue_email(
      'MEMBERSHIP_CANCELLED', 'membership_cancelled:' || v_uid::text || ':' || now()::date::text,
      'membership_cancelled', 'MEMBERSHIP', v_uid, v_email,
      jsonb_build_object('plan', v_plan_for_email),
      'rpc:cancel_subscription'
    );
  END IF;

  RETURN FOUND;
END;
$$;

-- ---------- 4. Admin-curated weekly-digest highlight ----------
CREATE TABLE IF NOT EXISTS public.newsletter_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  description text NOT NULL,
  cta_label text NOT NULL DEFAULT 'Learn more',
  cta_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  active_from timestamptz,
  active_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_offers ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.newsletter_offers TO service_role;
CREATE POLICY "Admins can read newsletter offers"
  ON public.newsletter_offers FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can manage newsletter offers"
  ON public.newsletter_offers FOR ALL TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

-- ---------- 5. Weekly digest content + fan-out (Monday cron) ----------
-- Deliberately a single SQL function (like enqueue_trial_expiring_events()),
-- not an edge function: content sourcing is plain SQL against news_articles/
-- ai_generated_product_reviews/newsletter_offers, and enqueue_email() is
-- already SECURITY DEFINER and callable in a loop from here directly.
-- Skips entirely (returns 0, no emails enqueued) if there's genuinely no
-- content this week, rather than sending a low-value empty digest.
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
      jsonb_build_object(
        'top_stories', coalesce(v_top_stories, '[]'::jsonb),
        'top_reviews', coalesce(v_top_reviews, '[]'::jsonb),
        'offer', v_offer,
        'week_label', v_week_label,
        'unsubscribe_token', v_rec.marketing_unsubscribe_token
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

-- Monday 09:00 SAST = 07:00 UTC — same SAST-business-hours convention as the
-- product-review pipeline's Vercel cron.
SELECT cron.schedule(
  'newsletter-weekly-digest',
  '0 7 * * 1',
  $$SELECT public.enqueue_weekly_newsletter_digest();$$
);
