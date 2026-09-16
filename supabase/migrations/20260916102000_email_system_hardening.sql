-- Hardening pass on 20260916100000/20260916101000, per the Supabase
-- security advisor run right after they landed — same defence-in-depth
-- reasoning as the existing 20260908160000_dashboard_redesign_hardening.sql:
-- Postgres already refuses to call a RETURNS trigger function outside a
-- trigger context, but the advisor still flags it as reachable via
-- PostgREST's /rest/v1/rpc/<fn> unless explicitly REVOKEd.

REVOKE ALL ON FUNCTION public.enforce_contact_submission_rate_limit() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.subscription_ladder_rank(p_status text)
RETURNS int
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(coalesce(p_status, ''))
    WHEN 'glow_lite' THEN 1
    WHEN 'insider' THEN 2
    WHEN 'active' THEN 2
    WHEN 'premium' THEN 2
    WHEN 'vip' THEN 3
    ELSE 0
  END
$$;
