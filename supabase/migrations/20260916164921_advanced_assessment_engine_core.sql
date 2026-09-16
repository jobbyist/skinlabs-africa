-- SKYNN AI Advanced Dermatology Assessment Engine — core schema.
--
-- Backend foundation for a Claude-powered "Advanced AI Dermatology Report",
-- distinct from (and building on) the existing free Starter Analysis
-- (skincare_recommendations) and the existing live-AI path (skincare-ai edge
-- function). This is a structured assessment + reasoning system, not a
-- chatbot: sessions collect richer, versioned skin-profile data through a
-- controlled question library, submission triggers server-side generation
-- through a provider-abstracted Claude call, and the result is validated
-- against a strict report schema before persistence.
--
-- Reuses existing infrastructure rather than duplicating it:
--   - public.is_member(uuid)              — Insider/VIP membership check
--   - public.consume_analysis_pass()      — atomic Analysis Pass spend
--   - public.refund_analysis_pass(uuid)   — refund on failed generation
--   - public.has_role(uuid, app_role)     — admin visibility
--   - profiles.date_of_birth/city/province — reused for sanitised
--     age-range/geographic context instead of re-collecting it in the
--     assessment itself (see the seed migration's identity/context section).
--
-- Feature-flagged: skynn_advanced_assessment_config.rollout_stage defaults to
-- 'disabled'. Nothing in the existing app calls this schema or the edge
-- function that reads it until SkinLabs explicitly flips that flag —
-- shipping this migration changes no live user-facing behaviour.
--
-- IMPORTANT — proprietary methodology boundary (see assessment_prompt_versions
-- below and CLAUDE.md): the actual dermatologist-approved SKYNN methodology
-- and system prompt do not exist in this repository. This migration creates
-- the secure registry/interface boundary for them, seeded with a placeholder
-- that the generation path refuses to run against. No clinical prompt content
-- is fabricated here.

-- ---------- Question library (versioned, admin-authored) ----------
-- Full section/question/condition tree lives in `sections` as one JSON
-- document per version — same "evolving structured shape, one JSON column"
-- precedent as skincare_recommendations.result_payload
-- (20260908010000_skynn_starter_analysis_2_0.sql) rather than exploding into
-- a normalised questions table, since the shape is still versioned and
-- expected to change. A definition is immutable once any session references
-- it (enforced at the application layer, not the DB) — publish a new version
-- rather than editing an active one, so historical sessions stay interpretable.
CREATE TABLE public.assessment_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  version text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'deprecated')),
  title text NOT NULL,
  sections jsonb NOT NULL,
  question_library_version text NOT NULL,
  scoring_rules_version text NOT NULL,
  evidence_version text NOT NULL,
  notes text
);

COMMENT ON TABLE public.assessment_definitions IS 'Versioned Advanced Assessment question library (sections -> questions -> options/conditions), one immutable JSON document per version. Public-readable (needed to render the assessment UI) — contains no proprietary clinical methodology, only the data-collection form structure.';
COMMENT ON COLUMN public.assessment_definitions.sections IS 'Full AssessmentDefinition tree: [{ id, title, questions: [{ id, type, required, prompt, helperText, options, next, showIf }] }]. Never mutate an active version in place — publish a new version.';

CREATE INDEX idx_assessment_definitions_status ON public.assessment_definitions (status);

ALTER TABLE public.assessment_definitions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.assessment_definitions TO anon, authenticated;
CREATE POLICY "Anyone can read active assessment definitions"
  ON public.assessment_definitions FOR SELECT
  TO anon, authenticated
  USING (status IN ('active', 'deprecated'));
CREATE POLICY "Admins can read all assessment definitions"
  ON public.assessment_definitions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
-- Authored via migration/service-role only — no client write path.
REVOKE INSERT, UPDATE, DELETE ON public.assessment_definitions FROM anon, authenticated;

