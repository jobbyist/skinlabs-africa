DROP POLICY IF EXISTS "Anyone can read review comments" ON public.review_comments;
REVOKE SELECT ON public.review_comments FROM anon;
CREATE POLICY "Signed-in users can read review comments" ON public.review_comments FOR SELECT TO authenticated USING (true);