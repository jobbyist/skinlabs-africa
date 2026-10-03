-- SkinLabs® October 2026 Skin Story Giveaway: lightweight entry confirmation.
--
-- TikTok Stories can't be verified through an API, so an entry is a SELF-REPORT that a human reviews: the member
-- confirms they posted the Story and tagged @skinlabsza and gives their TikTok username (the only extra personal
-- data collected; the email is the one already on their account). Nothing here is auto-verified and the UI says so.
--
-- Rules enforced HERE, not only in the browser:
--   * signed-in members only (the account email is how winners are contacted);
--   * a delivered, saved Basic AI Skin Analysis must exist (no entry without completing the assessment);
--   * entries stop at giveaway_closes_at() (31 Oct 2026 23:59:59 SAST: keep in sync with GIVEAWAY_CLOSES_AT in
--     src/lib/giveaway/campaign.ts, a unit test reads this file);
--   * one entry per member per campaign (re-submitting only corrects the TikTok username).
-- No assessment content is copied into the entry. ON DELETE CASCADE keeps account deletion (POPIA) complete.

CREATE OR REPLACE FUNCTION public.giveaway_closes_at()
RETURNS timestamptz LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path TO ''
AS $$ SELECT timestamptz '2026-10-31 23:59:59+02' $$;

CREATE TABLE IF NOT EXISTS public.giveaway_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign      text NOT NULL CHECK (campaign ~ '^[a-z0-9_]{1,60}$'),
  user_id       uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tiktok_handle text NOT NULL CHECK (tiktok_handle ~ '^[A-Za-z0-9_.]{2,24}$'),
  terms_version text NOT NULL CHECK (char_length(terms_version) BETWEEN 1 AND 40),
  -- submitted = member's confirmation received; verified/rejected/winner are set by an admin after checking the Story.
  status        text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'rejected', 'winner')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign, user_id)
);
CREATE INDEX IF NOT EXISTS giveaway_entries_campaign_status_idx ON public.giveaway_entries (campaign, status, created_at);

ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.giveaway_entries FROM PUBLIC, anon, authenticated;
-- Members read their own row (never anyone else's); all writes go through enter_giveaway(). Admins review via
-- admin_giveaway_entries() and set the status below.
GRANT SELECT (id, campaign, tiktok_handle, status, created_at) ON public.giveaway_entries TO authenticated;
GRANT UPDATE (status) ON public.giveaway_entries TO authenticated;
GRANT ALL ON public.giveaway_entries TO service_role;

CREATE POLICY "Members read their own giveaway entry"
  ON public.giveaway_entries FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins review giveaway entries"
  ON public.giveaway_entries FOR UPDATE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

CREATE OR REPLACE FUNCTION public.enter_giveaway(p_campaign text, p_tiktok_handle text, p_confirmed boolean, p_terms_version text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_handle text := regexp_replace(btrim(coalesce(p_tiktok_handle, '')), '^@+', '');
  v_existing public.giveaway_entries%ROWTYPE;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_signed_in' USING ERRCODE = '28000'; END IF;
  IF p_campaign IS DISTINCT FROM 'skinlabs_october_2026_giveaway' THEN RAISE EXCEPTION 'unknown_campaign' USING ERRCODE = '22023'; END IF;
  IF now() > public.giveaway_closes_at() THEN RAISE EXCEPTION 'giveaway_closed' USING ERRCODE = 'P0001'; END IF;
  IF p_confirmed IS NOT TRUE THEN RAISE EXCEPTION 'confirmation_required' USING ERRCODE = '22023'; END IF;
  IF v_handle !~ '^[A-Za-z0-9_.]{2,24}$' OR v_handle LIKE '%.' THEN RAISE EXCEPTION 'invalid_handle' USING ERRCODE = '22023'; END IF;
  IF p_terms_version IS NULL OR char_length(p_terms_version) NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'invalid_terms_version' USING ERRCODE = '22023'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.skincare_recommendations r
     WHERE r.user_id = v_uid AND r.status = 'delivered' AND r.result_payload IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'assessment_required' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_existing FROM public.giveaway_entries WHERE campaign = p_campaign AND user_id = v_uid;
  IF FOUND THEN
    -- One entry per person. A rejected or winning entry is never edited by the member.
    IF v_existing.status = 'submitted' AND v_existing.tiktok_handle <> v_handle THEN
      UPDATE public.giveaway_entries SET tiktok_handle = v_handle, terms_version = p_terms_version, updated_at = now() WHERE id = v_existing.id;
    END IF;
    RETURN jsonb_build_object('ok', true, 'entry_id', v_existing.id, 'already_entered', true, 'status', v_existing.status);
  END IF;

  INSERT INTO public.giveaway_entries (campaign, user_id, tiktok_handle, terms_version)
  VALUES (p_campaign, v_uid, v_handle, p_terms_version)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'entry_id', v_id, 'already_entered', false, 'status', 'submitted');
END;
$function$;

-- Revoke straight after the definition: CREATE OR REPLACE never carries a previous REVOKE forward.
REVOKE ALL ON FUNCTION public.enter_giveaway(text, text, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enter_giveaway(text, text, boolean, text) TO authenticated;

-- Admin review list: entries with the account email (so winners can be contacted). Admin-gated.
CREATE OR REPLACE FUNCTION public.admin_giveaway_entries(p_campaign text DEFAULT 'skinlabs_october_2026_giveaway')
RETURNS TABLE (id uuid, tiktok_handle text, email text, status text, created_at timestamptz, terms_version text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NOT public.has_role((SELECT auth.uid()), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT e.id, e.tiktok_handle, u.email::text, e.status, e.created_at, e.terms_version
      FROM public.giveaway_entries e
      JOIN auth.users u ON u.id = e.user_id
     WHERE e.campaign = p_campaign
     ORDER BY e.created_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_giveaway_entries(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_giveaway_entries(text) TO authenticated;
