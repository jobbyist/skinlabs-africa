-- Run each block against the SOURCE project. Each returns a single text
-- column of DDL. Copy that output and run it against the TARGET project
-- after the migrations in supabase/migrations/ have been applied.

-- 1. Enum types -------------------------------------------------------------
select string_agg(
  format('DO $$ BEGIN CREATE TYPE public.%I AS ENUM (%s); EXCEPTION WHEN duplicate_object THEN NULL; END $$;',
         t.typname,
         (select string_agg(quote_literal(e.enumlabel), ', ' order by e.enumsortorder)
            from pg_enum e where e.enumtypid = t.oid)),
  chr(10))
from pg_type t
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public' and t.typtype = 'e';

-- 2. Function definitions (authoritative, supersedes the migrations) --------
select string_agg(pg_get_functiondef(p.oid) || ';', chr(10) || chr(10))
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prolang <> (select oid from pg_language where lanname = 'c');

-- 3. Views ------------------------------------------------------------------
select string_agg(
  format('CREATE OR REPLACE VIEW public.%I WITH (security_invoker = true) AS %s',
         c.relname, pg_get_viewdef(c.oid, true)),
  chr(10) || chr(10))
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v';

-- 4. RLS enable + table grants ---------------------------------------------
select string_agg(stmt, chr(10)) from (
  select format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', schemaname, tablename) as stmt
    from pg_tables where schemaname = 'public' and rowsecurity
) x;

select string_agg(format('GRANT %s ON public.%I TO %I;', privs, table_name, grantee), chr(10))
from (
  select table_name, grantee, string_agg(distinct privilege_type, ', ') as privs
  from information_schema.role_table_grants
  where table_schema = 'public' and grantee in ('anon', 'authenticated', 'service_role')
  group by table_name, grantee
) g;

-- 5. Policies ---------------------------------------------------------------
select string_agg(
  format('DROP POLICY IF EXISTS %I ON %I.%I;' || chr(10) ||
         'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s;',
         policyname, schemaname, tablename,
         policyname, schemaname, tablename, permissive, cmd,
         array_to_string(roles, ', '),
         coalesce(' USING (' || qual || ')', ''),
         coalesce(' WITH CHECK (' || with_check || ')', '')),
  chr(10))
from pg_policies where schemaname in ('public', 'storage');

-- 6. Function-level REVOKE/GRANT (security hardening) -----------------------
select string_agg(
  format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated;',
         p.proname, pg_get_function_identity_arguments(p.oid)),
  chr(10))
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('handle_new_user', 'protect_profile_privileged_columns',
                    'protect_preorder_privileged_columns',
                    'enforce_partner_enquiry_rate_limit', 'expire_finished_trials',
                    'grant_ai_credits', 'claim_founding_member_slot');
