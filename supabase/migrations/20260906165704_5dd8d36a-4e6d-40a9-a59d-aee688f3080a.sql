-- 1. Free trial: actually flip the account into trial access
CREATE OR REPLACE FUNCTION public.start_free_trial(p_plan text)
RETURNS boolean
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
     SET subscription_status = 'trial',
         subscription_started_at = COALESCE(subscription_started_at, now()),
         trial_plan = 'insider',
         trial_ends_at = now() + interval '7 days',
         trial_used_at = now()
   WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN TRUE;
END;
$$;

-- 2. Expire trials server-side once the 7 days are up
CREATE OR REPLACE FUNCTION public.expire_finished_trials()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles
     SET subscription_status = 'free'
   WHERE lower(coalesce(subscription_status, '')) = 'trial'
     AND trial_ends_at IS NOT NULL
     AND trial_ends_at <= now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  PERFORM set_config('app.privileged_write', 'off', true);
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_finished_trials() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('expire-free-trials')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-free-trials');

SELECT cron.schedule('expire-free-trials', '7 * * * *', $$SELECT public.expire_finished_trials();$$);

-- 3. Column-level protection for profiles (no reliance on the trigger alone)
REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;
GRANT INSERT (user_id, email, full_name, phone, date_of_birth, gender, race_ethnicity,
              skin_color, allergies, skin_conditions, preferred_routine_time, notes, username)
  ON public.profiles TO authenticated;
GRANT UPDATE (email, full_name, phone, date_of_birth, gender, race_ethnicity,
              skin_color, allergies, skin_conditions, preferred_routine_time, notes, username, updated_at)
  ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Column-level protection for preorders
REVOKE INSERT, UPDATE ON public.preorders FROM authenticated;
GRANT INSERT (user_id, product_type) ON public.preorders TO authenticated;
GRANT ALL ON public.preorders TO service_role;

DROP POLICY IF EXISTS "Users can insert their own pending preorders" ON public.preorders;
CREATE POLICY "Users can insert their own pending preorders"
  ON public.preorders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
