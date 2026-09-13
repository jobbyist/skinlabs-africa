-- Explicit deny-all policies for the two service-role-only pipeline tables, matching
-- the auth_exchange_codes pattern: RLS-enabled-with-no-policy is a default deny that
-- the security advisor still flags as worth an explicit statement of intent.
DROP POLICY IF EXISTS "No client access to pipeline source cache" ON public.pipeline_source_cache;
CREATE POLICY "No client access to pipeline source cache"
  ON public.pipeline_source_cache FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
REVOKE ALL ON public.pipeline_source_cache FROM anon, authenticated;

DROP POLICY IF EXISTS "No client access to pipeline api usage" ON public.pipeline_api_usage;
CREATE POLICY "No client access to pipeline api usage"
  ON public.pipeline_api_usage FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
REVOKE ALL ON public.pipeline_api_usage FROM anon, authenticated;
