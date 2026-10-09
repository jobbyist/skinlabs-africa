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
* User text is parsed into data and rendered as React elements by `src/lib/community/markdown.tsx` (no HTML strings, no `dangerouslySetInnerHTML`); links are limited to http(s).

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
* GIFs: **upload**, or **search GIPHY** through the rate-limited proxy `api/giphy.ts` (see "GIPHY rate limiting"). Tenor's API is closed to new integrations.
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
After every second discussion the feed renders a `FaithfulToNature` unit (never adjacent, never before the first post; plan-aware: full / Insider light / VIP none). AdSense units were removed from the forum on 2026-10-08 because AdSense does not allow ads on login-gated or user-generated pages Google can't review.

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


## Quota, 30-day retention and mute/suspend (2026-10-08)

Migration `20261008200000_community_quota_retention_sanctions.sql` (applied live; probe `supabase/tests/community_quota_sanctions.sql`).

- **Picture quota**: 20 MB per member in `community-media` (`community_media_quota_bytes()`). The storage INSERT policy calls `community_media_has_room()`, so an upload is refused once the member is at the quota (one in-flight upload, max 3 MB, can overshoot). `uploadMedia()` also pre-checks `community_my_media_usage()` and throws `media_quota_exceeded` (plain-language message in `writeErrorMessage`). The compose sheet shows "x of 20 MB used".
- **30-day retention**: member posts older than 30 days, plus posts deleted/removed more than 7 days ago, are purged daily at 02:20 UTC by the `community-retention` edge function (pg_cron `community-retention-daily`; auth = Vault secret `community_retention_cron_secret`, verified in SQL, no Edge secret). Pictures are removed through the Storage API first (SQL deletes leave the file behind); a post whose picture could not be removed is kept for the next run. Member comments older than 30 days go too. Pinned posts and seed-persona content are never purged; `community_retention_purge()` re-checks eligibility itself. Abandoned uploads (no post references them, >1 day old) are swept as well. The compose sheet tells members posts expire after 30 days.
- **Mute / suspend**: table `community_sanctions` (service-role only). Mute = cannot post or comment (can read and like); suspend = also cannot like, and the forum feed is hidden in the UI (`useQuery` on `community_my_sanction()`; members see type and end date, never the reason). Enforced in `community_guard_insert()` and a like trigger (`account_muted` / `account_suspended`). One sanction in force per member (a new one replaces the old); durations 24 h / 7 d / 30 d / until lifted; expiry is automatic. Staff cannot be sanctioned, nor can anyone sanction themselves.
- **Admin UI**: Admin -> Moderation -> Members (search by handle, restrict, lift, history), plus "Mute / suspend author" on report and held cards (`SanctionDialog`). Moderators (not only admins) can open /admin: they see the Moderation tab only. Overview counters show restricted members, picture storage (MB) and posts due for the next purge.


## Formatting, replies, GIFs, sidebar (2026-10-09)
* **Formatting** (`src/lib/community/markdown.tsx`, pure parser + renderer, tested in `communityFormatting.test.ts`): `# H1`, `## H2`, `**bold**`, `*italic*`, `~~strike~~`, `` `code` ``, `- `/`* ` and `1. ` lists, `> quote`,
  `[text](https://…)`, `---` divider, and alignment with `-> centred <-` / `-> right ->`. Single line breaks are kept, so older plain posts render unchanged. Headings render as h3/h4 (below the post title).
  Feed cards show a clipped preview; the thread shows everything. Composer toolbar (`FormatToolbar`, transforms in `formatting.ts`) writes exactly this syntax.
* **Vote rail**: column stays `w-11 sm:w-12`; the button fills it (44px target). Haptic via the app's delegated `data-haptic` listener (touch only, respects the Settings switch). Bounce is the `vote-bounce` keyframe; fill follows `--primary`.
* **Replies**: comments carry `parent_id`; `buildCommentTree()` groups them (orphans/cycles surface at top level). Header tap or guide line collapses a sub-thread to `[ + ] name (N replies collapsed)`. Indent stops at depth 5. `OP` is matched by displayed name + role (comments carry no author id).
  Replying sets `parent_id` through the existing column grant; the database does not yet check that the parent belongs to the same post (a mismatch just shows as a top-level comment) and reply notifications still go to the post author only.
* **GIF search** (`giphy.ts`, `GifPicker`, `api/giphy.ts`): see "GIPHY rate limiting" below. A picked GIF is downloaded and goes through the normal upload pipeline (own bucket, 3 MB limit, quota), so readers never load from GIPHY. "Powered by GIPHY" is shown.
* **Keyboard**: `useKeyboardSheet()` tracks `visualViewport` (rAF-coalesced) and moves/limits `ThreadSheet` and `ComposeSheet`; vaul's own `repositionInputs` is off when the API exists. While the keyboard is up the compose footer collapses and Publish sits at the end of the toolbar.
* **Sidebar** (`CommunitySidebar`, lg+): counts from `community_overview()`, moderators from `community_staff_list()` (migration `20261009100000`, probe `supabase/tests/community_sidebar.sql`). **Migration not applied live**: until it is, the numbers and moderator list are simply left out.
* Forum UI carries `.forum-ui` (index.css): no tap highlight, 16px form controls on phones, 1.5px `--primary` focus ring.

## GIPHY rate limiting (2026-10-09)
GIPHY's beta key allows **100 calls per hour for the whole app**, so the browser never calls GIPHY. `api/giphy.ts` (Vercel function, key from `GIPHY_API_KEY` or `VITE_GIPHY_API_KEY`) is the only caller:
1. a signed-in member's bearer token is verified; 2. an identical search from the last hour is answered from `giphy_response_cache` (free); 3. otherwise `giphy_take_quota()` (service role, advisory-locked, **rolling** one-hour window in `giphy_api_calls`) allows at most **95 calls/hour across everyone and 20/hour per member**, else the proxy answers `429` with `Retry-After` and the composer says "GIF search is busy… try again in about N minutes, or upload your own". If counting fails, the call is refused (fails closed).
The client also remembers searches for 10 minutes per tab and asks `?action=status` (no GIPHY call) to decide whether to offer search at all; no key = upload only. Only the fields the composer reads are passed through and cached. Privacy: typed words go to our server and GIPHY, not the member's IP or account; the Privacy Policy still needs a legal read.

## Seed content and the scheduled publisher (2026-10-09)
`scripts/community-seed/content.ts` (28 backfilled discussions dated 15 Sep - 9 Oct 2026, 33 queued ones) is turned into `20261009130000_community_seed_content.sql` by `scripts/generate-community-seed.ts` (deterministic; re-run after editing, a test checks they match). Authors are 30 display-only personas with South African handles (`community_personas`, `is_seed`, no login or email, never notified), plus the existing moderator personas. Backfilled comments are threaded (`re` = index of the parent) with likes spread over the following hours, all in the past.
`community-seed-tick` (pg_cron, every 20 minutes, `community_seed_tick()`) publishes the next queued discussion at 08:05 and 18:25 SAST (two a day, about 16 days of content) and releases its comments and likes over the next hours (never between 23:00 and 06:30 SAST). Stop it with `SELECT cron.unschedule('community-seed-tick')`; add more by inserting payloads into `community_seed_queue`. Seed posts are exempt from the 30-day retention (persona posts are never purged). Remove all seed content by deleting the posts of seed personas (comments and likes cascade), then the personas.
Replies must now belong to the same post as their parent (`community_comments_validate_parent`).
