-- Admin user management: a real user directory (search/paginate instead of
-- the client shipping every row of `profiles`), role management, and a
-- manual entitlement-override escape hatch for support cases -- see
-- src/components/admin/UsersTab.tsx for the consumer.
--
-- Every privileged write here goes through a SECURITY DEFINER RPC that
-- checks has_role(auth.uid(), 'admin') itself (never trusts RLS alone) and
-- writes one row to admin_audit_log, so every grant/revoke/override is
-- traceable to who did what to whom and why.

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('role_grant', 'role_revoke', 'entitlement_override')),
  target_user_id uuid NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.admin_audit_log IS 'Append-only trail of admin_set_user_role/admin_override_entitlement calls. Written only by those SECURITY DEFINER functions -- no direct grants to anon/authenticated.';

CREATE INDEX idx_admin_audit_log_target_user ON public.admin_audit_log (target_user_id, created_at DESC);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read the audit log"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- No INSERT/UPDATE/DELETE policy or grant for anon/authenticated: rows are
-- only ever written by the SECURITY DEFINER functions below, which run as
-- the table owner and so don't need a table-level grant to do it.

-- ---------------------------------------------------------------------------
-- admin_search_profiles: paginated, searched profile directory. Returns only
-- the columns the Users tab actually needs -- never a bare `select("*")` on
-- profiles from the client, which is what this replaces in AdminDashboard.tsx.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_search_profiles(
  _query text DEFAULT NULL,
  _page int DEFAULT 0,
  _page_size int DEFAULT 25
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  subscription_status text,
  founding_member boolean,
  account_status text,
  created_at timestamptz,
  roles public.app_role[],
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  RETURN QUERY
  WITH matched AS (
    SELECT p.id, p.user_id, p.email, p.full_name, p.subscription_status,
           p.founding_member, p.account_status, p.created_at
    FROM public.profiles p
    WHERE _query IS NULL OR _query = ''
       OR p.email ILIKE '%' || _query || '%'
       OR p.full_name ILIKE '%' || _query || '%'
       OR p.username ILIKE '%' || _query || '%'
  ),
  counted AS (SELECT count(*) AS total_count FROM matched)
  SELECT m.id, m.user_id, m.email, m.full_name, m.subscription_status,
         m.founding_member, m.account_status, m.created_at,
         COALESCE(
           (SELECT array_agg(ur.role) FROM public.user_roles ur WHERE ur.user_id = m.user_id),
           ARRAY[]::public.app_role[]
         ) AS roles,
         counted.total_count
  FROM matched m, counted
  ORDER BY m.created_at DESC
  LIMIT GREATEST(_page_size, 1)
  OFFSET GREATEST(_page, 0) * GREATEST(_page_size, 1);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_search_profiles(text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search_profiles(text, int, int) TO authenticated;

-- ---------------------------------------------------------------------------
-- admin_set_user_role: grant or revoke admin/moderator. Refuses to let an
-- admin revoke their own admin role -- the one guard against a self-inflicted
-- lockout, since nothing else in this schema can re-grant it afterwards.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  _target_user_id uuid,
  _role public.app_role,
  _grant boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  IF NOT _grant AND _role = 'admin' AND _target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot revoke your own admin role';
  END IF;

  IF _grant THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_target_user_id, _role)
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _target_user_id AND role = _role;
  END IF;

  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, detail)
  VALUES (auth.uid(), CASE WHEN _grant THEN 'role_grant' ELSE 'role_revoke' END, _target_user_id,
          jsonb_build_object('role', _role));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.app_role, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.app_role, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- admin_override_entitlement: a support escape hatch, not a payment path.
-- Never touches payment_transactions (that table stays authoritative for
-- what was actually paid) -- this only ever writes profiles.subscription_status,
-- always with a required, logged reason.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_override_entitlement(
  _target_user_id uuid,
  _subscription_status text,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  IF _reason IS NULL OR btrim(_reason) = '' THEN
    RAISE EXCEPTION 'A reason is required for a manual entitlement override';
  END IF;

  IF _subscription_status NOT IN ('free', 'glow_lite', 'insider', 'vip') THEN
    RAISE EXCEPTION 'Unsupported subscription_status for a manual override: %', _subscription_status;
  END IF;

  UPDATE public.profiles
  SET subscription_status = _subscription_status
  WHERE user_id = _target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No profile found for that user';
  END IF;

  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, detail)
  VALUES (auth.uid(), 'entitlement_override', _target_user_id,
          jsonb_build_object('subscription_status', _subscription_status, 'reason', _reason));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_override_entitlement(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_override_entitlement(uuid, text, text) TO authenticated;
