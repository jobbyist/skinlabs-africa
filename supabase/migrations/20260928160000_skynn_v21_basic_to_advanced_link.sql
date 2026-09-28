-- SKYNN AI v2.1 — the Basic AI Skin Analysis is the starting point of the
-- Advanced AI Dermatology Analysis.
--
-- When a member starts an Advanced session, the frontend suggests answers
-- from their latest saved Basic analysis (src/lib/skynn/basicToAdvancedPrefill.ts).
-- The member confirms or changes every one before submitting. This records,
-- on the session, which Basic analysis it started from and which questions
-- were suggested, so the review team (intake record, admin detail) can see it.
--
-- Written only through link_basic_analysis_to_advanced_session(): the caller
-- must own both rows, the Basic row must be a delivered analysis, and the
-- session must not be submitted yet. Clients have no column grant here.

ALTER TABLE public.advanced_assessment_sessions
  ADD COLUMN IF NOT EXISTS basic_analysis_id uuid
    REFERENCES public.skincare_recommendations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS prefilled_question_ids text[];

CREATE INDEX IF NOT EXISTS advanced_assessment_sessions_basic_analysis_id_idx
  ON public.advanced_assessment_sessions (basic_analysis_id)
  WHERE basic_analysis_id IS NOT NULL;

COMMENT ON COLUMN public.advanced_assessment_sessions.basic_analysis_id IS
  'The Basic AI Skin Analysis (skincare_recommendations) this Advanced session started from, if any. Set by link_basic_analysis_to_advanced_session().';
COMMENT ON COLUMN public.advanced_assessment_sessions.prefilled_question_ids IS
  'Question ids suggested from the Basic analysis at session start (the member confirmed or changed each before submitting).';

CREATE OR REPLACE FUNCTION public.link_basic_analysis_to_advanced_session(
  p_session_id uuid,
  p_basic_analysis_id uuid,
  p_prefilled_question_ids text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ids text[];
  v_found boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.skincare_recommendations r
     WHERE r.id = p_basic_analysis_id
       AND r.user_id = v_uid
       AND r.status = 'delivered'
  ) THEN
    RAISE EXCEPTION 'basic_analysis_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- Bounded, id-shaped list only (never answer values).
  SELECT array_agg(DISTINCT x) INTO v_ids
    FROM unnest(coalesce(p_prefilled_question_ids, ARRAY[]::text[])) AS x
   WHERE x ~ '^[a-z0-9_]{1,64}$';
  IF coalesce(array_length(v_ids, 1), 0) > 60 THEN
    RAISE EXCEPTION 'too_many_prefilled_ids' USING ERRCODE = '22023';
  END IF;

  UPDATE public.advanced_assessment_sessions s
     SET basic_analysis_id = p_basic_analysis_id,
         prefilled_question_ids = v_ids
   WHERE s.id = p_session_id
     AND s.user_id = v_uid
     AND s.status IN ('created', 'in_progress', 'review');
  v_found := FOUND;
  RETURN v_found;
END;
$$;

REVOKE ALL ON FUNCTION public.link_basic_analysis_to_advanced_session(uuid, uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_basic_analysis_to_advanced_session(uuid, uuid, text[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- Security fix found while adding the columns above.
-- The engine migration (20260916164921) granted clients
--   UPDATE (responses, current_section_id, completeness_pct)
-- but this project's default privileges already give authenticated/anon ALL
-- on every new table, so that column grant never narrowed anything: a member
-- could UPDATE any column of their own unsubmitted session, including
-- assessment_definition_id — which submit_advanced_assessment_session() uses
-- to decide whether POPIA consent is required and what "complete" means.
-- Restore the intended column-only autosave grant (every other write goes
-- through SECURITY DEFINER RPCs, which don't need client grants).
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON public.advanced_assessment_sessions FROM anon, authenticated;
REVOKE SELECT ON public.advanced_assessment_sessions FROM anon;
GRANT SELECT ON public.advanced_assessment_sessions TO authenticated;
GRANT UPDATE (responses, current_section_id, completeness_pct)
  ON public.advanced_assessment_sessions TO authenticated;
