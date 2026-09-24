-- openhaus-price-sync now checks a batch of products per invocation (to stay
-- inside the edge-function wall-clock limit) instead of the whole catalogue.
-- price_checked_at records the last attempt, successful or not, so each run
-- picks up the products checked longest ago; source_last_synced_at still
-- records the last successful price read.
ALTER TABLE public.marketplace_products
  ADD COLUMN IF NOT EXISTS price_checked_at timestamptz;

-- Six runs of 20 products = 120 slots nightly for the 84-product catalogue,
-- 00:00-05:00 UTC (02:00-07:00 SAST). cron.schedule replaces the job in place.
SELECT cron.schedule(
  'openhaus-price-sync',
  '0 0-5 * * *',
  $$
  select net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/openhaus-price-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'marketplace_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
