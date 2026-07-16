
-- 1. Fix preorders_anon_select / preorders_public_select / SUPA_rls_policy_always_true (preorders)
DROP POLICY IF EXISTS "Anyone can count preorders" ON public.preorders;

CREATE OR REPLACE FUNCTION public.get_preorder_count(p_product_type text)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.preorders
  WHERE product_type = p_product_type
    AND status IN ('pending', 'complete');
$$;

-- Allow anon + authenticated to call only this aggregate function
REVOKE ALL ON FUNCTION public.get_preorder_count(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_preorder_count(text) TO anon, authenticated;

-- 2. Fix SUPA_rls_policy_always_true on newsletter_subscribers + openhaus_waitlist
--    Tighten WITH CHECK conditions to add basic validation instead of `true`.
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(email) BETWEEN 3 AND 255
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

DROP POLICY IF EXISTS "Anyone can insert waitlist entries" ON public.openhaus_waitlist;
CREATE POLICY "Anyone can insert waitlist entries"
ON public.openhaus_waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(first_name) BETWEEN 1 AND 100
  AND char_length(last_name) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 255
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(phone) BETWEEN 5 AND 30
  AND char_length(city) BETWEEN 1 AND 100
  AND char_length(country) BETWEEN 1 AND 100
);

-- 3. Fix user_roles_privilege_escalation
--    Add a restrictive policy that explicitly blocks any direct INSERT/UPDATE/DELETE on user_roles
--    by non-admins, regardless of any future permissive policies.
DROP POLICY IF EXISTS "Only admins can modify roles" ON public.user_roles;
CREATE POLICY "Only admins can modify roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix SUPA_anon_security_definer_function_executable / SUPA_authenticated_security_definer_function_executable
--    Revoke EXECUTE on internal SECURITY DEFINER helpers from anon/authenticated.
--    handle_new_user() is called only by an auth trigger; should not be callable from the API.
--    update_updated_at_column() is only used by row triggers; should not be callable from the API.
--    has_role() is called only from RLS policies and edge functions (service role); should not be callable directly.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
