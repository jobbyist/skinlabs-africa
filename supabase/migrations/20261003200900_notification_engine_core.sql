-- Notification engine — core. See supabase/migrations/20261006100000_notification_engine_core.sql for full header.
CREATE OR REPLACE FUNCTION public.notification_categories()
RETURNS text[] LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT ARRAY['podcast_episode','briefing','routine_reminder','account_update','promotional',
               'service','report_ready','skin_weather','journal_reminder','price_alert']::text[];
$$;

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS report_ready boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS skin_weather boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS journal_reminder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_alert boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiet_hours_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS quiet_hours_start time NOT NULL DEFAULT '21:00',
  ADD COLUMN IF NOT EXISTS quiet_hours_end time NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS daily_cap smallint NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS routine_reminder_time time;

DO $$ BEGIN
  ALTER TABLE public.notification_preferences
    ADD CONSTRAINT notification_preferences_daily_cap_check CHECK (daily_cap BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT INSERT (report_ready, skin_weather, journal_reminder, price_alert, quiet_hours_enabled,
              quiet_hours_start, quiet_hours_end, daily_cap, routine_reminder_time)
  ON public.notification_preferences TO authenticated;
GRANT UPDATE (report_ready, skin_weather, journal_reminder, price_alert, quiet_hours_enabled,
              quiet_hours_start, quiet_hours_end, daily_cap, routine_reminder_time)
  ON public.notification_preferences TO authenticated;

UPDATE public.notification_preferences np SET journal_reminder = true
  FROM public.skin_photo_journal_settings s
 WHERE s.user_id = np.user_id AND s.reminder_enabled AND NOT np.journal_reminder;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_installed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  push_enabled boolean NOT NULL DEFAULT true,
  default_daily_cap smallint NOT NULL DEFAULT 2 CHECK (default_daily_cap BETWEEN 0 AND 10),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.notification_settings (id) VALUES (true) ON CONFLICT DO NOTHING;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.notification_settings IS 'Single row. Global push kill switch + default daily cap. Admin-writable via admin_set_notification_settings() only.';

CREATE TABLE IF NOT EXISTS public.notification_templates (
  key text PRIMARY KEY CHECK (key ~ '^[a-z0-9_]{3,60}$'),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category = ANY (public.notification_categories())),
  inbox_category text NOT NULL DEFAULT 'system',
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 240),
  inbox_title text CHECK (inbox_title IS NULL OR char_length(inbox_title) <= 120),
  inbox_body text CHECK (inbox_body IS NULL OR char_length(inbox_body) <= 600),
  url text NOT NULL DEFAULT '/dashboard?tab=inbox',
  channels text[] NOT NULL DEFAULT ARRAY['inbox','push'],
  lock_screen_safe boolean NOT NULL DEFAULT true,
  bypass_caps boolean NOT NULL DEFAULT false,
  priority smallint NOT NULL DEFAULT 50,
  enabled boolean NOT NULL DEFAULT true,
  system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT notification_templates_channels_check
    CHECK (channels <@ ARRAY['inbox','push'] AND cardinality(channels) > 0)
);
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notification_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE CHECK (key ~ '^[a-z0-9_]{3,60}$'),
  name text NOT NULL,
  description text,
  trigger_kind text NOT NULL CHECK (trigger_kind IN ('event','schedule','lifecycle')),
  event_key text,
  frequency text CHECK (frequency IN ('daily','weekly','monthly','per_member_time')),
  send_time time,
  weekday smallint CHECK (weekday BETWEEN 1 AND 7),
  month_day smallint CHECK (month_day BETWEEN 1 AND 28),
  template_key text REFERENCES public.notification_templates(key) ON UPDATE CASCADE,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  system boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  last_run_count integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.notification_automations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notification_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  category text NOT NULL CHECK (category = ANY (public.notification_categories())),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 240),
  url text NOT NULL DEFAULT '/dashboard?tab=inbox',
  channels text[] NOT NULL DEFAULT ARRAY['inbox','push']
    CHECK (channels <@ ARRAY['inbox','push'] AND cardinality(channels) > 0),
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','cancelled')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  cancelled_at timestamptz,
  recipient_count integer,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_campaigns_due_idx ON public.notification_campaigns (scheduled_for) WHERE status = 'scheduled';
ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notification_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_key text,
  campaign_id uuid REFERENCES public.notification_campaigns(id) ON DELETE SET NULL,
  automation_key text,
  source text NOT NULL,
  category text NOT NULL CHECK (category = ANY (public.notification_categories())),
  title text NOT NULL,
  body text NOT NULL,
  url text NOT NULL,
  tag text,
  push_wanted boolean NOT NULL,
  inbox_notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  idempotency_key text NOT NULL UNIQUE,
  priority smallint NOT NULL DEFAULT 50,
  bypass_caps boolean NOT NULL DEFAULT false,
  guard jsonb,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','sent','partial','failed','skipped','inbox_only','cancelled')),
  skip_reason text,
  attempt_count smallint NOT NULL DEFAULT 0,
  processing_token uuid,
  processing_started_at timestamptz,
  devices_targeted smallint NOT NULL DEFAULT 0,
  devices_sent smallint NOT NULL DEFAULT 0,
  devices_failed smallint NOT NULL DEFAULT 0,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_dispatches_due_idx
  ON public.notification_dispatches (priority, scheduled_at) WHERE status IN ('pending','processing') AND push_wanted;
