# SkinLabs® Community Forum

Members-only discussion space at **`/community-forum`** (deep link: `/community-forum?post=<uuid>`).
Added 2026-10-08. **Applied live 2026-10-08** (project `gnkpzijxuciiaamakgzm`), in order: `20261008100000_community_forum_schema`,
`…110000_community_forum_notifications`, `…130000_community_media_and_avatars`, `…140000_community_spam_and_moderation`,
`…150000_community_forum_seed`, `…160000_community_fk_indexes`. Probe: `supabase/tests/community_forum.sql` (59 assertions, always rolled back;
passes on a local Postgres and on the live schema). `types.ts` was regenerated from the live DB afterwards.

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

## Posts with images, GIFs and emoji
* Composer (`ComposeSheet`): title, topic, details, an emoji popover (curated set, no dependency; inserted at the caret), **Photo** and **GIF** buttons
  (one attachment per post), preview with remove, draft kept for the tab, honeypot + minimum-fill-time check.
* **Upload pipeline** (`src/lib/community/image.ts`, byte helpers in `imageBytes.ts`): the file type is sniffed from its bytes (not its name), decoded with EXIF
  rotation applied, and re-encoded as **lossless WebP (quality 1) and PNG**; the smallest of {lossless WebP, PNG, the original with metadata stripped} is
  uploaded. Pixels are never altered, and EXIF/GPS never reaches storage (a JPEG that is already smaller is uploaded as-is after its EXIF/XMP/IPTC segments
  are removed; JPEGs with a rotation tag are re-encoded instead). **Animated GIFs are uploaded untouched** (re-encoding would drop the animation). The one
  non-lossless step is a safety net: a picture over 4096 px or over the per-file limit (3 MB posts / 1 MB avatars) is scaled down and the member is told.
  Lossless encoding of photos can be larger than a camera JPEG, which is why the original (stripped) competes in the pick.
* GIFs are **upload only**. A GIF search (Giphy/Tenor) needs a provider API key that this project does not have.
* Storage: public-read buckets `community-media` (3 MB, webp/png/jpeg/gif) and `avatars` (1 MB, webp/png/jpeg); object names are `<user-id>/<uuid>.<ext>` and cannot
  be listed; writes/deletes are limited to the caller's own folder (storage RLS), and `community_posts.image_path` must sit in the author's folder (trigger).
  Deleting your own post removes its image; replacing/removing an avatar deletes the old file.

## Profile pictures
Dashboard -> Settings -> Profile -> "Profile picture" (`AvatarUploader`): centre-cropped to a square on-device (max 512 px), same lossless pipeline,
stored as `profiles.avatar_path` (CHECK: own folder only). Shown with the username on posts and comments (`community_feed` / `community_comments_page` return `author_avatar`).

## Spam protection
In the database (`community_guard_insert()` + `community_screen()`); the browser adds only a honeypot field and a minimum-fill-time check.
* **Refused**: the same text by the same author within 24 h (`duplicate_content`), bursts (3 posts / 2 min, 6 comments / min), plus the hourly caps (5 posts, 30 comments).
* **Held** (saved as `status = 'held'` with `spam_flags`; visible only to the author and staff; no notifications; not counted): 3+ links, any link from an account younger than
  3 days, link shorteners / messaging links, e-mail addresses or phone numbers, an admin-managed blocked-terms list (`community_spam_terms`), ALL CAPS, repetition.
  Staff content is never held. The author sees "Awaiting moderator review".
* **Auto-hold**: three different members reporting the same post/comment hold it (not pinned or staff content).

## Admin -> Moderation
`ModerationTab` (admin dashboard): counters, Reports (open / actioned / dismissed; remove content or dismiss), Held (approve / reject with the spam flags shown), Blocked terms
(any staff can read, only admins change), Action log. Backed by staff-only RPCs `community_admin_overview/reports/held/log/terms`, `community_review_held`,
`community_admin_set_term`, `community_resolve_report`; every call re-checks the role server-side.

## Community Guidelines popup
The "Community guidelines" link on the forum opens `GuidelinesDialog` (scrollable, `max-h-88dvh`, safe on phones) rendering the same `GuidelinesContent` as `/community-guidelines`
(which gained section 6, "Posting in the Community Forum"; effective date moved to 8 October 2026 — worth a legal read).

## Ads in the feed
After every second discussion the feed renders a unit, alternating `AdSlot` (AdSense) and `FaithfulToNature`, never adjacent and never before the first post. Both components apply the
viewer's plan (full / Insider light / VIP none) themselves. **Policy risk:** AdSense generally does not allow ad units on pages that require sign-in or on user-generated content that
Google's crawler can't review; watch the AdSense policy centre after this ships and be ready to remove `data-feed-ad` units.

## Moderation (foundation)
Members: Report (post or comment), delete own. Moderators/admins: pin/unpin, remove post/comment (closes open reports on it, logged).
The admin dashboard has a Moderation tab (see above).

## Seed content
14 discussions, 36 comments and 105 likes (54 on posts, 51 on comments; likes by "Michael C." are skipped because that author is the real admin account, which cannot like as a persona). "Michael C." (Admin) posts from the real admin account (found by role + name); "Nicole N." and
"Cole O." (Moderators) and eight member voices are `community_personas`, not accounts. To remove: delete the posts whose `persona_id` is a seed
persona (comments and likes cascade), then the seed personas.

## Follow-ups
Replies (`parent_id`) and mentions, bookmarks, member suspension/mutes, a per-member storage quota (storage is capped per file, not per member), GIF search (needs a provider key),
linking ingredient mentions to `/ingredients/:slug`, and a real-device check of push delivery.
