-- 1. Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS billing_interval TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS trial_plan TEXT,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_used_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. AI analysis usage log
CREATE TABLE IF NOT EXISTS public.ai_analysis_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_analysis_uses TO authenticated;
GRANT ALL ON public.ai_analysis_uses TO service_role;
ALTER TABLE public.ai_analysis_uses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own ai usage" ON public.ai_analysis_uses;
CREATE POLICY "Users read own ai usage" ON public.ai_analysis_uses
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 3. Username availability (safe, boolean only)
CREATE OR REPLACE FUNCTION public.is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_username ~ '^[a-zA-Z0-9_]{3,20}$'
     AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(p_username));
$$;
REVOKE ALL ON FUNCTION public.is_username_available(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO anon, authenticated;

-- 4. Profile completeness
CREATE OR REPLACE FUNCTION public.is_profile_complete(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND coalesce(trim(username), '') <> ''
      AND coalesce(trim(full_name), '') <> ''
      AND date_of_birth IS NOT NULL
      AND coalesce(trim(skin_color), '') <> ''
  );
$$;
REVOKE ALL ON FUNCTION public.is_profile_complete(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_profile_complete(UUID) TO authenticated;

-- 5. Signup trigger carries the chosen username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT := nullif(trim(NEW.raw_user_meta_data ->> 'username'), '');
BEGIN
  IF v_username IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(v_username)
  ) THEN
    v_username := v_username || floor(random() * 9000 + 1000)::text;
  END IF;

  INSERT INTO public.profiles (user_id, email, username, full_name)
  VALUES (NEW.id, NEW.email, v_username, nullif(trim(NEW.raw_user_meta_data ->> 'full_name'), ''));
  RETURN NEW;
END;
$$;

-- 6. Privileged column protection (now also trial + billing fields)
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claims', true) IS NULL
     OR coalesce((current_setting('request.jwt.claims', true)::json ->> 'role'), '') = 'service_role'
     OR coalesce(current_setting('app.privileged_write', true), '') = 'on' THEN
    RETURN NEW;
  END IF;
  NEW.subscription_status := OLD.subscription_status;
  NEW.subscription_started_at := OLD.subscription_started_at;
  NEW.billing_interval := OLD.billing_interval;
  NEW.trial_plan := OLD.trial_plan;
  NEW.trial_ends_at := OLD.trial_ends_at;
  NEW.trial_used_at := OLD.trial_used_at;
  RETURN NEW;
END;
$$;

-- 7. One-time free trial
CREATE OR REPLACE FUNCTION public.start_free_trial(p_plan TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_used TIMESTAMPTZ;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_plan <> 'insider' THEN RAISE EXCEPTION 'Invalid trial plan'; END IF;

  SELECT trial_used_at INTO v_used FROM public.profiles WHERE user_id = v_uid;
  IF v_used IS NOT NULL THEN RAISE EXCEPTION 'Free trial already used'; END IF;

  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles
     SET trial_plan = 'insider',
         trial_ends_at = now() + interval '7 days',
         trial_used_at = now()
   WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.start_free_trial(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_free_trial(TEXT) TO authenticated;

-- 8. AI analysis quota: members weekly, free monthly
CREATE OR REPLACE FUNCTION public.register_ai_analysis_use()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_window INTERVAL;
  v_count INT;
BEGIN
  IF v_uid IS NULL THEN RETURN FALSE; END IF;
  v_window := CASE WHEN public.is_member(v_uid) THEN interval '7 days' ELSE interval '30 days' END;

  SELECT count(*) INTO v_count
    FROM public.ai_analysis_uses
   WHERE user_id = v_uid AND used_at > now() - v_window;

  IF v_count >= 1 THEN RETURN FALSE; END IF;

  INSERT INTO public.ai_analysis_uses (user_id) VALUES (v_uid);
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.register_ai_analysis_use() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_ai_analysis_use() TO authenticated;

-- 9. Comments require a completed profile
DROP POLICY IF EXISTS "Members can comment" ON public.news_comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON public.news_comments;
CREATE POLICY "Complete profiles can comment" ON public.news_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_profile_complete(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own review comments" ON public.review_comments;
DROP POLICY IF EXISTS "Members can comment on reviews" ON public.review_comments;
CREATE POLICY "Complete profiles can comment on reviews" ON public.review_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_profile_complete(auth.uid()));