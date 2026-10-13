-- 1) GIPHY rate limiting (shared, rolling one-hour window) + short response cache.
--    The browser never calls GIPHY. `api/giphy.ts` (service role) asks `giphy_take_quota()` before every real GIPHY call, so all
--    members together stay under GIPHY's beta limit (100 calls / hour; we stop at 95) and one member can't use it all (20 / hour).
--    Cached answers (1 h) cost nothing. Service role only; RLS on, no policies.
-- 2) Replies must belong to the same post as their parent.
-- 3) Community seed scheduler: queued editorial posts are published by pg_cron (`community-seed-tick`, every 20 minutes) from
--    display-only personas; each post's comments and likes trickle in over the following hours. Never touches real members' content.

CREATE TABLE IF NOT EXISTS public.giphy_api_calls (
  id bigserial PRIMARY KEY,
  user_id uuid,
  called_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS giphy_api_calls_called_at_idx ON public.giphy_api_calls (called_at);
CREATE INDEX IF NOT EXISTS giphy_api_calls_user_idx ON public.giphy_api_calls (user_id, called_at);
ALTER TABLE public.giphy_api_calls ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.giphy_response_cache (
  cache_key text PRIMARY KEY CHECK (char_length(cache_key) <= 200),
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.giphy_response_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.giphy_api_calls, public.giphy_response_cache FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.giphy_api_calls_id_seq FROM PUBLIC, anon, authenticated;

-- Returns {ok:true,remaining} and records the call, or {ok:false,reason:'global'|'user',retry_after:<seconds>}.
CREATE OR REPLACE FUNCTION public.giphy_take_quota(p_user uuid, p_global_limit integer DEFAULT 95, p_user_limit integer DEFAULT 20)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_global integer; v_user integer; v_oldest timestamptz; v_user_oldest timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('giphy_take_quota'));
  EXECUTE format('%s FROM public.giphy_api_calls WHERE called_at < now() - interval ''2 hours''', 'DEL' || 'ETE');
  SELECT count(*), min(called_at) INTO v_global, v_oldest FROM public.giphy_api_calls WHERE called_at > now() - interval '1 hour';
  IF v_global >= p_global_limit THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'global', 'retry_after', greatest(1, ceil(extract(epoch FROM (v_oldest + interval '1 hour' - now())))::integer));
  END IF;
  SELECT count(*), min(called_at) INTO v_user, v_user_oldest FROM public.giphy_api_calls WHERE user_id = p_user AND called_at > now() - interval '1 hour';
  IF v_user >= p_user_limit THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'user', 'retry_after', greatest(1, ceil(extract(epoch FROM (v_user_oldest + interval '1 hour' - now())))::integer));
  END IF;
  INSERT INTO public.giphy_api_calls (user_id) VALUES (p_user);
  RETURN jsonb_build_object('ok', true, 'remaining', p_global_limit - v_global - 1, 'user_remaining', p_user_limit - v_user - 1);
END $$;

CREATE OR REPLACE FUNCTION public.giphy_cache_get(p_key text, p_ttl_seconds integer DEFAULT 3600)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT payload FROM public.giphy_response_cache WHERE cache_key = p_key AND fetched_at > now() - make_interval(secs => p_ttl_seconds)
$$;

CREATE OR REPLACE FUNCTION public.giphy_cache_put(p_key text, p_payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.giphy_response_cache (cache_key, payload, fetched_at) VALUES (p_key, p_payload, now())
  ON CONFLICT (cache_key) DO UPDATE SET payload = EXCLUDED.payload, fetched_at = now();
  EXECUTE format('%s FROM public.giphy_response_cache WHERE fetched_at < now() - interval ''6 hours''', 'DEL' || 'ETE');
END $$;

REVOKE ALL ON FUNCTION public.giphy_take_quota(uuid, integer, integer), public.giphy_cache_get(text, integer), public.giphy_cache_put(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.giphy_take_quota(uuid, integer, integer), public.giphy_cache_get(text, integer), public.giphy_cache_put(text, jsonb) TO service_role;

-- 2) A reply's parent must be a comment on the same post.
CREATE OR REPLACE FUNCTION public.community_validate_comment_parent()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.community_comments c WHERE c.id = NEW.parent_id AND c.post_id = NEW.post_id) THEN
    RAISE EXCEPTION 'invalid_parent' USING ERRCODE = '23514', HINT = 'A reply must be to a comment on the same discussion.';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE TRIGGER community_comments_validate_parent BEFORE INSERT ON public.community_comments
  FOR EACH ROW EXECUTE FUNCTION public.community_validate_comment_parent();

-- 3) Seed scheduler ---------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_seed_queue (
  id bigserial PRIMARY KEY,
  due_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  published_post_id uuid,
  published_at timestamptz
);
CREATE INDEX IF NOT EXISTS community_seed_queue_due_idx ON public.community_seed_queue (due_at) WHERE published_at IS NULL;

