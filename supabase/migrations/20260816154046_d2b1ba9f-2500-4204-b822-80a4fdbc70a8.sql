ALTER VIEW public.news_articles_public SET (security_invoker = true);

GRANT SELECT (id, slug, title, excerpt, key_takeaways, sa_context_tag, source_name, source_url,
              publish_date, reading_time, word_count, cover_image_url, cover_image_alt,
              cover_credit_name, cover_credit_url, seo_title, seo_description, json_ld,
              view_count, status, created_at, updated_at)
ON public.news_articles TO anon, authenticated;