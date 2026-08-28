-- Glow VIP's free trial is discontinued: VIP now goes straight to a paid subscription,
-- backed by the 30-day money-back guarantee applied to every paid plan instead of a
-- trial period. Glow Insider keeps its 7-day free trial unchanged.
CREATE OR REPLACE FUNCTION public.start_free_trial(p_plan text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_plan <> 'insider' THEN
    RAISE EXCEPTION 'trial not available for this plan';
  END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  UPDATE public.profiles
     SET subscription_status = 'trial',
         trial_plan = p_plan,
         trial_started_at = now(),
         trial_ends_at = now() + interval '7 days',
         trial_used_at = now()
   WHERE user_id = auth.uid()
     AND trial_used_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'trial already used';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.start_free_trial(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_free_trial(text) TO authenticated;
