-- Unpublish near-duplicate Daily Skinny briefings from the last 10 days
-- (applied live 2026-09-28 via execute_sql; recorded here for history).
--
-- Found with supabase/functions/_shared/pipelines/briefingSimilarity.ts over
-- every briefing published since 2026-08-01:
--   * "The Pigment Puzzle" was generated three times from the same
--     barbeauty.ca page (Google's srsltid param made each URL look new).
--     The 2026-09-23 original stays; the 09-26 and 09-27 repeats go.
--   * "Decoding Your Face's Hidden History" (09-27) re-wrote the 09-25
--     "Skin on Your Arms" flat-spot briefing nearly word for word.
--
-- Status (not DELETE) so this is reversible: news_articles_public only
-- exposes status = 'published', so these drop out of /briefings, search and
-- the sitemap. vercel.json 301s the three URLs to the kept articles.
UPDATE public.news_articles
SET status = 'duplicate', updated_at = now()
WHERE status = 'published'
  AND slug IN (
    'the-pigment-puzzle-navigating-hyperpigmentation-in-the-south-african-s',
    'the-pigment-puzzle-managing-hyperpigmentation-in-the-south-african-sun',
    'the-daily-skinny-decoding-your-face-s-hidden-history'
  );
