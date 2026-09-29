-- Onboarding overhaul 09: trial lifecycle emails.
--
-- One daily enqueue function (following enqueue_trial_expiring_events()) for
-- the date-based trial emails. trial_started (day 0) and trial_ended stay on
-- notify_subscription_change(): they're events, not dates.
--
--   day 2 after start, not activated  trial_activation_nudge   MARKETING (consent)
--   T-7                               trial_week_left          TRIAL (transactional)
--   T-3, live auto-renew              trial_precharge_reminder TRIAL (transactional)
--   T-3, no payment method            trial_last_chance        TRIAL (transactional)
--   trial ended 5 days ago, still free trial_winback           MARKETING (consent), once
--
-- Days are SAST calendar days (the promo trial ends 2026-10-31T22:00Z, i.e.
-- 1 November SAST). Idempotency key = template + user + trial_ends_at, so each
-- email goes at most once per trial. trial_lifecycle_email_plan() is the ONLY
-- selection logic: the dry run returns it, the enqueue function loops it.
--
-- The cron job is deliberately NOT scheduled here. Review a dry run first:
--   SELECT * FROM public.trial_lifecycle_email_plan();              -- today
--   SELECT * FROM public.trial_lifecycle_email_plan('2026-10-25');  -- any SAST day
-- then enable it:
--   SELECT cron.schedule('trial-lifecycle-emails-daily', '5 4 * * *',
--     $$SELECT public.enqueue_trial_lifecycle_emails()$$);          -- 06:05 SAST

