-- PROPOSED, NOT APPLIED. Review, then move into supabase/migrations/ with a real timestamp and apply.
-- Source of truth being changed: the LIVE functions as read on 2026-10-04 (this file is a CREATE OR REPLACE of them with
-- only the changes listed below; every other branch of run_notification_automation is copied unchanged).
--
-- 1. journal_reminder: honour skin_photo_journal_settings.reminder_enabled (it was ignored), drop the dead 'fortnightly'/'biweekly'
--    branches (the column is CHECKed to weekly | monthly), and step "monthly" by a calendar month like the dashboard does
--    (PhotoJournalTab.addInterval uses setMonth(+1), the automation used 30 days).
-- 2. free_analysis_refreshed: audience is "limited tier" (formulator_tier explorer | glow_lite), the same rule that limits the Basic
--    analysis in the app. It used to be status free/explorer only, so Glow Lite members (limited to 1 per 7 days in-app) never got it.
--    The window still comes from pricing_settings.free_analysis_window_days (live 7).
-- 3. notification_guard_ok: new guard 'limited_tier'; 'not_paid' now covers every paid status (it missed 'active' and 'premium');
--    'trial_active' optionally re-checks card state (has_card) and activation (not_activated) at send time, which is what the
--    email guards (_shared/email/guards.ts) already do for the same trial emails.
-- 4. trial_lifecycle: passes those optional checks per template (precharge needs a live subscription, last chance needs none,
--    activation nudge needs "not activated").
-- 5. weekly_recap: "1 routine check-ins" -> "1 routine check-in" (new {{checkins}} variable; template body updated only if unedited).
-- 6. free_analysis_refreshed title uses the product name and no longer says "free" (Glow Lite is paying).

CREATE OR REPLACE FUNCTION public.notification_guard_ok(p_user_id uuid, p_guard jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_today date := (now() AT TIME ZONE 'Africa/Johannesburg')::date;
BEGIN
  IF p_guard IS NULL THEN RETURN true; END IF;
  CASE p_guard->>'type'
    WHEN 'trial_active' THEN
      RETURN EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = p_user_id
                       AND lower(coalesce(p.subscription_status, '')) = 'trial'
                       AND p.trial_ends_at = (p_guard->>'trial_ends_at')::timestamptz)
         AND (NOT (p_guard ? 'has_card') OR public.has_live_payment_subscription(p_user_id) = (p_guard->>'has_card')::boolean)
         AND (NOT (p_guard ? 'not_activated') OR NOT public.is_trial_activated(p_user_id));
    WHEN 'not_paid' THEN
      RETURN NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = p_user_id
                           AND lower(coalesce(p.subscription_status, '')) IN ('active','glow_lite','insider','vip','premium'));
    WHEN 'limited_tier' THEN
      RETURN public.formulator_tier(p_user_id) IN ('explorer', 'glow_lite');
    WHEN 'no_checkin_today' THEN
      RETURN NOT EXISTS (SELECT 1 FROM public.routine_checkins c WHERE c.user_id = p_user_id AND c.checkin_date = v_today);
    WHEN 'same_day' THEN
      RETURN v_today = (p_guard->>'date')::date;
    ELSE RETURN true;
  END CASE;
END $function$;

CREATE OR REPLACE FUNCTION public.run_notification_automation(p_key text, p_now timestamp with time zone DEFAULT now())
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  a public.notification_automations%ROWTYPE;
  v_local timestamp := p_now AT TIME ZONE 'Africa/Johannesburg';
  v_today date := (p_now AT TIME ZONE 'Africa/Johannesburg')::date;
  v_t time := (p_now AT TIME ZONE 'Africa/Johannesburg')::time;
  v_n integer := 0;
  v_window integer;
  c record;
