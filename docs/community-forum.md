# SkinLabs® Community Forum

Members-only discussion space at **`/community-forum`** (deep link: `/community-forum?post=<uuid>`).
Added 2026-10-08. Migrations (apply in order, **not yet applied live**): `20261008100000_community_forum_schema.sql`,
`20261008110000_community_forum_notifications.sql`, `20261008120000_community_forum_seed.sql`. Probe: `supabase/tests/community_forum.sql`
(40 assertions, rolled back; passes on a local Postgres with the real notification-engine migrations).

## Data model
| Table | Purpose |
|---|---|
| `community_posts` | title, body, category, `status` (published/removed/deleted), `pinned`, counters (`like_count`, `comment_count`, `share_count`), `edited_at`, soft delete |
| `community_comments` | body, `post_id`, `parent_id` (replies later), `status`, `like_count` |
| `community_post_likes`, `community_comment_likes` | one row per member per target (unique partial indexes) |
| `community_post_shares` | one row per member per post (counts people, not taps) |
| `community_reports` | member reports (reason + details), staff-readable, one per reporter per target |
| `community_moderation_log` | append-only record of remove / restore / pin / delete_own |
| `community_categories` | topics (reference data) |
| `community_personas` | display-only authors for the seed content (no login, no email, never notified) |

Exactly one of `author_id` / `persona_id` is set on posts, comments and likes. Real members always use `author_id`.

## Security
* Column-level grants decide what a member can write: only `title/body/category/author_id` on posts, `post_id/parent_id/body/author_id`
  on comments. Counters, `status`, `pinned` and persona ids are never writable by clients; triggers maintain counters.
* RLS: everyone signed in reads published content; authors see their own removed content; staff see all. Likes are readable only by
  their owner (nobody can enumerate who liked what), so realtime for likes rides on the counters of the post/comment rows.
* Staff come from `user_roles` via `has_role()`. Moderation is `community_moderate()` / `community_resolve_report()` (SECURITY DEFINER,
  42501 for non-staff). Authors soft-delete through `community_delete_own()`.
* Write guard trigger: a member needs a chosen public handle (`handle_required`) and an active account; 5 posts / 30 comments per hour
  (`rate_limited`).
* Reads go through `community_feed()` / `community_comments_page()` / `community_comment_by_id()` (keyset pagination, author name + role
  resolved server-side). Staff display "First L."; members display their public handle. `profiles` is never read by the browser.
* User text is rendered as plain text (`whitespace-pre-line`), never as HTML.

## Realtime
One channel per page (`useCommunityRealtime`) on `community_posts` and `community_comments`. Events patch the react-query cache
(counts, edits, removals); a new discussion by someone else shows as an "N new discussions" button instead of shifting the feed.
On reconnect everything is refetched. Private query keys (`community`) are removed on sign-out.

## Notifications and push
* Triggers on likes and comments call `community_notify()` -> `enqueue_notification()` (the existing engine: inbox row + push dispatch).
* New push category **`community`** (preference column, default ON, Settings -> Notifications "Community activity").
* Templates: `community_post_liked`, `community_comment_liked`, `community_post_commented`. Link: `/community-forum?post=<id>`.
* Never notifies the actor or a persona; idempotent per event (unlike + re-like does not repeat); inbox-only if the recipient already got a
  community push for the same post in the last 10 minutes; pushes for one post share a `tag`, so a device replaces instead of stacking.
  Quiet hours, the daily cap and the push kill switch apply as for every category; the inbox row is always written.
* Lock-screen text is generic ("Cole commented on your post" / "Tap to read it in the SkinLabs® Community."): the post title is only in the
  inbox body, behind sign-in (standing notification-engine rule: user-written skin topics must not appear on a lock screen).
* Delivery is the existing `notification-dispatcher` cron (every minute), so a push arrives within about a minute.
* Opening a thread marks the related inbox notifications read.

## Moderation (foundation)
Members: Report (post or comment), delete own. Moderators/admins: pin/unpin, remove post/comment (closes open reports on it, logged).
There is no moderation dashboard yet: reports are in `community_reports` (staff `SELECT`), resolved with `community_resolve_report()`.

## Seed content
14 discussions, ~36 comments and ~120 likes. "Michael C." (Admin) posts from the real admin account (found by role + name); "Nicole N." and
"Cole O." (Moderators) and eight member voices are `community_personas`, not accounts. To remove: delete the posts whose `persona_id` is a seed
persona (comments and likes cascade), then the seed personas.

## Follow-ups
Regenerate `src/integrations/supabase/types.ts` after applying (the forum uses an untyped client until then), an admin reports queue, replies
(`parent_id`) and mentions, bookmarks, linking ingredient mentions to `/ingredients/:slug`, and a real-device check of push delivery.