-- ---------- Prompt registry (proprietary IP — never client-readable) ----------
CREATE TABLE public.assessment_prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  version text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'deprecated')),
  -- NULL until SkinLabs supplies the dermatologist-approved system prompt.
  -- The Claude provider refuses to generate against a NULL/placeholder prompt
  -- (see supabase/functions/_shared/assessment/promptRegistry.ts) rather than
  -- inventing clinical methodology to fill the gap.
  system_prompt text,
  is_placeholder boolean NOT NULL DEFAULT true,
  model_default text,
  notes text
);

COMMENT ON TABLE public.assessment_prompt_versions IS 'PromptRegistry: proprietary dermatologist-approved SKYNN system prompt, versioned. Service-role only — never exposed to anon/authenticated, the frontend, or API responses. See CLAUDE.md: clinical methodology must be supplied by SkinLabs before production activation.';

ALTER TABLE public.assessment_prompt_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assessment_prompt_versions FROM anon, authenticated;
-- No policies granted to anon/authenticated at all — RLS with zero permissive
-- policies for those roles denies every row, and only service_role (which
-- bypasses RLS) can read this table. This mirrors the "admin config must
-- never be user-readable" requirement more strictly than an admin-only SELECT
-- policy would, since even an admin's browser session must never see the
-- proprietary prompt text.

-- ---------- Feature flag / staged rollout ----------
CREATE TABLE public.skynn_advanced_assessment_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  rollout_stage text NOT NULL DEFAULT 'disabled' CHECK (rollout_stage IN ('disabled', 'internal', 'beta', 'public')),
  active_definition_version text NOT NULL REFERENCES public.assessment_definitions (version),
  active_prompt_version text NOT NULL REFERENCES public.assessment_prompt_versions (version),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.skynn_advanced_assessment_config IS 'Single-row server-side feature flag + active-version pointer for the Advanced Assessment engine. Enforced by the edge function, not just hidden in the frontend — see get_advanced_assessment_access(). Service-role only.';

ALTER TABLE public.skynn_advanced_assessment_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.skynn_advanced_assessment_config FROM anon, authenticated;

-- ---------- Evidence library (controlled citation source) ----------
CREATE TABLE public.advanced_assessment_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  evidence_version text NOT NULL,
  topic_tags text[] NOT NULL DEFAULT '{}',
  title text NOT NULL,
  publisher text,
  source_type text NOT NULL CHECK (source_type IN ('clinical_guideline', 'peer_reviewed', 'dermatology_reference', 'regulatory', 'other')),
  url text,
  publication_date date,
  summary text NOT NULL,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'deprecated')),
  verified_by uuid REFERENCES auth.users (id)
);

COMMENT ON TABLE public.advanced_assessment_evidence IS 'Controlled evidence catalogue the Claude report generation is allowed to cite. The model receives only rows selected server-side by topic_tags (src/functions/_shared/assessment/evidence.ts) and validated post-generation — it can never fabricate a citation outside this set. Empty until SkinLabs supplies sourced content (see CLAUDE.md).';

CREATE INDEX idx_advanced_assessment_evidence_tags ON public.advanced_assessment_evidence USING gin (topic_tags);

ALTER TABLE public.advanced_assessment_evidence ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.advanced_assessment_evidence TO authenticated;
CREATE POLICY "Members can read verified evidence"
  ON public.advanced_assessment_evidence FOR SELECT
  TO authenticated
  USING (verification_status = 'verified');
CREATE POLICY "Admins can read all evidence"
  ON public.advanced_assessment_evidence FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------- Assessment sessions ----------
