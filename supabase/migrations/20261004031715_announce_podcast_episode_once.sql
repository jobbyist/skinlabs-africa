-- admin_announce_podcast_episode() created a NEW campaign on every call and sent it at once, so the same episode could be announced twice
-- (double click, retry after a timeout, two admins) and push the whole podcast audience twice. This version refuses when a campaign for the
-- same episode path is already scheduled, sending or sent. Cancelled campaigns do not count, so a mistaken announcement that was cancelled
-- can be redone. Everything else is unchanged.
CREATE OR REPLACE FUNCTION public.admin_announce_podcast_episode(p_slug text, p_title text, p_audience jsonb DEFAULT '{}'::jsonb, p_confirm_recipients integer DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := public.notification_require_admin(); v_id uuid;
BEGIN
  IF p_slug !~ '^[a-z0-9-]{1,120}$' THEN RAISE EXCEPTION 'Invalid episode slug' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.notification_campaigns c
              WHERE c.category = 'podcast_episode' AND c.url = '/podcast/' || p_slug
                AND c.status IN ('scheduled', 'sending', 'sent')) THEN
    RAISE EXCEPTION 'This episode has already been announced' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.notification_campaigns (name, category, title, body, url, channels, audience, created_by)
  VALUES ('Episode: ' || left(p_title, 100), 'podcast_episode', left('New episode: ' || btrim(p_title), 80),
          'The Skin Deep Podcast. Listen now or save it for offline.', '/podcast/' || p_slug,
          ARRAY['inbox','push'], coalesce(p_audience, '{}'::jsonb), v_uid)
  RETURNING id INTO v_id;
  RETURN public.admin_send_notification_campaign_now(v_id, p_confirm_recipients);
END $$;

REVOKE ALL ON FUNCTION public.admin_announce_podcast_episode(text, text, jsonb, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_announce_podcast_episode(text, text, jsonb, integer) TO authenticated;
