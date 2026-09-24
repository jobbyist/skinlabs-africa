-- Free-first SKYNN AI Formulator — CUTOVER half.
--
-- ⚠️ Apply this ONLY together with (immediately after) the frontend deploy
-- that saves starter analyses through save_starter_analysis(). The previous
-- frontend upserts skincare_recommendations directly and spends credits via
-- claim_starter_analysis(); applying this before that deploy would break
-- saving for everyone still on the old build.

-- 1. Catch up the rolling window for analyses saved by the old frontend
--    between the additive migration and this cutover.
UPDATE public.profiles p
   SET last_free_analysis_at = r.last_at
  FROM (
    SELECT user_id, max(created_at) AS last_at
      FROM public.skincare_recommendations
     WHERE status = 'delivered'
     GROUP BY user_id
  ) r
 WHERE r.user_id = p.user_id
   AND public.formulator_tier(p.user_id) NOT IN ('insider', 'vip')
   AND (p.last_free_analysis_at IS NULL OR p.last_free_analysis_at < r.last_at);

-- 2. Starter results (client_analysis_id / result_payload set) can only be
--    written through save_starter_analysis(). The skincare-ai edge function
--    still inserts its own live-AI rows with the caller's JWT — those never set
--    client_analysis_id or result_payload, so they keep working.
DROP POLICY IF EXISTS "Users can insert their own recommendations" ON public.skincare_recommendations;
CREATE POLICY "Users can insert their own recommendations"
  ON public.skincare_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND client_analysis_id IS NULL
    AND result_payload IS NULL
  );

-- The only client-side UPDATE was the starter upsert, now inside the RPC.
-- Without this, a user could overwrite an old row's result in place and get
-- a "new" saved analysis without spending the allowance.
DROP POLICY IF EXISTS "Users can update their own recommendations" ON public.skincare_recommendations;

-- 3. claim_starter_analysis() becomes a read-only pre-check (same signature
--    and return shape, so a stale tab degrades gracefully). It no longer
--    consumes anything — save_starter_analysis() is the enforcement point.
CREATE OR REPLACE FUNCTION public.claim_starter_analysis(p_variant_key text DEFAULT 'control')
RETURNS TABLE (allowed boolean, source text, remaining_free int)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a record;
BEGIN
  SELECT * INTO a FROM public.get_formulator_allowance(p_variant_key);
  IF a.unlimited THEN
    RETURN QUERY SELECT true, 'membership'::text, NULL::int;
  ELSIF a.free_remaining > 0 THEN
    RETURN QUERY SELECT true, 'free_allowance'::text, a.free_remaining;
  ELSIF a.pass_balance > 0 THEN
    RETURN QUERY SELECT true, 'analysis_pass'::text, 0;
  ELSE
    RETURN QUERY SELECT false, 'none'::text, 0;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_starter_analysis(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_starter_analysis(text) TO authenticated;
