-- Widens two CHECK constraints that were silently blocking real telemetry/quota
-- writes for shelf-showdown-sync and product-review-sync's full_review backfill
-- mode, discovered 2026-09-22 while diagnosing why 28 successful backfill Gemini
-- generations left zero rows in pipeline_model_calls for that run. Neither
-- constraint had been extended when those two pipelines were added.
--
-- pipeline_model_calls_pipeline_check only allowed 'product-review-sync' and
-- 'briefings-sync' -- every insert attempt from shelf-showdown-sync or the new
-- product-review-sync-backfill mode was silently failing (caught by the calling
-- code's own try/catch, which exists so telemetry logging never breaks a real
-- pipeline run -- but that same safety net hid this class of bug from ordinary
-- operation).
alter table public.pipeline_model_calls
  drop constraint pipeline_model_calls_pipeline_check;
alter table public.pipeline_model_calls
  add constraint pipeline_model_calls_pipeline_check
  check (pipeline = any (array['product-review-sync', 'briefings-sync', 'product-review-sync-backfill', 'shelf-showdown-sync']));

-- pipeline_api_usage_provider_check had no room for a distinct shelf-showdown-sync
-- provider value, so that pipeline was forced onto the literal 'gemini' string --
-- colliding with product-review-sync's own daily-quota bucket (its first real run
-- had already consumed 17 of product-review-sync's 100/day budget before this was
-- caught; see supabase/functions/shelf-showdown-sync/index.ts's GEMINI_PROVIDER
-- constant for the fix on the application side).
alter table public.pipeline_api_usage
  drop constraint pipeline_api_usage_provider_check;
alter table public.pipeline_api_usage
  add constraint pipeline_api_usage_provider_check
  check (provider = any (array['firecrawl', 'gemini', 'briefings-fc', 'briefings-gemini', 'shelf-showdown-gemini']));

-- Retag shelf-showdown-sync's historical usage rows out of product-review-sync's
-- quota bucket now that a dedicated provider value exists for them.
update public.pipeline_api_usage
set provider = 'shelf-showdown-gemini'
where provider = 'gemini' and purpose = 'shelf-showdown-sync';
