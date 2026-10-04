-- admin_audit_log.action has a CHECK limited to role/entitlement actions (and DROP CONSTRAINT
-- isn't usable through the SQL tool), so the notification console gets its own append-only
-- audit table, following the analysis_pass_grants precedent.
CREATE TABLE IF NOT EXISTS public.notification_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_user_id uuid,
  action text NOT NULL CHECK (action ~ '^notification_[a-z_]{3,60}$'),
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS notification_admin_audit_log_created_idx ON public.notification_admin_audit_log (created_at DESC);
ALTER TABLE public.notification_admin_audit_log ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.notification_admin_audit_log IS 'Append-only trail of notification console actions (campaigns, automations, templates, settings, push-send broadcasts). Written only by SECURITY DEFINER functions / service role; admin-read via admin_list_notification_audit().';

CREATE OR REPLACE FUNCTION public.notification_admin_audit(p_action text, p_detail jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  INSERT INTO public.notification_admin_audit_log (admin_user_id, action, detail)
  VALUES (auth.uid(), p_action, coalesce(p_detail, '{}'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.notification_admin_audit(text, jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_notification_audit(p_limit integer DEFAULT 100)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.notification_require_admin();
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object('id', l.id, 'created_at', l.created_at, 'action', l.action, 'detail', l.detail,
                                        'admin_email', (SELECT p.email FROM public.profiles p WHERE p.user_id = l.admin_user_id))
           ORDER BY l.created_at DESC)
      FROM (SELECT * FROM public.notification_admin_audit_log ORDER BY created_at DESC
             LIMIT greatest(1, least(p_limit, 500))) l), '[]'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.admin_list_notification_audit(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_notification_audit(integer) TO authenticated;