-- Activation, mirroring isActivated() in src/lib/journey.ts: a second saved
-- analysis, a saved routine, 3 routine check-ins or 3 saved briefings.
CREATE OR REPLACE FUNCTION public.is_trial_activated(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (SELECT count(*) FROM public.skincare_recommendations r WHERE r.user_id = _user_id AND r.status = 'delivered') >= 2
      OR EXISTS (SELECT 1 FROM public.routine_steps s WHERE s.user_id = _user_id)
      OR (SELECT count(*) FROM public.routine_checkins c WHERE c.user_id = _user_id) >= 3
      OR (SELECT count(*) FROM public.news_article_engagement e WHERE e.user_id = _user_id AND e.kind = 'save') >= 3;
$$;
REVOKE ALL ON FUNCTION public.is_trial_activated(uuid) FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION public.is_trial_activated(uuid) IS
  'Trial activation (journey.ts isActivated): 2+ saved analyses, a routine step, 3+ check-ins or 3+ saved briefings.';

CREATE OR REPLACE FUNCTION public.trial_lifecycle_email_plan(
  p_today date DEFAULT (now() AT TIME ZONE 'Africa/Johannesburg')::date
)
RETURNS TABLE (
  user_id uuid,
  email text,
  template_id text,
  category text,
  transactional boolean,
  trial_plan text,
  trial_ends_at timestamptz,
  idempotency_key text,
  payload jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH base AS (
    SELECT p.user_id,
           u.email,
           lower(coalesce(p.subscription_status, '')) AS status,
           p.trial_plan,
           p.trial_ends_at,
           (p.trial_ends_at AT TIME ZONE 'Africa/Johannesburg')::date AS ends_day,
           (coalesce(p.trial_started_at, p.trial_used_at) AT TIME ZONE 'Africa/Johannesburg')::date AS started_day,
           p.trial_used_at,
           coalesce(p.marketing_consent, false) AS consent,
           p.marketing_unsubscribe_token,
           coalesce(p.founding_member, false) AS founding,
           public.has_live_payment_subscription(p.user_id) AS has_card
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.user_id
     WHERE u.email IS NOT NULL
       AND coalesce(p.account_status, 'active') = 'active'
       AND p.trial_ends_at IS NOT NULL
  ),
  live_sub AS (
    SELECT DISTINCT ON (s.user_id) s.user_id, s.amount_zar, s.amount_charged, s.currency, s.gateway
      FROM public.payment_subscriptions s
     WHERE s.status IN ('trialing', 'active', 'past_due')
     ORDER BY s.user_id, s.created_at DESC
  ),
  picked AS (
    -- Day 2 activation nudge (marketing): still trialling, not activated yet,
    -- and not already inside the T-3 window.
    SELECT b.*, 'trial_activation_nudge'::text AS template_id
      FROM base b
     WHERE b.status = 'trial' AND b.trial_plan IS NOT NULL
       AND b.started_day = p_today - 2
       AND b.ends_day - p_today > 3
       AND b.consent AND b.marketing_unsubscribe_token IS NOT NULL
       AND NOT public.is_trial_activated(b.user_id)
    UNION ALL
    -- T-7 (skipped for a trial that only started yesterday or today).
    SELECT b.*, 'trial_week_left'
      FROM base b
     WHERE b.status = 'trial' AND b.trial_plan IS NOT NULL
       AND b.ends_day - p_today = 7
       AND b.started_day < p_today - 1
    UNION ALL
    SELECT b.*, CASE WHEN b.has_card THEN 'trial_precharge_reminder' ELSE 'trial_last_chance' END
      FROM base b
     WHERE b.status = 'trial' AND b.trial_plan IS NOT NULL
       AND b.ends_day - p_today = 3
    UNION ALL
    -- Win-back (marketing), once: trial ended 5 days ago and still on the free tier.
    SELECT b.*, 'trial_winback'
      FROM base b
     WHERE b.status IN ('', 'free', 'explorer')
       AND b.trial_used_at IS NOT NULL
       AND b.ends_day = p_today - 5
       AND NOT b.has_card AND NOT b.founding
       AND b.consent AND b.marketing_unsubscribe_token IS NOT NULL
  )
  SELECT k.user_id,
         k.email,
         k.template_id,
         CASE WHEN k.template_id IN ('trial_activation_nudge', 'trial_winback') THEN 'MARKETING' ELSE 'TRIAL' END,
         k.template_id NOT IN ('trial_activation_nudge', 'trial_winback'),
         k.trial_plan,
         k.trial_ends_at,
         k.template_id || ':' || k.user_id::text || ':' || k.trial_ends_at::text,
         jsonb_strip_nulls(jsonb_build_object(
           'plan', coalesce(k.trial_plan, 'insider'),
           'trial_ends_at', k.trial_ends_at,
           'has_payment_method', k.has_card,
           'amount_zar', ls.amount_zar,
           'amount_charged', ls.amount_charged,
           'currency', ls.currency,
           'gateway', ls.gateway,
           'unsubscribe_url', CASE WHEN k.template_id IN ('trial_activation_nudge', 'trial_winback')
             THEN 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/email-unsubscribe?token=' || k.marketing_unsubscribe_token::text
           END
         ))
    FROM picked k
    LEFT JOIN live_sub ls ON ls.user_id = k.user_id AND k.template_id = 'trial_precharge_reminder';
$$;
REVOKE ALL ON FUNCTION public.trial_lifecycle_email_plan(date) FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION public.trial_lifecycle_email_plan(date) IS
  'DRY RUN: who would get which trial lifecycle email on a SAST day. Enqueues nothing. Service role / SQL editor only.';

CREATE OR REPLACE FUNCTION public.enqueue_trial_lifecycle_emails()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer := 0;
  v_rec record;
BEGIN
  FOR v_rec IN SELECT * FROM public.trial_lifecycle_email_plan() LOOP
    PERFORM public.enqueue_email(
      upper(v_rec.template_id),
      v_rec.idempotency_key,
      v_rec.template_id,
      v_rec.category,
      v_rec.user_id,
      v_rec.email,
      v_rec.payload,
      'cron:enqueue_trial_lifecycle_emails',
      v_rec.transactional
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_trial_lifecycle_emails() FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION public.enqueue_trial_lifecycle_emails() IS
  'Daily trial lifecycle emails (onboarding overhaul 09); selection = trial_lifecycle_email_plan(). Not scheduled until reviewed.';
