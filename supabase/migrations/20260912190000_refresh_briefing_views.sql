-- Give the newest briefing a credible starting count, then add a small random
-- increment for every older briefing. New browser-local reads continue from
-- these counts without expiring.
WITH ranked AS (
  SELECT
    id,
    (486 + COALESCE(SUM((8 + floor(random() * 25))::int) OVER (
      ORDER BY publish_date DESC, created_at DESC, id DESC
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ), 0))::int AS refreshed_view_count
  FROM public.news_articles
  WHERE status = 'published'
)
UPDATE public.news_articles AS article
SET view_count = ranked.refreshed_view_count,
    updated_at = now()
FROM ranked
WHERE article.id = ranked.id;
