-- Shelf Showdown (comparison-article) content pipeline: DB-backed generated
-- comparisons, published alongside the static src/data/comparisons-part*.ts
-- catalogue -- same "generated table + static catalogue merged client-side"
-- pattern already used for ai_generated_product_reviews / use-generated-reviews.ts.
--
-- Auth secret follows the same Vault-indirection pattern established for
-- product_review_cron_secret / briefings_cron_secret (2026-09-22): the
-- plaintext value is generated entirely server-side and never appears in
-- this file or in the deployed edge function source.

create table if not exists public.ai_generated_comparisons (
  id text primary key,
  title text not null,
  dek text not null,
  sa_context text not null,
  body_markdown text not null,
  key_takeaways text[] not null default '{}',
  verdicts jsonb not null default '[]'::jsonb,
  faqs jsonb not null default '[]'::jsonb,
  products_compared jsonb not null,
  source_review_ids text[] not null,
  pair_key text not null,
  thumbnail_url text not null,
  thumbnail_alt text not null,
  thumbnail_credit_name text not null default 'SkinLabs',
  thumbnail_credit_url text not null default 'https://skinlabs.co.za',
  reading_time text not null default '6 min read',
  seo_title text not null,
  seo_description text not null,
  generated_by text not null,
  publish_date date not null,
  modified_date date not null,
  created_at timestamptz not null default now(),
  constraint ai_generated_comparisons_pair_key_unique unique (pair_key)
);

alter table public.ai_generated_comparisons enable row level security;

drop policy if exists "Public can view generated comparisons" on public.ai_generated_comparisons;
create policy "Public can view generated comparisons"
on public.ai_generated_comparisons
for select
to anon, authenticated
using (true);

grant select on public.ai_generated_comparisons to anon, authenticated;
grant all on public.ai_generated_comparisons to service_role;

-- Vault secret for shelf-showdown-sync's x-cron-secret auth path (see
-- product_review_cron_secret/briefings_cron_secret precedent). Generated
-- server-side; the plaintext is never returned to or seen by this session.
-- A human must still run `supabase secrets set SHELF_SHOWDOWN_CRON_SECRET=<value>`
-- (retrieve the value via `select decrypted_secret from vault.decrypted_secrets
-- where name = 'shelf_showdown_cron_secret'` in the Supabase SQL editor) before
-- the scheduled pg_cron firing below will authenticate -- the admin-JWT path
-- works immediately in the meantime for a signed-in admin.
select vault.create_secret(
  encode(gen_random_bytes(32), 'hex'),
  'shelf_showdown_cron_secret',
  'x-cron-secret value for the shelf-showdown-sync Edge Function'
) where not exists (select 1 from vault.secrets where name = 'shelf_showdown_cron_secret');

-- Thursdays at 17:00 SAST (UTC+2) = 15:00 UTC.
select
  cron.schedule(
    'shelf-showdown-sync',
    '0 15 * * 4',
    $$
    select net.http_post(
      url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/shelf-showdown-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'shelf_showdown_cron_secret')
      ),
      body := '{}'::jsonb
    );
    $$
  )
where not exists (select 1 from cron.job where jobname = 'shelf-showdown-sync');
