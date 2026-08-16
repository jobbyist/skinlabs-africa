-- ---------- Members-only helper ----------
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
      AND lower(coalesce(subscription_status, '')) IN ('active', 'insider', 'vip', 'premium')
  )
$$;
REVOKE ALL ON FUNCTION public.is_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_member(uuid) TO authenticated, service_role;

-- ---------- Newsroom: stop shipping bodies to the client ----------
REVOKE SELECT ON public.news_articles FROM anon, authenticated;

CREATE OR REPLACE VIEW public.news_articles_public AS
  SELECT id, slug, title, excerpt, key_takeaways, sa_context_tag, source_name, source_url,
         publish_date, reading_time, word_count, cover_image_url, cover_image_alt,
         cover_credit_name, cover_credit_url, seo_title, seo_description, json_ld,
         view_count, created_at
  FROM public.news_articles
  WHERE status = 'published';

GRANT SELECT ON public.news_articles_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_article_body(p_slug text)
RETURNS TABLE (body_markdown text, inline_images jsonb)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_member(auth.uid()) THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT a.body_markdown, a.inline_images
    FROM public.news_articles a
    WHERE a.slug = p_slug AND a.status = 'published';
END;
$$;
REVOKE ALL ON FUNCTION public.get_article_body(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_article_body(text) TO authenticated, service_role;

-- ---------- Reviews: members-only long-form write-ups ----------
CREATE TABLE IF NOT EXISTS public.review_details (
  review_id text PRIMARY KEY,
  full_review text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.review_details TO authenticated;
GRANT ALL ON public.review_details TO service_role;

ALTER TABLE public.review_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read full reviews" ON public.review_details;
CREATE POLICY "Members can read full reviews"
ON public.review_details
FOR SELECT
TO authenticated
USING (public.is_member(auth.uid()));

INSERT INTO public.review_details (review_id, full_review) VALUES
('skoon-sensitive-fluid', 'Skoon''s sensitive fluid is built around a minimal, fragrance-free base that suits reactive and post-procedure skin. Texture is the standout: it absorbs in seconds and layers cleanly under mineral sunscreen, which is where most local moisturisers fail. Hydration holds through a full Highveld workday, though very dry skin types will want an occlusive on top at night. Value is fair rather than cheap, and the 50ml tube lasts roughly ten weeks with twice-daily use.'),
('swiitch-superhero-cleanser', 'This is the cleanser we most often recommend to users mid-barrier-reset. The low-foam formula avoids the tight, squeaky finish that hard municipal water tends to amplify, and it removes SPF adequately as a second cleanse. It will not fully dissolve heavy waterproof sunscreen on its own, so pair it with an oil cleanse on beach days. Excellent value per millilitre for a locally formulated product.'),
('standard-beauty-niacinamide', 'At under R200 this is the most accessible niacinamide serum in South Africa, and the 10% concentration does measurable work on post-inflammatory marks over eight to twelve weeks. The trade-off is texture: it is slightly tacky and needs a full minute to set before moisturiser. Users with reactive skin should start at alternate days, since 10% is above the comfort threshold for many Fitzpatrick IV-VI users prone to flushing.'),
('lelive-marula-spf', 'Most mineral sunscreens ash out on melanin-rich skin. Lelive''s tinted marula formula is the clearest local answer to that problem, blending to a natural satin finish across a wide tonal range. Climate performance is the highest in our review set: it holds through humid coastal conditions without sliding, and the tint adds visible-light defence, which matters for melasma. SPF 30 rather than 50 is the only real limitation, so reapply diligently on long outdoor days.'),
('oh-lief-body-oil', 'Nothing clever here, and that is the appeal: a clean blend of local plant oils that seals damp skin after a shower. It sits heavier than a lotion in summer humidity, so treat it as a winter and post-bath product. Fragrance is naturally derived and noticeable, which will not suit highly reactive users.'),
('dermastore-barrier-cream', 'A serious ceramide-and-cholesterol formula that measurably shortens barrier recovery time. Applied to damp skin twice daily, most users report reduced stinging within three to five days. It is rich, so oily skin types should reserve it for night use. Price is the main obstacle, but per week of use during a flare it remains cheaper than a dermatology consult.')
ON CONFLICT (review_id) DO UPDATE SET full_review = EXCLUDED.full_review;