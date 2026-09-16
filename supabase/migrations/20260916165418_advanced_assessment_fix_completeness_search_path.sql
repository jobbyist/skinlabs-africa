-- Fixes the function_search_path_mutable advisory on
-- compute_assessment_completeness (flagged after
-- 20260916164921_advanced_assessment_engine_core.sql) — the function only
-- uses built-in jsonb operators so this has no behavioural effect, but every
-- other function in this migration set search_path explicitly and this one
-- was missed.
CREATE OR REPLACE FUNCTION public.compute_assessment_completeness(p_sections jsonb, p_responses jsonb)
RETURNS smallint
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
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
