-- Hardening pass per the performance advisor run right after the core
-- marketplace migration:
-- 1. marketplace_product_user_ratings.user_id had no covering index for its FK.
-- 2. Several tables had a public "anyone can SELECT" policy AND a separate
--    admin/owner "FOR ALL" policy, both permissive and both applying to the
--    authenticated role's SELECT action — Postgres evaluates every
--    permissive policy for a query, so this doubled SELECT policy checks
--    for no benefit (the public policy already covers admins/owners).
--    Splitting the ALL policies into INSERT/UPDATE/DELETE-only removes the
--    overlap while keeping identical write semantics.

CREATE INDEX IF NOT EXISTS idx_marketplace_product_user_ratings_user_id
  ON public.marketplace_product_user_ratings(user_id);

-- marketplace_brands
DROP POLICY IF EXISTS "Admins manage marketplace brands" ON public.marketplace_brands;
CREATE POLICY "Admins insert marketplace brands" ON public.marketplace_brands FOR INSERT
  TO authenticated WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins update marketplace brands" ON public.marketplace_brands FOR UPDATE
  TO authenticated USING (public.has_role((select auth.uid()), 'admin')) WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins delete marketplace brands" ON public.marketplace_brands FOR DELETE
  TO authenticated USING (public.has_role((select auth.uid()), 'admin'));

-- marketplace_products
DROP POLICY IF EXISTS "Admins manage marketplace products" ON public.marketplace_products;
CREATE POLICY "Admins insert marketplace products" ON public.marketplace_products FOR INSERT
  TO authenticated WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins update marketplace products" ON public.marketplace_products FOR UPDATE
  TO authenticated USING (public.has_role((select auth.uid()), 'admin')) WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins delete marketplace products" ON public.marketplace_products FOR DELETE
  TO authenticated USING (public.has_role((select auth.uid()), 'admin'));

-- marketplace_product_images
DROP POLICY IF EXISTS "Admins manage marketplace product images" ON public.marketplace_product_images;
CREATE POLICY "Admins insert marketplace product images" ON public.marketplace_product_images FOR INSERT
  TO authenticated WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins update marketplace product images" ON public.marketplace_product_images FOR UPDATE
  TO authenticated USING (public.has_role((select auth.uid()), 'admin')) WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins delete marketplace product images" ON public.marketplace_product_images FOR DELETE
  TO authenticated USING (public.has_role((select auth.uid()), 'admin'));

-- marketplace_product_ratings
DROP POLICY IF EXISTS "Admins manage external marketplace ratings" ON public.marketplace_product_ratings;
CREATE POLICY "Admins insert external marketplace ratings" ON public.marketplace_product_ratings FOR INSERT
  TO authenticated WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins update external marketplace ratings" ON public.marketplace_product_ratings FOR UPDATE
  TO authenticated USING (public.has_role((select auth.uid()), 'admin')) WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins delete external marketplace ratings" ON public.marketplace_product_ratings FOR DELETE
  TO authenticated USING (public.has_role((select auth.uid()), 'admin'));

-- marketplace_product_user_ratings: owners manage their own row; SELECT
-- already covered by the public policy, so drop it from this one too.
DROP POLICY IF EXISTS "Users manage their own marketplace rating" ON public.marketplace_product_user_ratings;
CREATE POLICY "Users insert their own marketplace rating" ON public.marketplace_product_user_ratings FOR INSERT
  TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users update their own marketplace rating" ON public.marketplace_product_user_ratings FOR UPDATE
  TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users delete their own marketplace rating" ON public.marketplace_product_user_ratings FOR DELETE
  TO authenticated USING ((select auth.uid()) = user_id);
