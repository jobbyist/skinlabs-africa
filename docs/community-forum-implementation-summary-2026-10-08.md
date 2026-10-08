# Community Forum — implementation summary (session of 2026-10-08)

PR: jobbyist/skinlabs-africa #207 (`claude/community-forum`). Companion docs: `docs/community-forum.md` (reference), `CLAUDE.md` (standing notes).

## Delivered

### Round 1 — members-only forum (`/community-forum`)
* Feed, thread bottom-sheet with comments, compose sheet, report dialog, likes, shares, topic filter, role badges, skeleton / empty / error / unavailable / reconnecting states.
* Forum tab in `FloatingBottomNav` (signed-in members; 7-slot sizing verified at 320 px) and "Community NEW" in the header Explore grid.
* Supabase-backed schema with RLS and column-level grants; keyset-paginated read RPCs; ONE realtime channel per page; notification engine integration (new `community`
  push category, three templates, idempotent, debounced, generic lock-screen copy).
* Seed: 14 discussions, 36 comments, 105 likes (Michael C. from the real admin account; Nicole N., Cole O. and eight member voices are display-only personas, no fake accounts).

### Round 2 — this request
| Ask | What shipped |
|---|---|
| Sophisticated post component: emoji, GIFs, image uploads, lossless compression | Composer with an emoji popover (curated, no dependency, caret insertion), Photo and GIF attach, preview/remove, optimise note. Pipeline `src/lib/community/image.ts`: bytes-sniffed type, EXIF-rotated decode, **lossless WebP + PNG** candidates, smallest of {WebP, PNG, EXIF-stripped original} uploaded; GIFs untouched so they keep animating; EXIF/GPS never stored. Public-read buckets `community-media` (3 MB) and `avatars` (1 MB), own-folder writes only. Browser test proves WebP q=1 reproduces every pixel. |
| Profile picture from the dashboard, shown with username on posts | Dashboard -> Settings -> Profile -> "Profile picture" (square crop on device, same lossless pipeline). `profiles.avatar_path` (CHECK: own folder). Avatars appear on posts and comments. |
| Moderation tab in the admin dashboard | `ModerationTab`: counters, Reports (remove / dismiss), Held (approve / reject with flags), Blocked terms (admin-editable), Action log. Staff-only RPCs, role re-checked server-side. |
| Spam protection | Database-side: refuse duplicates (24 h) and bursts; hold links (new accounts, 3+, shorteners), contact details, blocked terms, ALL CAPS, repetition; 3 reports auto-hold; staff exempt; held content visible to author + staff only, never notifies. Client adds honeypot + minimum fill time. |
| Guidelines popup | Link opens a scrollable, viewport-capped dialog with the same text as `/community-guidelines` (shared `GuidelinesContent`, new section 6 on forum posting). |
| Ad slots + Faithful to Nature between posts | A unit after every 2nd discussion, alternating AdSlot / FaithfulToNature, never adjacent, never before the first post; plan-aware (full / light / none). |
| Apply all migrations | Applied live to `gnkpzijxuciiaamakgzm` (see below). |
| Final e2e smoke, performance / functionality / security | See "Verification". |
| Open and merge the PR | See the PR. |

## Database (all applied live 2026-10-08)
`20261008100000_community_forum_schema` · `…110000_community_forum_notifications` · `…130000_community_media_and_avatars` · `…140000_community_spam_and_moderation` ·
`…150000_community_forum_seed` · `…160000_community_fk_indexes`.
Method: the migration files were fetched into Postgres from the pushed commit with `pg_net`, **md5 compared with the local files**, executed first inside a transaction that always rolls back together
with the SQL probe (59/59 assertions on the real schema), then executed for real and registered in `supabase_migrations.schema_migrations`. The Supabase SQL tool hangs on `DROP`, so no migration contains one
(policies are guarded with `duplicate_object` handlers). `types.ts` regenerated from the live DB (this also fixed the long-standing `supabaseTypesGuard` failure).

## Verification
* `bun test`: 981 pass, 0 fail (new: `communityRules`, `communityImage` incl. hand-built JPEGs for EXIF stripping/orientation).
* `tsc -p tsconfig.app.json`: clean. `eslint`: no findings in new/changed files (1 pre-existing `previewAuthStorage.ts` error on base).
* Playwright, new spec `e2e/community-forum.e2e.ts`: 20 tests x 4 projects (desktop/mobile x light/dark) = all pass: feed, roles, likes, thread + comments, compose + validation, emoji at the caret, photo optimise + upload to the member's own folder,
  GIF untouched, non-image refused before upload, link post held, honeypot, avatar on posts, avatar uploader, guidelines popup fits and scrolls, ads between posts, deep links, signed-out, moderator menu, Forum tab current state, no horizontal overflow,
  Admin -> Moderation (and its absence without the role, with zero moderation RPC calls).
* Full existing e2e suite (desktop-light + mobile-light): see the PR for the final result.
* SQL probe: 59 assertions (RLS, column grants, duplicates, burst limit, spam holds, image-path ownership, avatar folder CHECK, staff-only RPCs, auto-hold, notifications, debounce) — local and live (rolled back).
* Live smoke (rolled back, as a real member and the real admin): feed returns 14 rows with the pinned welcome first, page 2 works, a member is denied the admin overview, the admin gets counts.
* Supabase security advisor: the only community findings are the intended ones (RPC-only tables with RLS and no policy; SECURITY DEFINER RPCs callable by `authenticated`, each gated inside).
* Performance: community code is in lazy chunks only (entry bundle contains none of it); feed is keyset-paginated; thumbnails are lazy with width/height; FK indexes added; realtime is one channel.

## Honest limits and decisions to review
1. **GIFs are upload-only.** A GIF *search* (Giphy/Tenor) needs a provider API key we don't have.
2. **"Lossless"** means the encoder never changes a pixel; a photo larger than the per-file limit (3 MB) or 4096 px is scaled down as a safety net and the member is told. Lossless files can be larger than a camera JPEG, so the (EXIF-stripped) original competes.
3. **AdSense policy risk:** AdSense generally disallows ad units on sign-in-gated pages and on user-generated content Google can't review. Implemented as requested; watch the policy centre.
4. **Per-member storage quota is not implemented** (files are capped per file only).
5. **Community Guidelines text changed** (new section 6, effective date 8 October 2026): needs a human/legal read. The guidelines mention restricting/suspending accounts; there is no mute/suspend tool yet.
6. Lock-screen push copy stays generic (no post titles). Push still arrives via the existing per-minute dispatcher.
7. Replies, mentions, bookmarks and a real-device push check are still open.
