-- Advisor fixes for the Advanced Assessment engine tables, per
-- get_advisors(security) and get_advisors(performance) run right after
-- 20260916164921/20260916165245 landed:
--   1. Covering indexes for every FK the advisor flagged as missing one.
--   2. RLS admin policies rewritten to (select auth.uid()) instead of a
--      bare auth.uid() call, so the planner evaluates it once per query
--      instead of once per row — same fix pattern documented in CLAUDE.md
--      and already applied elsewhere in this project (e.g.
--      20260908160000_dashboard_redesign_hardening.sql).
-- The "multiple permissive SELECT policies" and "unused index" advisor
-- notes are expected/left as-is: every other admin-visibility table in this
-- project (e.g. skynn_fairness_events) uses the same separate
-- owner-policy + admin-policy shape, and a brand-new, still-untrafficked
-- table will always show its indexes as "unused" until real queries run
-- against it.

CREATE INDEX idx_advanced_assessment_events_user ON public.advanced_assessment_events (user_id);
CREATE INDEX idx_advanced_assessment_evidence_verified_by ON public.advanced_assessment_evidence (verified_by);
CREATE INDEX idx_advanced_assessment_sessions_definition ON public.advanced_assessment_sessions (assessment_definition_id);
CREATE INDEX idx_advanced_assessment_sessions_pass_transaction ON public.advanced_assessment_sessions (pass_transaction_id);
CREATE INDEX idx_skynn_advanced_assessment_config_definition_version ON public.skynn_advanced_assessment_config (active_definition_version);
CREATE INDEX idx_skynn_advanced_assessment_config_prompt_version ON public.skynn_advanced_assessment_config (active_prompt_version);

DROP POLICY "Admins can read all evidence" ON public.advanced_assessment_evidence;
CREATE POLICY "Admins can read all evidence"
  ON public.advanced_assessment_evidence FOR SELECT
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

DROP POLICY "Admins can read all assessment sessions" ON public.advanced_assessment_sessions;
CREATE POLICY "Admins can read all assessment sessions"
  ON public.advanced_assessment_sessions FOR SELECT
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

DROP POLICY "Admins can read all assessment reports" ON public.advanced_assessment_reports;
CREATE POLICY "Admins can read all assessment reports"
  ON public.advanced_assessment_reports FOR SELECT
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

DROP POLICY "Admins can read assessment events" ON public.advanced_assessment_events;
CREATE POLICY "Admins can read assessment events"
  ON public.advanced_assessment_events FOR SELECT
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

DROP POLICY "Admins can read all assessment definitions" ON public.assessment_definitions;
CREATE POLICY "Admins can read all assessment definitions"
  ON public.assessment_definitions FOR SELECT
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));