CREATE INDEX IF NOT EXISTS notification_dispatches_user_idx ON public.notification_dispatches (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notification_dispatches_campaign_idx ON public.notification_dispatches (campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS notification_dispatches_automation_idx ON public.notification_dispatches (automation_key, created_at DESC) WHERE automation_key IS NOT NULL;
ALTER TABLE public.notification_dispatches ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.notification_dispatches IS 'Outbox + permanent record of every member notification. Written only by enqueue_notification() (SECURITY DEFINER); delivered by the notification-dispatcher edge function. Admin-readable via RPCs; no client grants.';

CREATE TABLE IF NOT EXISTS public.push_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id uuid NOT NULL REFERENCES public.notification_dispatches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
  platform text,
  browser text,
  status text NOT NULL CHECK (status IN ('sent','failed','gone')),
  http_status integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  clicked_at timestamptz
);
CREATE INDEX IF NOT EXISTS push_deliveries_dispatch_idx ON public.push_deliveries (dispatch_id);
CREATE INDEX IF NOT EXISTS push_deliveries_created_idx ON public.push_deliveries (created_at DESC);
ALTER TABLE public.push_deliveries ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS dispatch_id uuid,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS action_label text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

REVOKE INSERT, UPDATE ON public.notifications FROM anon, authenticated;
GRANT UPDATE (read_at, archived_at) ON public.notifications TO authenticated;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
                     AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.render_notification_text(p_text text, p_vars jsonb)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE r record; v text := coalesce(p_text, '');
BEGIN
  FOR r IN SELECT key, value FROM jsonb_each_text(coalesce(p_vars, '{}'::jsonb)) LOOP
    v := replace(v, '{{' || r.key || '}}', coalesce(r.value, ''));
  END LOOP;
  RETURN btrim(regexp_replace(regexp_replace(v, '\{\{[A-Za-z0-9_]+\}\}', '', 'g'), '\s{2,}', ' ', 'g'));
END $$;

CREATE OR REPLACE FUNCTION public.sanitize_notification_url(p_url text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE
    WHEN p_url IS NULL OR left(p_url, 1) <> '/' OR left(p_url, 2) = '//' OR position(E'\\' in p_url) > 0
         OR p_url ~ '[\x00-\x1f\x7f]' THEN '/start'
    ELSE left(p_url, 300) END;
$$;

CREATE OR REPLACE FUNCTION public.notification_category_allowed(p_user_id uuid, p_category text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(
    (SELECT CASE p_category
              WHEN 'podcast_episode'  THEN np.podcast_episode
              WHEN 'briefing'         THEN np.briefing
              WHEN 'routine_reminder' THEN np.routine_reminder
              WHEN 'account_update'   THEN np.account_update
              WHEN 'promotional'      THEN np.promotional
              WHEN 'service'          THEN np.service
              WHEN 'report_ready'     THEN np.report_ready
              WHEN 'skin_weather'     THEN np.skin_weather
              WHEN 'journal_reminder' THEN np.journal_reminder
              WHEN 'price_alert'      THEN np.price_alert
              ELSE false END
       FROM public.notification_preferences np WHERE np.user_id = p_user_id),
    p_category IN ('account_update','service','report_ready'));
$$;

CREATE OR REPLACE FUNCTION public.notification_automation_enabled(p_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce((SELECT enabled FROM public.notification_automations WHERE key = p_key), false);
$$;

CREATE OR REPLACE FUNCTION public.notification_first_name(p_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(nullif(split_part(btrim((SELECT full_name FROM public.profiles WHERE user_id = p_user_id)), ' ', 1), ''), 'there');
$$;

CREATE OR REPLACE FUNCTION public.notification_guard_ok(p_user_id uuid, p_guard jsonb)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_today date := (now() AT TIME ZONE 'Africa/Johannesburg')::date;
BEGIN
  IF p_guard IS NULL THEN RETURN true; END IF;
  CASE p_guard->>'type'
    WHEN 'trial_active' THEN
      RETURN EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = p_user_id
                       AND lower(coalesce(p.subscription_status, '')) = 'trial'
                       AND p.trial_ends_at = (p_guard->>'trial_ends_at')::timestamptz);
    WHEN 'not_paid' THEN
      RETURN NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = p_user_id
                           AND lower(coalesce(p.subscription_status, '')) IN ('glow_lite','insider','vip'));
    WHEN 'no_checkin_today' THEN
      RETURN NOT EXISTS (SELECT 1 FROM public.routine_checkins c WHERE c.user_id = p_user_id AND c.checkin_date = v_today);
    WHEN 'same_day' THEN
      RETURN v_today = (p_guard->>'date')::date;
    ELSE RETURN true;
  END CASE;
END $$;

CREATE OR REPLACE FUNCTION public.enqueue_notification(
  p_user_id uuid,
  p_template_key text,
  p_vars jsonb DEFAULT '{}'::jsonb,
  p_idempotency_key text DEFAULT NULL,
  p_source text DEFAULT 'system',
  p_overrides jsonb DEFAULT '{}'::jsonb,
  p_scheduled_at timestamptz DEFAULT NULL,
  p_guard jsonb DEFAULT NULL,
  p_campaign_id uuid DEFAULT NULL,
  p_automation_key text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  t public.notification_templates%ROWTYPE;
  o jsonb := coalesce(p_overrides, '{}'::jsonb);
  v_vars jsonb;
  v_category text; v_inbox_category text;
  v_title text; v_body text; v_inbox_title text; v_inbox_body text; v_url text; v_tag text;
  v_channels text[]; v_bypass boolean; v_priority smallint;
  v_allowed boolean; v_push boolean; v_inbox boolean;
  v_id uuid; v_inbox_id uuid;
BEGIN
  IF p_user_id IS NULL THEN RETURN NULL; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id AND coalesce(account_status, 'active') <> 'active') THEN
    RETURN NULL;
  END IF;

  IF p_template_key IS NOT NULL THEN
    SELECT * INTO t FROM public.notification_templates WHERE key = p_template_key;
    IF NOT FOUND OR NOT t.enabled THEN RETURN NULL; END IF;
  END IF;

  v_vars := jsonb_build_object('first_name', public.notification_first_name(p_user_id)) || coalesce(p_vars, '{}'::jsonb);
  v_category := coalesce(o->>'category', t.category);
  IF v_category IS NULL OR NOT (v_category = ANY (public.notification_categories())) THEN
    RAISE EXCEPTION 'enqueue_notification: invalid category %', v_category USING ERRCODE = '22023';
  END IF;
  v_inbox_category := coalesce(o->>'inbox_category', t.inbox_category, 'system');
  v_title := left(public.render_notification_text(coalesce(o->>'title', t.title), v_vars), 80);
  v_body  := left(public.render_notification_text(coalesce(o->>'body', t.body), v_vars), 240);
  IF v_title = '' OR v_body = '' THEN
    RAISE EXCEPTION 'enqueue_notification: empty title/body' USING ERRCODE = '22023';
  END IF;
  v_inbox_title := coalesce(nullif(public.render_notification_text(coalesce(o->>'inbox_title', t.inbox_title), v_vars), ''), v_title);
  v_inbox_body := CASE WHEN o ? 'inbox_body'
                       THEN nullif(public.render_notification_text(o->>'inbox_body', v_vars), '')
                       ELSE coalesce(nullif(public.render_notification_text(t.inbox_body, v_vars), ''), v_body) END;
  v_url := public.sanitize_notification_url(public.render_notification_text(coalesce(o->>'url', t.url, '/dashboard?tab=inbox'), v_vars));
  v_tag := left(coalesce(o->>'tag', p_template_key, p_automation_key), 60);
  v_channels := CASE WHEN o ? 'channels' THEN ARRAY(SELECT jsonb_array_elements_text(o->'channels'))
                     ELSE coalesce(t.channels, ARRAY['inbox','push']) END;
  v_bypass := coalesce((o->>'bypass_caps')::boolean, t.bypass_caps, false);
  v_priority := coalesce((o->>'priority')::smallint, t.priority, 50);

  v_allowed := public.notification_category_allowed(p_user_id, v_category);
  IF NOT v_allowed AND v_category NOT IN ('account_update','service','report_ready') THEN
    RETURN NULL;
  END IF;
  v_push := v_allowed AND 'push' = ANY (v_channels);
  v_inbox := 'inbox' = ANY (v_channels);
  IF NOT v_push AND NOT v_inbox THEN RETURN NULL; END IF;

  INSERT INTO public.notification_dispatches (
    user_id, template_key, campaign_id, automation_key, source, category, title, body, url, tag,
    push_wanted, idempotency_key, priority, bypass_caps, guard, scheduled_at, status)
  VALUES (
    p_user_id, p_template_key, p_campaign_id, p_automation_key, left(coalesce(p_source, 'system'), 80),
    v_category, v_title, v_body, v_url, v_tag, v_push,
    coalesce(p_idempotency_key, 'adhoc:' || gen_random_uuid()::text), v_priority, v_bypass, p_guard,
    coalesce(p_scheduled_at, now()), CASE WHEN v_push THEN 'pending' ELSE 'inbox_only' END)
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN RETURN NULL; END IF;

  IF v_inbox THEN
    INSERT INTO public.notifications (user_id, category, title, body, link, dispatch_id, action_label)
    VALUES (p_user_id, v_inbox_category, v_inbox_title, v_inbox_body, v_url, v_id, o->>'action_label')
    RETURNING id INTO v_inbox_id;
    UPDATE public.notification_dispatches SET inbox_notification_id = v_inbox_id WHERE id = v_id;
  END IF;

  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_category text, p_title text, p_body text DEFAULT NULL::text, p_link text DEFAULT NULL::text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_push_cat text;
  v_mirror boolean := public.notification_automation_enabled('inbox_mirror_push')
                      AND NOT (p_category = 'billing' AND p_title LIKE 'Membership updated%');
BEGIN
  v_push_cat := CASE p_category WHEN 'billing' THEN 'account_update' WHEN 'analysis' THEN 'report_ready' ELSE 'service' END;
  BEGIN
    PERFORM public.enqueue_notification(
      p_user_id, NULL, '{}'::jsonb, NULL, 'create_notification',
      jsonb_build_object(
        'category', v_push_cat,
        'inbox_category', coalesce(p_category, 'system'),
        'title', CASE WHEN p_category = 'analysis' THEN 'Your skin analysis is ready' ELSE p_title END,
        'body', CASE WHEN p_category = 'analysis' THEN 'Tap to open it in SkinLabs®.'
                     ELSE coalesce(nullif(p_body, ''), 'Tap to view it in SkinLabs®.') END,
        'inbox_title', p_title,
        'inbox_body', p_body,
        'url', coalesce(p_link, '/dashboard?tab=inbox'),
        'channels', CASE WHEN v_mirror THEN '["inbox","push"]'::jsonb ELSE '["inbox"]'::jsonb END,
        'tag', 'inbox_' || coalesce(p_category, 'system')),
      NULL, NULL, NULL, 'inbox_mirror_push');
  EXCEPTION WHEN others THEN
    RAISE WARNING 'create_notification: engine enqueue failed (%), falling back to direct insert', SQLERRM;
    INSERT INTO public.notifications (user_id, category, title, body, link)
    VALUES (p_user_id, p_category, p_title, p_body, p_link);
  END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_notification_dispatches(p_limit integer DEFAULT 100)
RETURNS TABLE (d_id uuid, d_user_id uuid, d_category text, d_title text, d_body text, d_url text,
               d_tag text, d_subscriptions jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
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
      SELECT count(*) INTO v_sent_today FROM public.notification_dispatches x
       WHERE x.user_id = r.user_id AND NOT x.bypass_caps
         AND x.status IN ('sent','partial','processing')
         AND coalesce(x.sent_at, x.processing_started_at) >= (v_local::date)::timestamp AT TIME ZONE 'Africa/Johannesburg';
      IF v_sent_today >= v_cap THEN
        UPDATE public.notification_dispatches SET status = 'skipped', skip_reason = 'daily_cap', updated_at = v_now WHERE id = r.id;
        CONTINUE;
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
END $$;

CREATE OR REPLACE FUNCTION public.complete_notification_dispatch(p_id uuid, p_sent integer, p_failed integer, p_error text DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.notification_dispatches
     SET status = CASE WHEN p_sent > 0 AND p_failed = 0 THEN 'sent'
                       WHEN p_sent > 0 THEN 'partial'
                       ELSE 'failed' END,
         devices_sent = p_sent, devices_failed = p_failed,
         sent_at = CASE WHEN p_sent > 0 THEN now() ELSE sent_at END,
         last_error = left(p_error, 500), processing_token = NULL, updated_at = now()
   WHERE id = p_id AND status = 'processing';
$$;

CREATE OR REPLACE FUNCTION public.record_push_click(p_delivery_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_dispatch uuid;
BEGIN
  UPDATE public.push_deliveries SET clicked_at = now()
   WHERE id = p_delivery_id AND clicked_at IS NULL AND created_at > now() - interval '30 days'
  RETURNING dispatch_id INTO v_dispatch;
  IF v_dispatch IS NULL THEN RETURN false; END IF;
  UPDATE public.notifications n SET read_at = coalesce(n.read_at, now())
    FROM public.notification_dispatches d
   WHERE d.id = v_dispatch AND n.id = d.inbox_notification_id;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.notification_cron_secret_matches(p_secret text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_secret IS NOT NULL AND length(p_secret) >= 32 AND EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'notification_dispatcher_cron_secret' AND decrypted_secret = p_secret);
$$;

CREATE OR REPLACE FUNCTION public.mark_app_installed()
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid := auth.uid(); v_at timestamptz;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  UPDATE public.profiles SET app_installed_at = coalesce(app_installed_at, now())
   WHERE user_id = v_user RETURNING app_installed_at INTO v_at;
  RETURN v_at;
END $$;

CREATE OR REPLACE FUNCTION public.list_my_push_devices()
RETURNS TABLE (id uuid, platform text, browser text, is_active boolean, created_at timestamptz, last_used_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT s.id, s.platform, s.browser, s.is_active, s.created_at, s.last_used_at
    FROM public.push_subscriptions s WHERE s.user_id = auth.uid() ORDER BY s.updated_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.remove_my_push_device(p_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_n integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  UPDATE public.push_subscriptions SET is_active = false, updated_at = now()
   WHERE id = p_id AND user_id = auth.uid();
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n > 0;
END $$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_n integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  UPDATE public.notifications SET read_at = now() WHERE user_id = auth.uid() AND read_at IS NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END $$;

REVOKE ALL ON FUNCTION public.enqueue_notification(uuid, text, jsonb, text, text, jsonb, timestamptz, jsonb, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_notification_dispatches(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_notification_dispatch(uuid, integer, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_push_click(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notification_cron_secret_matches(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notification_guard_ok(uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notification_category_allowed(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notification_first_name(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notification_automation_enabled(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_notification(uuid, text, jsonb, text, text, jsonb, timestamptz, jsonb, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_notification_dispatches(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_notification_dispatch(uuid, integer, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_push_click(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.notification_cron_secret_matches(text) TO service_role;
REVOKE ALL ON FUNCTION public.mark_app_installed() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_my_push_devices() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_my_push_device(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_app_installed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_push_devices() TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_my_push_device(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;