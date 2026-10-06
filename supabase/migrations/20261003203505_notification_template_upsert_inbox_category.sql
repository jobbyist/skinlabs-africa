CREATE OR REPLACE FUNCTION public.admin_upsert_notification_template(
  p_key text, p_name text, p_category text, p_title text, p_body text,
  p_url text DEFAULT '/dashboard?tab=inbox', p_inbox_title text DEFAULT NULL, p_inbox_body text DEFAULT NULL,
  p_channels text[] DEFAULT ARRAY['inbox','push'], p_enabled boolean DEFAULT true, p_description text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := public.notification_require_admin(); t public.notification_templates%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.notification_templates WHERE key = p_key FOR UPDATE;
  IF FOUND THEN
    UPDATE public.notification_templates SET
      name = coalesce(p_name, name),
      description = coalesce(p_description, description),
      category = CASE WHEN system THEN category ELSE coalesce(p_category, category) END,
      channels = CASE WHEN system THEN channels ELSE coalesce(p_channels, channels) END,
      title = coalesce(btrim(p_title), title),
      body = coalesce(btrim(p_body), body),
      url = public.sanitize_notification_url(coalesce(p_url, url)),
      inbox_title = p_inbox_title,
      inbox_body = p_inbox_body,
      enabled = coalesce(p_enabled, enabled),
      updated_at = now(), updated_by = v_uid
    WHERE key = p_key RETURNING * INTO t;
  ELSE
    INSERT INTO public.notification_templates
      (key, name, description, category, inbox_category, title, body, inbox_title, inbox_body, url, channels, enabled, system, updated_by)
    VALUES (p_key, p_name, p_description, p_category, 'community', btrim(p_title), btrim(p_body), p_inbox_title, p_inbox_body,
            public.sanitize_notification_url(p_url), p_channels, coalesce(p_enabled, true), false, v_uid)
    RETURNING * INTO t;
  END IF;
  PERFORM public.notification_admin_audit('notification_template_saved', jsonb_build_object('key', p_key));
  RETURN to_jsonb(t);
END $$;