BEGIN
  SELECT * INTO a FROM public.notification_automations WHERE key = p_key;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF p_key = 'routine_reminder' THEN
    FOR c IN
      SELECT p.user_id,
             coalesce(np.routine_reminder_time,
                      CASE WHEN lower(coalesce(p.preferred_routine_time, '')) IN ('evening','night','pm') THEN '19:30'::time
                           ELSE '07:00'::time END) AS at_time
        FROM public.notification_preferences np
        JOIN public.profiles p ON p.user_id = np.user_id
       WHERE np.routine_reminder
         AND EXISTS (SELECT 1 FROM public.routine_steps rs WHERE rs.user_id = p.user_id)
         AND NOT EXISTS (SELECT 1 FROM public.routine_checkins rc WHERE rc.user_id = p.user_id AND rc.checkin_date = v_today)
    LOOP
      IF c.at_time <= v_t AND c.at_time > v_t - interval '15 minutes' THEN
        IF public.enqueue_notification(c.user_id, 'routine_reminder',
             jsonb_build_object('slot', CASE WHEN c.at_time < '12:00' THEN 'morning' ELSE 'evening' END),
             'routine_reminder:' || c.user_id || ':' || v_today, 'automation', '{}'::jsonb, NULL,
             jsonb_build_object('type', 'no_checkin_today'), NULL, p_key) IS NOT NULL THEN
          v_n := v_n + 1;
        END IF;
      END IF;
    END LOOP;

  ELSIF p_key = 'streak_at_risk' THEN
    FOR c IN
      SELECT np.user_id, count(DISTINCT rc.checkin_date) AS days
        FROM public.notification_preferences np
        JOIN public.routine_checkins rc ON rc.user_id = np.user_id
       WHERE np.routine_reminder
         AND rc.checkin_date BETWEEN v_today - 7 AND v_today - 1
       GROUP BY np.user_id
      HAVING bool_or(rc.checkin_date = v_today - 1) AND bool_or(rc.checkin_date = v_today - 2)
    LOOP
      IF NOT EXISTS (SELECT 1 FROM public.routine_checkins x WHERE x.user_id = c.user_id AND x.checkin_date = v_today) THEN
        IF public.enqueue_notification(c.user_id, 'streak_at_risk', jsonb_build_object('days', c.days),
             'streak_at_risk:' || c.user_id || ':' || v_today, 'automation', '{}'::jsonb, NULL,
             jsonb_build_object('type', 'no_checkin_today'), NULL, p_key) IS NOT NULL THEN
          v_n := v_n + 1;
        END IF;
      END IF;
    END LOOP;

  ELSIF p_key = 'daily_briefing' THEN
    FOR c IN
      WITH art AS (
        SELECT na.slug, na.title, coalesce(nullif(na.reading_time, ''), '3 min read') AS reading_time
          FROM public.news_articles na
         WHERE na.status = 'published' AND na.publish_date = v_today
         ORDER BY na.created_at DESC LIMIT 1)
      SELECT np.user_id, art.* FROM public.notification_preferences np CROSS JOIN art WHERE np.briefing
    LOOP
      IF public.enqueue_notification(c.user_id, 'daily_briefing',
           jsonb_build_object('title', c.title, 'slug', c.slug, 'reading_time', c.reading_time),
           'daily_briefing:' || c.user_id || ':' || v_today, 'automation', '{}'::jsonb, NULL,
           jsonb_build_object('type', 'same_day', 'date', v_today), NULL, p_key) IS NOT NULL THEN
        v_n := v_n + 1;
      END IF;
    END LOOP;

  ELSIF p_key = 'skin_weather_alert' THEN
    FOR c IN
      SELECT np.user_id, p.weather_city_key,
             initcap(replace(p.weather_city_key, '-', ' ')) AS city,
             (w.payload->>'uvMax')::numeric AS uv, (w.payload->>'humidity')::numeric AS hum,
             (w.payload->>'tempMax')::numeric AS tmax
        FROM public.notification_preferences np
        JOIN public.profiles p ON p.user_id = np.user_id
        JOIN public.skin_weather_cache w ON w.city_key = p.weather_city_key
       WHERE np.skin_weather AND w.fetched_at > p_now - interval '4 hours'
    LOOP
      DECLARE v_headline text; v_tip text;
      BEGIN
        IF c.uv >= 8 THEN
          v_headline := 'Very high UV today'; v_tip := 'UV peaks around midday. SPF 30+ and reapply every 2 hours outdoors.';
        ELSIF c.uv >= 6 THEN
          v_headline := 'High UV today'; v_tip := 'Wear SPF 30+ and reapply if you''re outside for long.';
        ELSIF c.hum < 30 THEN
          v_headline := 'Dry air today'; v_tip := 'Layer a hydrating serum under your moisturiser and go easy on exfoliants.';
        ELSIF c.hum > 80 AND c.tmax >= 28 THEN
          v_headline := 'Hot and humid today'; v_tip := 'Go lighter: a gel moisturiser and a non-greasy SPF.';
        ELSE
          CONTINUE;
        END IF;
        IF public.enqueue_notification(c.user_id, 'skin_weather_alert',
             jsonb_build_object('headline', v_headline, 'tip', v_tip, 'city', c.city),
             'skin_weather_alert:' || c.user_id || ':' || v_today, 'automation', '{}'::jsonb, NULL,
             jsonb_build_object('type', 'same_day', 'date', v_today), NULL, p_key) IS NOT NULL THEN
          v_n := v_n + 1;
        END IF;
      END;
    END LOOP;

  ELSIF p_key = 'journal_reminder' THEN
    -- CHANGED: reminder_enabled is honoured; frequency is weekly | monthly only (a calendar month, as in the dashboard).
    FOR c IN
      SELECT s.user_id,
             CASE WHEN lower(s.frequency) = 'monthly' THEN interval '1 month' ELSE interval '7 days' END AS step,
             (SELECT max(e.captured_at) FROM public.skin_photo_journal_entries e WHERE e.user_id = s.user_id) AS last_at,
             s.created_at
        FROM public.skin_photo_journal_settings s
        JOIN public.notification_preferences np ON np.user_id = s.user_id
       WHERE np.journal_reminder AND s.reminder_enabled
    LOOP
      IF coalesce(c.last_at, c.created_at) + c.step <= p_now
         AND NOT EXISTS (SELECT 1 FROM public.notification_dispatches d WHERE d.user_id = c.user_id
                           AND d.automation_key = p_key AND d.created_at > p_now - (c.step - interval '1 day')) THEN
        IF public.enqueue_notification(c.user_id, 'journal_reminder', '{}'::jsonb,
             'journal_reminder:' || c.user_id || ':' || v_today, 'automation', '{}'::jsonb, NULL,
             jsonb_build_object('type', 'same_day', 'date', v_today), NULL, p_key) IS NOT NULL THEN
          v_n := v_n + 1;
        END IF;
      END IF;
    END LOOP;

  ELSIF p_key = 'free_analysis_refreshed' THEN
    SELECT coalesce(ps.free_analysis_window_days, 7) INTO v_window
      FROM public.pricing_settings ps WHERE ps.variant_key = 'control';
    v_window := coalesce(v_window, 7);
    -- CHANGED: "limited tier" (explorer | glow_lite) instead of status free/explorer only.
    FOR c IN
      SELECT p.user_id, p.last_free_analysis_at + make_interval(days => v_window) AS unlock_at
        FROM public.profiles p
       WHERE public.formulator_tier(p.user_id) IN ('explorer', 'glow_lite')
         AND p.last_free_analysis_at IS NOT NULL
         AND ((p.last_free_analysis_at + make_interval(days => v_window)) AT TIME ZONE 'Africa/Johannesburg')::date = v_today
    LOOP
      IF public.enqueue_notification(c.user_id, 'free_analysis_refreshed', '{}'::jsonb,
           'free_analysis_refreshed:' || c.user_id || ':' || c.unlock_at, 'automation', '{}'::jsonb,
           greatest(p_now, c.unlock_at), jsonb_build_object('type', 'limited_tier'), NULL, p_key) IS NOT NULL THEN
        v_n := v_n + 1;
      END IF;
    END LOOP;

  ELSIF p_key = 'weekly_recap' THEN
    FOR c IN
      SELECT np.user_id, count(DISTINCT rc.checkin_date) AS n
        FROM public.notification_preferences np
        JOIN public.routine_checkins rc ON rc.user_id = np.user_id
       WHERE np.routine_reminder AND rc.checkin_date BETWEEN v_today - 6 AND v_today
       GROUP BY np.user_id
    LOOP
      IF public.enqueue_notification(c.user_id, 'weekly_recap',
           jsonb_build_object('n', c.n, 'checkins', CASE WHEN c.n = 1 THEN '1 routine check-in' ELSE c.n || ' routine check-ins' END),
           'weekly_recap:' || c.user_id || ':' || v_today, 'automation', '{}'::jsonb, NULL,
           jsonb_build_object('type', 'same_day', 'date', v_today), NULL, p_key) IS NOT NULL THEN
        v_n := v_n + 1;
      END IF;
    END LOOP;

  ELSIF p_key = 'trial_lifecycle' THEN
    FOR c IN SELECT * FROM public.trial_lifecycle_email_plan(v_today) LOOP
      IF public.enqueue_notification(c.user_id, c.template_id,
           jsonb_build_object('plan', public.notification_plan_label(c.trial_plan),
                              'ends_on', to_char(c.trial_ends_at AT TIME ZONE 'Africa/Johannesburg', 'FMDy FMDD Mon')),
           'push:' || c.idempotency_key, 'automation', '{}'::jsonb, NULL,
           -- CHANGED: the same send-time re-checks the email guards make (card state, activation).
           CASE c.template_id
             WHEN 'trial_week_left' THEN
               jsonb_build_object('type', 'trial_active', 'trial_ends_at', c.trial_ends_at)
             WHEN 'trial_precharge_reminder' THEN
               jsonb_build_object('type', 'trial_active', 'trial_ends_at', c.trial_ends_at, 'has_card', true)
             WHEN 'trial_last_chance' THEN
               jsonb_build_object('type', 'trial_active', 'trial_ends_at', c.trial_ends_at, 'has_card', false)
             WHEN 'trial_activation_nudge' THEN
               jsonb_build_object('type', 'trial_active', 'trial_ends_at', c.trial_ends_at, 'not_activated', true)
             ELSE jsonb_build_object('type', 'not_paid') END,
           NULL, p_key) IS NOT NULL THEN
        v_n := v_n + 1;
      END IF;
    END LOOP;

  ELSIF NOT a.system AND a.template_key IS NOT NULL THEN
    FOR c IN SELECT u.user_id FROM public.notification_audience_user_ids(a.audience) u LOOP
      IF public.enqueue_notification(c.user_id, a.template_key, '{}'::jsonb,
           p_key || ':' || c.user_id || ':' || v_today, 'automation', '{}'::jsonb, NULL,
           jsonb_build_object('type', 'same_day', 'date', v_today), NULL, p_key) IS NOT NULL THEN
        v_n := v_n + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN v_n;
END $function$;

-- Wording (only while the live text is still the seeded text, so an admin's edit is never overwritten).
UPDATE public.notification_templates
   SET title = 'Your Basic AI Skin Analysis is ready', updated_at = now()
 WHERE key = 'free_analysis_refreshed' AND title = 'Your free skin analysis is ready to use';
UPDATE public.notification_templates
   SET body = '{{checkins}} this week. Set yourself up for the next one.', updated_at = now()
 WHERE key = 'weekly_recap' AND body = '{{n}} routine check-ins this week. Set yourself up for the next one.';
