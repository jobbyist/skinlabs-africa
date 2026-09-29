-- SKYNN AI v2.1 — beta: Basic AI Skin Analysis limit + entitlement hardening.
--
-- Terminology: "Basic AI Skin Analysis" is the product name. The database keeps
-- its historical identifiers (save_starter_analysis, starter_analyses_used,
-- skynn_fairness_events.source = 'starter') — renaming them would break
-- compatibility and historical reporting for no user-visible gain.
--
-- 1. Basic AI Skin Analysis window: 1 per ROLLING 7 days (was 30) for Glow
--    Explorer and Glow Lite. Glow Insider / VIP stay unlimited (product decision
--    2026-09-28). Still DB-driven via pricing_settings.free_analysis_window_days.
-- 2. save_starter_analysis():
--    * NO Analysis Pass fallback any more — a Basic AI Skin Analysis never
--      spends an Analysis Pass (Passes are only for the Advanced AI Dermatology
--      Analysis, consumed by submit_advanced_assessment_session()).
--    * raises profile_missing when the caller has no profiles row (previously
--      the FOR UPDATE / stamp matched nothing, so the free allowance was
--      effectively unlimited for such an account).
--    * unchanged: idempotent on client_analysis_id; the allowance is only
--      stamped in the same transaction that inserts the delivered row, so a
--      failed analysis never consumes the week's allowance.
-- 3. consume_analysis_pass(): per-user transaction-scoped advisory lock before
--    the balance read, so two concurrent calls can't both spend the last Pass.
-- 4. skin-analysis-photos bucket: 5 MB + image MIME limits. (The v2.1 frontend
--    no longer uploads Basic photos at all; the bucket held 0 objects at the time
--    of this migration.)
-- 5. skincare_recommendations.mst_source: only 'user_reported' (or NULL) is
--    allowed — MST is never model-estimated or inferred from a photo. 0 rows had
--    'model_estimated' when this was applied.
-- 6. skynn_ops_summary(p_days): admin-only operational counts for SKYNN AI.

-- 1 ---------------------------------------------------------------------------
UPDATE public.pricing_settings SET free_analysis_window_days = 7
 WHERE free_analysis_window_days IS DISTINCT FROM 7;
ALTER TABLE public.pricing_settings ALTER COLUMN free_analysis_window_days SET DEFAULT 7;

