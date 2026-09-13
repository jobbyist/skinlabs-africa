-- The Daily Skinny's daily auto-generation cron is retired in favour of the new
-- product-review pipeline (api/product-review-sync.ts, a Vercel Cron -- see
-- vercel.json's `crons` -- rather than a Supabase pg_cron job, since it needs
-- GEMINI_API_KEY from Vercel's own project environment variables). The
-- newsroom-sync edge function itself is left in place (existing briefings still
-- render at /briefings, and an admin can still trigger it manually) -- only its
-- automatic daily schedule is removed.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE command ILIKE '%newsroom-sync%';
