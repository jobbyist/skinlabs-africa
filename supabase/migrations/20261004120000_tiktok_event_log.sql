-- Log of every conversion event handed to the TikTok Events API (no personal data) + an admin-only summary.
-- Written only by the `tiktok-events` edge function (service role). No client role can read or write the table;
-- admins read aggregates through admin_tiktok_events_overview().
CREATE TABLE IF NOT EXISTS public.tiktok_event_log (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at    timestamptz NOT NULL DEFAULT now(),
  event_name    text NOT NULL,
  event_id      text NOT NULL,
  page_key      text NOT NULL,          -- home | skynn-ai | skynn-ai-advanced | other
  path          text,                   -- pathname only, never a query string
  content_id    text,
  identified    boolean NOT NULL DEFAULT false,  -- a signed-in member (hashed identifiers were attached)
  status        text NOT NULL CHECK (status IN ('sent', 'not_configured', 'rejected', 'error')),
  upstream_code integer
);
CREATE INDEX IF NOT EXISTS tiktok_event_log_created_idx ON public.tiktok_event_log (created_at DESC);
CREATE INDEX IF NOT EXISTS tiktok_event_log_page_idx ON public.tiktok_event_log (page_key, event_name, created_at DESC);

ALTER TABLE public.tiktok_event_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tiktok_event_log FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_tiktok_events_overview(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_days int := least(greatest(coalesce(p_days, 30), 1), 90);
  v_from timestamptz;
  v_result jsonb;
BEGIN
  IF NOT public.has_role((SELECT auth.uid()), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  v_from := now() - make_interval(days => v_days);

  WITH e AS (
    SELECT *, (created_at AT TIME ZONE 'Africa/Johannesburg')::date AS day
      FROM public.tiktok_event_log
     WHERE created_at >= v_from
  )
  SELECT jsonb_build_object(
    'window_days', v_days,
    'totals', (SELECT jsonb_build_object(
        'events', count(*),
        'sent', count(*) FILTER (WHERE status = 'sent'),
        'not_configured', count(*) FILTER (WHERE status = 'not_configured'),
        'failed', count(*) FILTER (WHERE status IN ('rejected', 'error')),
        'identified', count(*) FILTER (WHERE identified),
        'first_event_at', min(created_at),
        'last_event_at', max(created_at)) FROM e),
    'by_page_event', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'page_key', page_key, 'event_name', event_name, 'total', n, 'sent', s, 'not_configured', nc, 'failed', f) ORDER BY page_key, n DESC)
        FROM (SELECT page_key, event_name, count(*) n,
                     count(*) FILTER (WHERE status = 'sent') s,
                     count(*) FILTER (WHERE status = 'not_configured') nc,
                     count(*) FILTER (WHERE status IN ('rejected', 'error')) f
                FROM e GROUP BY page_key, event_name) d), '[]'::jsonb),
    'daily', coalesce((SELECT jsonb_agg(jsonb_build_object('day', day, 'page_key', page_key, 'count', n) ORDER BY day)
        FROM (SELECT day, page_key, count(*) n FROM e WHERE page_key IN ('home', 'skynn-ai', 'skynn-ai-advanced') GROUP BY day, page_key) d), '[]'::jsonb),
    'recent', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'created_at', created_at, 'event_name', event_name, 'page_key', page_key, 'path', path, 'status', status, 'upstream_code', upstream_code, 'identified', identified) ORDER BY created_at DESC)
        FROM (SELECT * FROM e ORDER BY created_at DESC LIMIT 25) r), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_tiktok_events_overview(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_tiktok_events_overview(integer) TO authenticated;
