-- SKYNN AI v2 hardening (2026-09-23): retire the v1 synchronous completion
-- path. complete_advanced_assessment_session() marked a report 'completed'
-- with no human-review hold; v2 completes only through
-- complete_advanced_assessment_for_review(). If an older deployment of
-- skynn-advanced-assessment (e.g. redeployed from a stale branch by the
-- GitHub integration) ever called the v1 function, it now errors, the
-- caller's catch path runs fail_advanced_assessment_session(), and the
-- member's Analysis Pass is refunded — rather than a report bypassing review.
REVOKE EXECUTE ON FUNCTION public.complete_advanced_assessment_session(uuid, jsonb, text, jsonb, text, text, text, text) FROM service_role;
COMMENT ON FUNCTION public.complete_advanced_assessment_session(uuid, jsonb, text, jsonb, text, text, text, text) IS 'RETIRED 2026-09-23 (SKYNN AI v2): not executable by any API role. Use complete_advanced_assessment_for_review().';
