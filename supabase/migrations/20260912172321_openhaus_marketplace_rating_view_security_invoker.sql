-- Advisor flagged marketplace_product_internal_rating_summary as an
-- implicit SECURITY DEFINER view (Postgres views default to the creator's
-- privileges, not the querying user's, which can bypass RLS on the
-- underlying marketplace_product_user_ratings table). Force invoker rights
-- so it evaluates as the querying role, matching this table's own RLS.
ALTER VIEW public.marketplace_product_internal_rating_summary SET (security_invoker = true);
