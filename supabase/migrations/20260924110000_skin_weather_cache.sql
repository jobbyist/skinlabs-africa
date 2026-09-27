-- Per-city cache for the dashboard's "Today's skin weather" card
-- (supabase/functions/skin-weather). One row per supported SA city; the edge
-- function refreshes a row at most every ~45 minutes, so every visitor in a
-- city shares a single upstream weather call.
--
-- Holds no personal data: city-level weather only. Service-role only — RLS is
-- enabled with no anon/authenticated policies (same lockdown pattern as
-- assessment_prompt_versions); the browser only ever reads it through the
-- edge function.
CREATE TABLE IF NOT EXISTS public.skin_weather_cache (
  city_key text PRIMARY KEY
    CHECK (city_key IN ('johannesburg', 'pretoria', 'cape-town', 'durban', 'gqeberha',
                        'bloemfontein', 'east-london', 'polokwane', 'mbombela', 'kimberley')),
  provider text NOT NULL,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.skin_weather_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.skin_weather_cache FROM anon, authenticated;

COMMENT ON TABLE public.skin_weather_cache IS
  'City-level weather cache for the skin-weather edge function. Service-role only; no personal data.';
