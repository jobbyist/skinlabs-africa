-- 1) is_member / is_professional_account / is_profile_complete took any user id, so a
--    signed-in (or anonymous) API caller could probe another person's membership,
--    professional flag or profile completeness by UUID. They stay callable (RLS
--    policies and server code use them) but a client role (anon / authenticated) now only
--    gets an answer about itself; service_role and internal callers are unchanged.
CREATE OR REPLACE FUNCTION public.is_member(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.role() IN ('anon', 'authenticated') AND _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND (
        lower(coalesce(subscription_status, '')) IN ('active', 'insider', 'vip', 'premium')
        OR (lower(coalesce(subscription_status, '')) = 'trial' AND trial_ends_at IS NOT NULL AND trial_ends_at > now())
      )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_professional_account(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.role() IN ('anon', 'authenticated') AND _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND is_professional = true);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_profile_complete(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.role() IN ('anon', 'authenticated') AND _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND coalesce(trim(username), '') <> ''
      AND coalesce(trim(full_name), '') <> ''
      AND date_of_birth IS NOT NULL
      AND coalesce(trim(skin_color), '') <> ''
  );
END;
$$;

-- 2) Admin read of the waitlist behind the "Coming soon" dermatologist-messaging card. The
--    table only holds user ids (members manage their own rows), so this RPC adds the contact
--    details an admin needs. Admin-gated inside; no client role can call it usefully.
CREATE OR REPLACE FUNCTION public.admin_list_feature_waitlist(p_feature text DEFAULT NULL, p_limit integer DEFAULT 200)
RETURNS TABLE (user_id uuid, feature_key text, created_at timestamptz, email text, full_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorised' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT w.user_id, w.feature_key, w.created_at, u.email::text, p.full_name
      FROM public.feature_waitlist w
      LEFT JOIN auth.users u ON u.id = w.user_id
      LEFT JOIN public.profiles p ON p.user_id = w.user_id
     WHERE p_feature IS NULL OR w.feature_key = p_feature
     ORDER BY w.created_at DESC
     LIMIT least(greatest(coalesce(p_limit, 200), 1), 500);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_feature_waitlist(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_feature_waitlist(text, integer) TO authenticated, service_role;