-- 2 ---------------------------------------------------------------------------
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
RETURNS TABLE(recommendation_id uuid, source text, next_unlock_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Serialises concurrent saves for the same account (row lock). No row →
  -- refuse rather than silently skipping the allowance stamp.
  PERFORM 1 FROM public.profiles WHERE user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_missing' USING ERRCODE = 'P0001', HINT = 'profile_missing';
  END IF;

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
    v_window := COALESCE(v_window, 7);

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
    ELSE
      -- No Analysis Pass fallback: Passes are for the Advanced AI Dermatology Analysis only.
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
$function$;

REVOKE ALL ON FUNCTION public.save_starter_analysis(text, text, text[], text, jsonb, numeric, smallint, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_starter_analysis(text, text, text[], text, jsonb, numeric, smallint, text, text, text, text) TO authenticated;

-- get_formulator_allowance: only the window default changes (30 → 7). pass_balance
-- stays in the return type for compatibility; the UI no longer offers it for Basic.
CREATE OR REPLACE FUNCTION public.get_formulator_allowance(p_variant_key text DEFAULT 'control')
RETURNS TABLE(tier text, unlimited boolean, free_remaining integer, window_days integer,
              last_free_analysis_at timestamptz, last_analysis_at timestamptz,
              next_unlock_at timestamptz, pass_balance integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  v_window := COALESCE(v_window, 7);

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
$function$;

REVOKE ALL ON FUNCTION public.get_formulator_allowance(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_formulator_allowance(text) TO authenticated;

-- 3 ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_analysis_pass()
RETURNS TABLE(allowed boolean, transaction_id uuid, remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_balance int;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- One spender per account at a time: the balance read and the -1 insert below
  -- happen under this lock, so two concurrent calls can't both spend the last Pass.
  PERFORM pg_advisory_xact_lock(hashtextextended('analysis_pass:' || v_uid::text, 0));

  v_balance := public.available_ai_credits(v_uid);
  IF v_balance <= 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 0;
    RETURN;
  END IF;

  INSERT INTO public.ai_credit_transactions (user_id, delta, reason)
  VALUES (v_uid, -1, 'consume:advanced_analysis')
  RETURNING id INTO v_id;

  RETURN QUERY SELECT true, v_id, v_balance - 1;
END;
$function$;

-- Grants unchanged for now (the production frontend before v2.1 still calls it
-- directly); 20260928150000_skynn_v21_retire_legacy_ai.sql revokes the client grant.
REVOKE ALL ON FUNCTION public.consume_analysis_pass() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_analysis_pass() TO authenticated, service_role;

-- 4 ---------------------------------------------------------------------------
UPDATE storage.buckets
   SET file_size_limit = 5242880,
       allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
 WHERE id = 'skin-analysis-photos';

-- 5 ---------------------------------------------------------------------------
ALTER TABLE public.skincare_recommendations
  DROP CONSTRAINT IF EXISTS skincare_recommendations_mst_source_check;
ALTER TABLE public.skincare_recommendations
  ADD CONSTRAINT skincare_recommendations_mst_source_check
  CHECK (mst_source IS NULL OR mst_source = 'user_reported');
COMMENT ON COLUMN public.skincare_recommendations.mst_source IS
  'Always user_reported (or NULL when the member skipped MST). Monk Skin Tone is self-reported and optional; it is never inferred from a photo or estimated by a model.';

-- 6 ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.skynn_ops_summary(p_days integer DEFAULT 7)
RETURNS TABLE (
  window_days integer,
  basic_analyses_saved bigint,
  basic_limit_hits bigint,
  skynn_starts bigint,
  skynn_results_viewed bigint,
  skynn_pdf_downloads bigint,
  skynn_errors bigint,
  advanced_submissions bigint,
  advanced_pending bigint,
  advanced_intake_pdf_failed bigint,
  advanced_intake_email_failed bigint,
  analysis_passes_consumed bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_days int := least(greatest(coalesce(p_days, 7), 1), 90);
  v_from timestamptz := now() - make_interval(days => least(greatest(coalesce(p_days, 7), 1), 90));
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT
    v_days,
    (SELECT count(*) FROM public.skincare_recommendations r
      WHERE r.status = 'delivered' AND r.result_payload IS NOT NULL AND r.created_at >= v_from),
    (SELECT count(*) FROM public.analytics_events e
      WHERE e.event_name = 'skynn_basic_limit_reached' AND e.created_at >= v_from),
    (SELECT count(*) FROM public.analytics_events e
      WHERE e.event_name = 'skynn_started' AND e.created_at >= v_from),
    (SELECT count(*) FROM public.analytics_events e
      WHERE e.event_name = 'skynn_results_viewed' AND e.created_at >= v_from),
    (SELECT count(*) FROM public.analytics_events e
      WHERE e.event_name = 'skynn_results_pdf_downloaded' AND e.created_at >= v_from),
    (SELECT count(*) FROM public.analytics_events e
      WHERE e.event_name = 'skynn_error' AND e.created_at >= v_from),
    (SELECT count(*) FROM public.advanced_assessment_reports a WHERE a.submitted_at >= v_from),
    (SELECT count(*) FROM public.advanced_assessment_reports a
      WHERE a.processing_mode = 'fallback' AND a.intake_status IN ('pending', 'submitted')),
    (SELECT count(*) FROM public.advanced_assessment_reports a
      WHERE a.pdf_status = 'failed' AND coalesce(a.submitted_at, a.created_at) >= v_from),
    (SELECT count(*) FROM public.advanced_assessment_reports a
      WHERE a.internal_email_status = 'failed' AND coalesce(a.submitted_at, a.created_at) >= v_from),
    (SELECT count(*) FROM public.ai_credit_transactions t
      WHERE t.delta < 0 AND t.reason LIKE 'consume:%' AND t.created_at >= v_from);
END;
$$;

REVOKE ALL ON FUNCTION public.skynn_ops_summary(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.skynn_ops_summary(integer) TO authenticated;
COMMENT ON FUNCTION public.skynn_ops_summary(integer) IS
  'Admin-only SKYNN AI v2.1 operational counts (no PII) over the last p_days (1-90). Returns no rows unless has_role(auth.uid(), ''admin'').';
