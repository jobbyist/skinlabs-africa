-- Free-first SKYNN AI Formulator: rolling 30-day free starter analysis.
--
-- ADDITIVE ONLY — safe to apply while the previous frontend is still live.
-- The breaking half (direct-insert RLS lockdown + read-only
-- claim_starter_analysis) lives in 20260924100100_formulator_allowance_cutover.sql
-- and must be applied together with the frontend deploy that calls
-- save_starter_analysis(). See PLAN.md.
--
-- Limits (mirrored in src/lib/formulator/limits.ts — FORMULATOR_LIMITS; a unit
-- test parses this file to keep the two in sync):
--   explorer / glow_lite : pricing_settings.free_ai_analysis_allowance (1)
--                          per pricing_settings.free_analysis_window_days (30),
--                          rolling from the last FREE analysis
--   insider / vip        : unlimited
-- A locked free/Lite user may still spend a purchased Analysis Pass
-- (ai_credit_transactions), exactly as claim_starter_analysis() allowed before.

-- ---------- 1. Columns ----------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_free_analysis_at timestamptz;

COMMENT ON COLUMN public.profiles.last_free_analysis_at IS
  'When this account last used its free starter analysis. The rolling free-analysis window counts from here. Written only by save_starter_analysis() (privileged).';

ALTER TABLE public.pricing_settings
  ADD COLUMN IF NOT EXISTS free_analysis_window_days int NOT NULL DEFAULT 30
    CHECK (free_analysis_window_days > 0);

-- Backfill: anyone who already has a delivered analysis is treated as having
-- used their free one on that date (their next free one unlocks 30 days later).
UPDATE public.profiles p
   SET last_free_analysis_at = r.last_at
  FROM (
    SELECT user_id, max(created_at) AS last_at
      FROM public.skincare_recommendations
     WHERE status = 'delivered'
     GROUP BY user_id
  ) r
 WHERE r.user_id = p.user_id
   AND p.last_free_analysis_at IS NULL;

-- ---------- 2. Restore privileged-column protection ----------
-- 20260919100000_marketing_consent_and_cancellation.sql redefined this trigger
-- function from an older copy and silently dropped founding_member,
-- is_professional, starter_analyses_used, account_status and deactivated_at
-- (all added by 20260906180000/20260908150000). This is the union of every
-- column any prior version protected, plus the new last_free_analysis_at.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claims', true) IS NULL
     OR coalesce((current_setting('request.jwt.claims', true)::json ->> 'role'), '') = 'service_role'
     OR coalesce(current_setting('app.privileged_write', true), '') = 'on' THEN
    RETURN NEW;
  END IF;
  NEW.subscription_status := OLD.subscription_status;
  NEW.subscription_started_at := OLD.subscription_started_at;
  NEW.billing_interval := OLD.billing_interval;
  NEW.trial_plan := OLD.trial_plan;
  NEW.trial_ends_at := OLD.trial_ends_at;
  NEW.trial_used_at := OLD.trial_used_at;
  NEW.founding_member := OLD.founding_member;
  NEW.is_professional := OLD.is_professional;
  NEW.starter_analyses_used := OLD.starter_analyses_used;
  NEW.account_status := OLD.account_status;
  NEW.deactivated_at := OLD.deactivated_at;
  NEW.marketing_consent := OLD.marketing_consent;
  NEW.marketing_consent_at := OLD.marketing_consent_at;
  NEW.last_free_analysis_at := OLD.last_free_analysis_at;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_profile_privileged_columns() FROM PUBLIC, anon, authenticated;

