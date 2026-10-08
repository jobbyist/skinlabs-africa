-- Site audit (2026-10-08): fixes from the Supabase security advisor and a grant review.
--
-- 1. review_live_prices was the one SECURITY DEFINER view (advisor ERROR): it ran with its owner's rights. Anon already
--    has SELECT on exactly the marketplace_products columns it reads plus the public read policy, so it can safely run
--    as the caller (security_invoker), like every other public view.
-- 2. Every public view carried INSERT/UPDATE/DELETE/TRUNCATE grants for anon and authenticated (a project-wide default
--    privilege). Two of them (news_articles_public, marketplace_product_internal_rating_summary) are auto-updatable, so
--    those grants were a way to attempt writes through the view. Views are read-only for clients; SELECT is untouched.
-- 3. The two helper functions added with the forum quota / retention work now pin their search_path.

ALTER VIEW public.review_live_prices SET (security_invoker = true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON
  public.conversion_funnel_daily, public.current_product_prices, public.marketplace_product_internal_rating_summary,
  public.news_articles_public, public.review_live_prices, public.sa_retail_prices, public.skynn_fairness_summary
  FROM anon, authenticated;

ALTER FUNCTION public.community_media_quota_bytes() SET search_path = '';
ALTER FUNCTION public.community_retention_days() SET search_path = '';
