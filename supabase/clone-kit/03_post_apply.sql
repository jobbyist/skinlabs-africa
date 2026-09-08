-- Run against the TARGET project after migrations + drift patch.
-- Replace <TARGET_REF> and <CRON_SECRET> before running.

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists pg_trgm;

-- Storage bucket used by the SKYNN AI photo step (private).
insert into storage.buckets (id, name, public)
values ('skin-analysis-photos', 'skin-analysis-photos', false)
on conflict (id) do nothing;

-- Daily Skinny: 04:00 UTC = 06:00 SAST, capped at 2 briefings per run.
select cron.schedule(
  'daily-skinny-sync',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://<TARGET_REF>.supabase.co/functions/v1/newsroom-sync',
    headers := '{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
    body := '{"limit":2}'::jsonb
  );
  $$
);

-- Hourly trial expiry sweep.
select cron.schedule('expire-free-trials', '7 * * * *', $$SELECT public.expire_finished_trials();$$);
