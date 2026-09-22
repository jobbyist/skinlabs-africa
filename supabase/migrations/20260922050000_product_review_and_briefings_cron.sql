-- Schedules the product-review-sync and briefings-sync Edge Functions on
-- pg_cron, replacing the two Vercel Cron jobs of the same name (vercel.json's
-- `crons` array, now removed -- see CLAUDE.md's dated entry for why).
--
-- The x-cron-secret header each job sends is looked up live from Supabase
-- Vault (`vault.decrypted_secrets`) at call time, by name only -- the
-- plaintext secret value is never embedded in this file or in the deployed
-- Edge Function source, so it's never committed to this repo. (A prior
-- revision of this migration and the two Edge Functions it targets
-- hardcoded the secret literals directly -- flagged by an automated
-- security reviewer, 2026-09-22, correctly so; both secrets were rotated
-- and moved into Vault as this migration's fix.) The corresponding
-- Vault entries (`product_review_cron_secret`, `briefings_cron_secret`)
-- are created via a one-off `select vault.create_secret(encode(gen_random_
-- bytes(32),'hex'), '<name>', '<description>')` run directly against the
-- project, not part of this migration, since the whole point is that the
-- value itself never appears in any committed file.
--
-- Each Edge Function also needs a matching `PRODUCT_REVIEW_CRON_SECRET` /
-- `BRIEFINGS_CRON_SECRET` Supabase Edge Function secret (a *different*
-- secret store from Vault, read via `Deno.env.get(...)` -- see each
-- function's own header comment) set to the same value, so it can verify
-- the header pg_cron sends. Until a human runs `supabase secrets set
-- PRODUCT_REVIEW_CRON_SECRET=<value>` / `BRIEFINGS_CRON_SECRET=<value>`
-- (retrieve each value by running `select decrypted_secret from
-- vault.decrypted_secrets where name = 'product_review_cron_secret'` --
-- or `'briefings_cron_secret'` -- directly in the Supabase SQL editor,
-- never pasted into a commit, PR or chat transcript), the cron-triggered
-- path 401s -- the same accepted gap already documented for this
-- project's MARKETPLACE_CRON_SECRET-gated jobs (openhaus-fx-sync etc.).
-- Both functions also accept a signed-in admin's JWT as an alternate auth
-- path, which works immediately with no secret-store step at all.
--
-- Schedule matches the retired Vercel cron times: product-review-sync at
-- 07:00 UTC (09:00 SAST) daily, briefings-sync at 04:00 UTC (06:00 SAST) daily.

select
  cron.schedule(
    'product-review-sync',
    '0 7 * * *',
    $$
    select net.http_post(
      url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/product-review-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'product_review_cron_secret')
      ),
      body := '{}'::jsonb
    );
    $$
  );

select
  cron.schedule(
    'briefings-sync',
    '0 4 * * *',
    $$
    select net.http_post(
      url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/briefings-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'briefings_cron_secret')
      ),
      body := '{}'::jsonb
    );
    $$
  );
