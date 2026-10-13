-- SkinLabs Community Forum — notifications + push.  (2 of 5)
-- Plugs forum engagement into the EXISTING notification engine (enqueue_notification -> notification_dispatches ->
-- notifications inbox + notification-dispatcher web push). No parallel system.
--
--  * New push category `community` (member preference, default ON: it only ever concerns the member's own content).
--  * Templates: community_post_liked / community_comment_liked / community_post_commented.
--  * Triggers on likes + comments call community_notify():
--      - never notifies a member about their own action, never notifies personas (no account);
--      - idempotent per event (one notification per liker per target; one per comment), so unlike/re-like can't spam;
--      - debounce: if the recipient already has a pushed community notification for the SAME post in the last 10 minutes,
--        the new one is inbox-only (the inbox row is never lost, push is not repeated). Pushes for a post share a `tag`,
--        so a device replaces rather than stacks them.
--  * Lock-screen copy stays generic (no post title, no skin concern), per the notification engine's standing rule. The post
--    title is in the inbox body, behind sign-in.

CREATE OR REPLACE FUNCTION public.notification_categories()
RETURNS text[] LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT ARRAY['podcast_episode','briefing','routine_reminder','account_update','promotional',
               'service','report_ready','skin_weather','journal_reminder','price_alert','community']::text[];
$$;

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS community boolean NOT NULL DEFAULT true;
GRANT INSERT (community) ON public.notification_preferences TO authenticated;
GRANT UPDATE (community) ON public.notification_preferences TO authenticated;

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
              WHEN 'community'        THEN np.community
              ELSE false END
       FROM public.notification_preferences np WHERE np.user_id = p_user_id),
    p_category IN ('account_update','service','report_ready','community'));
$$;
REVOKE ALL ON FUNCTION public.notification_category_allowed(uuid, text) FROM PUBLIC, anon, authenticated;

INSERT INTO public.notification_templates
  (key, name, description, category, inbox_category, title, body, inbox_title, inbox_body, url, channels, lock_screen_safe, bypass_caps, priority, system)
VALUES
  ('community_post_liked', 'Community: your post was liked', 'Someone liked a discussion the member started.', 'community', 'community',
   '{{actor}} liked your post', 'Tap to see it in the SkinLabs® Community.', '{{actor}} liked your post', '{{actor}} liked your post “{{post_title}}”.',
   '/community-forum', ARRAY['inbox','push'], true, false, 60, true),
  ('community_comment_liked', 'Community: your comment was liked', 'Someone liked a comment the member wrote.', 'community', 'community',
   '{{actor}} liked your comment', 'Tap to see it in the SkinLabs® Community.', '{{actor}} liked your comment', '{{actor}} liked your comment on “{{post_title}}”.',
   '/community-forum', ARRAY['inbox','push'], true, false, 60, true),
  ('community_post_commented', 'Community: new comment on your post', 'Someone commented on a discussion the member started.', 'community', 'community',
   '{{actor}} commented on your post', 'Tap to read it in the SkinLabs® Community.', '{{actor}} commented on your post', '{{actor}} commented on “{{post_title}}”: {{excerpt}}',
   '/community-forum', ARRAY['inbox','push'], true, false, 40, true)
ON CONFLICT (key) DO NOTHING;

-- Internal: build + enqueue one community notification.
CREATE OR REPLACE FUNCTION public.community_notify(
  p_recipient uuid, p_actor uuid, p_template text, p_post uuid, p_key text, p_vars jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_tag text := 'community_' || p_post::text; v_recent boolean; v_overrides jsonb;
BEGIN
  IF p_recipient IS NULL OR p_actor IS NULL OR p_recipient = p_actor THEN RETURN; END IF;
  SELECT EXISTS (SELECT 1 FROM public.notification_dispatches d
                  WHERE d.user_id = p_recipient AND d.tag = v_tag AND d.push_wanted
                    AND d.created_at > now() - interval '10 minutes')
    INTO v_recent;
  v_overrides := jsonb_build_object('tag', v_tag, 'url', '/community-forum?post=' || p_post::text);
  IF v_recent THEN v_overrides := v_overrides || jsonb_build_object('channels', '["inbox"]'::jsonb); END IF;
  BEGIN
    PERFORM public.enqueue_notification(p_recipient, p_template, p_vars, p_key, 'community', v_overrides, NULL, NULL, NULL, NULL);
  EXCEPTION WHEN others THEN
    -- A notification problem must never block someone liking or commenting.
    RAISE WARNING 'community_notify failed: %', SQLERRM;
  END;
END $$;

CREATE OR REPLACE FUNCTION public.community_trg_post_liked()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_author uuid; v_title text;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NULL; END IF;
  SELECT author_id, title INTO v_author, v_title FROM public.community_posts WHERE id = NEW.post_id;
  PERFORM public.community_notify(v_author, NEW.user_id, 'community_post_liked', NEW.post_id,
    'community:post_like:' || NEW.post_id || ':' || NEW.user_id,
    jsonb_build_object('actor', public.community_display_name(NEW.user_id), 'post_title', left(v_title, 80)));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.community_trg_comment_liked()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_author uuid; v_post uuid; v_title text;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NULL; END IF;
  SELECT c.author_id, c.post_id, p.title INTO v_author, v_post, v_title
    FROM public.community_comments c JOIN public.community_posts p ON p.id = c.post_id WHERE c.id = NEW.comment_id;
  PERFORM public.community_notify(v_author, NEW.user_id, 'community_comment_liked', v_post,
    'community:comment_like:' || NEW.comment_id || ':' || NEW.user_id,
    jsonb_build_object('actor', public.community_display_name(NEW.user_id), 'post_title', left(v_title, 80)));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.community_trg_comment_added()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_author uuid; v_title text;
BEGIN
  IF NEW.author_id IS NULL OR NEW.status <> 'published' THEN RETURN NULL; END IF;
  SELECT author_id, title INTO v_author, v_title FROM public.community_posts WHERE id = NEW.post_id;
  PERFORM public.community_notify(v_author, NEW.author_id, 'community_post_commented', NEW.post_id,
    'community:comment:' || NEW.id,
    jsonb_build_object('actor', public.community_display_name(NEW.author_id), 'post_title', left(v_title, 80),
                       'excerpt', left(regexp_replace(NEW.body, '\s+', ' ', 'g'), 120)));
  RETURN NULL;
END $$;

CREATE OR REPLACE TRIGGER community_post_likes_notify AFTER INSERT ON public.community_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.community_trg_post_liked();
CREATE OR REPLACE TRIGGER community_comment_likes_notify AFTER INSERT ON public.community_comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.community_trg_comment_liked();
CREATE OR REPLACE TRIGGER community_comments_notify AFTER INSERT ON public.community_comments
  FOR EACH ROW EXECUTE FUNCTION public.community_trg_comment_added();

REVOKE ALL ON FUNCTION public.community_notify(uuid, uuid, text, uuid, text, jsonb),
  public.community_trg_post_liked(), public.community_trg_comment_liked(), public.community_trg_comment_added()
  FROM PUBLIC, anon, authenticated;