CREATE TABLE public.advanced_assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),

  status text NOT NULL DEFAULT 'created' CHECK (
    status IN ('created', 'in_progress', 'review', 'submitted', 'processing', 'completed', 'abandoned', 'expired', 'failed', 'requires_review')
  ),

  -- Versioning (section 16) — every session pins the exact versions it was
  -- run against, independent of whatever becomes "active" later.
  assessment_definition_id uuid NOT NULL REFERENCES public.assessment_definitions (id),
  assessment_version text NOT NULL,
  question_library_version text NOT NULL,
  scoring_rules_version text NOT NULL,
  engine_version text NOT NULL DEFAULT '1.0.0',

  -- Structured responses, keyed by question id. Same JSONB-evolving-shape
  -- precedent as assessment_definitions.sections above.
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_section_id text,
  completeness_pct smallint NOT NULL DEFAULT 0 CHECK (completeness_pct BETWEEN 0 AND 100),

  -- Deterministic safety/escalation screen computed from responses (never
  -- from the model) — see supabase/functions/_shared/assessment/safety.ts.
  safety_screen jsonb,

  -- Entitlement + idempotent submission bookkeeping (sections 18-20).
  access_type text CHECK (access_type IN ('analysis_pass', 'membership')),
  pass_transaction_id uuid REFERENCES public.ai_credit_transactions (id),
  submission_version int NOT NULL DEFAULT 1,
  idempotency_key text,

  failure_reason text
);

COMMENT ON TABLE public.advanced_assessment_sessions IS 'One Advanced Assessment session per attempt. responses is a versioned JSONB document (question_id -> answer) rather than a normalised per-question table, matching this repo''s existing precedent for evolving structured shapes (see skincare_recommendations.result_payload).';
COMMENT ON COLUMN public.advanced_assessment_sessions.idempotency_key IS 'session_id::submission_version, set at submit time. A retried submit with the same key returns the existing report instead of generating (and charging) again.';
COMMENT ON COLUMN public.advanced_assessment_sessions.pass_transaction_id IS 'Set only when access_type = analysis_pass, referencing the ai_credit_transactions row from consume_analysis_pass() — enables refund_analysis_pass() if generation fails.';

CREATE UNIQUE INDEX idx_advanced_assessment_sessions_idempotency ON public.advanced_assessment_sessions (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_advanced_assessment_sessions_user ON public.advanced_assessment_sessions (user_id, created_at DESC);
CREATE INDEX idx_advanced_assessment_sessions_status ON public.advanced_assessment_sessions (status);

ALTER TABLE public.advanced_assessment_sessions ENABLE ROW LEVEL SECURITY;

-- Reads are RLS-scoped to the owner (or an admin). Everything that creates a
-- session or moves it through the lifecycle (create/submit/complete/fail) is
-- deliberately NOT reachable via a direct client INSERT/UPDATE — only the
-- column-limited autosave UPDATE below, and the SECURITY DEFINER functions
-- further down (granted to service_role only, called exclusively from the
-- skynn-advanced-assessment edge function after it independently verifies
-- the caller's JWT). This is what makes "frontend says pass available,
-- backend generates, frontend deducts" (the anti-pattern section 19 warns
-- against) structurally impossible, and closes a real gap a simpler
-- ownership-only RLS policy would leave open: WITH CHECK (auth.uid() =
-- user_id) alone does not stop a client from writing status='completed' or
-- an arbitrary pass_transaction_id directly via PostgREST.
GRANT SELECT ON public.advanced_assessment_sessions TO authenticated;
CREATE POLICY "Users can read their own assessment sessions"
  ON public.advanced_assessment_sessions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Admins can read all assessment sessions"
  ON public.advanced_assessment_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Autosave: the owner may freely edit their own draft answers and the
-- purely cosmetic progress fields while the session is still editable.
-- completeness_pct here is a UX-only cache for the progress bar — the edge
-- function always recomputes real completeness from `responses` against the
-- assessment_definition at submit time and never trusts this column for the
-- actual gating decision, so a client sending a stale/optimistic 100% here
-- cannot skip required-question validation.
GRANT UPDATE (responses, current_section_id, completeness_pct) ON public.advanced_assessment_sessions TO authenticated;
CREATE POLICY "Users can autosave their own in-progress assessment session"
  ON public.advanced_assessment_sessions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id AND status IN ('created', 'in_progress', 'review'))
  WITH CHECK ((SELECT auth.uid()) = user_id AND status IN ('created', 'in_progress', 'review'));

