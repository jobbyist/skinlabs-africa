-- Daily pricing re-check, 03:00 UTC = 05:00 SAST (off-peak, before the fx-sync's 6-hourly cadence and well before daytime traffic).
--
-- Backfilled from the live migration history. The version applied live
-- embedded the x-cron-secret as a literal; this file carries the Vault
-- lookup that 20260924130000_openhaus_cron_secret_to_vault.sql switched the
-- live job to, so the secret never lands in git. The Vault secret
-- `marketplace_cron_secret` must equal the edge functions'
-- MARKETPLACE_CRON_SECRET; until both are set, calls fail closed with 401.
select cron.schedule(
  'openhaus-price-sync',
  '0 3 * * *',
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
