-- Schedules the product-review-sync and briefings-sync Edge Functions on
-- pg_cron, replacing the two Vercel Cron jobs of the same name (vercel.json's
-- `crons` array, now removed -- see CLAUDE.md's dated entry for why).
--
-- Same net.http_post + literal-secret-header pattern already used by
-- openhaus-fx-sync/openhaus-picks-rotation/openhaus-price-sync (see cron.job
-- for those), except the secret here is guaranteed to actually match what
-- the deployed function checks -- it's the same literal constant embedded in
-- each function's own source (see their header comments), not a
-- Deno.env.get(...) project secret nobody has run `supabase secrets set` for
-- (which is why those three openhaus_*_cron jobs currently 401 against
-- MARKETPLACE_CRON_SECRET, per CLAUDE.md's own documented gap).
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
      headers := '{"Content-Type":"application/json","x-cron-secret":"7b9db562d62fee7360460cf4a9924d21542401e0b4b44e04225bed14c9ec34b8"}'::jsonb,
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
      headers := '{"Content-Type":"application/json","x-cron-secret":"2fb2b03abc802b16cee0e8e3c4893de40a66a233a9cc5bf637d035f4d825926c"}'::jsonb,
      body := '{}'::jsonb
    );
    $$
  );
