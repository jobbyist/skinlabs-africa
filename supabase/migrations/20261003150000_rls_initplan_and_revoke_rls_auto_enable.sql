-- Wrap auth.uid() in (select ...) so Postgres evaluates it once per statement, not per row.
DO $$
DECLARE r record; q text; w text; stmt text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check FROM pg_policies
    WHERE schemaname = 'public'
      AND ((coalesce(qual,'') ~ 'auth\.uid\(\)' AND coalesce(qual,'') !~ 'SELECT auth\.')
        OR (coalesce(with_check,'') ~ 'auth\.uid\(\)' AND coalesce(with_check,'') !~ 'SELECT auth\.'))
  LOOP
    q := CASE WHEN r.qual IS NULL THEN NULL ELSE regexp_replace(r.qual, 'auth\.uid\(\)', '(select auth.uid())', 'g') END;
    w := CASE WHEN r.with_check IS NULL THEN NULL ELSE regexp_replace(r.with_check, 'auth\.uid\(\)', '(select auth.uid())', 'g') END;
    stmt := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    IF q IS NOT NULL THEN stmt := stmt || ' USING (' || q || ')'; END IF;
    IF w IS NOT NULL THEN stmt := stmt || ' WITH CHECK (' || w || ')'; END IF;
    EXECUTE stmt;
  END LOOP;
END $$;

-- Event-trigger helper; must not be callable through the REST API.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
