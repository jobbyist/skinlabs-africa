-- Product-review pipeline scale-up (2026-10-09): 5-10 reviews/day, 60% local / 40% "Import".
--
-- 1. Discovery now finds product pages on the trusted SA retailers with Parallel Search / Nimble, so a
--    review can be sourced from a retailer page: add 'retailer' to ai_generated_product_reviews.source_type.
-- 2. Parallel / Nimble searches are counted against their own daily budgets in pipeline_api_usage.
-- 3. One invocation publishes at most 3 reviews, so cron fires five times a morning (05, 07, 09, 11, 13 UTC)
--    until the daily cap (8 by default, env DAILY_REVIEW_CAP, clamped 5-10) is met. A run that finds the cap met
--    returns immediately without any search or model call.
--
-- Written without DROP statements where possible (the Supabase SQL tool hangs on them); the two CHECK
-- constraints are replaced with ALTER ... ADD CONSTRAINT after dropping the old ones in the same statement.
alter table public.ai_generated_product_reviews
  drop constraint if exists ai_generated_product_reviews_source_type_check,
  add constraint ai_generated_product_reviews_source_type_check
    check (source_type in ('faithful_to_nature', 'brand_direct', 'sponsored', 'openhaus_marketplace', 'retailer'));

alter table public.pipeline_api_usage
  drop constraint if exists pipeline_api_usage_provider_check,
  add constraint pipeline_api_usage_provider_check
    check (provider = any (array['firecrawl', 'gemini', 'briefings-fc', 'briefings-gemini', 'shelf-showdown-gemini', 'parallel-search', 'nimble-search']));

select
  cron.schedule(
    'product-review-sync',
    '0 5,7,9,11,13 * * *',
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
