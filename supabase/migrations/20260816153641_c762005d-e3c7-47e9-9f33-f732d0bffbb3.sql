create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'daily-skinny-sync',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://lxbknnvzkxgmvifksyze.supabase.co/functions/v1/newsroom-sync',
    headers := '{"Content-Type":"application/json","x-cron-secret":"a9c2cc366b9a98f8deb65a06c2262acb4c7219dc61081d81"}'::jsonb,
    body := '{"limit":3}'::jsonb
  );
  $$
);