-- ===== Membership: annual billing + free trial support =====
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS billing_interval TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS trial_plan TEXT,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_used_at TIMESTAMPTZ;

-- Lock the new privileged columns down the same way subscription_status already is,
-- but allow a transaction-local escape hatch for the start_free_trial() RPC below.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claims', true) IS NULL
     OR coalesce((current_setting('request.jwt.claims', true)::json ->> 'role'), '') = 'service_role'
     OR coalesce(current_setting('app.bypass_profile_guard', true), '') = 'on' THEN
    RETURN NEW;
  END IF;
  NEW.subscription_status := OLD.subscription_status;
  NEW.subscription_started_at := OLD.subscription_started_at;
  NEW.billing_interval := OLD.billing_interval;
  NEW.trial_plan := OLD.trial_plan;
  NEW.trial_started_at := OLD.trial_started_at;
  NEW.trial_ends_at := OLD.trial_ends_at;
  NEW.trial_used_at := OLD.trial_used_at;
  RETURN NEW;
END;
$$;

-- ---------- Members-only helper: now also recognises an active trial ----------
CREATE OR REPLACE FUNCTION public.is_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND (
        lower(coalesce(subscription_status, '')) IN ('active', 'insider', 'vip', 'premium')
        OR (lower(coalesce(subscription_status, '')) = 'trial' AND trial_ends_at IS NOT NULL AND trial_ends_at > now())
      )
  )
$$;

-- ---------- Start a 7-day, no-card free trial (one per account, ever) ----------
CREATE OR REPLACE FUNCTION public.start_free_trial(p_plan text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_plan NOT IN ('insider', 'vip') THEN
    RAISE EXCEPTION 'invalid plan';
  END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  UPDATE public.profiles
     SET subscription_status = 'trial',
         trial_plan = p_plan,
         trial_started_at = now(),
         trial_ends_at = now() + interval '7 days',
         trial_used_at = now()
   WHERE user_id = auth.uid()
     AND trial_used_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'trial already used';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.start_free_trial(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_free_trial(text) TO authenticated;

-- ===== Newsroom: some briefings are fully public, and free members get one full read/week =====
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT true;

GRANT SELECT (is_premium) ON public.news_articles TO anon, authenticated;

CREATE OR REPLACE VIEW public.news_articles_public AS
  SELECT id, slug, title, excerpt, key_takeaways, sa_context_tag, source_name, source_url,
         publish_date, reading_time, word_count, cover_image_url, cover_image_alt,
         cover_credit_name, cover_credit_url, seo_title, seo_description, json_ld,
         view_count, is_premium, created_at
  FROM public.news_articles
  WHERE status = 'published';

ALTER VIEW public.news_articles_public SET (security_invoker = true);
GRANT SELECT ON public.news_articles_public TO anon, authenticated;

-- Allow a 'full_read' engagement kind alongside the existing like/save, used to meter
-- the free tier's one-full-briefing-per-week allowance.
ALTER TABLE public.news_article_engagement DROP CONSTRAINT IF EXISTS news_article_engagement_kind_check;
ALTER TABLE public.news_article_engagement ADD CONSTRAINT news_article_engagement_kind_check
  CHECK (kind IN ('like', 'save', 'full_read'));

CREATE OR REPLACE FUNCTION public.get_article_body(p_slug text)
RETURNS TABLE (body_markdown text, inline_images jsonb)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_article public.news_articles%ROWTYPE;
  v_already_read boolean;
  v_reads_this_week int;
BEGIN
  SELECT * INTO v_article FROM public.news_articles a WHERE a.slug = p_slug AND a.status = 'published';
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Fully public articles (e.g. SEO comparison pieces) are never gated.
  IF v_article.is_premium = false THEN
    RETURN QUERY SELECT v_article.body_markdown, v_article.inline_images;
    RETURN;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF public.is_member(auth.uid()) THEN
    RETURN QUERY SELECT v_article.body_markdown, v_article.inline_images;
    RETURN;
  END IF;

  -- Free members: exactly one full briefing per rolling 7 days. Re-reading the same
  -- article within that window is free (idempotent via the unique constraint below).
  SELECT EXISTS (
    SELECT 1 FROM public.news_article_engagement
     WHERE user_id = auth.uid() AND article_id = v_article.id AND kind = 'full_read'
  ) INTO v_already_read;

  IF NOT v_already_read THEN
    SELECT count(DISTINCT article_id) INTO v_reads_this_week
      FROM public.news_article_engagement
     WHERE user_id = auth.uid() AND kind = 'full_read' AND created_at > now() - interval '7 days';

    IF v_reads_this_week >= 1 THEN
      RETURN;
    END IF;

    INSERT INTO public.news_article_engagement (article_id, user_id, kind)
    VALUES (v_article.id, auth.uid(), 'full_read')
    ON CONFLICT (article_id, user_id, kind) DO NOTHING;
  END IF;

  RETURN QUERY SELECT v_article.body_markdown, v_article.inline_images;
END;
$$;

REVOKE ALL ON FUNCTION public.get_article_body(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_article_body(text) TO anon, authenticated, service_role;

-- ===== AI Formulator: tier-based usage quota (explorer 1/month, insider & vip 1/week) =====
CREATE TABLE IF NOT EXISTS public.ai_analysis_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_at_use TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_analysis_usage TO authenticated;
GRANT ALL ON public.ai_analysis_usage TO service_role;
ALTER TABLE public.ai_analysis_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view their own AI usage" ON public.ai_analysis_usage;
CREATE POLICY "Users view their own AI usage" ON public.ai_analysis_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ai_analysis_usage_user_idx ON public.ai_analysis_usage (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.register_ai_analysis_use()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier text;
  v_count int;
  v_window interval;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  SELECT CASE
    WHEN lower(coalesce(p.subscription_status, '')) = 'vip'
      OR (lower(coalesce(p.subscription_status, '')) = 'trial' AND p.trial_plan = 'vip' AND p.trial_ends_at > now())
      THEN 'vip'
    WHEN lower(coalesce(p.subscription_status, '')) IN ('insider', 'active', 'premium')
      OR (lower(coalesce(p.subscription_status, '')) = 'trial' AND p.trial_plan = 'insider' AND p.trial_ends_at > now())
      THEN 'insider'
    ELSE 'explorer'
  END INTO v_tier
  FROM public.profiles p
  WHERE p.user_id = auth.uid();

  v_window := CASE WHEN v_tier = 'explorer' THEN interval '30 days' ELSE interval '7 days' END;

  SELECT count(*) INTO v_count
    FROM public.ai_analysis_usage
   WHERE user_id = auth.uid() AND created_at > now() - v_window;

  IF v_count >= 1 THEN
    RETURN false;
  END IF;

  INSERT INTO public.ai_analysis_usage (user_id, plan_at_use) VALUES (auth.uid(), v_tier);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.register_ai_analysis_use() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_ai_analysis_use() TO authenticated;