-- ---------- 3. Tier resolution (mirrors useMembership().resolveTier) ----------
-- Deliberately NOT is_member(): that treats ANY live trial as a member,
-- including a Glow Lite trial, which must stay on the free allowance here.
CREATE OR REPLACE FUNCTION public.formulator_tier(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p.user_id IS NULL THEN 'explorer'
    WHEN lower(coalesce(p.subscription_status, '')) = 'trial'
         AND p.trial_ends_at IS NOT NULL AND p.trial_ends_at > now() THEN
      CASE p.trial_plan WHEN 'vip' THEN 'vip' WHEN 'glow_lite' THEN 'glow_lite' ELSE 'insider' END
    WHEN lower(coalesce(p.subscription_status, '')) = 'vip' THEN 'vip'
    WHEN lower(coalesce(p.subscription_status, '')) = 'glow_lite' THEN 'glow_lite'
    WHEN lower(coalesce(p.subscription_status, '')) IN ('active', 'insider', 'premium') THEN 'insider'
    ELSE 'explorer'
  END
  FROM (SELECT _user_id AS uid) u
  LEFT JOIN public.profiles p ON p.user_id = u.uid
$$;
REVOKE ALL ON FUNCTION public.formulator_tier(uuid) FROM PUBLIC, anon, authenticated;

-- ---------- 4. Read: allowance status (dashboard card, locked state) ----------
CREATE OR REPLACE FUNCTION public.get_formulator_allowance(p_variant_key text DEFAULT 'control')
RETURNS TABLE (
  tier text,
  unlimited boolean,
  free_remaining int,
  window_days int,
  last_free_analysis_at timestamptz,
  last_analysis_at timestamptz,
  next_unlock_at timestamptz,
  pass_balance int
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tier text;
  v_allowance int;
  v_window int;
  v_last_free timestamptz;
  v_last_any timestamptz;
  v_unlock timestamptz;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT s.free_ai_analysis_allowance, s.free_analysis_window_days INTO v_allowance, v_window
    FROM public.pricing_settings s WHERE s.variant_key = coalesce(p_variant_key, 'control');
  IF NOT FOUND THEN
    SELECT s.free_ai_analysis_allowance, s.free_analysis_window_days INTO v_allowance, v_window
      FROM public.pricing_settings s WHERE s.variant_key = 'control';
  END IF;
  v_allowance := COALESCE(v_allowance, 1);
  v_window := COALESCE(v_window, 30);

  v_tier := public.formulator_tier(v_uid);
  SELECT p.last_free_analysis_at INTO v_last_free FROM public.profiles p WHERE p.user_id = v_uid;
  SELECT max(r.created_at) INTO v_last_any
    FROM public.skincare_recommendations r WHERE r.user_id = v_uid AND r.status = 'delivered';

  IF v_tier IN ('insider', 'vip') THEN
    RETURN QUERY SELECT v_tier, true, NULL::int, v_window, v_last_free, v_last_any, NULL::timestamptz,
      public.available_ai_credits(v_uid);
    RETURN;
  END IF;

  v_unlock := CASE WHEN v_last_free IS NULL THEN NULL ELSE v_last_free + make_interval(days => v_window) END;
  IF v_allowance > 0 AND (v_unlock IS NULL OR now() >= v_unlock) THEN
    RETURN QUERY SELECT v_tier, false, 1, v_window, v_last_free, v_last_any, NULL::timestamptz,
      public.available_ai_credits(v_uid);
  ELSE
    RETURN QUERY SELECT v_tier, false, 0, v_window, v_last_free, v_last_any, v_unlock,
      public.available_ai_credits(v_uid);
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.get_formulator_allowance(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_formulator_allowance(text) TO authenticated;

-- ---------- 5. Write: the ONLY path that saves a starter analysis ----------
-- Checks and stamps the allowance in the same transaction as the insert, so a
-- tampered client can't skip the check (the cutover migration removes the
-- direct-insert RLS path for starter rows). Idempotent on client_analysis_id:
-- re-saving the same analysis (refinement, retry, double click) updates it and
-- is never charged twice.
CREATE OR REPLACE FUNCTION public.save_starter_analysis(
  p_client_analysis_id text,
  p_skin_type text,
  p_concerns text[],
  p_recommendation text,
  p_result_payload jsonb,
  p_analysis_completeness numeric DEFAULT NULL,
  p_mst_tone smallint DEFAULT NULL,
  p_contact_name text DEFAULT NULL,
  p_contact_whatsapp text DEFAULT NULL,
  p_photo_storage_path text DEFAULT NULL,
  p_variant_key text DEFAULT 'control'
)
RETURNS TABLE (recommendation_id uuid, source text, next_unlock_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing uuid;
  v_tier text;
  v_allowance int;
  v_window int;
  v_last_free timestamptz;
  v_unlock timestamptz;
  v_source text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_client_analysis_id IS NULL OR length(p_client_analysis_id) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Invalid analysis id';
  END IF;
  IF p_result_payload IS NULL OR octet_length(p_result_payload::text) > 262144
     OR octet_length(coalesce(p_recommendation, '')) > 65536 THEN
    RAISE EXCEPTION 'Invalid analysis payload';
  END IF;
  IF p_mst_tone IS NOT NULL AND p_mst_tone NOT BETWEEN 1 AND 10 THEN
    RAISE EXCEPTION 'Invalid MST tone';
  END IF;
  IF p_photo_storage_path IS NOT NULL AND p_photo_storage_path NOT LIKE v_uid::text || '/%' THEN
    RAISE EXCEPTION 'Invalid photo path';
  END IF;

  -- Serialise concurrent saves for the same account (double submit, two tabs).
  PERFORM 1 FROM public.profiles WHERE user_id = v_uid FOR UPDATE;

  SELECT r.id INTO v_existing FROM public.skincare_recommendations r
   WHERE r.user_id = v_uid AND r.client_analysis_id = p_client_analysis_id;

  IF v_existing IS NOT NULL THEN
    UPDATE public.skincare_recommendations SET
      skin_type = p_skin_type,
      concerns = p_concerns,
      recommendation = p_recommendation,
      result_payload = p_result_payload,
      analysis_completeness = p_analysis_completeness,
      mst_tone = p_mst_tone,
      mst_source = CASE WHEN p_mst_tone IS NOT NULL THEN 'user_reported' ELSE NULL END,
      contact_name = coalesce(p_contact_name, contact_name),
      contact_whatsapp = coalesce(p_contact_whatsapp, contact_whatsapp),
      photo_storage_path = coalesce(p_photo_storage_path, photo_storage_path)
    WHERE id = v_existing;
    RETURN QUERY SELECT v_existing, 'existing'::text, NULL::timestamptz;
    RETURN;
  END IF;

  v_tier := public.formulator_tier(v_uid);

  IF v_tier IN ('insider', 'vip') THEN
    v_source := 'membership';
  ELSE
    SELECT s.free_ai_analysis_allowance, s.free_analysis_window_days INTO v_allowance, v_window
      FROM public.pricing_settings s WHERE s.variant_key = coalesce(p_variant_key, 'control');
    IF NOT FOUND THEN
      SELECT s.free_ai_analysis_allowance, s.free_analysis_window_days INTO v_allowance, v_window
        FROM public.pricing_settings s WHERE s.variant_key = 'control';
    END IF;
    v_allowance := COALESCE(v_allowance, 1);
    v_window := COALESCE(v_window, 30);

    SELECT p.last_free_analysis_at INTO v_last_free FROM public.profiles p WHERE p.user_id = v_uid;
    v_unlock := CASE WHEN v_last_free IS NULL THEN NULL ELSE v_last_free + make_interval(days => v_window) END;

    IF v_allowance > 0 AND (v_unlock IS NULL OR now() >= v_unlock) THEN
      v_source := 'free_allowance';
      PERFORM set_config('app.privileged_write', 'on', true);
      UPDATE public.profiles
         SET last_free_analysis_at = now(),
             starter_analyses_used = coalesce(starter_analyses_used, 0) + 1
       WHERE user_id = v_uid;
      PERFORM set_config('app.privileged_write', 'off', true);
    ELSIF public.available_ai_credits(v_uid) > 0 THEN
      v_source := 'analysis_pass';
      INSERT INTO public.ai_credit_transactions (user_id, delta, reason)
      VALUES (v_uid, -1, 'consume:starter_analysis');
    ELSE
      RAISE EXCEPTION 'formulator_limit_reached'
        USING ERRCODE = 'P0001',
              DETAIL = coalesce(v_unlock::text, ''),
              HINT = 'formulator_limit_reached';
    END IF;
  END IF;

  INSERT INTO public.skincare_recommendations (
    user_id, client_analysis_id, skin_type, concerns, recommendation, status,
    mst_tone, mst_source, analysis_completeness, result_payload,
    contact_name, contact_whatsapp, photo_storage_path
  ) VALUES (
    v_uid, p_client_analysis_id, p_skin_type, p_concerns, p_recommendation, 'delivered',
    p_mst_tone, CASE WHEN p_mst_tone IS NOT NULL THEN 'user_reported' ELSE NULL END,
    p_analysis_completeness, p_result_payload,
    p_contact_name, p_contact_whatsapp, p_photo_storage_path
  ) RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_source,
    CASE WHEN v_source = 'free_allowance' THEN now() + make_interval(days => v_window) ELSE NULL END;
END;
$$;
REVOKE ALL ON FUNCTION public.save_starter_analysis(text, text, text[], text, jsonb, numeric, smallint, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_starter_analysis(text, text, text[], text, jsonb, numeric, smallint, text, text, text, text) TO authenticated;
