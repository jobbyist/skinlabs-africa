-- Daily trial-lifecycle email enqueue, 06:05 South Africa time (SAST = UTC+2, no daylight saving, so a fixed
-- 04:05 UTC). Applied live 2026-10-03 after a dry run (trial_lifecycle_email_plan over 3 Oct - 10 Nov showed the
-- one live trialist getting: nudge 5 Oct, week-left 25 Oct, last-chance 29 Oct). Each email is idempotent per
-- template + user + trial_ends_at, so a re-run never double-sends.
SELECT cron.schedule('trial-lifecycle-emails-daily', '5 4 * * *', $$SELECT public.enqueue_trial_lifecycle_emails()$$);
