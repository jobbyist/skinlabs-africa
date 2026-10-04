# Proposed migrations (not applied)

Files here are **proposals for review**. Nothing in this directory is picked up by Supabase's migration tooling, the deploy
scripts or `scripts/run-sql-probes.sh`. To adopt one: read it, move it into `supabase/migrations/` with a real timestamp, apply it
to the live project, run its `.probe.sql` (rolled back), then regenerate `types.ts` if the schema changed.

| File | What | Why |
|---|---|---|
| `20261006120000_notification_automation_fixes.sql` | `notification_guard_ok`, `run_notification_automation` (journal / free analysis / trial lifecycle / weekly recap branches), two template wordings | Findings F1-F5 in `docs/notification-automations-review-2026-10-04.md` |
| `20261006120000_notification_automation_fixes.probe.sql` | Rolled-back assertions for the above | Run after applying |
| `20261006121000_announce_podcast_episode_once.sql` | `admin_announce_podcast_episode` refuses a second announcement of the same episode | Finding F8 (double push) |

The first file was dry-run against the live schema as `pg_temp` copies (nothing persisted) and every changed branch behaved as described;
see the review document for the output.
