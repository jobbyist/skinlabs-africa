-- Fix: enqueue_weekly_newsletter_digest() passed a bare
-- marketing_unsubscribe_token and left the template to guess at a host for
-- it — the unsubscribe endpoint lives on the Supabase functions domain
-- (email-unsubscribe), not skinlabs.co.za, so the template can't safely
-- construct that URL itself. Build the full URL here instead (same
-- hardcoded-project-URL precedent as the email-outbox-processor cron job)
-- and pass it as one `unsubscribe_url` var that both the template body and
-- email-processor's List-Unsubscribe header read from — one source of
-- truth instead of reconstructing the URL in two places.
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
        'unsubscribe_url', 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/email-unsubscribe?token=' || v_rec.marketing_unsubscribe_token::text
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
