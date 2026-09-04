-- ===== The Daily Skinny: signed-out visitors get no free-tier access =====
-- Correction to 20260904010000_daily_skinny_free_weekly_allowance.sql: that migration
-- extended the free 3-per-week allowance to signed-out visitors via a client-supplied
-- device id. That's a soft, client-trust-based mechanism (clearing local storage mints
-- a fresh device id and resets the count) which isn't an appropriate security boundary
-- for a server-enforced quota, so signed-out visitors now get no free full-briefing
-- access at all — only a free Glow Explorer account (still 3 full briefings per rolling
-- 7 days) or a paid membership unlocks premium briefing bodies.
--
-- Also fixes a real bug carried over from the original definition: the function was
-- declared STABLE while its body performs an INSERT (recording the free_read), which
-- Postgres rejects outright ("INSERT is not allowed in a non-volatile function") —
-- meaning every free-tier read of a premium briefing has been erroring, not just
-- rate-limiting. Declared VOLATILE (the correct classification for a function with a
-- write) so the read actually succeeds.

DROP TABLE IF EXISTS public.news_anon_reads;

CREATE OR REPLACE FUNCTION public.get_article_body(p_slug text, p_device_id text DEFAULT NULL)
RETURNS TABLE (body_markdown text, inline_images jsonb)
LANGUAGE plpgsql
VOLATILE
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

  -- Signed-out visitors: no free access. p_device_id is accepted for backwards
  -- compatibility with existing client calls but is no longer used for anything.
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF public.is_member(auth.uid()) THEN
    RETURN QUERY SELECT v_article.body_markdown, v_article.inline_images;
    RETURN;
  END IF;

  -- Signed-in, free (Glow Explorer) accounts: up to 3 full briefings per rolling 7 days.
  -- Re-reading the same article within that window is free (idempotent via the unique
  -- constraint on news_article_engagement).
  SELECT EXISTS (
    SELECT 1 FROM public.news_article_engagement
     WHERE user_id = auth.uid() AND article_id = v_article.id AND kind = 'full_read'
  ) INTO v_already_read;

  IF NOT v_already_read THEN
    SELECT count(DISTINCT article_id) INTO v_reads_this_week
      FROM public.news_article_engagement
     WHERE user_id = auth.uid() AND kind = 'full_read' AND created_at > now() - interval '7 days';

    IF v_reads_this_week >= 3 THEN
      RETURN;
    END IF;

    INSERT INTO public.news_article_engagement (article_id, user_id, kind)
    VALUES (v_article.id, auth.uid(), 'full_read')
    ON CONFLICT (article_id, user_id, kind) DO NOTHING;
  END IF;

  RETURN QUERY SELECT v_article.body_markdown, v_article.inline_images;
END;
$$;

REVOKE ALL ON FUNCTION public.get_article_body(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_article_body(text, text) TO anon, authenticated, service_role;
