-- notifications.category is CHECKed to system|billing|analysis|community|security (the Inbox UI
-- keys its icons on these). Map engine inbox categories onto that set instead of widening it.
CREATE OR REPLACE FUNCTION public.notification_inbox_category(p_category text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE
    WHEN p_category IN ('system','billing','analysis','community','security') THEN p_category
    WHEN p_category IN ('announcement','tips','podcast','briefing') THEN 'community'
    ELSE 'system' END;
$$;

UPDATE public.notification_templates SET inbox_category = public.notification_inbox_category(inbox_category)
 WHERE inbox_category IS DISTINCT FROM public.notification_inbox_category(inbox_category);
ALTER TABLE public.notification_templates
  ADD CONSTRAINT notification_templates_inbox_category_check
  CHECK (inbox_category IN ('system','billing','analysis','community','security'));
ALTER TABLE public.notification_templates ALTER COLUMN inbox_category SET DEFAULT 'system';

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
  v_inbox_category := public.notification_inbox_category(coalesce(o->>'inbox_category', t.inbox_category, 'system'));
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
REVOKE ALL ON FUNCTION public.enqueue_notification(uuid, text, jsonb, text, text, jsonb, timestamptz, jsonb, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_notification(uuid, text, jsonb, text, text, jsonb, timestamptz, jsonb, uuid, text) TO service_role;