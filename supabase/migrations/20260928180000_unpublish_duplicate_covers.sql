-- Unpublish the newer briefing when two published rows share the same cover image.
-- Applied live 2026-09-28 via apply_migration; recorded here for history.
-- Keeps the earliest publish_date per cover_image_url; marks the rest status='duplicate'.

WITH ranked AS (
  SELECT id,
         cover_image_url,
         ROW_NUMBER() OVER (PARTITION BY cover_image_url ORDER BY publish_date ASC, created_at ASC) AS rn
  FROM public.news_articles
  WHERE status = 'published'
    AND cover_image_url IS NOT NULL
),
losers AS (
  SELECT id FROM ranked WHERE rn > 1
)
UPDATE public.news_articles n
SET status = 'duplicate', updated_at = now()
FROM losers l
WHERE n.id = l.id;
