-- SKYNN AI v2.1 — retire the legacy live-AI path. APPLY ONLY AFTER the v2.1
-- frontend is live on production (the pre-v2.1 frontend still calls these
-- RPCs from the browser; applying this first would break its member path).
--
-- After v2.1:
--   * Basic AI Skin Analysis is the deterministic engine for every tier and is
--     saved only through save_starter_analysis().
--   * The Advanced AI Dermatology Analysis spends a Pass only inside
--     submit_advanced_assessment_session() (SECURITY DEFINER, which keeps
--     working without a client grant) and refunds it only server-side.
--   * The skincare-ai edge function returns 410 and writes nothing.
-- So the client grants below have no remaining legitimate caller.

REVOKE EXECUTE ON FUNCTION public.consume_analysis_pass() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_analysis_pass(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.register_ai_analysis_use() FROM authenticated;

-- skincare-ai was the only writer that used this policy (client_analysis_id
-- and result_payload NULL). Without it a client could still insert bare
-- 'delivered' rows, which the journey model counts toward activation.
DROP POLICY IF EXISTS "Users can insert their own recommendations" ON public.skincare_recommendations;
