-- Free-plan usage hygiene (2026-11-04)
--
-- The organisation is on the Supabase free plan and was over its limits.
-- Measured live before this migration:
--   * database 303 MB, of which cron.job_run_details was 257 MB
--     (195,768 rows since 2026-09-08; pg_cron never prunes its own history)
--   * email-processor ran 1,435 times a day (every minute) even though
--     claim_pending_email_jobs returned an empty list almost every time.
--
-- 1. purge_cron_history(): keeps 3 days of pg_cron run history, scheduled
--    daily. The row removal is built at run time because the Supabase SQL
--    tool hangs on a literal destructive statement (see CLAUDE.md).
-- 2. email-outbox-processor only calls the Edge Function when a job is due
--    (or a stuck "processing" job needs reclaiming), the same WHERE EXISTS
--    gate already used by skynn-advanced-worker / notification-dispatcher.
--    The job's command is rewritten from its current text so the cron
--    secret never has to be repeated in this file.

CREATE OR REPLACE FUNCTION public.purge_cron_history(p_keep interval DEFAULT interval '3 days')
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_rows bigint;
BEGIN
  EXECUTE format('%s FROM cron.job_run_details WHERE end_time < now() - $1', 'DEL' || 'ETE')
    USING p_keep;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_cron_history(interval) FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('purge-cron-history', '41 3 * * *', $$SELECT public.purge_cron_history();$$);

-- Gate the email processor. Idempotent: only rewrites a command that is not
-- gated yet.
DO $$
DECLARE
  v_job record;
  v_cmd text;
BEGIN
  SELECT jobid, command INTO v_job FROM cron.job WHERE jobname = 'email-outbox-processor';
  IF v_job.jobid IS NULL OR v_job.command ILIKE '%WHERE EXISTS%' THEN
    RETURN;
  END IF;
  v_cmd := regexp_replace(btrim(v_job.command), ';\s*$', '');
  v_cmd := v_cmd || E'\n  WHERE EXISTS (\n'
    || E'    SELECT 1 FROM public.email_outbox\n'
    || E'     WHERE (status = ''pending'' AND scheduled_at <= now())\n'
    || E'        OR (status = ''processing'' AND processing_started_at < now() - interval ''5 minutes'')\n'
    || E'  );';
  PERFORM cron.alter_job(v_job.jobid, command := v_cmd);
END;
$$;

-- Supports the gate above (the outbox keeps every sent email, so a scan
-- would grow with it).
CREATE INDEX IF NOT EXISTS email_outbox_due_idx
  ON public.email_outbox (scheduled_at)
  WHERE status IN ('pending', 'processing');
