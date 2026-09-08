CREATE OR REPLACE FUNCTION public.available_ai_credits(_user_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target uuid;
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user = 'service_role' THEN
    v_target := COALESCE(_user_id, auth.uid());
  ELSE
    IF auth.uid() IS NULL THEN
      RETURN 0;
    END IF;
    IF _user_id IS NOT NULL AND _user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Not authorised to read another account''s credit balance';
    END IF;
    v_target := auth.uid();
  END IF;

  RETURN COALESCE((
    SELECT SUM(delta)
      FROM public.ai_credit_transactions
     WHERE user_id = v_target
       AND (expires_at IS NULL OR expires_at > now())
  ), 0)::int;
END;
$$;

REVOKE ALL ON FUNCTION public.available_ai_credits(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.available_ai_credits(uuid) TO authenticated, service_role;

DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.enforce_partner_enquiry_rate_limit()',
    'public.protect_preorder_privileged_columns()',
    'public.protect_profile_privileged_columns()',
    'public.handle_new_user()'
  ] LOOP
    IF to_regprocedure(fn) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    END IF;
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.start_free_trial(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_free_trial(text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.register_ai_analysis_use() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_ai_analysis_use() TO authenticated, service_role;

ALTER VIEW public.current_product_prices SET (security_invoker = true);