-- ---------- Reports ----------
CREATE TABLE public.advanced_assessment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.advanced_assessment_sessions (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  generated_at timestamptz,

  generation_status text NOT NULL DEFAULT 'pending' CHECK (generation_status IN ('pending', 'completed', 'failed')),
  -- Safe, user-facing message only — never a raw provider/exception string
  -- (see supabase/functions/_shared/assessment/errors.ts).
  error_message text,

  -- AdvancedDermatologyReport, validated against the strict schema in
  -- supabase/functions/_shared/assessment/reportSchema.ts before insert.
  report jsonb,
  confidence text CHECK (confidence IS NULL OR confidence IN ('high', 'moderate', 'limited')),
  safety_flags jsonb,

  -- Reproducibility/audit stamps (section 5/16).
  model text,
  prompt_version text,
  engine_version text,
  evidence_version text
);

COMMENT ON TABLE public.advanced_assessment_reports IS 'One persisted, schema-validated Advanced Dermatology Report per session. Read-only to its owner; never regenerated on view (Claude is only called once per successful submission, from submit_advanced_assessment_session -> the edge function).';

CREATE INDEX idx_advanced_assessment_reports_user ON public.advanced_assessment_reports (user_id, created_at DESC);

ALTER TABLE public.advanced_assessment_reports ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.advanced_assessment_reports TO authenticated;
CREATE POLICY "Users can read their own assessment reports"
  ON public.advanced_assessment_reports FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Admins can read all assessment reports"
  ON public.advanced_assessment_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
-- No client INSERT/UPDATE/DELETE policy at all — only the service-role edge
-- function writes reports, via the SECURITY DEFINER functions below.
REVOKE INSERT, UPDATE, DELETE ON public.advanced_assessment_reports FROM anon, authenticated;

-- ---------- Observability events ----------
CREATE TABLE public.advanced_assessment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.advanced_assessment_sessions (id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'assessment_created', 'assessment_started', 'assessment_resumed', 'assessment_submitted',
    'generation_started', 'generation_completed', 'generation_failed',
    'report_validated', 'report_viewed', 'routine_handoff_clicked'
  )),
  -- Sanitised only — never raw responses, prompts or provider payloads
  -- (section 39). E.g. { "urgency": "routine" } or { "confidence": "moderate" }.
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.advanced_assessment_events IS 'Append-only, sanitised observability log — no raw assessment content, prompts or API keys, ever (see migration/edge-function comments). Write-only from the client (own user_id), admin-only read, same shape as skynn_fairness_events.';

CREATE INDEX idx_advanced_assessment_events_session ON public.advanced_assessment_events (session_id, created_at);
CREATE INDEX idx_advanced_assessment_events_type ON public.advanced_assessment_events (event_type, created_at DESC);

ALTER TABLE public.advanced_assessment_events ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.advanced_assessment_events TO authenticated;
GRANT SELECT ON public.advanced_assessment_events TO authenticated;
CREATE POLICY "Users can log their own assessment events"
  ON public.advanced_assessment_events FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Admins can read assessment events"
  ON public.advanced_assessment_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Reuses the existing shared trigger function (see e.g.
-- 20260912000000_openhaus_marketplace_core.sql) rather than declaring a
-- second one.
CREATE TRIGGER trg_advanced_assessment_sessions_updated_at
  BEFORE UPDATE ON public.advanced_assessment_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Completeness (authoritative, never client-trusted) ----------
