-- Scheduled review price checks (Parallel Search, Nimble fallback) via the review-price-sync edge function.
--  * Every 10 minutes, but the HTTP call is only made when at least one review is due, so an idle
--    system costs nothing. Each run prices up to 4 reviews (one search per review covers all six shops);
--    the 235 reviews are therefore worked through in chunks over the first day, then each review
--    comes due again 25 days after its last check (prices must be re-verified within 30 days).
--  * x-cron-secret is read from Vault at run time and verified in the database; no literal secret here.
--  * Retires the Firecrawl-based retailer discovery/refresh jobs (Firecrawl credits are exhausted-prone and
--    this replaces them for reviews). The Clicks refresh job reads pages directly (no credits) and stays.
--    Re-enable any with the cron.schedule calls in 20261003130000_retailer_price_cron.sql.

SELECT cron.schedule(
  'review-price-sync',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/review-price-sync',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'review_price_sync_cron_secret')),
    body := '{"limit":4,"source":"auto"}'::jsonb,
    timeout_milliseconds := 5000
  )
  WHERE EXISTS (SELECT 1 FROM public.review_price_targets WHERE next_check_at <= now());
  $$
);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('retailer-price-discover-clicks', 'retailer-price-refresh-dischem', 'retailer-price-discover-dischem');