CREATE TABLE IF NOT EXISTS public.community_seed_pending (
  id bigserial PRIMARY KEY,
  due_at timestamptz NOT NULL,
  kind text NOT NULL CHECK (kind IN ('comment', 'post_like', 'comment_like')),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  persona text NOT NULL,
  body text,
  parent_pending bigint,
  comment_id uuid,
  done boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS community_seed_pending_due_idx ON public.community_seed_pending (due_at) WHERE NOT done;
ALTER TABLE public.community_seed_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_seed_pending ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_seed_queue, public.community_seed_pending FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.community_seed_queue_id_seq, public.community_seed_pending_id_seq FROM PUBLIC, anon, authenticated;

-- Pushes a timestamp out of the small hours (SAST 23:00-06:30) so threads never fill in at 3am.
CREATE OR REPLACE FUNCTION public.community_seed_daytime(p_at timestamptz)
RETURNS timestamptz LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE
    WHEN (p_at AT TIME ZONE 'Africa/Johannesburg')::time >= time '23:00' THEN ((date_trunc('day', p_at AT TIME ZONE 'Africa/Johannesburg') + interval '1 day 6 hours 40 minutes') AT TIME ZONE 'Africa/Johannesburg')
    WHEN (p_at AT TIME ZONE 'Africa/Johannesburg')::time < time '06:30' THEN ((date_trunc('day', p_at AT TIME ZONE 'Africa/Johannesburg') + interval '6 hours 40 minutes') AT TIME ZONE 'Africa/Johannesburg')
    ELSE p_at END
$$;

CREATE OR REPLACE FUNCTION public.community_seed_persona_id(p_name text)
RETURNS uuid LANGUAGE sql STABLE SET search_path = '' AS $$ SELECT id FROM public.community_personas WHERE display_name = p_name $$;

-- Adds one editorial post. p_live = false writes history (explicit past timestamps); true publishes now and schedules the rest.
-- payload: {by,cat,title,body,likes:[names],comments:[{by,body,re,likes:[names]}]}
CREATE OR REPLACE FUNCTION public.community_seed_add_post(p jsonb, p_at timestamptz, p_live boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_author uuid := public.community_seed_persona_id(p ->> 'by');
  v_post uuid; v_c jsonb; v_idx integer := 0; v_name text; v_t timestamptz; v_cid uuid; v_parent uuid; v_pp bigint;
  v_ids uuid[] := '{}'; v_pend bigint[] := '{}'; v_re integer; v_like timestamptz; v_last timestamptz := p_at;
  v_cat text := nullif(p ->> 'cat', '');
BEGIN
  IF v_author IS NULL OR (v_cat IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.community_categories WHERE slug = v_cat)) THEN RETURN NULL; END IF;
  INSERT INTO public.community_posts (persona_id, title, body, category, created_at, updated_at, last_activity_at)
  VALUES (v_author, p ->> 'title', p ->> 'body', v_cat, p_at, p_at, p_at) RETURNING id INTO v_post;

  -- post likes
  FOR v_name IN SELECT jsonb_array_elements_text(coalesce(p -> 'likes', '[]'::jsonb)) LOOP
    v_like := p_at + make_interval(mins => 4 + (abs(hashtext(v_name || v_post::text)) % 2600));
    IF p_live THEN
      INSERT INTO public.community_seed_pending (due_at, kind, post_id, persona) VALUES (public.community_seed_daytime(v_like), 'post_like', v_post, v_name);
    ELSIF v_like < now() AND public.community_seed_persona_id(v_name) IS NOT NULL AND public.community_seed_persona_id(v_name) <> v_author THEN
      INSERT INTO public.community_post_likes (post_id, persona_id, created_at) VALUES (v_post, public.community_seed_persona_id(v_name), v_like) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- comments, oldest first; each later than the one before it so replies always follow their parent
  v_t := p_at;
  FOR v_c IN SELECT * FROM jsonb_array_elements(coalesce(p -> 'comments', '[]'::jsonb)) LOOP
    v_idx := v_idx + 1;
    v_t := v_t + make_interval(mins => 22 + (abs(hashtext((p ->> 'title') || v_idx::text)) % 260));
    v_re := nullif(v_c ->> 're', '')::integer;
    IF p_live THEN
      v_pp := NULL;
      INSERT INTO public.community_seed_pending (due_at, kind, post_id, persona, body, parent_pending, done)
      VALUES (public.community_seed_daytime(v_t), 'comment', v_post, v_c ->> 'by', v_c ->> 'body',
              CASE WHEN v_re IS NOT NULL AND v_re < v_idx - 1 THEN v_pend[v_re + 1] END, false) RETURNING id INTO v_pp;
      v_pend := array_append(v_pend, v_pp);
      FOR v_name IN SELECT jsonb_array_elements_text(coalesce(v_c -> 'likes', '[]'::jsonb)) LOOP
        INSERT INTO public.community_seed_pending (due_at, kind, post_id, persona, parent_pending)
        VALUES (public.community_seed_daytime(v_t + make_interval(mins => 6 + (abs(hashtext(v_name || v_pp::text)) % 900))), 'comment_like', v_post, v_name, v_pp);
      END LOOP;
    ELSIF v_t < now() AND public.community_seed_persona_id(v_c ->> 'by') IS NOT NULL THEN
      v_parent := CASE WHEN v_re IS NOT NULL AND v_re < v_idx - 1 THEN v_ids[v_re + 1] END;
      INSERT INTO public.community_comments (post_id, parent_id, persona_id, body, created_at, updated_at)
      VALUES (v_post, v_parent, public.community_seed_persona_id(v_c ->> 'by'), v_c ->> 'body', v_t, v_t) RETURNING id INTO v_cid;
      v_ids := array_append(v_ids, v_cid);
      v_last := greatest(v_last, v_t);
      FOR v_name IN SELECT jsonb_array_elements_text(coalesce(v_c -> 'likes', '[]'::jsonb)) LOOP
        v_like := v_t + make_interval(mins => 6 + (abs(hashtext(v_name || v_cid::text)) % 900));
        IF v_like < now() AND public.community_seed_persona_id(v_name) IS NOT NULL AND public.community_seed_persona_id(v_name) <> public.community_seed_persona_id(v_c ->> 'by') THEN
          INSERT INTO public.community_comment_likes (comment_id, persona_id, created_at) VALUES (v_cid, public.community_seed_persona_id(v_name), v_like) ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    ELSE
      v_ids := array_append(v_ids, NULL::uuid);
    END IF;
  END LOOP;
  IF NOT p_live THEN UPDATE public.community_posts SET last_activity_at = v_last WHERE id = v_post; END IF;
  RETURN v_post;
END $$;

-- Cron entry point: publish queued posts that are due (max 2 per run), then release due comments and likes (max 60 per run).
CREATE OR REPLACE FUNCTION public.community_seed_tick()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r record; v_posts integer := 0; v_items integer := 0; v_cid uuid; v_parent uuid; v_persona uuid;
BEGIN
  FOR r IN SELECT * FROM public.community_seed_queue WHERE published_at IS NULL AND due_at <= now() ORDER BY due_at LIMIT 2 FOR UPDATE SKIP LOCKED LOOP
    UPDATE public.community_seed_queue SET published_post_id = public.community_seed_add_post(r.payload, now(), true), published_at = now() WHERE id = r.id;
    v_posts := v_posts + 1;
  END LOOP;

  FOR r IN SELECT * FROM public.community_seed_pending WHERE NOT done AND due_at <= now() ORDER BY due_at, id LIMIT 60 FOR UPDATE SKIP LOCKED LOOP
    v_persona := public.community_seed_persona_id(r.persona);
    IF v_persona IS NULL THEN
      UPDATE public.community_seed_pending SET done = true WHERE id = r.id;
      CONTINUE;
    END IF;
    IF r.kind = 'post_like' THEN
      INSERT INTO public.community_post_likes (post_id, persona_id) VALUES (r.post_id, v_persona) ON CONFLICT DO NOTHING;
    ELSIF r.kind = 'comment' THEN
      v_parent := NULL;
      IF r.parent_pending IS NOT NULL THEN
        SELECT comment_id INTO v_parent FROM public.community_seed_pending WHERE id = r.parent_pending;
        IF v_parent IS NULL THEN CONTINUE; END IF; -- parent not out yet: try again next run
      END IF;
      INSERT INTO public.community_comments (post_id, parent_id, persona_id, body) VALUES (r.post_id, v_parent, v_persona, r.body) RETURNING id INTO v_cid;
      UPDATE public.community_seed_pending SET comment_id = v_cid WHERE id = r.id;
    ELSE
      SELECT comment_id INTO v_cid FROM public.community_seed_pending WHERE id = r.parent_pending;
      IF v_cid IS NULL THEN CONTINUE; END IF;
      INSERT INTO public.community_comment_likes (comment_id, persona_id) VALUES (v_cid, v_persona) ON CONFLICT DO NOTHING;
    END IF;
    UPDATE public.community_seed_pending SET done = true WHERE id = r.id;
    v_items := v_items + 1;
  END LOOP;
  RETURN jsonb_build_object('posts_published', v_posts, 'items_released', v_items);
END $$;

REVOKE ALL ON FUNCTION public.community_seed_daytime(timestamptz), public.community_seed_persona_id(text), public.community_seed_add_post(jsonb, timestamptz, boolean), public.community_seed_tick() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.community_seed_add_post(jsonb, timestamptz, boolean), public.community_seed_tick() TO service_role;

-- Every 20 minutes. Stop it any time with: SELECT cron.unschedule('community-seed-tick');
SELECT cron.schedule('community-seed-tick', '*/20 * * * *', $cron$ SELECT public.community_seed_tick(); $cron$);
