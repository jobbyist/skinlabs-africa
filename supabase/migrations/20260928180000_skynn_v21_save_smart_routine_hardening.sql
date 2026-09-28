-- SKYNN AI v2.1 — save_smart_routine hardening (code-review findings).
--  1. Rebuilding a Smart Routine no longer erases check-in history: steps that
--     are still in the routine (same slot + name) are updated in place; only
--     steps that dropped out are removed. Auto-seeded starter steps the member
--     has ticked off are adopted as their own (source = 'manual') instead of
--     deleted; untouched starter steps are replaced.
--  2. Shape validation can no longer be skipped by a missing key
--     (jsonb_typeof(NULL) is NULL, which used to fall through the IF).
CREATE OR REPLACE FUNCTION public.save_smart_routine(
  p_routine jsonb,
  p_basic_analysis_id uuid DEFAULT NULL,
  p_advanced_session_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
  v_source text := p_routine ->> 'source';
  v_step jsonb;
  v_slot text;
  v_order int := 0;
  v_existing uuid;
  v_kept uuid[] := ARRAY[]::uuid[];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF NOT public.has_smart_routine_access(v_uid) THEN
    RAISE EXCEPTION 'smart_routine_locked' USING ERRCODE = '42501';
  END IF;

  -- Shape and size (the routine is rendered back as plain text only). Every
  -- test is NULL-safe: a missing or wrongly typed key is invalid.
  IF v_source IS NULL OR v_source NOT IN ('rule_based', 'advanced_report')
     OR coalesce(jsonb_typeof(p_routine -> 'am'), '') <> 'array'
     OR coalesce(jsonb_typeof(p_routine -> 'pm'), '') <> 'array'
     OR jsonb_array_length(p_routine -> 'am') > 10 OR jsonb_array_length(p_routine -> 'pm') > 10
     OR jsonb_array_length(p_routine -> 'am') + jsonb_array_length(p_routine -> 'pm') = 0
     OR octet_length(p_routine::text) > 32768 THEN
    RAISE EXCEPTION 'invalid_routine' USING ERRCODE = '22023';
  END IF;
  FOR v_slot IN SELECT unnest(ARRAY['am', 'pm']) LOOP
    FOR v_step IN SELECT * FROM jsonb_array_elements(p_routine -> v_slot) LOOP
      IF jsonb_typeof(v_step) <> 'object'
         OR coalesce(char_length(v_step ->> 'step'), 0) NOT BETWEEN 1 AND 80
         OR char_length(coalesce(v_step ->> 'guidance', '')) > 600
         OR char_length(coalesce(v_step ->> 'productName', '')) > 200
         OR char_length(coalesce(v_step ->> 'productType', '')) > 120
         OR char_length(coalesce(v_step ->> 'productSlug', '')) > 160 THEN
        RAISE EXCEPTION 'invalid_routine' USING ERRCODE = '22023';
      END IF;
    END LOOP;
  END LOOP;

  -- Only the member's own sources may be referenced.
  IF p_basic_analysis_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.skincare_recommendations WHERE id = p_basic_analysis_id AND user_id = v_uid
  ) THEN
    p_basic_analysis_id := NULL;
  END IF;
  IF p_advanced_session_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.advanced_assessment_sessions WHERE id = p_advanced_session_id AND user_id = v_uid
  ) THEN
    p_advanced_session_id := NULL;
  END IF;

  INSERT INTO public.smart_routines (user_id, source, engine_version, basic_analysis_id, advanced_session_id, season, routine)
  VALUES (v_uid, v_source, left(coalesce(p_routine ->> 'engineVersion', 'unknown'), 40), p_basic_analysis_id,
          p_advanced_session_id, left(p_routine ->> 'season', 20), p_routine)
  ON CONFLICT (user_id) DO UPDATE
     SET source = EXCLUDED.source,
         engine_version = EXCLUDED.engine_version,
         basic_analysis_id = EXCLUDED.basic_analysis_id,
         advanced_session_id = EXCLUDED.advanced_session_id,
         season = EXCLUDED.season,
         routine = EXCLUDED.routine
  RETURNING id INTO v_id;

  -- Starter steps the member has already ticked off are theirs now.
  UPDATE public.routine_steps s SET source = 'manual'
   WHERE s.user_id = v_uid AND s.source = 'default'
     AND EXISTS (SELECT 1 FROM public.routine_checkins c WHERE c.step_id = s.id);

  FOR v_slot IN SELECT unnest(ARRAY['am', 'pm']) LOOP
    FOR v_step IN SELECT * FROM jsonb_array_elements(p_routine -> v_slot) LOOP
      -- Same slot + name as a step from the previous Smart Routine: update it
      -- in place so its check-ins (and the member's streak) survive.
      SELECT s.id INTO v_existing
        FROM public.routine_steps s
       WHERE s.user_id = v_uid AND s.source = 'smart' AND s.time_of_day = v_slot
         AND lower(s.step_name) = lower(v_step ->> 'step') AND NOT (s.id = ANY (v_kept))
       ORDER BY s.sort_order LIMIT 1;

      IF v_existing IS NOT NULL THEN
        UPDATE public.routine_steps
           SET product_name = coalesce(nullif(v_step ->> 'productName', ''), nullif(v_step ->> 'productType', '')),
               sort_order = v_order,
               smart_routine_id = v_id,
               guidance = nullif(v_step ->> 'guidance', ''),
               product_slug = nullif(v_step ->> 'productSlug', '')
         WHERE id = v_existing;
        v_kept := v_kept || v_existing;
      ELSE
        INSERT INTO public.routine_steps (user_id, step_name, product_name, time_of_day, sort_order, source, smart_routine_id, guidance, product_slug)
        VALUES (
          v_uid,
          v_step ->> 'step',
          coalesce(nullif(v_step ->> 'productName', ''), nullif(v_step ->> 'productType', '')),
          v_slot,
          v_order,
          'smart',
          v_id,
          nullif(v_step ->> 'guidance', ''),
          nullif(v_step ->> 'productSlug', '')
        )
        RETURNING id INTO v_existing;
        v_kept := v_kept || v_existing;
      END IF;
      v_existing := NULL;
      v_order := v_order + 1;
    END LOOP;
  END LOOP;

  -- Previous Smart Routine steps that dropped out, and untouched starter
  -- steps, go. The member's own manual steps are never touched.
  DELETE FROM public.routine_steps
   WHERE user_id = v_uid AND source IN ('smart', 'default') AND NOT (id = ANY (v_kept));

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_smart_routine(jsonb, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_smart_routine(jsonb, uuid, uuid) TO authenticated;
