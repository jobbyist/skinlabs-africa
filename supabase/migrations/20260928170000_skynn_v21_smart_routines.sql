-- SKYNN AI v2.1 — Smart Routines (an extension of the Advanced AI Dermatology
-- Analysis) + routine-step provenance + two fixes found on the way.
--
-- A Smart Routine is built in the browser by the pure engine
-- (src/lib/smartRoutine/engine.ts) from the member's own Basic + Advanced
-- answers and SkinLabs-reviewed products, then saved here through
-- save_smart_routine(), which is the only write path. Access = members who
-- have submitted an Advanced AI Dermatology Analysis (spent an Analysis Pass)
-- that wasn't rejected or refunded. The steps land in the existing routine
-- tracker (routine_steps, source = 'smart'), so check-ins and streaks work
-- unchanged; the member's own manual steps are never touched.

-- ---------- routine_steps provenance ----------
ALTER TABLE public.routine_steps
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS guidance text,
  ADD COLUMN IF NOT EXISTS product_slug text;

DO $$ BEGIN
  ALTER TABLE public.routine_steps
    ADD CONSTRAINT routine_steps_source_check CHECK (source IN ('manual', 'default', 'smart'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.routine_steps
    ADD CONSTRAINT routine_steps_guidance_len CHECK (guidance IS NULL OR char_length(guidance) <= 600);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN public.routine_steps.source IS
  'manual = the member added it; default = the four starter steps the tracker seeds on first open; smart = written by save_smart_routine().';

-- The tracker used to seed Cleanser/Serum/Moisturiser/Sunscreen (no product)
-- on first open. Mark existing seeded rows so they stop counting as a member
-- "saving a routine" (see is_trial_activated below).
UPDATE public.routine_steps
   SET source = 'default'
 WHERE source = 'manual'
   AND product_name IS NULL
   AND ((step_name IN ('Cleanser', 'Serum', 'Moisturiser') AND time_of_day = 'both')
     OR (step_name = 'Sunscreen' AND time_of_day = 'am'));

-- ---------- smart_routines ----------
CREATE TABLE IF NOT EXISTS public.smart_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('rule_based', 'advanced_report')),
  engine_version text NOT NULL,
  basic_analysis_id uuid REFERENCES public.skincare_recommendations(id) ON DELETE SET NULL,
  advanced_session_id uuid REFERENCES public.advanced_assessment_sessions(id) ON DELETE SET NULL,
  season text,
  routine jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.routine_steps
  ADD COLUMN IF NOT EXISTS smart_routine_id uuid REFERENCES public.smart_routines(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS routine_steps_smart_routine_id_idx ON public.routine_steps (smart_routine_id) WHERE smart_routine_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS smart_routines_basic_analysis_id_idx ON public.smart_routines (basic_analysis_id) WHERE basic_analysis_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS smart_routines_advanced_session_id_idx ON public.smart_routines (advanced_session_id) WHERE advanced_session_id IS NOT NULL;

ALTER TABLE public.smart_routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read their own smart routine" ON public.smart_routines;
CREATE POLICY "Members read their own smart routine" ON public.smart_routines
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins read smart routines" ON public.smart_routines;
CREATE POLICY "Admins read smart routines" ON public.smart_routines
  FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

-- Default privileges grant ALL on new tables; the only write path is the RPC.
REVOKE ALL ON public.smart_routines FROM anon, authenticated;
GRANT SELECT ON public.smart_routines TO authenticated;

DROP TRIGGER IF EXISTS trg_smart_routines_updated_at ON public.smart_routines;
CREATE TRIGGER trg_smart_routines_updated_at BEFORE UPDATE ON public.smart_routines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- eligibility ----------
CREATE OR REPLACE FUNCTION public.has_smart_routine_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.advanced_assessment_reports r
     WHERE r.user_id = _user_id
       AND coalesce(r.intake_status, '') NOT IN ('rejected', 'failed')
       AND coalesce(r.generation_status, '') <> 'failed'
       AND coalesce(r.review_status, '') <> 'rejected'
  );
$$;

REVOKE ALL ON FUNCTION public.has_smart_routine_access(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_smart_routine_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE WHEN auth.uid() IS NULL THEN false ELSE public.has_smart_routine_access(auth.uid()) END;
$$;

REVOKE ALL ON FUNCTION public.get_smart_routine_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_smart_routine_access() TO authenticated;

-- ---------- the only write path ----------
-- p_routine: { source, engineVersion, season, am: Step[], pm: Step[], weekly, notes }
-- Step: { step, productType, productSlug|null, productName|null, guidance, why, fromShelf }
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
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF NOT public.has_smart_routine_access(v_uid) THEN
    RAISE EXCEPTION 'smart_routine_locked' USING ERRCODE = '42501';
  END IF;

  -- Shape and size (the routine is rendered back as plain text only).
  IF v_source IS NULL OR v_source NOT IN ('rule_based', 'advanced_report')
     OR jsonb_typeof(p_routine -> 'am') <> 'array' OR jsonb_typeof(p_routine -> 'pm') <> 'array'
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

  -- Replace the previous Smart Routine steps and the auto-seeded starter
  -- steps; the member's own manual steps stay exactly as they are.
  DELETE FROM public.routine_steps WHERE user_id = v_uid AND source IN ('smart', 'default');

  FOR v_slot IN SELECT unnest(ARRAY['am', 'pm']) LOOP
    FOR v_step IN SELECT * FROM jsonb_array_elements(p_routine -> v_slot) LOOP
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
      );
      v_order := v_order + 1;
    END LOOP;
  END LOOP;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_smart_routine(jsonb, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_smart_routine(jsonb, uuid, uuid) TO authenticated;

-- ---------- activation ignores auto-seeded steps ----------
-- Mirrors isActivated() in src/lib/journey.ts (which now counts only
-- non-default steps too). Before this, merely opening the Routine tab seeded
-- four steps and counted as "saved a routine".
CREATE OR REPLACE FUNCTION public.is_trial_activated(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT (SELECT count(*) FROM public.skincare_recommendations r WHERE r.user_id = _user_id AND r.status = 'delivered') >= 2
      OR EXISTS (SELECT 1 FROM public.routine_steps s WHERE s.user_id = _user_id AND s.source <> 'default')
      OR (SELECT count(*) FROM public.routine_checkins c WHERE c.user_id = _user_id) >= 3
      OR (SELECT count(*) FROM public.news_article_engagement e WHERE e.user_id = _user_id AND e.kind = 'save') >= 3;
$$;

REVOKE ALL ON FUNCTION public.is_trial_activated(uuid) FROM PUBLIC, anon, authenticated;

-- ---------- analytics_events: user_id can't be spoofed ----------
-- The insert policy was WITH CHECK (true), so any client could attribute an
-- event to another user's id. Anonymous inserts must now carry no user_id and
-- signed-in inserts only their own.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'public.analytics_events'::regclass AND polcmd = 'a' LOOP
    EXECUTE format('DROP POLICY %I ON public.analytics_events', r.polname);
  END LOOP;
END $$;

CREATE POLICY "Anyone can record an event as themselves" ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = (SELECT auth.uid()));

REVOKE UPDATE, DELETE, TRUNCATE ON public.analytics_events FROM anon, authenticated;