-- Walks a definition's sections/questions and checks which REQUIRED
-- questions have a real answer in `responses`, honouring a simple one-level
-- branching condition (showIf: { questionId, oneOf }) so a required
-- follow-up question that isn't currently applicable doesn't block
-- submission. Deliberately conservative rather than a full expression
-- evaluator — the question library (see the seed migration) is designed to
-- stay within this shape. This is the ONLY thing submit_advanced_assessment_
-- session trusts to gate submission; the client-writable completeness_pct
-- column on the session row is a cosmetic progress-bar cache only.
CREATE OR REPLACE FUNCTION public.compute_assessment_completeness(p_sections jsonb, p_responses jsonb)
RETURNS smallint
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_section jsonb;
  v_question jsonb;
  v_show_if jsonb;
  v_answer jsonb;
  v_qid text;
  v_total int := 0;
  v_answered int := 0;
  v_applies boolean;
BEGIN
  FOR v_section IN SELECT * FROM jsonb_array_elements(coalesce(p_sections, '[]'::jsonb))
  LOOP
    FOR v_question IN SELECT * FROM jsonb_array_elements(coalesce(v_section -> 'questions', '[]'::jsonb))
    LOOP
      CONTINUE WHEN NOT coalesce((v_question ->> 'required')::boolean, false);

      v_show_if := v_question -> 'showIf';
      v_applies := true;
      IF v_show_if IS NOT NULL THEN
        v_applies := EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(coalesce(v_show_if -> 'oneOf', '[]'::jsonb)) val
          WHERE val = (p_responses ->> (v_show_if ->> 'questionId'))
        );
      END IF;
      CONTINUE WHEN NOT v_applies;

      v_total := v_total + 1;
      v_qid := v_question ->> 'id';
      v_answer := p_responses -> v_qid;
      IF v_answer IS NOT NULL AND jsonb_typeof(v_answer) <> 'null' THEN
        IF jsonb_typeof(v_answer) = 'array' THEN
          IF jsonb_array_length(v_answer) > 0 THEN v_answered := v_answered + 1; END IF;
        ELSIF jsonb_typeof(v_answer) = 'string' THEN
          IF length(trim(both '"' from v_answer::text)) > 0 THEN v_answered := v_answered + 1; END IF;
        ELSE
          v_answered := v_answered + 1;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  IF v_total = 0 THEN RETURN 100; END IF;
  RETURN floor((v_answered::numeric / v_total::numeric) * 100)::smallint;
END;
$$;

