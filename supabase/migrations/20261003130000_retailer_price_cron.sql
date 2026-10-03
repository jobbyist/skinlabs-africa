-- Schedules for retailer-price-sync. One job per retailer and mode, so each retailer's rules
-- are respected and runs never overlap (Firecrawl's concurrency limit answers 429 otherwise):
--   * Clicks: only inside its robots.txt visit window (04:00-08:45 UTC), 10 s apart per page
--     (the function enforces the delay; batches of 6 stay well inside one run).
--   * Dis-Chem / Takealot: early-morning UTC refreshes, daytime discovery.
-- Spend is capped by the function's daily Firecrawl budget (default 250 credits). To pause a
-- job: SELECT cron.unschedule('<name>').
-- x-cron-secret is looked up live from Vault by name (never a literal); the function verifies it
-- in the database (verify_price_sync_secret), so no Edge secret has to be set by hand.

SELECT cron.schedule(
  'retailer-price-refresh-clicks',
  '*/15 4-7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/retailer-price-sync',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'retailer_price_sync_cron_secret')),
    body := '{"retailer":"clicks","mode":"refresh","limit":6}'::jsonb,
    timeout_milliseconds := 5000
  );
  $$
);

SELECT cron.schedule(
  'retailer-price-discover-clicks',
  '10,40 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/retailer-price-sync',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'retailer_price_sync_cron_secret')),
    body := '{"retailer":"clicks","mode":"discover","limit":4}'::jsonb,
    timeout_milliseconds := 5000
  );
  $$
);

SELECT cron.schedule(
  'retailer-price-refresh-dischem',
  '0,20,40 2-3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/retailer-price-sync',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'retailer_price_sync_cron_secret')),
    body := '{"retailer":"dis-chem","mode":"refresh","limit":8}'::jsonb,
    timeout_milliseconds := 5000
  );
  $$
);

SELECT cron.schedule(
  'retailer-price-refresh-takealot',
  '10,30,50 2-3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/retailer-price-sync',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'retailer_price_sync_cron_secret')),
    body := '{"retailer":"takealot","mode":"refresh","limit":8}'::jsonb,
    timeout_milliseconds := 5000
  );
  $$
);

SELECT cron.schedule(
  'retailer-price-discover-dischem',
  '30 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/retailer-price-sync',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'retailer_price_sync_cron_secret')),
    body := '{"retailer":"dis-chem","mode":"discover","limit":8}'::jsonb,
    timeout_milliseconds := 5000
  );
  $$
);

SELECT cron.schedule(
  'retailer-price-discover-takealot',
  '30 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/retailer-price-sync',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'retailer_price_sync_cron_secret')),
    body := '{"retailer":"takealot","mode":"discover","limit":8}'::jsonb,
    timeout_milliseconds := 5000
  );
  $$
);
