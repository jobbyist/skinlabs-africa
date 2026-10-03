-- PWA layer (docs/pwa.md): Web Push subscriptions, per-user notification preferences,
-- and cross-device podcast playback progress.
--
-- Security model
--  * push_subscriptions holds each device's Web Push endpoint + public keys (p256dh/auth).
--    Those are secrets in the sense that anyone holding them AND the VAPID private key could
--    push to the device, so clients get NO column grant on endpoint/p256dh/auth: members can
--    only see non-secret metadata about their own devices, and every write goes through the
--    SECURITY DEFINER RPCs below. Nobody can read another user's rows (RLS).
--  * notification_preferences is user-specific. `promotional` is OFF by default and can only be
--    on after an explicit opt-in (promotional_opt_in_at records when).
--  * podcast_playback_progress is written only by upsert_podcast_progress(), which refuses a
--    stale (older) client timestamp, so a device that was offline can never overwrite newer
--    progress from another device.
-- Private VAPID keys never touch the database (Edge Function secret only).
-- (No DROP statements: the Supabase SQL tool hangs on them — see CLAUDE.md.)

-- ---------------------------------------------------------------------------
-- Push subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  endpoint text NOT NULL CHECK (char_length(endpoint) BETWEEN 20 AND 2048 AND endpoint LIKE 'https://%'),
  p256dh text NOT NULL CHECK (char_length(p256dh) BETWEEN 20 AND 255),
  auth text NOT NULL CHECK (char_length(auth) BETWEEN 8 AND 255),
  platform text NOT NULL DEFAULT 'unknown' CHECK (platform IN ('ios', 'ipados', 'android', 'windows', 'macos', 'linux', 'chromeos', 'unknown')),
  browser text NOT NULL DEFAULT 'other' CHECK (browser IN ('safari', 'chrome', 'edge', 'firefox', 'samsung', 'opera', 'other')),
  is_active boolean NOT NULL DEFAULT true,
  failure_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint)
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_active_idx ON public.push_subscriptions (user_id) WHERE is_active;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_subscriptions FROM PUBLIC, anon, authenticated;
-- Non-secret metadata only. endpoint / p256dh / auth are deliberately NOT granted.
GRANT SELECT (id, user_id, platform, browser, is_active, created_at, updated_at, last_used_at)
  ON public.push_subscriptions TO authenticated;
GRANT DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

CREATE POLICY "Members read their own push devices"
  ON public.push_subscriptions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Members remove their own push devices"
  ON public.push_subscriptions FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE OR REPLACE TRIGGER push_subscriptions_set_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Notification preferences (one row per member)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  podcast_episode boolean NOT NULL DEFAULT false,
  briefing boolean NOT NULL DEFAULT false,
  routine_reminder boolean NOT NULL DEFAULT false,
  account_update boolean NOT NULL DEFAULT true,
  -- Marketing: explicit opt-in only. Never defaulted on, never inferred.
  promotional boolean NOT NULL DEFAULT false,
  promotional_opt_in_at timestamptz,
  service boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_preferences FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.notification_preferences TO authenticated;
GRANT INSERT (podcast_episode, briefing, routine_reminder, account_update, promotional, service)
  ON public.notification_preferences TO authenticated;
GRANT UPDATE (podcast_episode, briefing, routine_reminder, account_update, promotional, service)
  ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

CREATE POLICY "Members read their own notification preferences"
  ON public.notification_preferences FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Members create their own notification preferences"
  ON public.notification_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Members update their own notification preferences"
  ON public.notification_preferences FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.notification_preferences_audit()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.promotional AND (TG_OP = 'INSERT' OR NOT OLD.promotional) THEN
    NEW.promotional_opt_in_at := now();
  ELSIF NOT NEW.promotional THEN
    NEW.promotional_opt_in_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notification_preferences_audit() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE TRIGGER notification_preferences_audit_trg
  BEFORE INSERT OR UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.notification_preferences_audit();

