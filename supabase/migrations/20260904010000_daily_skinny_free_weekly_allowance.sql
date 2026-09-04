-- ===== The Daily Skinny: raise the free weekly allowance to 3, and extend it to =====
-- ===== signed-out visitors (previously: 1/week, members only). =====

-- Anonymous (signed-out) reads are tracked by a client-generated device id, mirroring the
-- signed-in "full_read" engagement mechanism below but without an auth.users row to hang off.
CREATE TABLE IF NOT EXISTS public.news_anon_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (device_id, article_id)
);

ALTER TABLE public.news_anon_reads ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.news_anon_reads TO service_role;
-- No direct anon/authenticated grants — this table is only ever touched through the
-- SECURITY DEFINER get_article_body() function below.

CREATE INDEX IF NOT EXISTS news_anon_reads_device_idx ON public.news_anon_reads (device_id, created_at DESC);

DROP FUNCTION IF EXISTS public.get_article_body(text);

CREATE OR REPLACE FUNCTION public.get_article_body(p_slug text, p_device_id text DEFAULT NULL)
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
  v_device_id text;
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

  IF public.is_member(auth.uid()) THEN
    RETURN QUERY SELECT v_article.body_markdown, v_article.inline_images;
    RETURN;
  END IF;

  IF auth.uid() IS NOT NULL THEN
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
    RETURN;
  END IF;

  -- Signed-out visitors: the same 3-per-7-days allowance, tracked by a client-supplied
  -- device id rather than a user id. No device id means we cannot meter the visitor, so
  -- nothing is returned rather than granting unlimited free access.
  v_device_id := NULLIF(trim(coalesce(p_device_id, '')), '');
  IF v_device_id IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.news_anon_reads WHERE device_id = v_device_id AND article_id = v_article.id
  ) INTO v_already_read;

  IF NOT v_already_read THEN
    SELECT count(DISTINCT article_id) INTO v_reads_this_week
      FROM public.news_anon_reads
     WHERE device_id = v_device_id AND created_at > now() - interval '7 days';

    IF v_reads_this_week >= 3 THEN
      RETURN;
    END IF;

    INSERT INTO public.news_anon_reads (device_id, article_id)
    VALUES (v_device_id, v_article.id)
    ON CONFLICT (device_id, article_id) DO NOTHING;
  END IF;

  RETURN QUERY SELECT v_article.body_markdown, v_article.inline_images;
END;
$$;

REVOKE ALL ON FUNCTION public.get_article_body(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_article_body(text, text) TO anon, authenticated, service_role;
