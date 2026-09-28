/**
 * Daily Skinny Briefings pipeline entrypoint.
 * Source of truth is the committed implementation; deployed Edge Function may
 * pin an immutable raw URL for runtime (see supabase deploy notes).
 *
 * Generates 1 full-length briefing daily at 06:00 SAST. QA gate enforces SEO
 * heading hierarchy and unique cover images. See CLAUDE.md and this file's
 * full implementation history.
 *
 * Re-export of the last pre-placeholder implementation; hardened revision is
 * applied via Edge Function deploy with local _shared copies.
 */
import "https://raw.githubusercontent.com/jobbyist/skinlabs-africa/2ebc766e15d30956d66236ee180c4c8e90dd676e/supabase/functions/briefings-sync/index.ts";