-- ---------------------------------------------------------------------------
-- register / unregister a device (the ONLY write path for push_subscriptions)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_push_subscription(
  p_endpoint text, p_p256dh text, p_auth text, p_platform text DEFAULT 'unknown', p_browser text DEFAULT 'other'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF p_endpoint IS NULL OR p_endpoint NOT LIKE 'https://%' OR char_length(p_endpoint) > 2048 THEN
    RAISE EXCEPTION 'Invalid push endpoint' USING ERRCODE = '22023';
  END IF;

  -- Same device re-registering (or a different member signing in on a shared device) re-points
  -- the existing row to the current member and refreshes its keys: one row per endpoint, ever.
  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth, platform, browser, is_active, failure_count)
  VALUES (
    v_user, p_endpoint, p_p256dh, p_auth,
    CASE WHEN p_platform IN ('ios','ipados','android','windows','macos','linux','chromeos') THEN p_platform ELSE 'unknown' END,
    CASE WHEN p_browser IN ('safari','chrome','edge','firefox','samsung','opera') THEN p_browser ELSE 'other' END,
    true, 0
  )
  ON CONFLICT (endpoint) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    platform = EXCLUDED.platform,
    browser = EXCLUDED.browser,
    is_active = true,
    failure_count = 0
  RETURNING id INTO v_id;

  -- A member can keep several devices, but not unlimited ones: retire the oldest beyond 10.
  UPDATE public.push_subscriptions s SET is_active = false
  WHERE s.user_id = v_user AND s.is_active
    AND s.id NOT IN (
      SELECT id FROM public.push_subscriptions
      WHERE user_id = v_user AND is_active ORDER BY updated_at DESC LIMIT 10
    );

  INSERT INTO public.notification_preferences (user_id) VALUES (v_user) ON CONFLICT (user_id) DO NOTHING;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.unregister_push_subscription(p_endpoint text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_deleted integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  DELETE FROM public.push_subscriptions WHERE endpoint = p_endpoint AND user_id = v_user;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.register_push_subscription(text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.unregister_push_subscription(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_push_subscription(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unregister_push_subscription(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Podcast playback progress (cross-device resume)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.podcast_playback_progress (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  episode_slug text NOT NULL CHECK (char_length(episode_slug) BETWEEN 1 AND 120 AND episode_slug ~ '^[a-z0-9-]+$'),
  position_seconds numeric NOT NULL CHECK (position_seconds >= 0 AND position_seconds <= 86400),
  duration_seconds numeric CHECK (duration_seconds IS NULL OR (duration_seconds >= 0 AND duration_seconds <= 86400)),
  -- When the listener actually was at this position (the device clock, clamped on write).
  client_updated_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, episode_slug)
);

ALTER TABLE public.podcast_playback_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.podcast_playback_progress FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.podcast_playback_progress TO authenticated;
GRANT ALL ON public.podcast_playback_progress TO service_role;

CREATE POLICY "Members read their own playback progress"
  ON public.podcast_playback_progress FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Returns true when the write was applied, false when the stored progress was already newer.
CREATE OR REPLACE FUNCTION public.upsert_podcast_progress(
  p_slug text, p_position numeric, p_duration numeric, p_client_updated_at timestamptz
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_ts timestamptz;
  v_applied integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF p_slug IS NULL OR p_slug !~ '^[a-z0-9-]{1,120}$' THEN
    RAISE EXCEPTION 'Invalid episode' USING ERRCODE = '22023';
  END IF;
  -- A wrong device clock must not be able to "win" forever: clamp to a few minutes ahead of the server.
  v_ts := LEAST(COALESCE(p_client_updated_at, now()), now() + interval '5 minutes');

  INSERT INTO public.podcast_playback_progress (user_id, episode_slug, position_seconds, duration_seconds, client_updated_at)
  VALUES (v_user, p_slug, GREATEST(0, LEAST(COALESCE(p_position, 0), 86400)), LEAST(p_duration, 86400), v_ts)
  ON CONFLICT (user_id, episode_slug) DO UPDATE SET
    position_seconds = EXCLUDED.position_seconds,
    duration_seconds = EXCLUDED.duration_seconds,
    client_updated_at = EXCLUDED.client_updated_at,
    updated_at = now()
  WHERE public.podcast_playback_progress.client_updated_at < EXCLUDED.client_updated_at;
  GET DIAGNOSTICS v_applied = ROW_COUNT;
  RETURN v_applied > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.upsert_podcast_progress(text, numeric, numeric, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_podcast_progress(text, numeric, numeric, timestamptz) TO authenticated;
