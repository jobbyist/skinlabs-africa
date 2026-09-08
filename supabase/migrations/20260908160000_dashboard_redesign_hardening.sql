-- Hardening pass on 20260908150000_user_dashboard_redesign.sql, per the
-- Supabase security/performance advisors run right after that migration
-- landed:
--
-- 1. notify_credit_grant/notify_new_recommendation/notify_subscription_change
--    are trigger functions (RETURNS trigger) — Postgres already refuses to
--    call them outside a trigger context, but they were missing the same
--    REVOKE ALL FROM PUBLIC, anon, authenticated that create_notification
--    already has, which is why the advisor could see them as callable via
--    PostgREST's /rest/v1/rpc/<fn> endpoint. Defence in depth, not a live
--    exploit — matches the pattern already used elsewhere in this schema.
--
-- 2. Every new RLS policy compared auth.uid() directly, which Postgres
--    re-evaluates per row; wrapping it as (select auth.uid()) lets the
--    planner evaluate it once per query instead. Standard Supabase
--    performance-linter guidance, applied here before any of these tables
--    carry real traffic.
--
-- 3. routine_checkins.step_id had no covering index for its foreign key.

REVOKE ALL ON FUNCTION public.notify_credit_grant() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_new_recommendation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_subscription_change() FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_routine_checkins_step_id ON public.routine_checkins(step_id);

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can mark their own notifications read" ON public.notifications;
CREATE POLICY "Users can mark their own notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage their own waitlist entries" ON public.feature_waitlist;
CREATE POLICY "Users manage their own waitlist entries"
  ON public.feature_waitlist FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view their own transactions"
  ON public.payment_transactions FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage their own routine steps" ON public.routine_steps;
CREATE POLICY "Users manage their own routine steps"
  ON public.routine_steps FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage their own routine checkins" ON public.routine_checkins;
CREATE POLICY "Users manage their own routine checkins"
  ON public.routine_checkins FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
