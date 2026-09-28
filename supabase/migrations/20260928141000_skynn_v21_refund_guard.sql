-- SKYNN AI v2.1 — close an Analysis Pass refund bypass (found in the v2.1 audit).
--
-- refund_analysis_pass() is client-callable. It existed so the legacy in-page
-- "Advanced" path could hand a Pass back when the skincare-ai call failed. It
-- accepted ANY of the caller's 'consume:advanced_analysis' transactions — which
-- is the same reason consume_analysis_pass() writes when
-- submit_advanced_assessment_session() spends a Pass on an Advanced AI
-- Dermatology Analysis submission. So a member could submit, then refund that
-- transaction themselves and keep both the submission and the Pass.
--
-- Now a client refund is refused when:
--   * the transaction is linked to an advanced_assessment_sessions row (those are
--     refunded only server-side, by _refund_advanced_session_pass(), on failure,
--     rejection or withdrawal), or
--   * it is older than 15 minutes (the legacy path refunds immediately after a
--     failed call; nothing legitimate refunds later).
-- The grant is removed entirely by 20260928150000_skynn_v21_retire_legacy_ai.sql
-- once the v2.1 frontend (which never calls it) is live.

CREATE OR REPLACE FUNCTION public.refund_analysis_pass(p_transaction_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_refund_reason text := 'refund:' || p_transaction_id::text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('analysis_pass:' || v_uid::text, 0));

  IF NOT EXISTS (
    SELECT 1 FROM public.ai_credit_transactions
     WHERE id = p_transaction_id AND user_id = v_uid AND reason = 'consume:advanced_analysis' AND delta = -1
       AND created_at > now() - interval '15 minutes'
  ) THEN
    RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM public.advanced_assessment_sessions s WHERE s.pass_transaction_id = p_transaction_id) THEN
    RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM public.ai_credit_transactions WHERE user_id = v_uid AND reason = v_refund_reason) THEN
    RETURN false;
  END IF;

  INSERT INTO public.ai_credit_transactions (user_id, delta, reason)
  VALUES (v_uid, 1, v_refund_reason);
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.refund_analysis_pass(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refund_analysis_pass(uuid) TO authenticated, service_role;
