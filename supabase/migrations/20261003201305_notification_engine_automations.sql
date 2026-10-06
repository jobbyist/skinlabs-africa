INSERT INTO public.notification_templates
  (key, name, description, category, inbox_category, title, body, inbox_title, inbox_body, url, channels, bypass_caps, priority, system)
VALUES
  ('trial_week_left', 'Trial: a week left', 'Lifecycle T-7. Mirrors the trial_week_left email.', 'account_update', 'billing',
   'A week left on your {{plan}} trial', 'Your trial ends {{ends_on}}. Here''s what to try before then.', NULL, NULL,
   '/dashboard', ARRAY['inbox','push'], false, 20, true),
  ('trial_precharge_reminder', 'Trial: card will be charged', 'Lifecycle T-3 with a card on file. Billing notice, bypasses caps.', 'account_update', 'billing',
   'Your {{plan}} membership starts {{ends_on}}', 'Your trial ends then and your saved card is charged. Manage it anytime in Billing.', NULL, NULL,
   '/dashboard?tab=billing', ARRAY['inbox','push'], true, 10, true),
  ('trial_last_chance', 'Trial: 3 days left (no card)', 'Lifecycle T-3 without a card.', 'account_update', 'billing',
   '3 days left on your {{plan}} trial', 'Keep your routine, reports and briefings: add a payment method before {{ends_on}}.', NULL, NULL,
   '/dashboard?keep=1', ARRAY['inbox','push'], true, 10, true),
  ('trial_activation_nudge', 'Trial: activation nudge', 'Day 2 of a trial that has not activated. Marketing: needs promotional opt-in.', 'promotional', 'tips',
   'Get more from your trial', 'Two minutes: save your routine and SkinLabs® tracks your progress every day.', NULL, NULL,
   '/dashboard', ARRAY['inbox','push'], false, 40, true),
  ('trial_winback', 'Trial: win-back', '5 days after a trial ended without a card. Marketing: needs promotional opt-in.', 'promotional', 'tips',
   'Your skin profile is still here', 'Pick up where you left off: your analysis and routine are saved.', NULL, NULL,
   '/pricing', ARRAY['inbox','push'], false, 60, true),
  ('trial_ended', 'Trial ended', 'Event: trial → free. Push only (the inbox already gets "Membership updated").', 'account_update', 'billing',
   'Your {{plan}} trial has ended', 'Keep your membership to hold on to your routine and full reports.', NULL, NULL,
   '/dashboard?keep=1', ARRAY['push'], true, 10, true),
  ('membership_activated', 'Membership activated', 'Event: became a paying member. Push only.', 'account_update', 'billing',
   'Welcome to {{plan}}', 'Your membership is active. Everything is unlocked in your dashboard.', NULL, NULL,
   '/dashboard', ARRAY['push'], true, 10, true),
  ('report_ready_advanced', 'Advanced report ready', 'Event: Advanced Dermatology Report released. Lock-screen copy is deliberately generic.', 'report_ready', 'analysis',
   'Your SkinLabs® report is ready', 'Tap to read it securely in the app.', 'Your Advanced Dermatology Report is ready',
   'Reference {{reference}}. Open My Skin › Analysis to read it.', '/dashboard?tab=analysis', ARRAY['inbox','push'], true, 10, true),
  ('routine_reminder', 'Routine reminder', 'Daily at the member''s reminder time, only if no check-in yet today.', 'routine_reminder', 'routine',
   'Time for your {{slot}} routine', 'Tap to check in. It takes under a minute.', NULL, NULL,
   '/dashboard?tab=routine', ARRAY['push'], false, 30, true),
  ('streak_at_risk', 'Streak at risk', '19:00, members with recent check-ins but none today.', 'routine_reminder', 'routine',
   'Keep your routine going', 'You''ve checked in {{days}} of the last 7 days. Tonight counts too.', NULL, NULL,
   '/dashboard?tab=routine', ARRAY['push'], false, 40, true),
  ('daily_briefing', 'Daily briefing', 'Today''s newest published briefing.', 'briefing', 'briefing',
   '{{title}}', 'Today''s SkinLabs® briefing · {{reading_time}}', NULL, NULL,
   '/briefings/{{slug}}', ARRAY['push'], false, 50, true),
  ('skin_weather_alert', 'Skin Weather alert', 'Only on days with high UV, very dry or hot-and-humid conditions in the member''s city.', 'skin_weather', 'weather',
   '{{headline}} in {{city}}', '{{tip}}', NULL, NULL,
   '/dashboard', ARRAY['push'], false, 30, true),
  ('journal_reminder', 'Photo journal reminder', 'When a progress photo is due for the member''s chosen frequency.', 'journal_reminder', 'journal',
   'Time for a progress photo', 'Same light, same angle. It takes 30 seconds and shows you what''s working.', NULL, NULL,
   '/dashboard?tab=journey', ARRAY['push'], false, 50, true),
  ('free_analysis_refreshed', 'Free analysis unlocked again', 'Free members: the day the free analysis window resets.', 'service', 'analysis',
   'Your free skin analysis is ready to use', 'A fresh check-in shows how your skin has changed since last time.', NULL, NULL,
   '/skynn-ai', ARRAY['inbox','push'], false, 50, true),
  ('weekly_recap', 'Weekly routine recap', 'Sunday evening recap for members who checked in last week.', 'routine_reminder', 'routine',
   'Your week in skin', '{{n}} routine check-ins this week. Set yourself up for the next one.', NULL, NULL,
   '/dashboard?tab=routine', ARRAY['push'], false, 60, true),
  ('podcast_episode_announce', 'New podcast episode', 'Sent by an admin from the console when an episode goes live.', 'podcast_episode', 'podcast',
   'New episode: {{title}}', 'The Skin Deep Podcast. Listen now or save it for offline.', NULL, NULL,
   '/podcast/{{slug}}', ARRAY['inbox','push'], false, 50, true),
  ('test_push', 'Test notification', 'Member/admin self-test. Push only, bypasses caps and quiet hours.', 'service', 'system',
   'SkinLabs® notifications are on', 'This is a test notification. You''re all set.', NULL, NULL,
   '/dashboard?tab=app', ARRAY['push'], true, 0, true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.notification_automations
  (key, name, description, trigger_kind, event_key, frequency, send_time, weekday, month_day, template_key, system, enabled)
VALUES
  ('inbox_mirror_push', 'Push existing inbox notices', 'Also push the legacy create_notification() inbox notices (credits, analysis). Off: these happen while the member is in the app.', 'event', 'create_notification', NULL, NULL, NULL, NULL, NULL, true, false),
  ('report_ready_advanced', 'Advanced report ready', 'When an Advanced Dermatology Report is released.', 'event', 'advanced_assessment_reports.released', NULL, NULL, NULL, NULL, 'report_ready_advanced', true, true),
  ('trial_ended', 'Trial ended', 'When a trial falls back to free.', 'event', 'profiles.trial_to_free', NULL, NULL, NULL, NULL, 'trial_ended', true, true),
  ('membership_activated', 'Membership activated', 'When a member starts paying.', 'event', 'profiles.became_paid', NULL, NULL, NULL, NULL, 'membership_activated', true, true),
  ('trial_lifecycle', 'Trial lifecycle (T-7 / T-3 / nudges)', 'Push twins of the trial lifecycle emails, same selection (trial_lifecycle_email_plan).', 'lifecycle', NULL, 'daily', '08:00', NULL, NULL, NULL, true, true),
  ('routine_reminder', 'Routine reminder', 'At each member''s reminder time if they haven''t checked in today.', 'schedule', NULL, 'per_member_time', NULL, NULL, NULL, 'routine_reminder', true, true),
  ('streak_at_risk', 'Streak at risk', 'Evening nudge after recent check-ins.', 'schedule', NULL, 'daily', '19:00', NULL, NULL, 'streak_at_risk', true, true),
  ('daily_briefing', 'Daily briefing', 'Newest briefing published today.', 'schedule', NULL, 'daily', '07:30', NULL, NULL, 'daily_briefing', true, true),
  ('skin_weather_alert', 'Skin Weather alert', 'High UV / dry / hot-humid days in the member''s city.', 'schedule', NULL, 'daily', '07:05', NULL, NULL, 'skin_weather_alert', true, true),
  ('journal_reminder', 'Photo journal reminder', 'Progress photo due.', 'schedule', NULL, 'daily', '18:00', NULL, NULL, 'journal_reminder', true, true),
  ('free_analysis_refreshed', 'Free analysis unlocked', 'Free members on the day their free analysis unlocks.', 'schedule', NULL, 'daily', '09:00', NULL, NULL, 'free_analysis_refreshed', true, true),
  ('weekly_recap', 'Weekly recap', 'Sunday evening routine recap.', 'schedule', NULL, 'weekly', '18:30', 7, NULL, 'weekly_recap', true, true)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.notification_audience_user_ids(p_audience jsonb)
RETURNS TABLE (user_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH a AS (SELECT coalesce(p_audience, '{}'::jsonb) AS j)
  SELECT p.user_id
    FROM public.profiles p, a
   WHERE coalesce(p.account_status, 'active') = 'active'
     AND (NOT (a.j ? 'tiers') OR jsonb_array_length(a.j->'tiers') = 0 OR
          (CASE WHEN lower(coalesce(p.subscription_status, '')) IN ('', 'free', 'explorer') THEN 'free'
                ELSE lower(p.subscription_status) END) IN (SELECT jsonb_array_elements_text(a.j->'tiers')))
     AND (NOT (a.j ? 'user_ids') OR p.user_id::text IN (SELECT jsonb_array_elements_text(a.j->'user_ids')))
     AND (NOT (a.j ? 'push_enabled') OR
          EXISTS (SELECT 1 FROM public.push_subscriptions s WHERE s.user_id = p.user_id AND s.is_active) = (a.j->>'push_enabled')::boolean)
     AND (NOT (a.j ? 'installed') OR (p.app_installed_at IS NOT NULL) = (a.j->>'installed')::boolean)
     AND (NOT (a.j ? 'platforms') OR jsonb_array_length(a.j->'platforms') = 0 OR
          EXISTS (SELECT 1 FROM public.push_subscriptions s WHERE s.user_id = p.user_id AND s.is_active
                    AND s.platform IN (SELECT jsonb_array_elements_text(a.j->'platforms'))))
     AND (NOT (a.j ? 'cities') OR jsonb_array_length(a.j->'cities') = 0 OR
          p.weather_city_key IN (SELECT jsonb_array_elements_text(a.j->'cities')))
     AND (NOT (a.j ? 'founding_member') OR p.founding_member = (a.j->>'founding_member')::boolean)
     AND (NOT (a.j ? 'signed_up_after') OR p.created_at >= (a.j->>'signed_up_after')::timestamptz)
     AND (NOT (a.j ? 'signed_up_before') OR p.created_at < (a.j->>'signed_up_before')::timestamptz)
     AND (NOT (a.j ? 'active_within_days') OR EXISTS (
            SELECT 1 FROM public.analytics_events e WHERE e.user_id = p.user_id
               AND e.created_at >= now() - make_interval(days => (a.j->>'active_within_days')::int)))
     AND (NOT (a.j ? 'inactive_for_days') OR NOT EXISTS (
            SELECT 1 FROM public.analytics_events e WHERE e.user_id = p.user_id
               AND e.created_at >= now() - make_interval(days => (a.j->>'inactive_for_days')::int)))
     AND (NOT (a.j ? 'trial_ends_within_days') OR (
            lower(coalesce(p.subscription_status, '')) = 'trial'
            AND p.trial_ends_at BETWEEN now() AND now() + make_interval(days => (a.j->>'trial_ends_within_days')::int)));
$$;

CREATE OR REPLACE FUNCTION public.notification_plan_label(p_plan text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE lower(coalesce(p_plan, ''))
           WHEN 'insider' THEN 'Glow Insider' WHEN 'vip' THEN 'Glow VIP' WHEN 'glow_lite' THEN 'Glow Lite'
           WHEN '' THEN 'SkinLabs®' ELSE initcap(replace(p_plan, '_', ' ')) END;
$$;

CREATE OR REPLACE FUNCTION public.run_notification_automation(p_key text, p_now timestamptz DEFAULT now())
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
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
    FOR c IN
      SELECT s.user_id,
             CASE lower(s.frequency) WHEN 'fortnightly' THEN 14 WHEN 'biweekly' THEN 14 WHEN 'monthly' THEN 30 ELSE 7 END AS every_days,
             (SELECT max(e.captured_at) FROM public.skin_photo_journal_entries e WHERE e.user_id = s.user_id) AS last_at,
             s.created_at
        FROM public.skin_photo_journal_settings s
        JOIN public.notification_preferences np ON np.user_id = s.user_id
       WHERE np.journal_reminder
    LOOP
      IF coalesce(c.last_at, c.created_at) <= p_now - make_interval(days => c.every_days)
         AND NOT EXISTS (SELECT 1 FROM public.notification_dispatches d WHERE d.user_id = c.user_id
                           AND d.automation_key = p_key AND d.created_at > p_now - make_interval(days => c.every_days - 1)) THEN
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
    FOR c IN
      SELECT p.user_id, p.last_free_analysis_at + make_interval(days => v_window) AS unlock_at
        FROM public.profiles p
       WHERE lower(coalesce(p.subscription_status, '')) IN ('', 'free', 'explorer')
         AND p.last_free_analysis_at IS NOT NULL
         AND ((p.last_free_analysis_at + make_interval(days => v_window)) AT TIME ZONE 'Africa/Johannesburg')::date = v_today
    LOOP
      IF public.enqueue_notification(c.user_id, 'free_analysis_refreshed', '{}'::jsonb,
           'free_analysis_refreshed:' || c.user_id || ':' || c.unlock_at, 'automation', '{}'::jsonb,
           greatest(p_now, c.unlock_at), jsonb_build_object('type', 'not_paid'), NULL, p_key) IS NOT NULL THEN
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
      IF public.enqueue_notification(c.user_id, 'weekly_recap', jsonb_build_object('n', c.n),
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
           CASE WHEN c.template_id IN ('trial_week_left','trial_precharge_reminder','trial_last_chance','trial_activation_nudge')
                THEN jsonb_build_object('type', 'trial_active', 'trial_ends_at', c.trial_ends_at)
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
END $$;

CREATE OR REPLACE FUNCTION public.fan_out_notification_campaign(p_campaign_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  c public.notification_campaigns%ROWTYPE;
  u record; v_n integer := 0;
BEGIN
  UPDATE public.notification_campaigns SET status = 'sending', updated_at = now()
   WHERE id = p_campaign_id AND status IN ('draft','scheduled')
  RETURNING * INTO c;
  IF NOT FOUND THEN RETURN 0; END IF;

  FOR u IN SELECT a.user_id FROM public.notification_audience_user_ids(c.audience) a LOOP
    BEGIN
      IF public.enqueue_notification(u.user_id, NULL, '{}'::jsonb,
           'campaign:' || c.id || ':' || u.user_id, 'campaign',
           jsonb_build_object('category', c.category, 'inbox_category', 'announcement',
                              'title', c.title, 'body', c.body, 'url', c.url,
                              'channels', to_jsonb(c.channels), 'tag', 'campaign_' || left(c.id::text, 8)),
           NULL, NULL, c.id, NULL) IS NOT NULL THEN
        v_n := v_n + 1;
      END IF;
    EXCEPTION WHEN others THEN
      RAISE WARNING 'campaign % enqueue failed for %: %', c.id, u.user_id, SQLERRM;
    END;
  END LOOP;

  UPDATE public.notification_campaigns
     SET status = 'sent', sent_at = now(), recipient_count = v_n, updated_at = now()
   WHERE id = c.id;
  RETURN v_n;
END $$;

CREATE OR REPLACE FUNCTION public.run_notification_scheduler(p_now timestamptz DEFAULT now())
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  a public.notification_automations%ROWTYPE;
  c record;
  v_today date := (p_now AT TIME ZONE 'Africa/Johannesburg')::date;
  v_t time := (p_now AT TIME ZONE 'Africa/Johannesburg')::time;
  v_n integer; v_total integer := 0;
BEGIN
  FOR a IN SELECT * FROM public.notification_automations
            WHERE enabled AND trigger_kind IN ('schedule','lifecycle') ORDER BY key LOOP
    IF a.frequency IS DISTINCT FROM 'per_member_time' THEN
      CONTINUE WHEN a.send_time IS NULL;
      CONTINUE WHEN v_t < a.send_time OR v_t >= a.send_time + interval '2 hours';
      CONTINUE WHEN a.last_run_at IS NOT NULL AND (a.last_run_at AT TIME ZONE 'Africa/Johannesburg')::date = v_today;
      CONTINUE WHEN a.frequency = 'weekly' AND extract(isodow FROM v_today) <> a.weekday;
      CONTINUE WHEN a.frequency = 'monthly' AND extract(day FROM v_today) <> a.month_day;
    END IF;
    BEGIN
      v_n := public.run_notification_automation(a.key, p_now);
      UPDATE public.notification_automations SET last_run_at = p_now, last_run_count = v_n WHERE id = a.id;
      v_total := v_total + v_n;
    EXCEPTION WHEN others THEN
      RAISE WARNING 'notification automation % failed: %', a.key, SQLERRM;
    END;
  END LOOP;

  FOR c IN SELECT id FROM public.notification_campaigns
            WHERE status = 'scheduled' AND scheduled_for <= p_now ORDER BY scheduled_for LOOP
    v_total := v_total + public.fan_out_notification_campaign(c.id);
  END LOOP;

  RETURN v_total;
END $$;

CREATE OR REPLACE FUNCTION public.notify_advanced_report_released()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.released_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.released_at IS NULL)
     AND public.notification_automation_enabled('report_ready_advanced') THEN
    BEGIN
      PERFORM public.enqueue_notification(NEW.user_id, 'report_ready_advanced',
        jsonb_build_object('reference', coalesce(NEW.reference_number, 'on file')),
        'report_ready_advanced:' || NEW.id, 'trigger:advanced_assessment_reports', '{}'::jsonb,
        NULL, NULL, NULL, 'report_ready_advanced');
    EXCEPTION WHEN others THEN
      RAISE WARNING 'notify_advanced_report_released failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_advanced_report_released ON public.advanced_assessment_reports;
CREATE TRIGGER trg_notify_advanced_report_released
  AFTER INSERT OR UPDATE OF released_at ON public.advanced_assessment_reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_advanced_report_released();

CREATE OR REPLACE FUNCTION public.notify_subscription_change_push()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_old text := lower(coalesce(OLD.subscription_status, ''));
  v_new text := lower(coalesce(NEW.subscription_status, ''));
BEGIN
  IF v_old IS NOT DISTINCT FROM v_new THEN RETURN NEW; END IF;
  BEGIN
    IF v_old = 'trial' AND v_new IN ('', 'free', 'explorer') AND public.notification_automation_enabled('trial_ended') THEN
      PERFORM public.enqueue_notification(NEW.user_id, 'trial_ended',
        jsonb_build_object('plan', public.notification_plan_label(OLD.trial_plan)),
        'trial_ended:' || NEW.user_id || ':' || coalesce(OLD.trial_ends_at, now()), 'trigger:profiles', '{}'::jsonb,
        NULL, jsonb_build_object('type', 'not_paid'), NULL, 'trial_ended');
    ELSIF v_old NOT IN ('glow_lite','insider','vip') AND v_new IN ('glow_lite','insider','vip')
          AND public.notification_automation_enabled('membership_activated') THEN
      PERFORM public.enqueue_notification(NEW.user_id, 'membership_activated',
        jsonb_build_object('plan', public.notification_plan_label(v_new)),
        'membership_activated:' || NEW.user_id || ':' || coalesce(NEW.subscription_started_at, now()), 'trigger:profiles',
        '{}'::jsonb, NULL, NULL, NULL, 'membership_activated');
    END IF;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_subscription_change_push failed: %', SQLERRM;
  END;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_subscription_change_push ON public.profiles;
CREATE TRIGGER trg_notify_subscription_change_push
  AFTER UPDATE OF subscription_status ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_subscription_change_push();

CREATE OR REPLACE FUNCTION public.prewarm_skin_weather_for_alerts()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c record; v_n integer := 0;
BEGIN
  IF NOT public.notification_automation_enabled('skin_weather_alert') THEN RETURN 0; END IF;
  FOR c IN SELECT DISTINCT p.weather_city_key AS city
             FROM public.profiles p JOIN public.notification_preferences np ON np.user_id = p.user_id
            WHERE np.skin_weather AND p.weather_city_key IS NOT NULL LOOP
    PERFORM net.http_post(
      url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/skin-weather',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('city', c.city),
      timeout_milliseconds := 10000);
    v_n := v_n + 1;
  END LOOP;
  RETURN v_n;
END $$;

REVOKE ALL ON FUNCTION public.notification_audience_user_ids(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.run_notification_automation(text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fan_out_notification_campaign(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.run_notification_scheduler(timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prewarm_skin_weather_for_alerts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_advanced_report_released() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_subscription_change_push() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_notification_scheduler(timestamptz) TO service_role;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'notification_dispatcher_cron_secret') THEN
    PERFORM vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
                                'notification_dispatcher_cron_secret',
                                'x-cron-secret for the notification-dispatcher edge function');
  END IF;
END $$;

SELECT cron.unschedule(jobname) FROM cron.job
 WHERE jobname IN ('notification-scheduler', 'notification-dispatcher', 'skin-weather-prewarm');

SELECT cron.schedule('notification-scheduler', '*/15 * * * *', $cron$SELECT public.run_notification_scheduler();$cron$);

SELECT cron.schedule('notification-dispatcher', '* * * * *', $cron$
  SELECT net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/notification-dispatcher',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'notification_dispatcher_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000)
  WHERE EXISTS (SELECT 1 FROM public.notification_dispatches
                 WHERE status IN ('pending','processing') AND push_wanted AND scheduled_at <= now());
$cron$);

SELECT cron.schedule('skin-weather-prewarm', '50 4 * * *', $cron$SELECT public.prewarm_skin_weather_for_alerts();$cron$);