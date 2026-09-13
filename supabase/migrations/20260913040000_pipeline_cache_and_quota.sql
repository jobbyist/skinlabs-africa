-- Internal machinery for api/product-review-sync.ts's research/analysis/publication
-- pipeline (Firecrawl = researcher, Gemini = analyst + writer, Supabase = memory +
-- orchestration + publication). Both tables are service-role only -- no public or
-- authenticated access -- since they hold nothing a reader needs, only pipeline
-- bookkeeping.

-- Caches Firecrawl scrape/search results per source so a source already fetched
-- recently is reused instead of re-fetched, cutting real Firecrawl API calls (and the
-- Gemini tokens spent reprocessing the same markdown) across daily runs that keep
-- hitting the same handful of listing pages.
CREATE TABLE IF NOT EXISTS public.pipeline_source_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pipeline_source_cache_expires_at
  ON public.pipeline_source_cache(expires_at);

ALTER TABLE public.pipeline_source_cache ENABLE ROW LEVEL SECURITY;
-- No policies, no grants to anon/authenticated -- service_role only by default.
GRANT ALL ON public.pipeline_source_cache TO service_role;

-- Logs every real Firecrawl and Gemini API call the pipeline makes, so it can check
-- its own usage against a configurable daily/per-minute threshold before making the
-- next call rather than discovering a rate limit mid-run.
CREATE TABLE IF NOT EXISTS public.pipeline_api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('firecrawl', 'gemini')),
  called_at timestamptz NOT NULL DEFAULT now(),
  purpose text,
  success boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_pipeline_api_usage_provider_called_at
  ON public.pipeline_api_usage(provider, called_at DESC);

ALTER TABLE public.pipeline_api_usage ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.pipeline_api_usage TO service_role;