-- ---------- Access resolution (section 18) ----------
-- Mirrors AdvancedAssessmentCard.tsx's existing eligibility logic
-- (isMember || hasPasses) as the server-side source of truth, so the
-- frontend never has to be trusted to decide entitlement itself.
CREATE OR REPLACE FUNCTION public.get_advanced_assessment_access()
RETURNS TABLE (eligible boolean, access_type text, membership_tier text, passes_available int, rollout_stage text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_member boolean;
  v_status text;
  v_balance int;
  v_stage text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT rollout_stage INTO v_stage FROM public.skynn_advanced_assessment_config WHERE id = true;
  v_stage := coalesce(v_stage, 'disabled');

  v_is_member := public.is_member(v_uid);
  SELECT lower(coalesce(subscription_status, '')) INTO v_status FROM public.profiles WHERE user_id = v_uid;
  v_balance := public.available_ai_credits(v_uid);

  IF v_stage = 'disabled' THEN
    RETURN QUERY SELECT false, 'none', v_status, v_balance, v_stage;
  ELSIF v_is_member THEN
    RETURN QUERY SELECT true, 'membership', v_status, v_balance, v_stage;
  ELSIF v_balance > 0 THEN
    RETURN QUERY SELECT true, 'analysis_pass', v_status, v_balance, v_stage;
  ELSE
    RETURN QUERY SELECT false, 'none', v_status, v_balance, v_stage;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.get_advanced_assessment_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_advanced_assessment_access() TO authenticated;

-- ---------- Session lifecycle ----------
CREATE OR REPLACE FUNCTION public.start_advanced_assessment_session()
RETURNS public.advanced_assessment_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_access record;
  v_def public.assessment_definitions;
  v_session public.advanced_assessment_sessions;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_access FROM public.get_advanced_assessment_access();
  IF NOT v_access.eligible THEN
    RAISE EXCEPTION 'not_eligible' USING ERRCODE = '42501';
  END IF;

  SELECT d.* INTO v_def
    FROM public.assessment_definitions d
    JOIN public.skynn_advanced_assessment_config c ON c.active_definition_version = d.version
    WHERE c.id = true;
  IF v_def.id IS NULL THEN
    RAISE EXCEPTION 'assessment_not_configured' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.advanced_assessment_sessions (
    user_id, assessment_definition_id, assessment_version,
    question_library_version, scoring_rules_version, status
  ) VALUES (
    v_uid, v_def.id, v_def.version,
    v_def.question_library_version, v_def.scoring_rules_version, 'created'
  )
  RETURNING * INTO v_session;

  INSERT INTO public.advanced_assessment_events (user_id, session_id, event_type, metadata)
  VALUES (v_uid, v_session.id, 'assessment_created', jsonb_build_object('assessment_version', v_def.version));

  RETURN v_session;
END;
$$;
REVOKE ALL ON FUNCTION public.start_advanced_assessment_session() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_advanced_assessment_session() TO authenticated;

-- Saves in-progress responses. completeness_pct is always recomputed here
-- via compute_assessment_completeness() against the session's own pinned
-- definition — never taken from client input — so the progress bar and the
-- submit-time gate can never disagree.
-- p_safety_screen is computed application-side (supabase/functions/_shared/
-- assessment/safety.ts) from the same responses, deliberately kept out of
-- SQL entirely so the non-clinical escalation heuristic can be reviewed/
-- updated by SkinLabs without a migration. NULL leaves the stored value
-- untouched (e.g. an autosave call that only changed an unrelated section).
CREATE OR REPLACE FUNCTION public.save_advanced_assessment_progress(
  p_session_id uuid,
  p_responses jsonb,
  p_current_section_id text,
  p_safety_screen jsonb DEFAULT NULL
)
RETURNS public.advanced_assessment_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_sections jsonb;
  v_session public.advanced_assessment_sessions;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT d.sections INTO v_sections
    FROM public.advanced_assessment_sessions s
    JOIN public.assessment_definitions d ON d.id = s.assessment_definition_id
   WHERE s.id = p_session_id AND s.user_id = v_uid;
  IF v_sections IS NULL THEN
    RAISE EXCEPTION 'session_not_editable' USING ERRCODE = '42501';
  END IF;

  UPDATE public.advanced_assessment_sessions
     SET responses = p_responses,
         current_section_id = p_current_section_id,
         completeness_pct = public.compute_assessment_completeness(v_sections, p_responses),
         safety_screen = coalesce(p_safety_screen, safety_screen),
         status = CASE WHEN status = 'created' THEN 'in_progress' ELSE status END
   WHERE id = p_session_id AND user_id = v_uid AND status IN ('created', 'in_progress', 'review')
  RETURNING * INTO v_session;

  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'session_not_editable' USING ERRCODE = '42501';
  END IF;

  RETURN v_session;
END;
$$;
REVOKE ALL ON FUNCTION public.save_advanced_assessment_progress(uuid, jsonb, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_advanced_assessment_progress(uuid, jsonb, text, jsonb) TO authenticated;

-- Atomically: verify ownership/completeness, resolve entitlement, consume a
-- pass if that's the access path, mark the session 'submitted' with an
-- idempotency key and a pending report row. Generation itself (the Claude
-- call) happens in the edge function AFTER this returns, keyed off the
-- report id — kept out of this function so a slow/failed AI call can never
-- hold this transaction (and therefore the pass-consumption row lock) open.
-- Idempotent: calling this twice for the same session/submission_version
-- returns the same pending/completed report instead of consuming a second
-- pass (section 20).
CREATE OR REPLACE FUNCTION public.submit_advanced_assessment_session(p_session_id uuid, p_safety_screen jsonb DEFAULT NULL)
RETURNS TABLE (report_id uuid, session_status text, access_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_session public.advanced_assessment_sessions;
  v_sections jsonb;
  v_real_completeness smallint;
  v_existing_report_id uuid;
  v_key text;
  v_access record;
  v_pass record;
  v_report_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_session
    FROM public.advanced_assessment_sessions
   WHERE id = p_session_id AND user_id = v_uid
   FOR UPDATE;
  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotency: already submitted (retry, double-click, network replay) —
  -- return the existing report rather than resubmitting/re-charging.
  IF v_session.status NOT IN ('created', 'in_progress', 'review') THEN
    SELECT id INTO v_existing_report_id FROM public.advanced_assessment_reports WHERE session_id = p_session_id;
    RETURN QUERY SELECT v_existing_report_id, v_session.status, v_session.access_type;
    RETURN;
  END IF;

  -- Recomputed from the session's own pinned definition + actual responses —
  -- the stored completeness_pct column is a client-writable UX cache and is
  -- never trusted for this gate (see compute_assessment_completeness()).
  SELECT sections INTO v_sections FROM public.assessment_definitions WHERE id = v_session.assessment_definition_id;
  v_real_completeness := public.compute_assessment_completeness(v_sections, v_session.responses);
  IF v_real_completeness < 100 THEN
    RAISE EXCEPTION 'assessment_incomplete' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_access FROM public.get_advanced_assessment_access();
  IF NOT v_access.eligible THEN
    RAISE EXCEPTION 'not_eligible' USING ERRCODE = '42501';
  END IF;

  v_key := p_session_id::text || ':' || v_session.submission_version::text;

  -- Consume exactly at submission (never at session creation), per section 19.
  IF v_access.access_type = 'analysis_pass' THEN
    SELECT * INTO v_pass FROM public.consume_analysis_pass();
    IF NOT v_pass.allowed THEN
      RAISE EXCEPTION 'insufficient_passes' USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.advanced_assessment_sessions
     SET status = 'submitted',
         submitted_at = now(),
         access_type = v_access.access_type,
         pass_transaction_id = v_pass.transaction_id,
         idempotency_key = v_key,
         safety_screen = coalesce(p_safety_screen, safety_screen)
   WHERE id = p_session_id;

  INSERT INTO public.advanced_assessment_reports (session_id, user_id, generation_status)
  VALUES (p_session_id, v_uid, 'pending')
  RETURNING id INTO v_report_id;

  INSERT INTO public.advanced_assessment_events (user_id, session_id, event_type, metadata)
  VALUES (v_uid, p_session_id, 'assessment_submitted', jsonb_build_object('access_type', v_access.access_type));

  RETURN QUERY SELECT v_report_id, 'submitted'::text, v_access.access_type;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_advanced_assessment_session(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_advanced_assessment_session(uuid, jsonb) TO authenticated;

-- Called by the edge function once (and only once) after a Claude call
-- fails irrecoverably, so a spent pass is never lost to a generation error.
-- Deliberately does NOT call the existing refund_analysis_pass() — that
-- function resolves the acting user from auth.uid(), which is NULL for a
-- service-role call made outside any end-user request (generation happens
-- after submit_advanced_assessment_session's transaction has already
-- committed). Reimplements the same ownership/shape/already-refunded checks
-- against the session's known user_id instead.
CREATE OR REPLACE FUNCTION public.fail_advanced_assessment_session(p_session_id uuid, p_error_message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.advanced_assessment_sessions;
  v_refund_reason text;
BEGIN
  SELECT * INTO v_session FROM public.advanced_assessment_sessions WHERE id = p_session_id FOR UPDATE;
  IF v_session.id IS NULL THEN RETURN; END IF;
  IF v_session.status NOT IN ('submitted', 'processing') THEN RETURN; END IF;

  IF v_session.access_type = 'analysis_pass' AND v_session.pass_transaction_id IS NOT NULL THEN
    v_refund_reason := 'refund:' || v_session.pass_transaction_id::text;
    IF EXISTS (
      SELECT 1 FROM public.ai_credit_transactions
       WHERE id = v_session.pass_transaction_id AND user_id = v_session.user_id
         AND reason = 'consume:advanced_analysis' AND delta = -1
    ) AND NOT EXISTS (
      SELECT 1 FROM public.ai_credit_transactions WHERE user_id = v_session.user_id AND reason = v_refund_reason
    ) THEN
      INSERT INTO public.ai_credit_transactions (user_id, delta, reason)
      VALUES (v_session.user_id, 1, v_refund_reason);
    END IF;
  END IF;

  UPDATE public.advanced_assessment_sessions
     SET status = 'failed', failure_reason = left(coalesce(p_error_message, 'unknown_error'), 500)
   WHERE id = p_session_id;

  UPDATE public.advanced_assessment_reports
     SET generation_status = 'failed', error_message = left(coalesce(p_error_message, 'Something went wrong generating your report.'), 500)
   WHERE session_id = p_session_id;

  INSERT INTO public.advanced_assessment_events (user_id, session_id, event_type, metadata)
  VALUES (v_session.user_id, p_session_id, 'generation_failed', '{}'::jsonb);
END;
$$;
-- Service-role only: refund_analysis_pass() runs as the calling user via
-- auth.uid() internally, but this orchestration step must run with the edge
-- function's own service-role credentials since generation happens outside
-- any end-user request context by the time failure is known.
REVOKE ALL ON FUNCTION public.fail_advanced_assessment_session(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_advanced_assessment_session(uuid, text) TO service_role;

-- Marks a submitted session as actively generating — purely a status/UX
-- transition for the polling endpoint (section 15/33), no side effects.
CREATE OR REPLACE FUNCTION public.mark_advanced_assessment_processing(p_session_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.advanced_assessment_sessions
     SET status = 'processing'
   WHERE id = p_session_id AND status = 'submitted';
$$;
REVOKE ALL ON FUNCTION public.mark_advanced_assessment_processing(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_advanced_assessment_processing(uuid) TO service_role;

-- Persists a schema-validated report and closes out the session. Called by
-- the edge function (service-role) exactly once per successful generation —
-- the UNIQUE session_id on advanced_assessment_reports means a second call
-- for the same session would violate that constraint rather than silently
-- duplicating a report, which is the idempotency backstop under this
-- application-level check.
CREATE OR REPLACE FUNCTION public.complete_advanced_assessment_session(
  p_session_id uuid,
  p_report jsonb,
  p_confidence text,
  p_safety_flags jsonb,
  p_model text,
  p_prompt_version text,
  p_engine_version text,
  p_evidence_version text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.advanced_assessment_sessions;
BEGIN
  SELECT * INTO v_session FROM public.advanced_assessment_sessions WHERE id = p_session_id FOR UPDATE;
  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_session.status NOT IN ('submitted', 'processing') THEN
    RETURN; -- already completed/failed — idempotent no-op
  END IF;

  UPDATE public.advanced_assessment_sessions
     SET status = 'completed', completed_at = now()
   WHERE id = p_session_id;

  UPDATE public.advanced_assessment_reports
     SET generation_status = 'completed',
         generated_at = now(),
         report = p_report,
         confidence = p_confidence,
         safety_flags = p_safety_flags,
         model = p_model,
         prompt_version = p_prompt_version,
         engine_version = p_engine_version,
         evidence_version = p_evidence_version
   WHERE session_id = p_session_id;

  INSERT INTO public.advanced_assessment_events (user_id, session_id, event_type, metadata)
  VALUES (v_session.user_id, p_session_id, 'report_validated', jsonb_build_object('confidence', p_confidence));
END;
$$;
REVOKE ALL ON FUNCTION public.complete_advanced_assessment_session(uuid, jsonb, text, jsonb, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_advanced_assessment_session(uuid, jsonb, text, jsonb, text, text, text, text) TO service_role;
