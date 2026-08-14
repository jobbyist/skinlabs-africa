
-- ===== Newsroom articles =====
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  body_markdown TEXT NOT NULL DEFAULT '',
  key_takeaways TEXT[] NOT NULL DEFAULT '{}',
  sa_context_tag TEXT NOT NULL DEFAULT 'SA Skin',
  source_name TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reading_time TEXT NOT NULL DEFAULT '5 min read',
  word_count INT NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  cover_credit_name TEXT,
  cover_credit_url TEXT,
  inline_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  json_ld JSONB,
  view_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news_articles TO anon;
GRANT SELECT ON public.news_articles TO authenticated;
GRANT ALL ON public.news_articles TO service_role;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published articles are public" ON public.news_articles;
CREATE POLICY "Published articles are public" ON public.news_articles
  FOR SELECT TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS "Admins manage articles" ON public.news_articles;
CREATE POLICY "Admins manage articles" ON public.news_articles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS news_articles_publish_idx ON public.news_articles (publish_date DESC, created_at DESC);

-- ===== Engagement (likes / saves) =====
CREATE TABLE IF NOT EXISTS public.news_article_engagement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('like','save')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (article_id, user_id, kind)
);

GRANT SELECT, INSERT, DELETE ON public.news_article_engagement TO authenticated;
GRANT SELECT ON public.news_article_engagement TO anon;
GRANT ALL ON public.news_article_engagement TO service_role;
ALTER TABLE public.news_article_engagement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Engagement counts are public" ON public.news_article_engagement;
CREATE POLICY "Engagement counts are public" ON public.news_article_engagement
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users add their own engagement" ON public.news_article_engagement;
CREATE POLICY "Users add their own engagement" ON public.news_article_engagement
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users remove their own engagement" ON public.news_article_engagement;
CREATE POLICY "Users remove their own engagement" ON public.news_article_engagement
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== Comments =====
CREATE TABLE IF NOT EXISTS public.news_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Member',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_comments TO authenticated;
GRANT ALL ON public.news_comments TO service_role;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are public" ON public.news_comments;
CREATE POLICY "Comments are public" ON public.news_comments
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users write their own comments" ON public.news_comments;
CREATE POLICY "Users write their own comments" ON public.news_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users edit their own comments" ON public.news_comments;
CREATE POLICY "Users edit their own comments" ON public.news_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their own comments" ON public.news_comments;
CREATE POLICY "Users delete their own comments" ON public.news_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ===== Daily view tracking =====
CREATE TABLE IF NOT EXISTS public.news_article_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INT NOT NULL DEFAULT 0,
  UNIQUE (article_id, view_date)
);

GRANT SELECT ON public.news_article_views TO anon, authenticated;
GRANT ALL ON public.news_article_views TO service_role;
ALTER TABLE public.news_article_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View stats are public" ON public.news_article_views;
CREATE POLICY "View stats are public" ON public.news_article_views
  FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.register_article_view(p_article_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INT;
BEGIN
  INSERT INTO public.news_article_views (article_id, view_date, views)
  VALUES (p_article_id, CURRENT_DATE, 1)
  ON CONFLICT (article_id, view_date) DO UPDATE SET views = public.news_article_views.views + 1;

  UPDATE public.news_articles
     SET view_count = view_count + 1
   WHERE id = p_article_id
  RETURNING view_count INTO v_total;

  RETURN COALESCE(v_total, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.register_article_view(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_article_view(UUID) TO anon, authenticated, service_role;

-- ===== Sync run log (rate limiting) =====
CREATE TABLE IF NOT EXISTS public.news_sync_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  articles_created INT NOT NULL DEFAULT 0,
  firecrawl_calls INT NOT NULL DEFAULT 0,
  ai_calls INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ok',
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.news_sync_runs TO service_role;
ALTER TABLE public.news_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read sync runs" ON public.news_sync_runs;
CREATE POLICY "Admins read sync runs" ON public.news_sync_runs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.news_sync_runs TO authenticated;

-- ===== Security: lock privileged columns =====
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claims', true) IS NULL
     OR coalesce((current_setting('request.jwt.claims', true)::json ->> 'role'), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.subscription_status := OLD.subscription_status;
  NEW.subscription_started_at := OLD.subscription_started_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

CREATE OR REPLACE FUNCTION public.protect_preorder_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_service BOOLEAN := (
    current_setting('request.jwt.claims', true) IS NULL
    OR coalesce((current_setting('request.jwt.claims', true)::json ->> 'role'), '') = 'service_role'
  );
  v_price NUMERIC;
BEGIN
  IF v_is_service THEN
    RETURN NEW;
  END IF;

  v_price := CASE lower(coalesce(NEW.product_type, ''))
    WHEN 'subscription' THEN 99.00
    ELSE 299.00
  END;

  IF TG_OP = 'INSERT' THEN
    NEW.amount := v_price;
    NEW.status := 'pending';
    NEW.payment_id := NULL;
    RETURN NEW;
  END IF;

  NEW.amount := OLD.amount;
  NEW.status := OLD.status;
  NEW.payment_id := OLD.payment_id;
  NEW.product_type := OLD.product_type;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_preorder_privileged_columns ON public.preorders;
CREATE TRIGGER protect_preorder_privileged_columns
  BEFORE INSERT OR UPDATE ON public.preorders
  FOR EACH ROW EXECUTE FUNCTION public.protect_preorder_privileged_columns();
