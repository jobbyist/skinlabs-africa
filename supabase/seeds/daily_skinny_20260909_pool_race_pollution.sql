-- Seed applied live on 2026-09-09 via Supabase MCP to project gnkpzijxuciiaamakgzm
-- Slugs:
--   chlorine-pool-skin-barrier-sa-summers
--   comrades-argus-outdoor-sports-skincare
--   joburg-cape-town-pollution-skin-barrier
-- Status published, is_premium false, Unsplash covers + credits, NewsArticle json_ld.
SELECT slug, title, word_count, status FROM news_articles
WHERE slug IN (
  'chlorine-pool-skin-barrier-sa-summers',
  'comrades-argus-outdoor-sports-skincare',
  'joburg-cape-town-pollution-skin-barrier'
);
