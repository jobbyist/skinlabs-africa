-- Onboarding overhaul 00 — baseline conversion funnel (measure before changing behaviour).
--
-- public.conversion_funnel_daily: one row per SAST calendar day (last 365 days)
-- with COUNTS ONLY — no user ids, emails or any other PII ever leave the function.
--
-- Why a SECURITY DEFINER function behind a security_invoker view: sign-ups come
-- from auth.users, which the `authenticated` role (admins included) cannot read.
-- The function runs as its owner so it can count those rows, and it returns
-- nothing unless the caller holds the 'admin' role via has_role(). The view is
-- security_invoker so the caller's own identity (auth.uid()) is what the gate
-- sees. anon has no privilege on either object; a signed-in non-admin gets zero
-- rows.
--
-- Column definitions:
--   signups                  auth.users created that day
--   starter_analyses_saved   delivered skincare_recommendations with a
--                            result_payload (only save_starter_analysis() /
--                            the pre-cutover starter upsert write that column;
--                            live-AI rows from skincare-ai never set it)
--   trials_started           profiles.trial_used_at on that day
--   live_subscriptions_created payment_subscriptions created that day that are
--                            currently live (trialing / active / past_due)
--   paid_subscriptions_started profiles whose subscription_started_at is that
--                            day and whose subscription_status is currently in
--                            PAID_SUBSCRIPTION_STATUSES (src/lib/entitlements.ts
--                            — a unit test pins the two lists together)

CREATE OR REPLACE FUNCTION public.conversion_funnel_daily_rows()
RETURNS TABLE (
  day date,
  signups bigint,
  starter_analyses_saved bigint,
  trials_started bigint,
  live_subscriptions_created bigint,
  paid_subscriptions_started bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_from date := (now() AT TIME ZONE 'Africa/Johannesburg')::date - 364;
  v_to   date := (now() AT TIME ZONE 'Africa/Johannesburg')::date;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH days AS (
    SELECT d::date AS day FROM generate_series(v_from, v_to, interval '1 day') AS d
  ),
  s AS (
    SELECT (u.created_at AT TIME ZONE 'Africa/Johannesburg')::date AS day, count(*) AS n
      FROM auth.users u
     WHERE u.created_at >= (v_from::timestamp AT TIME ZONE 'Africa/Johannesburg')
     GROUP BY 1
  ),
  a AS (
    SELECT (r.created_at AT TIME ZONE 'Africa/Johannesburg')::date AS day, count(*) AS n
      FROM public.skincare_recommendations r
     WHERE r.status = 'delivered'
       AND r.result_payload IS NOT NULL
       AND r.created_at >= (v_from::timestamp AT TIME ZONE 'Africa/Johannesburg')
     GROUP BY 1
  ),
  t AS (
    SELECT (p.trial_used_at AT TIME ZONE 'Africa/Johannesburg')::date AS day, count(*) AS n
      FROM public.profiles p
     WHERE p.trial_used_at >= (v_from::timestamp AT TIME ZONE 'Africa/Johannesburg')
     GROUP BY 1
  ),
  l AS (
    SELECT (ps.created_at AT TIME ZONE 'Africa/Johannesburg')::date AS day, count(*) AS n
      FROM public.payment_subscriptions ps
     WHERE ps.status IN ('trialing', 'active', 'past_due')
       AND ps.created_at >= (v_from::timestamp AT TIME ZONE 'Africa/Johannesburg')
     GROUP BY 1
  ),
  pd AS (
    SELECT (p.subscription_started_at AT TIME ZONE 'Africa/Johannesburg')::date AS day, count(*) AS n
      FROM public.profiles p
     WHERE lower(coalesce(p.subscription_status, '')) IN ('active', 'glow_lite', 'insider', 'vip', 'premium')
       AND p.subscription_started_at >= (v_from::timestamp AT TIME ZONE 'Africa/Johannesburg')
     GROUP BY 1
  )
  SELECT days.day,
         coalesce(s.n, 0),
         coalesce(a.n, 0),
         coalesce(t.n, 0),
         coalesce(l.n, 0),
         coalesce(pd.n, 0)
    FROM days
    LEFT JOIN s  ON s.day  = days.day
    LEFT JOIN a  ON a.day  = days.day
    LEFT JOIN t  ON t.day  = days.day
    LEFT JOIN l  ON l.day  = days.day
    LEFT JOIN pd ON pd.day = days.day
   ORDER BY days.day DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.conversion_funnel_daily_rows() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.conversion_funnel_daily_rows() TO authenticated;

COMMENT ON FUNCTION public.conversion_funnel_daily_rows() IS
  'Admin-only daily conversion counts (no PII). Returns zero rows unless has_role(auth.uid(), ''admin''). Read through the conversion_funnel_daily view.';

DROP VIEW IF EXISTS public.conversion_funnel_daily;
CREATE VIEW public.conversion_funnel_daily
  WITH (security_invoker = true) AS
  SELECT * FROM public.conversion_funnel_daily_rows();

REVOKE ALL ON public.conversion_funnel_daily FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.conversion_funnel_daily TO authenticated;

COMMENT ON VIEW public.conversion_funnel_daily IS
  'Admin-only (gated inside conversion_funnel_daily_rows by has_role admin): per-SAST-day sign-ups, saved starter analyses, trials started, live subscriptions created and paid subscriptions started. Counts only. Last 365 days, newest first.';
