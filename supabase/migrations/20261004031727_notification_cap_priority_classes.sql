-- Daily cap priority classes (owner decision, 2026-10-04): routine reminders and important non-marketing notifications come first.
-- routine_reminder, account_update, service and report_ready are no longer dropped by the daily cap (they still count toward it, so optional
-- categories such as briefing, skin weather, journal, podcast, promotional and price alerts give way once the cap is reached). A member's cap of 0
-- still holds back everything that is not bypass_caps. Rows with bypass_caps (e.g. trial_last_chance, trial_precharge_reminder, report ready,
-- membership events) ignore quiet hours and the cap entirely, as before. Everything else in claim_notification_dispatches is the live text.
CREATE OR REPLACE FUNCTION public.claim_notification_dispatches(p_limit integer DEFAULT 100)
 RETURNS TABLE(d_id uuid, d_user_id uuid, d_category text, d_title text, d_body text, d_url text, d_tag text, d_subscriptions jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_token uuid := gen_random_uuid();
  v_now timestamptz := now();
  v_local timestamp := now() AT TIME ZONE 'Africa/Johannesburg';
  v_t time := (now() AT TIME ZONE 'Africa/Johannesburg')::time;
  v_settings public.notification_settings%ROWTYPE;
  r public.notification_dispatches%ROWTYPE;
  np public.notification_preferences%ROWTYPE;
  v_has_np boolean;
  v_qs time; v_qe time; v_quiet boolean; v_resume timestamp;
  v_cap integer; v_sent_today integer; v_subs jsonb;
  v_claimed integer := 0;
BEGIN
  SELECT * INTO v_settings FROM public.notification_settings WHERE id;

  UPDATE public.notification_dispatches
     SET status = 'pending', processing_token = NULL, updated_at = v_now
   WHERE status = 'processing' AND processing_started_at < v_now - interval '10 minutes';

  IF NOT coalesce(v_settings.push_enabled, true) THEN RETURN; END IF;

  FOR r IN
    SELECT * FROM public.notification_dispatches d
     WHERE d.status = 'pending' AND d.push_wanted AND d.scheduled_at <= v_now
     ORDER BY d.priority, d.scheduled_at
     LIMIT greatest(p_limit, 1) * 4
     FOR UPDATE SKIP LOCKED
  LOOP
    EXIT WHEN v_claimed >= p_limit;

    IF r.scheduled_at < v_now - interval '24 hours' THEN
      UPDATE public.notification_dispatches SET status = 'skipped', skip_reason = 'expired', updated_at = v_now WHERE id = r.id;
      CONTINUE;
    END IF;

    IF NOT public.notification_category_allowed(r.user_id, r.category) THEN
      UPDATE public.notification_dispatches SET status = 'skipped', skip_reason = 'preference_off', updated_at = v_now WHERE id = r.id;
      CONTINUE;
    END IF;

    SELECT * INTO np FROM public.notification_preferences WHERE user_id = r.user_id;
    v_has_np := FOUND;

    IF NOT r.bypass_caps AND (NOT v_has_np OR np.quiet_hours_enabled) THEN
      v_qs := CASE WHEN v_has_np THEN np.quiet_hours_start ELSE '21:00'::time END;
      v_qe := CASE WHEN v_has_np THEN np.quiet_hours_end ELSE '07:00'::time END;
      v_quiet := CASE WHEN v_qs = v_qe THEN false
                      WHEN v_qs < v_qe THEN v_t >= v_qs AND v_t < v_qe
                      ELSE v_t >= v_qs OR v_t < v_qe END;
      IF v_quiet THEN
        v_resume := v_local::date + v_qe;
        IF v_resume <= v_local THEN v_resume := v_resume + interval '1 day'; END IF;
        UPDATE public.notification_dispatches
           SET scheduled_at = v_resume AT TIME ZONE 'Africa/Johannesburg', updated_at = v_now
         WHERE id = r.id;
        CONTINUE;
      END IF;
    END IF;

    IF NOT public.notification_guard_ok(r.user_id, r.guard) THEN
      UPDATE public.notification_dispatches SET status = 'skipped', skip_reason = 'guard_failed', updated_at = v_now WHERE id = r.id;
      CONTINUE;
    END IF;

    IF NOT r.bypass_caps THEN
      v_cap := CASE WHEN v_has_np THEN np.daily_cap ELSE coalesce(v_settings.default_daily_cap, 2) END;
      -- CHANGED: the cap only holds back optional categories (and everything when the member's cap is 0).
      IF v_cap = 0 OR r.category NOT IN ('routine_reminder', 'account_update', 'service', 'report_ready') THEN
        SELECT count(*) INTO v_sent_today FROM public.notification_dispatches x
         WHERE x.user_id = r.user_id AND NOT x.bypass_caps
           AND x.status IN ('sent','partial','processing')
           AND coalesce(x.sent_at, x.processing_started_at) >= (v_local::date)::timestamp AT TIME ZONE 'Africa/Johannesburg';
        IF v_sent_today >= v_cap THEN
          UPDATE public.notification_dispatches SET status = 'skipped', skip_reason = 'daily_cap', updated_at = v_now WHERE id = r.id;
          CONTINUE;
        END IF;
      END IF;
    END IF;

    SELECT jsonb_agg(jsonb_build_object('id', s.id, 'endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth,
                                        'failure_count', s.failure_count, 'platform', s.platform, 'browser', s.browser))
      INTO v_subs
      FROM public.push_subscriptions s WHERE s.user_id = r.user_id AND s.is_active;
    IF v_subs IS NULL THEN
      UPDATE public.notification_dispatches SET status = 'skipped', skip_reason = 'no_devices', updated_at = v_now WHERE id = r.id;
      CONTINUE;
    END IF;

    UPDATE public.notification_dispatches
       SET status = 'processing', processing_token = v_token, processing_started_at = v_now,
           attempt_count = attempt_count + 1, devices_targeted = jsonb_array_length(v_subs), updated_at = v_now
     WHERE id = r.id;

    v_claimed := v_claimed + 1;
    d_id := r.id; d_user_id := r.user_id; d_category := r.category; d_title := r.title; d_body := r.body;
    d_url := r.url; d_tag := r.tag; d_subscriptions := v_subs;
    RETURN NEXT;
  END LOOP;
END $function$;
