-- The openhaus-* pg_cron jobs were scheduled with the x-cron-secret embedded
-- as a literal in each job command. Move it into Vault (the pattern the
-- project's other cron jobs already use) so the committed migrations never
-- need to contain it.

-- One-time copy of the existing value out of the live job definition, so it
-- never appears in this file. A no-op wherever no job embeds a literal
-- (e.g. a fresh database replaying the backfilled cron migrations), in which
-- case create the secret by hand:
--   select vault.create_secret('<value>', 'marketplace_cron_secret');
-- It must equal the edge functions' MARKETPLACE_CRON_SECRET.
SELECT vault.create_secret(
  substring(command FROM '"x-cron-secret":"([0-9a-f]+)"'),
  'marketplace_cron_secret',
  'x-cron-secret for the openhaus-* pg_cron jobs; must equal the MARKETPLACE_CRON_SECRET edge function secret'
)
FROM cron.job
WHERE jobname = 'openhaus-fx-sync'
  AND substring(command FROM '"x-cron-secret":"([0-9a-f]+)"') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'marketplace_cron_secret');

-- cron.schedule with an existing job name replaces that job in place.
SELECT cron.schedule(
  'openhaus-fx-sync',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/openhaus-fx-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'marketplace_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'openhaus-picks-rotation',
  '0 22 * * 0',
  $$
  select net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/openhaus-picks-rotation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'marketplace_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
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
