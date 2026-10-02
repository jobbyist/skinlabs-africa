-- Smart Routines are built from the member's Basic AI Skin Analysis data, so a
-- saved Basic analysis (free for every tier) is enough. An Advanced AI
-- Dermatology Analysis submission still qualifies and enriches the routine.
CREATE OR REPLACE FUNCTION public.has_smart_routine_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.skincare_recommendations b
     WHERE b.user_id = _user_id
       AND b.status = 'delivered'
       AND b.result_payload IS NOT NULL
  )
  OR EXISTS (
    SELECT 1
      FROM public.advanced_assessment_reports r
     WHERE r.user_id = _user_id
       AND coalesce(r.intake_status, '') NOT IN ('rejected', 'failed')
       AND coalesce(r.generation_status, '') <> 'failed'
       AND coalesce(r.review_status, '') <> 'rejected'
  );
$$;

REVOKE ALL ON FUNCTION public.has_smart_routine_access(uuid) FROM PUBLIC, anon, authenticated;
