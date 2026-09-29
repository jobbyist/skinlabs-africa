-- SKYNN AI intake PDFs: orphan sweep (2026-09-27).
--
-- A member's delete removes the report row in SQL and then the stored PDF
-- through the Storage API (skynn-advanced-assessment `delete_session`), and
-- account-delete does the same. If that second step ever fails, the PDF —
-- special personal information — would be left behind with nothing
-- pointing at it. This lists such orphans so the worker can remove them
-- through the Storage API on its next tick; the cron guard also fires when
-- one exists. The 10-minute grace avoids racing a PDF that has just been
-- uploaded but not yet recorded against its report.

CREATE OR REPLACE FUNCTION public.list_orphan_intake_pdfs(p_limit int DEFAULT 50)
RETURNS TABLE (name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.name
    FROM storage.objects o
   WHERE o.bucket_id = 'skynn-advanced-intake'
     AND o.created_at < now() - interval '10 minutes'
     AND NOT EXISTS (SELECT 1 FROM public.advanced_assessment_reports r WHERE r.pdf_storage_path = o.name)
   ORDER BY o.created_at
   LIMIT greatest(1, least(coalesce(p_limit, 50), 200));
$$;
REVOKE ALL ON FUNCTION public.list_orphan_intake_pdfs(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_orphan_intake_pdfs(int) TO service_role;

SELECT cron.schedule(
  'skynn-advanced-worker',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/skynn-advanced-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'skynn_worker_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  )
  WHERE EXISTS (
    SELECT 1 FROM public.advanced_assessment_reports
     WHERE (locked_at IS NULL OR locked_at < now() - interval '5 minutes')
       AND (
         (processing_mode = 'production' AND generation_status = 'pending')
         OR (processing_mode = 'fallback' AND intake_status = 'pending' AND intake_attempts < 6
             AND (pdf_status IS DISTINCT FROM 'generated' OR internal_email_status IS DISTINCT FROM 'sent')
             AND (intake_next_attempt_at IS NULL OR intake_next_attempt_at <= now()))
       )
  )
  OR EXISTS (SELECT 1 FROM public.list_orphan_intake_pdfs(1));
  $$
);
